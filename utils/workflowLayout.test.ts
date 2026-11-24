import { describe, expect, it } from 'vitest'
import { layoutWorkflowNodes } from './workflowLayout'

describe('layoutWorkflowNodes', () => {
  it('places start → agents → end left to right', () => {
    const nodes = [
      { id: 'end', type: 'end', position: { x: 0, y: 0 } },
      { id: 'a2', type: 'agent', position: { x: 10, y: 500 } },
      { id: 'start', type: 'start', position: { x: 900, y: 20 } },
      { id: 'a1', type: 'agent', position: { x: 50, y: 300 } },
    ]
    const edges = [
      { source: 'start', target: 'a1' },
      { source: 'a1', target: 'a2' },
      { source: 'a2', target: 'end' },
    ]
    const out = layoutWorkflowNodes(nodes, edges)
    const byId = Object.fromEntries(out.map(n => [n.id, n.position]))
    expect(byId.start.x).toBeLessThan(byId.a1.x)
    expect(byId.a1.x).toBeLessThan(byId.a2.x)
    expect(byId.a2.x).toBeLessThan(byId.end.x)
    // 同列对齐：线性链每列一个，y 应接近
    expect(Math.abs(byId.start.y - byId.a1.y)).toBeLessThan(5)
  })

  it('returns empty for empty input', () => {
    expect(layoutWorkflowNodes([], [])).toEqual([])
  })
})
