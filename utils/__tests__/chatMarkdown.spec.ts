import { describe, expect, it } from 'vitest'
import {
  isSafeImageSrc,
  linkifyBareImageUrls,
  renderChatMarkdown,
} from '../chatMarkdown'

describe('isSafeImageSrc', () => {
  it('allows http(s) and raster data urls', () => {
    expect(isSafeImageSrc('https://cdn.example.com/a.png')).toBe(true)
    expect(isSafeImageSrc('http://cdn.example.com/a.jpg')).toBe(true)
    expect(isSafeImageSrc('data:image/png;base64,abc')).toBe(true)
  })

  it('rejects unsafe schemes', () => {
    expect(isSafeImageSrc('javascript:alert(1)')).toBe(false)
    expect(isSafeImageSrc('data:image/svg+xml;base64,abc')).toBe(false)
    expect(isSafeImageSrc('')).toBe(false)
  })
})

describe('linkifyBareImageUrls', () => {
  it('wraps bare https image urls', () => {
    expect(linkifyBareImageUrls('see https://x.com/a.png end')).toBe(
      'see ![image](https://x.com/a.png) end',
    )
  })

  it('leaves existing markdown images alone', () => {
    const src = '![cat](https://x.com/a.png)'
    expect(linkifyBareImageUrls(src)).toBe(src)
  })
})

describe('renderChatMarkdown', () => {
  it('renders markdown images as img tags', () => {
    const html = renderChatMarkdown('![demo](https://cdn.example.com/pic.webp)')
    expect(html).toContain('class="message-md-img"')
    expect(html).toContain('src="https://cdn.example.com/pic.webp"')
    expect(html).toContain('alt="demo"')
  })

  it('renders bare image urls', () => {
    const html = renderChatMarkdown('https://cdn.example.com/shot.jpg')
    expect(html).toContain('src="https://cdn.example.com/shot.jpg"')
  })

  it('does not turn javascript urls into images', () => {
    const html = renderChatMarkdown('![x](javascript:alert(1))')
    expect(html).not.toContain('<img')
    expect(html).not.toContain('javascript:')
  })
})
