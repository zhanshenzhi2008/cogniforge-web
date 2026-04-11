/**
 * Workflow types and API composable
 */

export interface Workflow {
  id: string
  user_id: string
  name: string
  description: string
  definition: string
  status: 'draft' | 'published' | 'archived'
  version: number
  created_at: string
  updated_at: string
}

export interface WorkflowExecution {
  id: string
  workflow_id: string
  user_id: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  input: Record<string, any>
  output: string
  error: string
  started_at: string | null
  completed_at: string | null
  created_at: string
}

export interface CreateWorkflowInput {
  name: string
  description?: string
  definition?: WorkflowDefinition
}

export interface UpdateWorkflowInput {
  name?: string
  description?: string
  status?: string
  definition?: WorkflowDefinition
}

export interface WorkflowDefinition {
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
}

export interface WorkflowNode {
  id: string
  type: string
  position: { x: number; y: number }
  data: {
    label: string
    config?: Record<string, any>
  }
}

export interface WorkflowEdge {
  id: string
  source: string
  target: string
  type?: string
  animated?: boolean
}

export const useWorkflows = () => {
  const api = useApi()

  const list = async (): Promise<{ data?: Workflow[]; error?: string }> => {
    try {
      const res = await api.get<Workflow[]>('/api/v1/workflows')
      if (res.error) return { error: res.error }
      return { data: res.data || [] }
    } catch (err: any) {
      return { error: err.message || '获取工作流列表失败' }
    }
  }

  const get = async (id: string): Promise<{ data?: Workflow; error?: string }> => {
    try {
      const res = await api.get<Workflow>(`/api/v1/workflows/${id}`)
      if (res.error) return { error: res.error }
      return { data: res.data }
    } catch (err: any) {
      return { error: err.message || '获取工作流详情失败' }
    }
  }

  const create = async (input: CreateWorkflowInput): Promise<{ data?: Workflow; error?: string }> => {
    try {
      const res = await api.post<Workflow>('/api/v1/workflows', input)
      if (res.error) return { error: res.error }
      return { data: res.data }
    } catch (err: any) {
      return { error: err.message || '创建工作流失败' }
    }
  }

  const update = async (id: string, input: UpdateWorkflowInput): Promise<{ data?: Workflow; error?: string }> => {
    try {
      const res = await api.put<Workflow>(`/api/v1/workflows/${id}`, input)
      if (res.error) return { error: res.error }
      return { data: res.data }
    } catch (err: any) {
      return { error: err.message || '更新工作流失败' }
    }
  }

  const remove = async (id: string): Promise<{ error?: string }> => {
    try {
      const res = await api.del(`/api/v1/workflows/${id}`)
      if (res.error) return { error: res.error }
      return {}
    } catch (err: any) {
      return { error: err.message || '删除工作流失败' }
    }
  }

  const execute = async (id: string, input?: Record<string, any>): Promise<{ executionId?: string; status?: string; error?: string }> => {
    try {
      const res = await api.post<{ execution_id: string; status: string }>(`/api/v1/workflows/${id}/execute`, { input })
      if (res.error) return { error: res.error }
      return { executionId: res.data?.execution_id, status: res.data?.status }
    } catch (err: any) {
      return { error: err.message || '执行工作流失败' }
    }
  }

  const getExecution = async (id: string, executionId: string): Promise<{ data?: WorkflowExecution; error?: string }> => {
    try {
      const res = await api.get<WorkflowExecution>(`/api/v1/workflows/${id}/executions/${executionId}`)
      if (res.error) return { error: res.error }
      return { data: res.data }
    } catch (err: any) {
      return { error: err.message || '获取执行记录失败' }
    }
  }

  return {
    list,
    get,
    create,
    update,
    remove,
    execute,
    getExecution,
  }
}
