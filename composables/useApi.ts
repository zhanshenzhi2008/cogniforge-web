import { createApiClient } from '../utils/apiClient'
import { useAuth } from './useAuth'

export const useApi = () => {
  const auth = useAuth()

  return createApiClient({
    baseUrl: 'http://localhost:8080',
    getToken: () => auth.getToken(),
    onUnauthorized: () => auth.redirectToLogin(),
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
