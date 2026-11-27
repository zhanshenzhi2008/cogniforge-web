/** 需要侧栏绑定资源的节点类型 */
export const WORKFLOW_BIND_KINDS = ['llm', 'http', 'code', 'condition', 'team', 'agent', 'search', 'subflow'] as const
export type WorkflowBindKind = (typeof WORKFLOW_BIND_KINDS)[number]

/** 画布 / 保存 / 执行共用：节点是否尚未绑定必填资源 */
export function isWorkflowBindUnbound(kind: string, data?: Record<string, unknown> | null): boolean {
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
    return !String(d.subflowWorkflowId || d.workflowId || d.workflow_id || '').trim()
  }
  return false
}
