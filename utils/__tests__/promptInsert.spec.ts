import { describe, expect, it } from 'vitest'
import {
  detectMentionTrigger,
  extractVarNames,
  formatVarInsert,
  replaceRange,
} from '../promptInsert'

describe('promptInsert', () => {
  it('extractVarNames finds unique {{vars}}', () => {
    expect(extractVarNames('Hi {{user}}, {{ user }} and {{query}} {{user}}')).toEqual([
      'user',
      'query',
    ])
  })

  it('formatVarInsert sanitizes names', () => {
    expect(formatVarInsert(' brand ')).toBe('{{brand}}')
    expect(formatVarInsert('my-var')).toBe('{{my_var}}')
    expect(formatVarInsert('1bad')).toBe('{{_1bad}}')
  })

  it('detectMentionTrigger finds / and @ before caret', () => {
    const text = 'Hello /us'
    expect(detectMentionTrigger(text, text.length)).toEqual({
      kind: '/',
      match: '/us',
      query: 'us',
      start: 6,
      end: 9,
    })
    const at = 'Use @知'
    expect(detectMentionTrigger(at, at.length)?.kind).toBe('@')
    expect(detectMentionTrigger('nope/', 5)).toBeNull()
    expect(detectMentionTrigger('a /b c', 4)).toEqual({
      kind: '/',
      match: '/b',
      query: 'b',
      start: 2,
      end: 4,
    })
  })

  it('replaceRange inserts and moves caret', () => {
    expect(replaceRange('ab/cd', 2, 4, '{{x}} ')).toEqual({
      value: 'ab{{x}} d',
      caret: 8,
    })
  })
})
