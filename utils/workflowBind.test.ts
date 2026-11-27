import { describe, expect, it } from 'vitest'
import { isWorkflowBindUnbound, WORKFLOW_BIND_KINDS } from './workflowBind'

describe('isWorkflowBindUnbound', () => {
  it('covers all bind kinds', () => {
    expect(WORKFLOW_BIND_KINDS).toEqual(
      expect.arrayContaining([
        'llm', 'http', 'code', 'condition', 'team', 'agent', 'search', 'subflow', 'input', 'output',
      ]),
    )
  })

  it('detects empty llm / http / code', () => {
    expect(isWorkflowBindUnbound('llm', {})).toBe(true)
    expect(isWorkflowBindUnbound('llm', { model: 'm1' })).toBe(false)
    expect(isWorkflowBindUnbound('http', {})).toBe(true)
    expect(isWorkflowBindUnbound('http', { url: 'https://example.com' })).toBe(false)
    expect(isWorkflowBindUnbound('http', { httpUrl: 'https://example.com' })).toBe(false)
    expect(isWorkflowBindUnbound('code', {})).toBe(true)
    expect(isWorkflowBindUnbound('code', { code: 'return 1' })).toBe(false)
  })

  it('detects empty condition field', () => {
    expect(isWorkflowBindUnbound('condition', {})).toBe(true)
    expect(isWorkflowBindUnbound('condition', { conditionField: 'score' })).toBe(false)
    expect(isWorkflowBindUnbound('condition', { conditions: [{ field: 'score' }] })).toBe(false)
  })

  it('detects empty resource binds', () => {
    expect(isWorkflowBindUnbound('team', {})).toBe(true)
    expect(isWorkflowBindUnbound('team', { teamId: 't1' })).toBe(false)
    expect(isWorkflowBindUnbound('agent', {})).toBe(true)
    expect(isWorkflowBindUnbound('agent', { agentId: 'a1' })).toBe(false)
    expect(isWorkflowBindUnbound('search', {})).toBe(true)
    expect(isWorkflowBindUnbound('search', { knowledgeBaseId: 'kb1' })).toBe(false)
    expect(isWorkflowBindUnbound('subflow', {})).toBe(true)
    expect(isWorkflowBindUnbound('subflow', { workflow_id: 'w1' })).toBe(false)
  })

  it('detects empty input / output variable', () => {
    expect(isWorkflowBindUnbound('input', {})).toBe(true)
    expect(isWorkflowBindUnbound('input', { variable: 'q' })).toBe(false)
    expect(isWorkflowBindUnbound('output', {})).toBe(true)
    expect(isWorkflowBindUnbound('output', { variable: 'result' })).toBe(false)
  })

  it('ignores unknown kinds', () => {
    expect(isWorkflowBindUnbound('delay', {})).toBe(false)
    expect(isWorkflowBindUnbound('start', {})).toBe(false)
    expect(isWorkflowBindUnbound('end', {})).toBe(false)
    expect(isWorkflowBindUnbound('loop', { loopType: 'times' })).toBe(false)
    expect(isWorkflowBindUnbound('loop', { loopType: 'for_each' })).toBe(true)
    expect(isWorkflowBindUnbound('loop', { loopType: 'for_each', loopArrayVar: 'items' })).toBe(false)
    expect(isWorkflowBindUnbound('loop', { type: 'for_each', array_var: 'rows' })).toBe(false)
  })
})
