import { describe, expect, it } from 'vitest'
import { toVisionContent } from '../chatImages'

describe('toVisionContent', () => {
  it('returns plain string without images', () => {
    expect(toVisionContent('hello')).toBe('hello')
  })

  it('builds multimodal parts with text + images', () => {
    const parts = toVisionContent('看图', ['data:image/png;base64,abc'])
    expect(Array.isArray(parts)).toBe(true)
    expect(parts).toEqual([
      { type: 'text', text: '看图' },
      { type: 'image_url', image_url: { url: 'data:image/png;base64,abc' } },
    ])
  })

  it('adds default text when only images', () => {
    const parts = toVisionContent('  ', ['https://x.com/a.png']) as Array<Record<string, unknown>>
    expect(parts[0]).toEqual({ type: 'text', text: '请描述这张图片。' })
    expect(parts[1]).toEqual({
      type: 'image_url',
      image_url: { url: 'https://x.com/a.png' },
    })
  })
})
