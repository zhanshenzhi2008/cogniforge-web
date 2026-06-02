export interface HealthResponse {
  status: 'ok' | 'error'
  timestamp: string
  version: string
}

export interface ApiResponse<T = unknown> {
  code?: number
  message?: string
  trace_id?: string
  data?: T
  error?: string
}

export interface ApiConfig {
  baseUrl: string
  getToken?: () => string | null
  onUnauthorized?: () => void
}

// traceId header 名称（与后端一致）
const TRACE_ID_HEADER = 'X-Trace-ID'
const RESPONSE_TRACE_ID_HEADER = 'X-Trace-ID'

// 生成 traceId
function generateTraceId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 10)}`
}

// 获取或生成 traceId（存储在 session 中）
function getOrCreateTraceId(): string {
  const storageKey = 'x-trace-id'
  let traceId = sessionStorage.getItem(storageKey)
  if (!traceId) {
    traceId = generateTraceId()
    sessionStorage.setItem(storageKey, traceId)
  }
  return traceId
}

/** 与后端 internal/model/code.go IsSuccess 一致：2xxx 为成功；0 为旧版兼容 */
export function isApiSuccessCode(code: number): boolean {
  return code === 0 || (code >= 2000 && code < 3000)
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

    // 获取当前 traceId 并添加到请求 header
    const traceId = getOrCreateTraceId()

    const defaultHeaders: HeadersInit = {
      'Content-Type': 'application/json',
      [TRACE_ID_HEADER]: traceId,
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

      let data: any
      try {
        data = await response.json()
      } catch (e) {
        // 无法解析 JSON 响应
        if (!response.ok) {
          console.error('[API Error] Failed to parse response:', response.status, url)
          return {
            error: `HTTP ${response.status}`,
          }
        }
        return { data: undefined }
      }

      if (response.status === 401) {
        try {
          finalConfig.onUnauthorized?.()
        } catch {
          // ignore redirect errors
        }
        console.warn('[API 401]', url, data)
        return {
          error: data.error || data.message || 'Unauthorized',
        }
      }

      if (!response.ok) {
        console.error('[API Error]', response.status, url, data)
        return {
          error: data.error || data.message || `HTTP ${response.status}`,
        }
      }

      // 统一响应格式（业务 code：2xxx 成功，4xxx/5xxx 失败；兼容历史 code===0）
      if (data && typeof data === 'object' && 'code' in data) {
        if (!isApiSuccessCode(data.code)) {
          console.warn('[API Business Error]', url, data)
          return {
            error: data.error || data.message || `API error (code: ${data.code})`,
          }
        }
        return { data: data.data }
      }

      // 兜底：直接返回 body 作为 data
      return { data }
    } catch (error) {
      // Network error (CORS, no connection, etc.)
      console.error('[API Network Error]', url, error)
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
    del: <T>(endpoint: string) => request<T>(endpoint, { method: 'DELETE' }),

    /**
     * 上传文件（使用 FormData）
     * @param endpoint API 端点
     * @param formData FormData 对象，包含文件字段
     */
    upload: async <T>(endpoint: string, formData: FormData): Promise<ApiResponse<T>> => {
      const url = `${finalConfig.baseUrl}${endpoint}`

      // 获取当前 traceId 并添加到请求 header
      const traceId = getOrCreateTraceId()
      const headers: HeadersInit = {
        [TRACE_ID_HEADER]: traceId,
      }

      const token = finalConfig.getToken?.()
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers,
          body: formData,
        })

        let data: any
        try {
          data = await response.json()
        } catch {
          if (!response.ok) {
            return { error: `HTTP ${response.status}` }
          }
          return { data: undefined }
        }

        if (response.status === 401) {
          return { error: data.error || data.message || 'Unauthorized' }
        }

        if (!response.ok) {
          return { error: data.error || data.message || `HTTP ${response.status}` }
        }

        if (data && typeof data === 'object' && 'code' in data) {
          if (!isApiSuccessCode(data.code)) {
            return { error: data.error || data.message || `API error (code: ${data.code})` }
          }
          return { data: data.data }
        }

        return { data }
      } catch (error) {
        return { error: error instanceof Error ? error.message : 'Upload failed' }
      }
    },
  }
}

export type ApiClient = ReturnType<typeof createApiClient>

// 导出 traceId 相关工具函数
export const traceIdUtils = {
  generate: generateTraceId,
  get: getOrCreateTraceId,
  clear: () => sessionStorage.removeItem('x-trace-id'),
}
