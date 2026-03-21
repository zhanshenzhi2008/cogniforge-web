import { createApiClient } from '../utils/apiClient'

export interface HealthResponse {
  status: 'ok' | 'error'
  timestamp: string
  version: string
}

export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
  message?: string
}

export const useApi = () => {
  // 优先从 localStorage 读取（登录时存储），fallback 到 Cookie
  const getToken = () => {
    if (typeof window !== 'undefined') {
      const localToken = localStorage.getItem('token')
      if (localToken) return localToken
    }
    const tokenCookie = useCookie('token')
    return tokenCookie.value || null
  }

  return createApiClient({
    baseUrl: (import.meta.server ? 'http://localhost:8080' : (window.__API_BASE_URL__ || 'http://localhost:8080')),
    getToken,
  })
}

export const useHealthApi = () => {
  const api = useApi()

  const checkHealth = async (): Promise<ApiResponse<HealthResponse>> => {
    return api.get<HealthResponse>('/health')
  }

  const checkReady = async (): Promise<ApiResponse<{ status: string }>> => {
    return api.get<{ status: string }>('/ready')
  }

  const checkLive = async (): Promise<ApiResponse<{ status: string }>> => {
    return api.get<{ status: string }>('/live')
  }

  return {
    checkHealth,
    checkReady,
    checkLive,
  }
}
