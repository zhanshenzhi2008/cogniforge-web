import { describe, expect, it } from 'vitest'
import { findUnreachableNodes, reachableFromStart } from './workflowReachability'

describe('workflowReachability', () => {
  it('marks only start when no edges', () => {
    const nodes = [
      { id: 's', type: 'start' },
      { id: 'a', type: 'llm', data: { label: 'LLM' } },
      { id: 'e', type: 'end' },
    ]
    expect([...reachableFromStart(nodes, [])]).toEqual(['s'])
    expect(findUnreachableNodes(nodes, []).map(n => n.id)).toEqual(['a', 'e'])
  })

  it('follows linear path', () => {
    const nodes = [
      { id: 's', type: 'start' },
      { id: 'a', type: 'llm', data: { label: 'LLM' } },
      { id: 'e', type: 'end' },
    ]
    const edges = [
      { source: 's', target: 'a' },
      { source: 'a', target: 'e' },
    ]
    expect(reachableFromStart(nodes, edges).size).toBe(3)
    expect(findUnreachableNodes(nodes, edges)).toEqual([])
  })

  it('detects orphan branch', () => {
    const nodes = [
      { id: 's', type: 'start' },
      { id: 'a', type: 'llm' },
      { id: 'orphan', type: 'http', data: { label: '孤儿' } },
      { id: 'e', type: 'end' },
    ]
    const edges = [
      { source: 's', target: 'a' },
      { source: 'a', target: 'e' },
    ]
    expect(findUnreachableNodes(nodes, edges).map(n => n.id)).toEqual(['orphan'])
  })
})
