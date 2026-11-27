/**
 * 多 Agent 小队 API（对齐 Go /api/v1/teams）
 */

import { useApi } from './useApi'

export type TeamMode = 'pipeline' | 'supervisor' | 'handoff'

export interface AgentTeam {
  id: string
  user_id: string
  name: string
  description: string
  mode: TeamMode
  supervisor_agent_id: string
  member_agent_ids: string[]
  workflow_id?: string
  config?: Record<string, unknown>
  status: string
  created_at: string
  updated_at: string
}

export interface CreateTeamInput {
  name: string
  description?: string
  mode?: TeamMode
  supervisor_agent_id?: string
  member_agent_ids?: string[]
  workflow_id?: string
  config?: Record<string, unknown>
  status?: string
}

export interface UpdateTeamInput {
  name?: string
  description?: string
  mode?: TeamMode
  supervisor_agent_id?: string
  member_agent_ids?: string[]
  workflow_id?: string
  config?: Record<string, unknown>
  status?: string
}

export interface TeamDelegateRecord {
  worker_agent_id: string
  task?: string
  result_summary?: string
  at?: string
}

export interface TeamRunState {
  team_id: string
  active_agent_id: string
  goal?: string
  step_count?: number
  handoff_history?: unknown[]
  delegate_history?: TeamDelegateRecord[]
  scratchpad?: Record<string, unknown>
}

export interface TeamChatResult {
  response?: {
    id?: string
    model?: string
    choices?: Array<{ message?: { role?: string, content?: unknown } }>
  }
  run_state?: TeamRunState
  conversation_id?: string
}

export const useTeams = () => {
  const api = useApi()

  const list = async (): Promise<{ data?: AgentTeam[], error?: string }> => {
    try {
      const res = await api.get<AgentTeam[]>('/api/v1/teams')
      if (res.error) return { error: res.error }
      return { data: res.data || [] }
    }
    catch (err: any) {
      return { error: err.message || '获取小队列表失败' }
    }
  }

  const get = async (id: string): Promise<{ data?: AgentTeam, error?: string }> => {
    try {
      const res = await api.get<AgentTeam>(`/api/v1/teams/${id}`)
      if (res.error) return { error: res.error }
      return { data: res.data }
    }
    catch (err: any) {
      return { error: err.message || '获取小队失败' }
    }
  }

  const create = async (input: CreateTeamInput): Promise<{ data?: AgentTeam, error?: string }> => {
    try {
      const res = await api.post<AgentTeam>('/api/v1/teams', input)
      if (res.error) return { error: res.error }
      return { data: res.data }
    }
    catch (err: any) {
      return { error: err.message || '创建小队失败' }
    }
  }

  const update = async (id: string, input: UpdateTeamInput): Promise<{ data?: AgentTeam, error?: string }> => {
    try {
      const res = await api.put<AgentTeam>(`/api/v1/teams/${id}`, input)
      if (res.error) return { error: res.error }
      return { data: res.data }
    }
    catch (err: any) {
      return { error: err.message || '更新小队失败' }
    }
  }

  const remove = async (id: string): Promise<{ error?: string }> => {
    try {
      const res = await api.del(`/api/v1/teams/${id}`)
      if (res.error) return { error: res.error }
      return {}
    }
    catch (err: any) {
      return { error: err.message || '删除小队失败' }
    }
  }

  const chat = async (
    id: string,
    body: {
      messages: Array<{ role: string, content: string }>
      stream?: boolean
      goal?: string
      run_state?: TeamRunState | null
      conversation_id?: string
    },
  ): Promise<{ data?: TeamChatResult, error?: string }> => {
    try {
      const res = await api.post<TeamChatResult>(`/api/v1/teams/${id}/chat`, body)
      if (res.error) return { error: res.error }
      return { data: res.data }
    }
    catch (err: any) {
      return { error: err.message || '小队对话失败' }
    }
  }

  const run = async (
    id: string,
    body: {
      task: string
      goal?: string
      run_state?: TeamRunState | null
    },
  ): Promise<{ data?: TeamChatResult, error?: string }> => {
    try {
      const res = await api.post<TeamChatResult>(`/api/v1/teams/${id}/run`, body)
      if (res.error) return { error: res.error }
      return { data: res.data }
    }
    catch (err: any) {
      return { error: err.message || '小队任务执行失败' }
    }
  }

  const expandPipeline = async (
    id: string,
    opts?: { layout?: 'parallel' | 'linear' | 'team' },
  ): Promise<{ data?: { team?: AgentTeam, workflow?: { id: string, name?: string } }, error?: string }> => {
    try {
      const res = await api.post<{ team?: AgentTeam, workflow?: { id: string, name?: string } }>(
        `/api/v1/teams/${id}/expand-pipeline`,
        opts?.layout ? { layout: opts.layout } : {},
      )
      if (res.error) return { error: res.error }
      return { data: res.data }
    }
    catch (err: any) {
      return { error: err.message || '生成流水线失败' }
    }
  }

  return { list, get, create, update, remove, chat, run, expandPipeline }
}
