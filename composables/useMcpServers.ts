/**
 * MCP Server types and API composable
 */

import { useApi } from './useApi'

export interface McpServer {
  id: string
  user_id: string
  name: string
  type: 'built-in' | 'http'
  url?: string
  auth_header?: string
  enabled: boolean
  metadata?: Record<string, any>
  created_at: string
  updated_at: string
  /** 列表接口附带的已发现工具数 */
  tool_count?: number
}

export interface McpTool {
  name: string
  description: string
  input_schema?: Record<string, any>
  server_id: string
  server_type?: string
}

export const useMcpServers = () => {
  const api = useApi()

  const list = async (): Promise<{ data?: McpServer[]; error?: string }> => {
    try {
      const res = await api.get<McpServer[]>('/api/v1/mcp/servers')
      if (res.error) return { error: res.error }
      return { data: res.data || [] }
    } catch (err: any) {
      return { error: err.message || '获取 MCP Server 列表失败' }
    }
  }

  const getOne = async (id: string): Promise<{ data?: McpServer; error?: string }> => {
    try {
      const res = await api.get<McpServer>(`/api/v1/mcp/servers/${id}`)
      if (res.error) return { error: res.error }
      return { data: res.data }
    } catch (err: any) {
      return { error: err.message || '获取 MCP Server 失败' }
    }
  }

  const listTools = async (
    id: string,
    opts?: { refresh?: boolean },
  ): Promise<{ data?: McpTool[]; error?: string }> => {
    try {
      const q = opts?.refresh ? '?refresh=1' : ''
      const res = await api.get<McpTool[]>(`/api/v1/mcp/servers/${id}/tools${q}`)
      if (res.error) return { error: res.error }
      return { data: res.data || [] }
    } catch (err: any) {
      return { error: err.message || '获取工具列表失败' }
    }
  }

  const refreshTools = async (id: string): Promise<{ data?: McpTool[]; error?: string }> => {
    try {
      const res = await api.post<McpTool[]>(`/api/v1/mcp/servers/${id}/tools/refresh`, {})
      if (res.error) return { error: res.error }
      return { data: res.data || [] }
    } catch (err: any) {
      return { error: err.message || '刷新工具失败' }
    }
  }

  const create = async (input: Partial<McpServer>): Promise<{ data?: McpServer; error?: string }> => {
    try {
      const res = await api.post<McpServer>('/api/v1/mcp/servers', input)
      if (res.error) return { error: res.error }
      return { data: res.data }
    } catch (err: any) {
      return { error: err.message || '创建 MCP Server 失败' }
    }
  }

  const update = async (id: string, input: Partial<McpServer>): Promise<{ data?: McpServer; error?: string }> => {
    try {
      const res = await api.put<McpServer>(`/api/v1/mcp/servers/${id}`, input)
      if (res.error) return { error: res.error }
      return { data: res.data }
    } catch (err: any) {
      return { error: err.message || '更新 MCP Server 失败' }
    }
  }

  const remove = async (id: string): Promise<{ error?: string }> => {
    try {
      const res = await api.del(`/api/v1/mcp/servers/${id}`)
      if (res.error) return { error: res.error }
      return {}
    } catch (err: any) {
      return { error: err.message || '删除 MCP Server 失败' }
    }
  }

  return {
    list,
    getOne,
    listTools,
    refreshTools,
    create,
    update,
    remove,
  }
}
