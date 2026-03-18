const config = useRuntimeConfig()

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  body?: any
  headers?: Record<string, string>
}

export const useApi = () => {
  const baseURL = config.public.apiBase

  const request = async <T = any>(endpoint: string, options: RequestOptions = {}): Promise<T> => {
    const { method = 'GET', body, headers = {} } = options

    const token = useCookie('token')
    if (token.value) {
      headers['Authorization'] = `Bearer ${token.value}`
    }

    const response = await $fetch<T>(`${baseURL}${endpoint}`, {
      method,
      body,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    })

    return response
  }

  const get = <T = any>(endpoint: string) => request<T>(endpoint)
  const post = <T = any>(endpoint: string, body?: any) => request<T>(endpoint, { method: 'POST', body })
  const put = <T = any>(endpoint: string, body?: any) => request<T>(endpoint, { method: 'PUT', body })
  const del = <T = any>(endpoint: string) => request<T>(endpoint, { method: 'DELETE' })

  return { request, get, post, put, del }
}
