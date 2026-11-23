import { resolveApiBase } from '~/utils/apiBase'

/** Same base-url rules as useApi (prod empty = same-origin; dev → localhost:8080). */
export function readChatApiBase(): string {
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

/** Authorization only when a token exists (avoid empty Bearer → 401 format errors). */
export function chatAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  const token = useAuth().getToken()
  if (token) headers.Authorization = `Bearer ${token}`
  return headers
}
