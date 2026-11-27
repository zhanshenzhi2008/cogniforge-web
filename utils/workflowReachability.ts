/** 图中所有开始节点（按原顺序） */
export function findStartNodes(
  nodes: { id: string, type?: string, data?: { label?: string } }[],
): { id: string, label: string }[] {
  const out: { id: string, label: string }[] = []
  for (const n of nodes) {
    if (String(n.type || '') !== 'start') continue
    out.push({
      id: n.id,
      label: String(n.data?.label || 'start'),
    })
  }
  return out
}

/** 结束类节点（end / output）不得作为边的起点；兼容旧图/导入脏数据 */
export function findEndsWithOutgoing(
  nodes: { id: string, type?: string, data?: { label?: string } }[],
  edges: { source: string, target: string }[],
): { id: string, label: string, kind: string }[] {
  const byId = new Map(nodes.map(n => [n.id, n]))
  const seen = new Set<string>()
  const out: { id: string, label: string, kind: string }[] = []
  for (const e of edges) {
    const n = byId.get(e.source)
    if (!n || seen.has(n.id)) continue
    const kind = String(n.type || '')
    if (kind !== 'end' && kind !== 'output') continue
    seen.add(n.id)
    out.push({
      id: n.id,
      label: String(n.data?.label || kind || n.id),
      kind,
    })
  }
  return out
}

/** 从 start 出发，沿边走到的节点 id 集合（含 start；多 start 时只用第一个） */
export function reachableFromStart(
  nodes: { id: string, type?: string }[],
  edges: { source: string, target: string }[],
): Set<string> {
  const start = nodes.find(n => String(n.type || '') === 'start')
  const seen = new Set<string>()
  if (!start) return seen

  const outs = new Map<string, string[]>()
  for (const e of edges) {
    const list = outs.get(e.source) || []
    list.push(e.target)
    outs.set(e.source, list)
  }

  const queue = [start.id]
  seen.add(start.id)
  while (queue.length) {
    const cur = queue.shift()!
    for (const next of outs.get(cur) || []) {
      if (seen.has(next)) continue
      seen.add(next)
      queue.push(next)
    }
  }
  return seen
}

/** 相对 start 不可达的节点（无 start 时返回全部非空图节点） */
export function findUnreachableNodes(
  nodes: { id: string, type?: string, data?: { label?: string } }[],
  edges: { source: string, target: string }[],
): { id: string, label: string, kind: string }[] {
  if (!nodes.length) return []
  const reachable = reachableFromStart(nodes, edges)
  const hasStart = nodes.some(n => String(n.type || '') === 'start')
  const out: { id: string, label: string, kind: string }[] = []
  for (const n of nodes) {
    const kind = String(n.type || '')
    if (kind === 'start') continue
    if (hasStart && reachable.has(n.id)) continue
    out.push({
      id: n.id,
      label: String(n.data?.label || kind || n.id),
      kind,
    })
  }
  return out
}
