/** 画布边 ↔ 工作流 definition 边的句柄字段往返（条件真/假出口依赖此字段） */

export type WorkflowEdgeLike = {
  id: string
  source: string
  target: string
  sourceHandle?: string | null
  targetHandle?: string | null
  source_handle?: string | null
  target_handle?: string | null
  label?: string | null
}

/** 条件出边句柄 → 真/假；无法识别则 null */
export function conditionBranchKind(
  handle?: string | null,
): 'true' | 'false' | null {
  const h = String(handle || '').trim().toLowerCase()
  if (h === 's-top' || h === 'true') return 'true'
  if (h === 's-bottom' || h === 'false') return 'false'
  return null
}

/** 写入 definition：camel + snake 双写，兼容 Vue Flow 与 Go `source_handle` */
export function toDefinitionEdge(e: WorkflowEdgeLike) {
  const sourceHandle = String(e.sourceHandle || e.source_handle || '').trim() || undefined
  const targetHandle = String(e.targetHandle || e.target_handle || '').trim() || undefined
  return {
    id: e.id,
    source: e.source,
    target: e.target,
    ...(sourceHandle ? { sourceHandle, source_handle: sourceHandle } : {}),
    ...(targetHandle ? { targetHandle, target_handle: targetHandle } : {}),
  }
}

/** 从 definition 读回画布：兼容 camel / snake */
export function fromDefinitionEdge(e: WorkflowEdgeLike) {
  const sourceHandle = String(e.sourceHandle || e.source_handle || '').trim() || undefined
  const targetHandle = String(e.targetHandle || e.target_handle || '').trim() || undefined
  return {
    id: e.id,
    source: e.source,
    target: e.target,
    sourceHandle,
    targetHandle,
  }
}
