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

/** 开始类节点（start / input）不得作为边的终点；兼容旧图/导入脏数据 */
export function findStartsWithIncoming(
  nodes: { id: string, type?: string, data?: { label?: string } }[],
  edges: { source: string, target: string }[],
): { id: string, label: string, kind: string }[] {
  const byId = new Map(nodes.map(n => [n.id, n]))
  const seen = new Set<string>()
  const out: { id: string, label: string, kind: string }[] = []
  for (const e of edges) {
    const n = byId.get(e.target)
    if (!n || seen.has(n.id)) continue
    const kind = String(n.type || '')
    if (kind !== 'start' && kind !== 'input') continue
    seen.add(n.id)
    out.push({
      id: n.id,
      label: String(n.data?.label || kind || n.id),
      kind,
    })
  }
  return out
}

/** 条件节点须同时有真(s-top)与假(s-bottom)出边 */
export function findConditionsMissingBranches(
  nodes: { id: string, type?: string, data?: { label?: string } }[],
  edges: { source: string, target: string, sourceHandle?: string | null }[],
): { id: string, label: string, missing: 'true' | 'false' | 'both' }[] {
  const out: { id: string, label: string, missing: 'true' | 'false' | 'both' }[] = []
  for (const n of nodes) {
    if (String(n.type || '') !== 'condition') continue
    let hasTrue = false
    let hasFalse = false
    for (const e of edges) {
      if (e.source !== n.id) continue
      const h = String(e.sourceHandle || '').trim()
      if (h === 's-top' || h === 'true') hasTrue = true
      else if (h === 's-bottom' || h === 'false') hasFalse = true
    }
    if (hasTrue && hasFalse) continue
    const missing = !hasTrue && !hasFalse ? 'both' : (!hasTrue ? 'true' : 'false')
    out.push({
      id: n.id,
      label: String(n.data?.label || 'condition'),
      missing,
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

/**
 * 从 start 可达、但不是结束类、却没有任何出边的节点（死胡同）。
 * 条件节点由 findConditionsMissingBranches 覆盖，这里跳过。
 */
export function findDeadEndNodes(
  nodes: { id: string, type?: string, data?: { label?: string } }[],
  edges: { source: string, target: string }[],
): { id: string, label: string, kind: string }[] {
  if (!nodes.length) return []
  const hasStart = nodes.some(n => String(n.type || '') === 'start')
  if (!hasStart) return []
  const reachable = reachableFromStart(nodes, edges)
  const hasOut = new Set(edges.map(e => e.source))
  const out: { id: string, label: string, kind: string }[] = []
  for (const n of nodes) {
    const kind = String(n.type || '')
    if (kind === 'end' || kind === 'output' || kind === 'condition') continue
    if (!reachable.has(n.id)) continue
    if (hasOut.has(n.id)) continue
    out.push({
      id: n.id,
      label: String(n.data?.label || kind || n.id),
      kind,
    })
  }
  return out
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
