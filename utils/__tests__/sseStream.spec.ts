import { describe, expect, it, vi, afterEach } from 'vitest'
import {
  fetchSse,
  isAbortError,
  isNetworkError,
  parseOpenAISseData,
  parseSseBlock,
  readSseStream,
  SseStreamError,
} from '../sseStream'

describe('parseSseBlock', () => {
  it('parses single data line', () => {
    expect(parseSseBlock('data: hello')).toEqual({
      event: 'message',
      id: '',
      data: 'hello',
    })
  })

  it('joins multi-line data', () => {
    expect(parseSseBlock('data: a\ndata: b')).toEqual({
      event: 'message',
      id: '',
      data: 'a\nb',
    })
  })

  it('ignores comments and keeps event/id', () => {
    const ev = parseSseBlock(': keep-alive\nevent: delta\nid: 3\ndata: x')
    expect(ev).toEqual({ event: 'delta', id: '3', data: 'x' })
  })
})

describe('parseOpenAISseData', () => {
  it('handles DONE, delta, full, and error', () => {
    expect(parseOpenAISseData('[DONE]')).toEqual({ done: true })
    expect(parseOpenAISseData(JSON.stringify({
      choices: [{ delta: { content: 'hi' } }],
    }))).toEqual({ delta: 'hi' })
    expect(parseOpenAISseData(JSON.stringify({
      choices: [{ message: { content: 'full' } }],
    }))).toEqual({ full: 'full' })
    expect(parseOpenAISseData(JSON.stringify({ error: 'boom' }))).toEqual({ error: 'boom' })
  })

  it('returns null for broken JSON', () => {
    expect(parseOpenAISseData('{not-json')).toBeNull()
  })
})

function streamResponse(chunks: string[], ok = true, status = 200): Response {
  const encoder = new TextEncoder()
  let i = 0
  const stream = new ReadableStream<Uint8Array>({
    pull(controller) {
      if (i >= chunks.length) {
        controller.close()
        return
      }
      controller.enqueue(encoder.encode(chunks[i++]))
    },
  })
  return new Response(stream, { status, statusText: ok ? 'OK' : 'Error' })
}

describe('readSseStream', () => {
  it('reassembles events split across TCP chunks', async () => {
    const events: string[] = []
    // Split mid-JSON across chunks
    const part1 = 'data: {"choices":[{"delta":{"content":"hel'
    const part2 = 'lo"}}]}\n\n'
    const res = streamResponse([part1, part2, 'data: [DONE]\n\n'])
    await readSseStream(res, {
      onEvent: (ev) => {
        events.push(ev.data)
      },
    })
    expect(events[0]).toContain('hello')
    expect(events[1]).toBe('[DONE]')
  })

  it('passes leftover non-SSE JSON to onRawLeftover', async () => {
    let leftover = ''
    const res = streamResponse(['{"choices":[{"message":{"content":"all"}}]}'])
    await readSseStream(res, {
      onEvent: () => {},
      onRawLeftover: (raw) => { leftover = raw },
    })
    expect(leftover).toContain('all')
  })

  it('maps mid-stream read failure to disconnect', async () => {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('data: {"choices":[{"delta":{"content":"a"}}]}\n\n'))
      },
      pull() {
        throw new TypeError('network error')
      },
    })
    const res = new Response(stream, { status: 200 })
    await expect(readSseStream(res, { onEvent: () => {} })).rejects.toMatchObject({
      kind: 'disconnect',
    })
  })
})

describe('fetchSse connect retry', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('retries once when connect fails before any event', async () => {
    let calls = 0
    vi.stubGlobal('fetch', vi.fn(async () => {
      calls++
      if (calls === 1) throw new TypeError('Failed to fetch')
      return streamResponse(['data: {"choices":[{"delta":{"content":"ok"}}]}\n\n'])
    }))

    const deltas: string[] = []
    await fetchSse(
      'http://example.test/stream',
      {
        method: 'POST',
        body: '{}',
        connectRetries: 1,
        retryDelayMs: 1,
      },
      {
        onEvent: (ev) => {
          const p = parseOpenAISseData(ev.data)
          if (p?.delta) deltas.push(p.delta)
        },
      },
    )
    expect(calls).toBe(2)
    expect(deltas).toEqual(['ok'])
  })

  it('does not retry HTTP errors', async () => {
    let calls = 0
    vi.stubGlobal('fetch', vi.fn(async () => {
      calls++
      return new Response('nope', { status: 500 })
    }))

    await expect(fetchSse(
      'http://example.test/stream',
      { connectRetries: 2, retryDelayMs: 1 },
      { onEvent: () => {} },
    )).rejects.toBeInstanceOf(SseStreamError)

    expect(calls).toBe(1)
  })
})

describe('error helpers', () => {
  it('detects abort and network shapes', () => {
    expect(isAbortError({ name: 'AbortError' })).toBe(true)
    expect(isAbortError(new SseStreamError('abort', 'aborted'))).toBe(true)
    expect(isNetworkError(new TypeError('Failed to fetch'))).toBe(true)
    expect(isNetworkError(new SseStreamError('disconnect', 'gone'))).toBe(true)
    expect(isNetworkError(new SseStreamError('abort', 'aborted'))).toBe(false)
  })
})
