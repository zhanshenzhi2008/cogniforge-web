/**
 * Workflow types and API composable
 */

import { useApi } from './useApi'

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

export interface WorkflowNodeRun {
  id: string
  execution_id: string
  node_id: string
  node_type: string
  attempt: number
  status: 'pending' | 'running' | 'succeeded' | 'failed' | 'skipped' | string
  error?: string
  duration_ms?: number
  output?: Record<string, any>
}

export interface WorkflowExecution {
  id: string
  workflow_id: string
  user_id: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'debugging' | 'cancelled' | 'waiting' | 'succeeded'
  wait_reason?: string
  wait_until?: string | null
  input: Record<string, any>
  output: string
  error: string
  current_node?: string
  node_runs?: WorkflowNodeRun[]
  latest_checkpoint_seq?: number
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
  name?: string
  position: { x: number; y: number }
  data: {
    label: string
    config?: Record<string, any>
    [key: string]: any
  }
  config?: Record<string, any>
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

  const getExecution = async (_id: string, executionId: string): Promise<{ data?: WorkflowExecution; error?: string }> => {
    try {
      const res = await api.get<WorkflowExecution>(`/api/v1/workflows/executions/${executionId}`)
      if (res.error) return { error: res.error }
      return { data: res.data }
    } catch (err: any) {
      return { error: err.message || '获取执行记录失败' }
    }
  }

  const listExecutions = async (id: string): Promise<{ data?: WorkflowExecution[]; error?: string }> => {
    try {
      const res = await api.get<WorkflowExecution[]>(`/api/v1/workflows/${id}/executions`)
      if (res.error) return { error: res.error }
      return { data: res.data || [] }
    } catch (err: any) {
      return { error: err.message || '获取执行列表失败' }
    }
  }

  const cancelExecution = async (_id: string, executionId: string): Promise<{ error?: string }> => {
    try {
      const res = await api.post(`/api/v1/workflows/executions/${executionId}/cancel`, {})
      if (res.error) return { error: res.error }
      return {}
    } catch (err: any) {
      return { error: err.message || '取消执行失败' }
    }
  }

  const resumeExecution = async (
    _id: string,
    executionId: string,
    seq?: number,
  ): Promise<{ executionId?: string; status?: string; error?: string }> => {
    try {
      const body = seq != null ? { seq } : {}
      const res = await api.post<{ execution_id: string; status: string }>(
        `/api/v1/workflows/executions/${executionId}/resume`,
        body,
      )
      if (res.error) return { error: res.error }
      return { executionId: res.data?.execution_id, status: res.data?.status }
    } catch (err: any) {
      return { error: err.message || '继续执行失败' }
    }
  }

  const approveExecution = async (
    _id: string,
    executionId: string,
    comment?: string,
  ): Promise<{ executionId?: string; status?: string; error?: string }> => {
    try {
      const res = await api.post<{ execution_id: string; status: string }>(
        `/api/v1/workflows/executions/${executionId}/approve`,
        comment ? { comment } : {},
      )
      if (res.error) return { error: res.error }
      return { executionId: res.data?.execution_id, status: res.data?.status }
    } catch (err: any) {
      return { error: err.message || '审批失败' }
    }
  }

  const rejectExecution = async (
    _id: string,
    executionId: string,
    reason?: string,
  ): Promise<{ error?: string }> => {
    try {
      const res = await api.post(
        `/api/v1/workflows/executions/${executionId}/reject`,
        reason ? { reason } : {},
      )
      if (res.error) return { error: res.error }
      return {}
    } catch (err: any) {
      return { error: err.message || '拒绝失败' }
    }
  }

  const debug = async (id: string, input?: Record<string, any>, breakpoints?: string[]): Promise<{ executionId?: string; error?: string }> => {
    try {
      const res = await api.post<{ execution_id: string; status: string }>(`/api/v1/workflows/${id}/debug`, { input, node_breakpoints: breakpoints })
      if (res.error) return { error: res.error }
      return { executionId: res.data?.execution_id }
    } catch (err: any) {
      return { error: err.message || '启动调试失败' }
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
    listExecutions,
    cancelExecution,
    resumeExecution,
    approveExecution,
    rejectExecution,
    debug,
  }
}
