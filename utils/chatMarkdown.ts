/**
 * Playground chat markdown → HTML, with image display support.
 */

import { marked } from 'marked'

const IMAGE_EXT = String.raw`(?:png|jpe?g|gif|webp)`
/** Bare http(s) image URL — not already inside markdown `](...)`. */
const BARE_IMAGE_URL =
  new RegExp(
    String.raw`(^|[\s>（【])((?:https?:\/\/)[^\s<>"'）】\]]+\.${IMAGE_EXT}(?:\?[^\s<>"'）】\]]*)?)`,
    'gi',
  )
/** data:image/...;base64,... on its own line or after whitespace */
const BARE_DATA_IMAGE =
  /(^|[\s])(data:image\/(?:png|jpe?g|gif|webp);base64,[A-Za-z0-9+/=\s]+)/gi

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/** Only allow safe image sources (no javascript: / svg data XSS). */
export function isSafeImageSrc(href: string | null | undefined): boolean {
  if (!href) return false
  const src = href.trim()
  if (/^https?:\/\//i.test(src)) return true
  if (/^data:image\/(?:png|jpe?g|gif|webp);base64,/i.test(src)) return true
  return false
}

/** Turn bare image URLs into markdown images so marked can render them. */
export function linkifyBareImageUrls(content: string): string {
  if (!content) return ''
  let out = content.replace(BARE_IMAGE_URL, (_m, prefix: string, url: string) => {
    return `${prefix}![image](${url})`
  })
  out = out.replace(BARE_DATA_IMAGE, (_m, prefix: string, data: string) => {
    const compact = data.replace(/\s+/g, '')
    return `${prefix}![image](${compact})`
  })
  return out
}

function renderImageHtml(href: string, title: string | null | undefined, text: string): string {
  if (!isSafeImageSrc(href)) {
    return escapeAttr(text || href || '')
  }
  const alt = escapeAttr(text || 'image')
  const titleAttr = title ? ` title="${escapeAttr(title)}"` : ''
  const src = escapeAttr(href.trim())
  return (
    `<a class="message-md-img-link" href="${src}" target="_blank" rel="noopener noreferrer">` +
    `<img class="message-md-img" src="${src}" alt="${alt}"${titleAttr} loading="lazy" />` +
    `</a>`
  )
}

let markedReady = false

function ensureMarked() {
  if (markedReady) return
  marked.use({
    breaks: true,
    gfm: true,
    renderer: {
      // marked@12 still calls image(href, title, text); typings may claim a token.
      image(hrefOrToken: string | { href?: string; title?: string | null; text?: string }, title?: string | null, text?: string) {
        if (typeof hrefOrToken === 'string') {
          return renderImageHtml(hrefOrToken, title, text || '')
        }
        return renderImageHtml(hrefOrToken.href || '', hrefOrToken.title, hrefOrToken.text || '')
      },
    },
  } as Parameters<typeof marked.use>[0])
  markedReady = true
}

/** Render assistant/user chat content to HTML (sync). */
export function renderChatMarkdown(content: string): string {
  ensureMarked()
  const prepared = linkifyBareImageUrls(content || '')
  return marked.parse(prepared, { async: false }) as string
}
