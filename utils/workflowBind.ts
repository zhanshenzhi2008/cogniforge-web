/** 需要侧栏绑定资源的节点类型（含 input/output 必填变量） */
export const WORKFLOW_BIND_KINDS = [
  'llm',
  'http',
  'code',
  'condition',
  'team',
  'agent',
  'search',
  'subflow',
  'input',
  'output',
] as const
export type WorkflowBindKind = (typeof WORKFLOW_BIND_KINDS)[number]

/** 子流程目标工作流 ID */
export function subflowTargetId(data?: Record<string, unknown> | null): string {
  const d = data || {}
  return String(d.subflowWorkflowId || d.workflowId || d.workflow_id || '').trim()
}

/** 子流程是否指向当前工作流（会无限嵌套） */
export function isSubflowSelfReference(
  data: Record<string, unknown> | null | undefined,
  currentWorkflowId?: string | null,
): boolean {
  const cur = String(currentWorkflowId || '').trim()
  if (!cur) return false
  const target = subflowTargetId(data)
  return !!target && target === cur
}

export type WorkflowBindOpts = {
  /** 当前编辑的工作流 ID；用于判定子流程是否自嵌套 */
  currentWorkflowId?: string | null
}

/** 画布 / 保存 / 执行共用：节点是否尚未绑定必填资源 */
export function isWorkflowBindUnbound(
  kind: string,
  data?: Record<string, unknown> | null,
  opts?: WorkflowBindOpts,
): boolean {
  const d = data || {}
  if (kind === 'llm') return !String(d.model || '').trim()
  if (kind === 'http') return !String(d.url || d.httpUrl || '').trim()
  if (kind === 'code') return !String(d.codeSource || d.code || '').trim()
  if (kind === 'condition') {
    const field = String(d.conditionField || '').trim()
    if (field) return false
    const conds = Array.isArray(d.conditions) ? d.conditions : []
    const first = conds[0] as { field?: string } | undefined
    return !String(first?.field || '').trim()
  }
  if (kind === 'team') return !String(d.teamId || '').trim()
  if (kind === 'agent') return !String(d.agentId || '').trim()
  if (kind === 'search') return !String(d.knowledgeBaseId || '').trim()
  if (kind === 'subflow') {
    const id = subflowTargetId(d)
    if (!id) return true
    // 旧图/导入可能仍指向自身；与引擎 RunNested 拒绝一致
    if (isSubflowSelfReference(d, opts?.currentWorkflowId)) return true
    return false
  }
  if (kind === 'input' || kind === 'output') {
    return !String(d.variable || '').trim()
  }
  if (kind === 'loop') {
    let loopType = String(d.loopType || d.type || 'times').trim() || 'times'
    if (loopType === 'count') loopType = 'times'
    if (loopType !== 'for_each') return false
    return !String(d.loopArrayVar || d.array_var || '').trim()
  }
  return false
}
