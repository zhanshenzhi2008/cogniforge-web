/**
 * Playground conversation history API
 */

import { useApi } from './useApi'

export interface ConversationMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  time?: string
}

export interface ConversationSummary {
  id: string
  title: string
  agent_id: string
  model: string
  created_at: string
  updated_at: string
}

export interface Conversation extends ConversationSummary {
  user_id: string
  messages: ConversationMessage[]
}

export interface UpsertConversationInput {
  title?: string
  agent_id?: string
  model?: string
  messages?: ConversationMessage[]
}

export const useConversations = () => {
  const api = useApi()

  const list = async (): Promise<{ data?: ConversationSummary[]; error?: string }> => {
    try {
      const res = await api.get<ConversationSummary[]>('/api/v1/conversations')
      if (res.error) return { error: res.error }
      return { data: res.data || [] }
    } catch (err: any) {
      return { error: err.message || '获取对话列表失败' }
    }
  }

  const get = async (id: string): Promise<{ data?: Conversation; error?: string }> => {
    try {
      const res = await api.get<Conversation>(`/api/v1/conversations/${id}`)
      if (res.error) return { error: res.error }
      return { data: res.data }
    } catch (err: any) {
      return { error: err.message || '获取对话失败' }
    }
  }

  const create = async (input: UpsertConversationInput): Promise<{ data?: Conversation; error?: string }> => {
    try {
      const res = await api.post<Conversation>('/api/v1/conversations', input)
      if (res.error) return { error: res.error }
      return { data: res.data }
    } catch (err: any) {
      return { error: err.message || '保存对话失败' }
    }
  }

  const update = async (id: string, input: UpsertConversationInput): Promise<{ data?: Conversation; error?: string }> => {
    try {
      const res = await api.put<Conversation>(`/api/v1/conversations/${id}`, input)
      if (res.error) return { error: res.error }
      return { data: res.data }
    } catch (err: any) {
      return { error: err.message || '更新对话失败' }
    }
  }

  const remove = async (id: string): Promise<{ error?: string }> => {
    try {
      const res = await api.del(`/api/v1/conversations/${id}`)
      if (res.error) return { error: res.error }
      return {}
    } catch (err: any) {
      return { error: err.message || '删除对话失败' }
    }
  }

  return { list, get, create, update, remove }
}
