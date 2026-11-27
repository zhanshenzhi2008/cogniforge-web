import { describe, expect, it } from 'vitest'
import { formatHttpHeadersJson, parseHttpHeadersJson } from './workflowHttpHeaders'

describe('workflowHttpHeaders', () => {
  it('parses object and JSON text', () => {
    expect(parseHttpHeadersJson({ Authorization: 'Bearer x', '': 'skip' })).toEqual({
      Authorization: 'Bearer x',
    })
    expect(parseHttpHeadersJson('{"X-Trace":"1"}')).toEqual({ 'X-Trace': '1' })
    expect(parseHttpHeadersJson('')).toBe(null)
    expect(parseHttpHeadersJson('[]')).toBe(null)
    expect(parseHttpHeadersJson('{bad')).toBe(null)
  })

  it('formats for the drawer textarea', () => {
    expect(formatHttpHeadersJson({ A: '1' })).toBe('{\n  "A": "1"\n}')
    expect(formatHttpHeadersJson(null)).toBe('')
  })
})
