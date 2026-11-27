import { describe, expect, it } from 'vitest'
import { formatNodeRunOutputPreview, isUntakenConditionSkip } from './workflowDebugStep'

describe('workflowDebugStep', () => {
  it('prefers text/content fields and truncates', () => {
    expect(formatNodeRunOutputPreview({ text: 'hello world' })).toBe('hello world')
    expect(formatNodeRunOutputPreview({ content: 'abc' })).toBe('abc')
    const long = 'x'.repeat(50)
    expect(formatNodeRunOutputPreview(long, 10).endsWith('…')).toBe(true)
    expect(formatNodeRunOutputPreview(long, 10).length).toBe(10)
  })

  it('detects untaken condition skip reason', () => {
    expect(isUntakenConditionSkip({ reason: 'untaken_condition_branch' })).toBe(true)
    expect(isUntakenConditionSkip({ reason: 'other' })).toBe(false)
    expect(isUntakenConditionSkip(null)).toBe(false)
  })
})
