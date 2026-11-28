import { describe, expect, it } from 'vitest'
import { conditionBranchKind, fromDefinitionEdge, toDefinitionEdge } from './workflowEdge'

describe('workflowEdge', () => {
  it('maps condition handles to true/false', () => {
    expect(conditionBranchKind('s-top')).toBe('true')
    expect(conditionBranchKind('true')).toBe('true')
    expect(conditionBranchKind('s-bottom')).toBe('false')
    expect(conditionBranchKind('false')).toBe('false')
    expect(conditionBranchKind('')).toBe(null)
    expect(conditionBranchKind('s')).toBe(null)
  })

  it('round-trips condition branch handles', () => {
    const saved = toDefinitionEdge({
      id: 'e1',
      source: 'cond',
      target: 'yes',
      sourceHandle: 's-top',
    })
    expect(saved).toEqual({
      id: 'e1',
      source: 'cond',
      target: 'yes',
      sourceHandle: 's-top',
      source_handle: 's-top',
    })
    expect(fromDefinitionEdge(saved)).toEqual({
      id: 'e1',
      source: 'cond',
      target: 'yes',
      sourceHandle: 's-top',
      targetHandle: undefined,
    })
  })

  it('reads snake_case from Go-shaped edges', () => {
    expect(fromDefinitionEdge({
      id: 'e2',
      source: 'cond',
      target: 'no',
      source_handle: 's-bottom',
      target_handle: 't',
    })).toEqual({
      id: 'e2',
      source: 'cond',
      target: 'no',
      sourceHandle: 's-bottom',
      targetHandle: 't',
    })
  })

  it('omits empty handles', () => {
    expect(toDefinitionEdge({ id: 'e3', source: 'a', target: 'b' })).toEqual({
      id: 'e3',
      source: 'a',
      target: 'b',
    })
  })
})
