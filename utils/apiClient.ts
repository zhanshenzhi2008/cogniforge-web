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

export interface ApiConfig {
  baseUrl: string
  getToken?: () => string | null
  onUnauthorized?: () => void
}

export const defaultConfig: ApiConfig = {
  baseUrl: 'http://localhost:8080',
}

export const createApiClient = (config: Partial<ApiConfig> = {}) => {
  const finalConfig: ApiConfig = { ...defaultConfig, ...config }

  const request = async <T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> => {
    const url = `${finalConfig.baseUrl}${endpoint}`

    const defaultHeaders: HeadersInit = {
      'Content-Type': 'application/json',
    }

    const token = finalConfig.getToken?.()
    if (token) {
      defaultHeaders['Authorization'] = `Bearer ${token}`
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...defaultHeaders,
          ...options.headers,
        },
      })

      const data = await response.json()

      if (response.status === 401) {
        finalConfig.onUnauthorized?.()
        return {
          error: data.error || data.message || 'Unauthorized',
        }
      }

      if (!response.ok) {
        return {
          error: data.error || data.message || `HTTP ${response.status}`,
        }
      }

      return { data }
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Network error',
      }
    }
  }

  return {
    get: <T>(endpoint: string) => request<T>(endpoint, { method: 'GET' }),
    post: <T>(endpoint: string, body?: unknown) =>
      request<T>(endpoint, {
        method: 'POST',
        body: body ? JSON.stringify(body) : undefined,
      }),
    put: <T>(endpoint: string, body?: unknown) =>
      request<T>(endpoint, {
        method: 'PUT',
        body: body ? JSON.stringify(body) : undefined,
      }),
    delete: <T>(endpoint: string) => request<T>(endpoint, { method: 'DELETE' }),
  }
}

export type ApiClient = ReturnType<typeof createApiClient>
