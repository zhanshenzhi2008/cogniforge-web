/**
 * Agent types and API composable
 */

export interface MemoryConfig {
  type: 'short_term' | 'long_term'
  max_turns: number
}

export interface Guardrails {
  input_filter: boolean
  output_filter: boolean
}

export interface Agent {
  id: string
  user_id: string
  name: string
  description: string
  model: string
  system_prompt: string
  tools: string[]
  memory_config: MemoryConfig
  guardrails: Guardrails
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
  memory_config?: MemoryConfig
  guardrails?: Guardrails
}

export interface UpdateAgentInput {
  name?: string
  description?: string
  model?: string
  system_prompt?: string
  tools?: string[]
  memory_config?: MemoryConfig
  guardrails?: Guardrails
  status?: string
}

export const useAgents = () => {
  const api = useApi()

  const list = async (): Promise<{ data?: Agent[]; error?: string }> => {
    try {
      const res = await api.get<{ data: Agent[] }>('/api/v1/agents/')
      return { data: res.data?.data || [] }
    } catch (err: any) {
      return { error: err.message || '获取 Agent 列表失败' }
    }
  }

  const get = async (id: string): Promise<{ data?: Agent; error?: string }> => {
    try {
      const res = await api.get<Agent>(`/api/v1/agents/${id}`)
      return { data: res.data }
    } catch (err: any) {
      return { error: err.message || '获取 Agent 详情失败' }
    }
  }

  const create = async (input: CreateAgentInput): Promise<{ data?: Agent; error?: string }> => {
    try {
      const res = await api.post<Agent>('/api/v1/agents/', input)
      return { data: res.data }
    } catch (err: any) {
      return { error: err.message || '创建 Agent 失败' }
    }
  }

  const update = async (id: string, input: UpdateAgentInput): Promise<{ data?: Agent; error?: string }> => {
    try {
      const res = await api.put<Agent>(`/api/v1/agents/${id}`, input)
      return { data: res.data }
    } catch (err: any) {
      return { error: err.message || '更新 Agent 失败' }
    }
  }

  const remove = async (id: string): Promise<{ error?: string }> => {
    try {
      await api.del(`/api/v1/agents/${id}`)
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
