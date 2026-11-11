/**
 * Shared SSE reader for chat streams.
 * Uses fetch + ReadableStream (not EventSource / fetch-event-source).
 *
 * Handles: chunk/event boundary buffering, UTF-8 splits, abort, connect retry
 * before first byte, and clear disconnect errors mid-stream.
 * Does NOT resume mid-reply (server has no Last-Event-ID resume for chat).
 */

export type SseEvent = {
  event: string
  data: string
  id: string
}

export type SseErrorKind = 'http' | 'network' | 'abort' | 'empty' | 'server' | 'disconnect'

export class SseStreamError extends Error {
  kind: SseErrorKind
  status?: number
  bodyText?: string

  constructor(kind: SseErrorKind, message: string, extra?: { status?: number; bodyText?: string }) {
    super(message)
    this.name = 'SseStreamError'
    this.kind = kind
    this.status = extra?.status
    this.bodyText = extra?.bodyText
  }
}

export function isAbortError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false
  const e = err as { name?: string; kind?: string }
  return e.name === 'AbortError' || e.kind === 'abort'
}

export function isNetworkError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false
  if (isAbortError(err)) return false
  const e = err as { name?: string; message?: string; kind?: string }
  if (e.kind === 'network' || e.kind === 'disconnect') return true
  const msg = String(e.message || '').toLowerCase()
  if (e.name === 'TypeError' && (msg.includes('fetch') || msg.includes('network') || msg.includes('failed'))) {
    return true
  }
  return msg.includes('networkerror') || msg.includes('failed to fetch') || msg.includes('load failed')
}

/** Parse one SSE event block (text between blank lines). */
export function parseSseBlock(block: string): SseEvent | null {
  const trimmed = block.replace(/^\uFEFF/, '').trimEnd()
  if (!trimmed) return null

  let event = 'message'
  let id = ''
  const dataLines: string[] = []

  for (const rawLine of trimmed.split('\n')) {
    const line = rawLine.replace(/\r$/, '')
    if (!line || line.startsWith(':')) continue
    const colon = line.indexOf(':')
    const field = colon === -1 ? line : line.slice(0, colon)
    let value = colon === -1 ? '' : line.slice(colon + 1)
    if (value.startsWith(' ')) value = value.slice(1)

    if (field === 'event') event = value || 'message'
    else if (field === 'id') id = value
    else if (field === 'data') dataLines.push(value)
  }

  if (!dataLines.length && event === 'message' && !id) return null
  return { event, id, data: dataLines.join('\n') }
}

export type OpenAISsePayload = {
  done?: boolean
  error?: string
  delta?: string
  full?: string
}

/** Interpret OpenAI-compatible chat SSE `data:` payload. */
export function parseOpenAISseData(data: string): OpenAISsePayload | null {
  const text = data.trim()
  if (!text) return null
  if (text === '[DONE]') return { done: true }

  try {
    const parsed = JSON.parse(text)
    if (typeof parsed?.error === 'string' && parsed.error) {
      return { error: parsed.error }
    }
    if (parsed?.error && typeof parsed.error?.message === 'string') {
      return { error: parsed.error.message }
    }
    const delta = parsed?.choices?.[0]?.delta?.content
    if (typeof delta === 'string' && delta.length > 0) {
      return { delta }
    }
    const full =
      parsed?.choices?.[0]?.message?.content
      ?? parsed?.data?.choices?.[0]?.message?.content
    if (typeof full === 'string' && full.length > 0) {
      return { full }
    }
    return {}
  } catch {
    return null
  }
}

export type ReadSseHandlers = {
  /** Return true to stop reading early (e.g. server error event). */
  onEvent: (ev: SseEvent) => boolean | void
  /** Called with leftover buffer after stream ends (non-SSE JSON fallback). */
  onRawLeftover?: (raw: string) => void
}

/**
 * Read an already-opened response body as SSE.
 * Buffers across TCP chunks; flushes leftover at end.
 */
export async function readSseStream(
  response: Response,
  handlers: ReadSseHandlers,
  options?: { signal?: AbortSignal },
): Promise<'done' | 'stopped'> {
  const reader = response.body?.getReader()
  if (!reader) {
    throw new SseStreamError('empty', 'response body unavailable')
  }

  const decoder = new TextDecoder()
  let buffer = ''
  let sawEvent = false

  const throwIfAborted = () => {
    if (options?.signal?.aborted) {
      throw new SseStreamError('abort', 'aborted')
    }
  }

  try {
    while (true) {
      throwIfAborted()
      let chunk: ReadableStreamReadResult<Uint8Array>
      try {
        chunk = await reader.read()
      } catch (err) {
        if (isAbortError(err) || options?.signal?.aborted) {
          throw new SseStreamError('abort', 'aborted')
        }
        throw new SseStreamError(
          sawEvent ? 'disconnect' : 'network',
          (err as Error)?.message || 'stream read failed',
        )
      }

      if (chunk.done) break
      if (!chunk.value) continue

      buffer += decoder.decode(chunk.value, { stream: true })
      const parts = buffer.split('\n\n')
      buffer = parts.pop() || ''

      for (const part of parts) {
        const ev = parseSseBlock(part)
        if (!ev) continue
        sawEvent = true
        if (handlers.onEvent(ev) === true) {
          try { await reader.cancel() } catch { /* ignore */ }
          return 'stopped'
        }
      }
    }

    buffer += decoder.decode()
    if (buffer.trim()) {
      const ev = parseSseBlock(buffer)
      if (ev) {
        sawEvent = true
        if (handlers.onEvent(ev) === true) return 'stopped'
      } else {
        handlers.onRawLeftover?.(buffer)
      }
    }

    return 'done'
  } finally {
    try { reader.releaseLock() } catch { /* ignore */ }
  }
}

export type FetchSseOptions = {
  method?: string
  headers?: Record<string, string>
  body?: string
  signal?: AbortSignal
  /** Retries only when the connection fails before any SSE event. Default 1. */
  connectRetries?: number
  retryDelayMs?: number
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new SseStreamError('abort', 'aborted'))
      return
    }
    const timer = setTimeout(resolve, ms)
    const onAbort = () => {
      clearTimeout(timer)
      reject(new SseStreamError('abort', 'aborted'))
    }
    signal?.addEventListener('abort', onAbort, { once: true })
  })
}

async function openSseResponse(url: string, options: FetchSseOptions): Promise<Response> {
  let response: Response
  try {
    response = await fetch(url, {
      method: options.method || 'POST',
      headers: {
        Accept: 'text/event-stream',
        ...options.headers,
      },
      body: options.body,
      signal: options.signal,
    })
  } catch (err) {
    if (isAbortError(err) || options.signal?.aborted) {
      throw new SseStreamError('abort', 'aborted')
    }
    throw new SseStreamError('network', (err as Error)?.message || 'failed to fetch')
  }

  if (!response.ok) {
    const bodyText = await response.text().catch(() => '')
    throw new SseStreamError('http', `HTTP ${response.status}`, {
      status: response.status,
      bodyText,
    })
  }

  return response
}

/**
 * POST/GET an SSE endpoint, with connect-only retries (no mid-stream resume).
 */
export async function fetchSse(
  url: string,
  options: FetchSseOptions,
  handlers: ReadSseHandlers,
): Promise<'done' | 'stopped'> {
  const retries = Math.max(0, options.connectRetries ?? 1)
  const delayMs = options.retryDelayMs ?? 500
  let lastErr: unknown

  for (let attempt = 0; attempt <= retries; attempt++) {
    if (options.signal?.aborted) {
      throw new SseStreamError('abort', 'aborted')
    }
    try {
      const response = await openSseResponse(url, options)
      return await readSseStream(response, handlers, { signal: options.signal })
    } catch (err) {
      lastErr = err
      if (isAbortError(err)) throw err
      // Only retry pure connect failures before any event was delivered.
      const canRetry =
        attempt < retries
        && err instanceof SseStreamError
        && err.kind === 'network'
      if (!canRetry) throw err
      await sleep(delayMs * (attempt + 1), options.signal)
    }
  }

  throw lastErr instanceof Error ? lastErr : new SseStreamError('network', 'connect failed')
}
