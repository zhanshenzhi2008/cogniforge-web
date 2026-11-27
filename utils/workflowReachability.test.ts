import { describe, expect, it } from 'vitest'
import {
  findEndsWithOutgoing,
  findStartNodes,
  findStartsWithIncoming,
  findUnreachableNodes,
  reachableFromStart,
} from './workflowReachability'

describe('workflowReachability', () => {
  it('lists all start nodes in order', () => {
    const nodes = [
      { id: 's1', type: 'start', data: { label: '开始 A' } },
      { id: 'a', type: 'llm' },
      { id: 's2', type: 'start', data: { label: '开始 B' } },
    ]
    expect(findStartNodes(nodes)).toEqual([
      { id: 's1', label: '开始 A' },
      { id: 's2', label: '开始 B' },
    ])
  })

  it('flags end/output nodes that still have outgoing edges', () => {
    const nodes = [
      { id: 's', type: 'start' },
      { id: 'e', type: 'end', data: { label: '结束' } },
      { id: 'o', type: 'output', data: { label: '输出' } },
      { id: 'a', type: 'llm' },
    ]
    const edges = [
      { source: 's', target: 'e' },
      { source: 'e', target: 'a' },
      { source: 'o', target: 'a' },
    ]
    expect(findEndsWithOutgoing(nodes, edges).map(n => n.id)).toEqual(['e', 'o'])
    expect(findEndsWithOutgoing(nodes, [{ source: 's', target: 'e' }])).toEqual([])
  })

  it('flags start/input nodes that still have incoming edges', () => {
    const nodes = [
      { id: 's', type: 'start', data: { label: '开始' } },
      { id: 'i', type: 'input', data: { label: '输入' } },
      { id: 'a', type: 'llm' },
      { id: 'e', type: 'end' },
    ]
    const edges = [
      { source: 'a', target: 's' },
      { source: 'a', target: 'i' },
      { source: 's', target: 'e' },
    ]
    expect(findStartsWithIncoming(nodes, edges).map(n => n.id)).toEqual(['s', 'i'])
    expect(findStartsWithIncoming(nodes, [{ source: 's', target: 'e' }])).toEqual([])
  })

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
