import { createApiClient } from '../utils/apiClient'
import { resolveApiBase } from '../utils/apiBase'
import { useAuth } from './useAuth'

function readApiBase(): string {
  try {
    const runtime = useRuntimeConfig()
    const resolved = resolveApiBase(String(runtime.public?.apiBase ?? ''))
    if (resolved) return resolved
    if (import.meta.env?.PROD) return ''
    return 'http://localhost:8080'
  } catch {
    return 'http://localhost:8080'
  }
}

export const useApi = () => {
  const auth = useAuth()

  return createApiClient({
    baseUrl: readApiBase(),
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
