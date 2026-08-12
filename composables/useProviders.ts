/**
 * AI Provider types and API composable
 */

import { useApi } from './useApi'

export interface AIProvider {
  id: string
  name: string
  provider: string       // openai | anthropic | openrouter | azure | gemini | siliconeglow | deepseek
  base_url: string
  default_model: string
  extra_headers: Record<string, any> | null
  is_enabled: boolean
  is_default: boolean
  priority: number
  status: 'active' | 'error' | 'testing'
  last_test_at: string | null
  last_error: string
  api_key?: string      // 仅在详情接口返回，列表接口返回 mask 后的值
  created_at: string
  updated_at: string
}

export interface CreateProviderInput {
  id?: string
  name: string
  provider: string
  base_url?: string
  api_key: string
  default_model?: string
  extra_headers?: Record<string, any>
  is_enabled?: boolean
  priority?: number
}

export interface UpdateProviderInput {
  name?: string
  base_url?: string
  api_key?: string
  default_model?: string
  extra_headers?: Record<string, any>
  is_enabled?: boolean
  priority?: number
}

export interface TestResult {
  success: boolean
  message: string
  latency_ms: number
}

// 供应商元信息（用于表单展示）
export const PROVIDER_META: Record<string, { label: string; icon: string; color: string; defaultBaseURL: string; docURL: string; local?: boolean }> = {
  openai: {
    label: 'OpenAI',
    icon: '🤖',
    color: '#10a37f',
    defaultBaseURL: 'https://api.openai.com/v1',
    docURL: 'https://platform.openai.com/docs/api-reference',
  },
  anthropic: {
    label: 'Anthropic Claude',
    icon: '🧠',
    color: '#d4a574',
    defaultBaseURL: 'https://api.anthropic.com',
    docURL: 'https://docs.anthropic.com/en/api/reference',
  },
  openrouter: {
    label: 'OpenRouter',
    icon: '🛤️',
    color: '#7c3aed',
    defaultBaseURL: 'https://openrouter.ai/api/v1',
    docURL: 'https://openrouter.ai/docs',
  },
  siliconeglow: {
    label: '硅基流动 SiliconGlow',
    icon: '🌊',
    color: '#0ea5e9',
    defaultBaseURL: 'https://api.siliconflow.cn/v1',
    docURL: 'https://docs.siliconflow.cn',
  },
  deepseek: {
    label: 'DeepSeek',
    icon: '🔮',
    color: '#6366f1',
    defaultBaseURL: 'https://api.deepseek.com/v1',
    docURL: 'https://api-docs.deepseek.com',
  },
  aicore: {
    label: 'AI Core',
    icon: '⚡',
    color: '#f59e0b',
    defaultBaseURL: 'https://api.xty.app/v1',
    docURL: '',
  },
  azure: {
    label: 'Azure OpenAI',
    icon: '☁️',
    color: '#0078d4',
    defaultBaseURL: '',
    docURL: 'https://learn.microsoft.com/en-us/azure/ai-services/openai/reference',
  },
  gemini: {
    label: 'Google Gemini',
    icon: '💎',
    color: '#4285f4',
    defaultBaseURL: 'https://generativelanguage.googleapis.com/v1beta',
    docURL: 'https://ai.google.dev/api/rest',
  },
  groq: {
    label: 'Groq',
    icon: '⚡',
    color: '#f97316',
    defaultBaseURL: 'https://api.groq.com/openai/v1',
    docURL: 'https://console.groq.com/docs',
  },
  ollama: {
    label: 'Ollama 本地',
    icon: '🖥️',
    color: '#64748b',
    defaultBaseURL: 'http://localhost:11434/v1',
    docURL: 'https://github.com/ollama/ollama',
    local: true,
  },
}

export const PROVIDER_OPTIONS = Object.entries(PROVIDER_META).map(([value, meta]) => ({
  value,
  label: `${meta.icon} ${meta.label}`,
}))

export const useProviders = () => {
  const api = useApi()

  const list = async (): Promise<{ data?: AIProvider[]; error?: string }> => {
    try {
      const res = await api.get<AIProvider[]>('/api/v1/providers')
      if (res.error) return { error: res.error }
      return { data: res.data || [] }
    } catch (err: any) {
      return { error: err.message || '获取供应商列表失败' }
    }
  }

  const get = async (id: string): Promise<{ data?: AIProvider; error?: string }> => {
    try {
      const res = await api.get<AIProvider>(`/api/v1/providers/${id}`)
      if (res.error) return { error: res.error }
      return { data: res.data }
    } catch (err: any) {
      return { error: err.message || '获取供应商详情失败' }
    }
  }

  const getActive = async (): Promise<{ data?: AIProvider; error?: string }> => {
    try {
      const res = await api.get<AIProvider>('/api/v1/providers/active')
      if (res.error) return { error: res.error }
      return { data: res.data }
    } catch (err: any) {
      return { error: err.message || '获取当前配置失败' }
    }
  }

  const create = async (input: CreateProviderInput): Promise<{ data?: AIProvider; error?: string }> => {
    try {
      const res = await api.post<AIProvider>('/api/v1/providers', input)
      if (res.error) return { error: res.error }
      return { data: res.data }
    } catch (err: any) {
      return { error: err.message || '创建供应商失败' }
    }
  }

  const update = async (id: string, input: UpdateProviderInput): Promise<{ data?: AIProvider; error?: string }> => {
    try {
      const res = await api.put<AIProvider>(`/api/v1/providers/${id}`, input)
      if (res.error) return { error: res.error }
      return { data: res.data }
    } catch (err: any) {
      return { error: err.message || '更新供应商失败' }
    }
  }

  const remove = async (id: string): Promise<{ error?: string }> => {
    try {
      const res = await api.del(`/api/v1/providers/${id}`)
      if (res.error) return { error: res.error }
      return {}
    } catch (err: any) {
      return { error: err.message || '删除供应商失败' }
    }
  }

  const setDefault = async (id: string): Promise<{ error?: string }> => {
    try {
      const res = await api.post(`/api/v1/providers/${id}/default`)
      if (res.error) return { error: res.error }
      return {}
    } catch (err: any) {
      return { error: err.message || '设置默认供应商失败' }
    }
  }

  const test = async (id: string): Promise<{ data?: TestResult; error?: string }> => {
    try {
      const res = await api.post<TestResult>(`/api/v1/providers/${id}/test`)
      if (res.error) return { error: res.error }
      return { data: res.data }
    } catch (err: any) {
      return { error: err.message || '测试连接失败' }
    }
  }

  return {
    list,
    get,
    getActive,
    create,
    update,
    remove,
    setDefault,
    test,
  }
}
