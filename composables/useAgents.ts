/**
 * Agent types and API composable
 */

export interface Agent {
  id: string
  user_id: string
  name: string
  description: string
  model: string
  system_prompt: string
  tools: string[]
  memory_type: string
  memory_turns: number
  input_filter: boolean
  output_filter: boolean
  status: 'active' | 'disabled'
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

export interface CreateAgentInput {
  name: string
  description?: string
  model: string
  system_prompt?: string
  tools?: string[]
}

export interface UpdateAgentInput {
  name?: string
  description?: string
  model?: string
  system_prompt?: string
  tools?: string[]
  status?: string
}

export const useAgents = () => {
  const api = useApi()

  const list = async (): Promise<{ data?: Agent[]; error?: string }> => {
    try {
      const res = await api.get<Agent[]>('/api/v1/agents/')
      if (res.error) return { error: res.error }
      return { data: res.data || [] }
    } catch (err: any) {
      return { error: err.message || '获取 Agent 列表失败' }
    }
  }

  const get = async (id: string): Promise<{ data?: Agent; error?: string }> => {
    try {
      const res = await api.get<Agent>(`/api/v1/agents/${id}`)
      if (res.error) return { error: res.error }
      return { data: res.data }
    } catch (err: any) {
      return { error: err.message || '获取 Agent 详情失败' }
    }
  }

  const create = async (input: CreateAgentInput): Promise<{ data?: Agent; error?: string }> => {
    try {
      const res = await api.post<Agent>('/api/v1/agents/', input)
      if (res.error) return { error: res.error }
      return { data: res.data }
    } catch (err: any) {
      return { error: err.message || '创建 Agent 失败' }
    }
  }

  const update = async (id: string, input: UpdateAgentInput): Promise<{ data?: Agent; error?: string }> => {
    try {
      const res = await api.put<Agent>(`/api/v1/agents/${id}`, input)
      if (res.error) return { error: res.error }
      return { data: res.data }
    } catch (err: any) {
      return { error: err.message || '更新 Agent 失败' }
    }
  }

  const remove = async (id: string): Promise<{ error?: string }> => {
    try {
      const res = await api.del(`/api/v1/agents/${id}`)
      if (res.error) return { error: res.error }
      return {}
    } catch (err: any) {
      return { error: err.message || '删除 Agent 失败' }
    }
  }

  return {
    list,
    get,
    create,
    update,
    remove,
  }
}
