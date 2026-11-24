/**
 * 工作流画布「整理布局」：按连线做分层排版（左→右），减少歪斜与横向拉太开。
 */

export interface LayoutNodeLike {
  id: string
  type?: string
  position: { x: number, y: number }
  [key: string]: any
}

export interface LayoutEdgeLike {
  source: string
  target: string
}

export interface LayoutOptions {
  /** 列间距（水平） */
  columnGap?: number
  /** 行间距（垂直） */
  rowGap?: number
  /** 左上起点 */
  originX?: number
  originY?: number
}

const DEFAULTS = {
  columnGap: 240,
  rowGap: 120,
  originX: 80,
  originY: 80,
}

/**
 * 返回带新 position 的节点副本（不改边）。
 * 规则：按依赖分层；同层上下对齐；优先把 start 放第 0 列。
 */
export function layoutWorkflowNodes<T extends LayoutNodeLike>(
  nodes: T[],
  edges: LayoutEdgeLike[],
  opts: LayoutOptions = {},
): T[] {
  if (!nodes.length) return []

  const columnGap = opts.columnGap ?? DEFAULTS.columnGap
  const rowGap = opts.rowGap ?? DEFAULTS.rowGap
  const originX = opts.originX ?? DEFAULTS.originX
  const originY = opts.originY ?? DEFAULTS.originY

  const ids = nodes.map(n => n.id)
  const idSet = new Set(ids)
  const outgoing = new Map<string, string[]>()
  const incoming = new Map<string, string[]>()
  for (const id of ids) {
    outgoing.set(id, [])
    incoming.set(id, [])
  }
  for (const e of edges) {
    if (!idSet.has(e.source) || !idSet.has(e.target) || e.source === e.target) continue
    outgoing.get(e.source)!.push(e.target)
    incoming.get(e.target)!.push(e.source)
  }

  // 最长路径分层（适合 DAG）；环上的节点用 BFS 补秩
  const rank = new Map<string, number>()
  const roots = ids.filter(id => (incoming.get(id)?.length || 0) === 0)
  const startIds = nodes.filter(n => n.type === 'start').map(n => n.id)
  const seed = [
    ...startIds.filter(id => roots.includes(id)),
    ...roots.filter(id => !startIds.includes(id)),
  ]
  if (seed.length === 0 && ids.length) seed.push(ids[0])

  for (const id of seed) rank.set(id, 0)

  // Kahn 拓扑 + 松弛
  const indeg = new Map<string, number>()
  for (const id of ids) indeg.set(id, incoming.get(id)!.length)
  const queue = [...seed]
  const visited = new Set<string>()
  while (queue.length) {
    const cur = queue.shift()!
    if (visited.has(cur)) continue
    visited.add(cur)
    const r = rank.get(cur) ?? 0
    for (const next of outgoing.get(cur) || []) {
      const nr = r + 1
      const prev = rank.get(next)
      if (prev === undefined || nr > prev) rank.set(next, nr)
      const d = (indeg.get(next) || 0) - 1
      indeg.set(next, d)
      if (d <= 0) queue.push(next)
    }
  }
  // 未访问（环或孤立未进队）：接在最大层后
  let maxRank = 0
  for (const r of rank.values()) if (r > maxRank) maxRank = r
  for (const id of ids) {
    if (!rank.has(id)) {
      maxRank += 1
      rank.set(id, maxRank)
    }
  }

  // 同层排序：按父节点平均序（减少交叉）
  const layers = new Map<number, string[]>()
  for (const id of ids) {
    const r = rank.get(id)!
    if (!layers.has(r)) layers.set(r, [])
    layers.get(r)!.push(id)
  }
  const orderIndex = new Map<string, number>()
  const sortedRanks = [...layers.keys()].sort((a, b) => a - b)

  // 第 0 层：start 优先，其余按原数组顺序
  const nodeIndex = new Map(ids.map((id, i) => [id, i]))
  for (const r of sortedRanks) {
    const layer = layers.get(r)!
    if (r === 0) {
      layer.sort((a, b) => {
        const sa = nodes.find(n => n.id === a)?.type === 'start' ? 0 : 1
        const sb = nodes.find(n => n.id === b)?.type === 'start' ? 0 : 1
        if (sa !== sb) return sa - sb
        return (nodeIndex.get(a) || 0) - (nodeIndex.get(b) || 0)
      })
    }
    else {
      layer.sort((a, b) => {
        const avg = (id: string) => {
          const parents = (incoming.get(id) || []).filter(p => orderIndex.has(p))
          if (!parents.length) return nodeIndex.get(id) || 0
          return parents.reduce((s, p) => s + (orderIndex.get(p) || 0), 0) / parents.length
        }
        const da = avg(a) - avg(b)
        if (Math.abs(da) > 1e-6) return da
        return (nodeIndex.get(a) || 0) - (nodeIndex.get(b) || 0)
      })
    }
    layer.forEach((id, i) => orderIndex.set(id, i))
  }

  // 垂直居中：以最「高」的一列为基准，各列相对居中
  let maxRows = 1
  for (const layer of layers.values()) {
    if (layer.length > maxRows) maxRows = layer.length
  }
  const totalHeight = (maxRows - 1) * rowGap

  const pos = new Map<string, { x: number, y: number }>()
  for (const r of sortedRanks) {
    const layer = layers.get(r)!
    const colHeight = (layer.length - 1) * rowGap
    const y0 = originY + (totalHeight - colHeight) / 2
    layer.forEach((id, i) => {
      pos.set(id, {
        x: originX + r * columnGap,
        y: y0 + i * rowGap,
      })
    })
  }

  return nodes.map((n) => {
    const p = pos.get(n.id) || n.position
    return {
      ...n,
      position: { x: Math.round(p.x), y: Math.round(p.y) },
    }
  })
}
