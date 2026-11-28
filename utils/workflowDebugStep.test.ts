import { describe, expect, it } from 'vitest'
import {
  clearCanvasRunDecorations,
  decorateEdgesForSkippedTargets,
  findLatestTimelineKeyForNode,
  formatExecutionInputJson,
  formatExecutionOutputForCopy,
  formatNodeRunOutputPreview,
  isSeededDebugSkip,
  isUntakenConditionSkip,
} from './workflowDebugStep'

describe('workflowDebugStep', () => {
  it('formats execution input for reuse into the debug form', () => {
    expect(formatExecutionInputJson(null)).toBe(null)
    expect(formatExecutionInputJson({})).toBe(null)
    expect(formatExecutionInputJson({ query: 'hi' })).toBe('{\n  "query": "hi"\n}')
    expect(formatExecutionInputJson('{"a":1}')).toBe('{\n  "a": 1\n}')
    expect(formatExecutionInputJson('  ')).toBe(null)
  })

  it('formats output for clipboard copy', () => {
    expect(formatExecutionOutputForCopy(null)).toBe('')
    expect(formatExecutionOutputForCopy('plain')).toBe('plain')
    expect(formatExecutionOutputForCopy({ a: 1 })).toBe('{\n  "a": 1\n}')
  })

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

  it('detects seeded debug-from-node skips', () => {
    expect(isSeededDebugSkip({ seeded_from: 'exec-1' })).toBe(true)
    expect(isSeededDebugSkip({ skip_reason: 'debug_from_node' }, { text: 'hi' })).toBe(true)
    expect(isSeededDebugSkip({ skip_reason: 'debug_from_node' }, {})).toBe(false)
    expect(isSeededDebugSkip({ skip_reason: 'debug_from_node' })).toBe(false)
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

  it('dims edges whose target is skipped', () => {
    const status = new Map([['no', 'skipped'], ['yes', 'succeeded']])
    const [e1, e2] = decorateEdgesForSkippedTargets([
      { id: '1', target: 'no', style: { stroke: '#dc2626' }, animated: true },
      { id: '2', target: 'yes', style: { stroke: '#16a34a' }, animated: true },
    ], status)
    expect(e1?.class).toContain('run-edge-skipped')
    expect(e1?.animated).toBe(false)
    expect(e1?.style?.opacity).toBe(0.35)
    expect(e2?.class).not.toContain('run-edge-skipped')
    expect(e2?.animated).toBe(true)
    expect(e2?.style?.opacity).toBeUndefined()
  })

  it('clears run decorations from nodes and edges', () => {
    const { nodes, edges } = clearCanvasRunDecorations(
      [{ id: 'a', class: 'foo run-succeeded', data: { streamProgress: 'hi', label: 'A' } }],
      [{ id: 'e', target: 'b', class: 'run-edge-skipped', style: { opacity: 0.35, stroke: '#x' }, animated: false }],
    )
    expect(nodes[0]?.class).toBe('foo')
    expect(nodes[0]?.data?.streamProgress).toBeUndefined()
    expect(nodes[0]?.data?.label).toBe('A')
    expect(edges[0]?.class).not.toContain('run-edge-skipped')
    expect(edges[0]?.style?.opacity).toBeUndefined()
    expect(edges[0]?.animated).toBe(true)
  })
})
