import { describe, expect, it } from 'vitest'
import { formatJsonObject, parseJsonObject } from './workflowJsonObject'

describe('workflowJsonObject', () => {
  it('parses objects and JSON text', () => {
    expect(parseJsonObject({ a: 1, b: '{{x}}' })).toEqual({ a: 1, b: '{{x}}' })
    expect(parseJsonObject('{"q":"{{query}}"}')).toEqual({ q: '{{query}}' })
    expect(parseJsonObject('')).toBe(null)
    expect(parseJsonObject('[]')).toBe(null)
    expect(parseJsonObject('{bad')).toBe(null)
  })

  it('formats for textarea', () => {
    expect(formatJsonObject({ a: 1 })).toBe('{\n  "a": 1\n}')
    expect(formatJsonObject(null)).toBe('')
  })
})
