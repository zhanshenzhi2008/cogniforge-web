/**
 * 工作流节点元信息：图标 / 配色 / 连接点形态。
 * 左侧面板与画布共用；域图标统一取自 constants/icons。
 */

import { CF_ICONS } from '~/constants/icons'

export type WorkflowNodeKind =
  | 'start'
  | 'end'
  | 'llm'
  | 'agent'
  | 'team'
  | 'condition'
  | 'loop'
  | 'http'
  | 'code'
  | 'delay'
  | 'wait'
  | 'search'
  | 'input'
  | 'output'

/** 连接点：配合左→右排版。条件节点上下分叉。 */
export type HandleLayout = 'start' | 'end' | 'io' | 'branch'

export interface WorkflowNodeMeta {
  icon: string
  /** CSS 修饰 class 后缀，如 flow-node-llm */
  tone: string
  handles: HandleLayout
}

export const WORKFLOW_NODE_META: Record<WorkflowNodeKind, WorkflowNodeMeta> = {
  start: { icon: 'i-lucide-play', tone: 'start', handles: 'start' },
  end: { icon: CF_ICONS.workflowEnd, tone: 'end', handles: 'end' },
  llm: { icon: CF_ICONS.llm, tone: 'llm', handles: 'io' },
  agent: { icon: CF_ICONS.agent, tone: 'agent', handles: 'io' },
  team: { icon: CF_ICONS.team, tone: 'team', handles: 'io' },
  condition: { icon: CF_ICONS.workflow, tone: 'condition', handles: 'branch' },
  loop: { icon: 'i-lucide-repeat', tone: 'loop', handles: 'io' },
  http: { icon: 'i-lucide-globe', tone: 'http', handles: 'io' },
  code: { icon: 'i-lucide-code-2', tone: 'code', handles: 'io' },
  delay: { icon: 'i-lucide-timer', tone: 'delay', handles: 'io' },
  wait: { icon: 'i-lucide-pause-circle', tone: 'wait', handles: 'io' },
  search: { icon: CF_ICONS.knowledge, tone: 'search', handles: 'io' },
  input: { icon: 'i-lucide-download', tone: 'input', handles: 'start' },
  output: { icon: 'i-lucide-upload', tone: 'output', handles: 'end' },
}

export const WORKFLOW_PALETTE_TYPES: WorkflowNodeKind[] = [
  'start',
  'end',
  'llm',
  'agent',
  'team',
  'search',
  'condition',
  'loop',
  'http',
  'code',
  'delay',
  'wait',
]

export function getWorkflowNodeMeta(type: string): WorkflowNodeMeta {
  if (type === 'human_action') {
    return { icon: 'i-lucide-user-check', tone: 'wait', handles: 'io' }
  }
  return WORKFLOW_NODE_META[type as WorkflowNodeKind] || {
    icon: CF_ICONS.fallback,
    tone: 'default',
    handles: 'io',
  }
}
