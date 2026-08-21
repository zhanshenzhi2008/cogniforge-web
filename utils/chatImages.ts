/**
 * Client-side image pick / compress for Playground vision messages.
 */

export const CHAT_IMAGE_MAX_COUNT = 4
export const CHAT_IMAGE_MAX_BYTES = 4 * 1024 * 1024
export const CHAT_IMAGE_MAX_EDGE = 1536
export const CHAT_IMAGE_ACCEPT = 'image/jpeg,image/png,image/gif,image/webp'

const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp'])

export type ChatImageErrorCode =
  | 'tooMany'
  | 'tooBig'
  | 'badType'
  | 'readFail'

export class ChatImageError extends Error {
  code: ChatImageErrorCode
  constructor(code: ChatImageErrorCode, message: string) {
    super(message)
    this.code = code
  }
}

export function isAllowedChatImage(file: File): boolean {
  return ALLOWED.has(file.type)
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('decode failed'))
    img.src = url
  })
}

function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('read failed'))
    reader.readAsDataURL(file)
  })
}

/** Resize / recompress so payload stays reasonable for vision APIs. */
export async function fileToChatDataUrl(file: File): Promise<string> {
  if (!isAllowedChatImage(file)) {
    throw new ChatImageError('badType', 'unsupported image type')
  }
  if (file.size > CHAT_IMAGE_MAX_BYTES) {
    throw new ChatImageError('tooBig', 'image too large')
  }

  const raw = await readAsDataURL(file)
  // GIF keeps animation if small enough; skip canvas re-encode
  if (file.type === 'image/gif' && file.size <= 1.5 * 1024 * 1024) {
    return raw
  }

  try {
    const img = await loadImage(raw)
    const scale = Math.min(1, CHAT_IMAGE_MAX_EDGE / Math.max(img.width, img.height))
    const w = Math.max(1, Math.round(img.width * scale))
    const h = Math.max(1, Math.round(img.height * scale))
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) return raw
    ctx.drawImage(img, 0, 0, w, h)
    const mime = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
    const quality = mime === 'image/jpeg' ? 0.85 : undefined
    const out = canvas.toDataURL(mime, quality)
    // If somehow larger, fall back to original when still under cap
    if (out.length > raw.length && raw.length < CHAT_IMAGE_MAX_BYTES * 1.4) {
      return raw
    }
    return out
  } catch {
    return raw
  }
}

export async function filesToChatDataUrls(
  files: File[],
  already: number,
): Promise<string[]> {
  if (already + files.length > CHAT_IMAGE_MAX_COUNT) {
    throw new ChatImageError('tooMany', 'too many images')
  }
  const out: string[] = []
  for (const file of files) {
    try {
      out.push(await fileToChatDataUrl(file))
    } catch (err) {
      if (err instanceof ChatImageError) throw err
      throw new ChatImageError('readFail', 'could not read image')
    }
  }
  return out
}

/** Build OpenAI-compatible multimodal content. */
export function toVisionContent(
  text: string,
  images?: string[],
): string | Array<Record<string, unknown>> {
  const trimmed = text.trim()
  const imgs = (images || []).filter(Boolean)
  if (imgs.length === 0) return text

  const parts: Array<Record<string, unknown>> = []
  if (trimmed) {
    parts.push({ type: 'text', text: trimmed })
  } else {
    parts.push({ type: 'text', text: '请描述这张图片。' })
  }
  for (const url of imgs) {
    parts.push({ type: 'image_url', image_url: { url } })
  }
  return parts
}
