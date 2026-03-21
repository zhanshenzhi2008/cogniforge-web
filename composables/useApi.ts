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
  return createApiClient({
    baseUrl: (import.meta.server ? 'http://localhost:8080' : (window.__API_BASE_URL__ || 'http://localhost:8080')),
    getToken: () => typeof window !== 'undefined' ? localStorage.getItem('token') : null,
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
