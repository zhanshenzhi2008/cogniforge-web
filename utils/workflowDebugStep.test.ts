import { describe, expect, it } from 'vitest'
import {
  findLatestTimelineKeyForNode,
  formatNodeRunOutputPreview,
  isUntakenConditionSkip,
} from './workflowDebugStep'

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

  it('finds latest non-human timeline key for a node', () => {
    const steps = [
      { key: 'a1', nodeId: 'n1', nodeType: 'llm' },
      { key: 'h1', nodeId: 'n1', nodeType: 'human_action' },
      { key: 'a2', nodeId: 'n1', nodeType: 'llm' },
      { key: 'b1', nodeId: 'n2', nodeType: 'code' },
    ]
    expect(findLatestTimelineKeyForNode(steps, 'n1')).toBe('a2')
    expect(findLatestTimelineKeyForNode(steps, 'n2')).toBe('b1')
    expect(findLatestTimelineKeyForNode(steps, 'missing')).toBe(null)
  })
})
