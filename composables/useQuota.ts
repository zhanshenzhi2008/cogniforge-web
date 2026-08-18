/**
 * Playground / Agent 配额与用量
 */
import { useApi } from './useApi'

export interface QuotaWindow {
  requests_used?: number
  requests_limit?: number
  tokens_used: number
  tokens_limit: number
  resets_at: string
}

export interface QuotaSnapshot {
  unlimited: boolean
  day: QuotaWindow
  month: QuotaWindow
  warn: boolean
}

export interface UsagePoint {
  date: string
  requests: number
  tokens: number
}

export interface ModelShare {
  model: string
  tokens: number
}

export interface TopUser {
  user_id: string
  name: string
  tokens: number
}

export interface UsageReport {
  points: UsagePoint[]
  by_model: ModelShare[]
  top_users?: TopUser[]
}

export interface QuotaPolicy {
  id?: string
  user_id?: string | null
  daily_requests: number
  daily_tokens: number
  monthly_tokens: number
  rpm: number
  admin_unlimited: boolean
  enabled: boolean
}

export function quotaExhausted(snap: QuotaSnapshot | null | undefined): boolean {
  if (!snap || snap.unlimited) return false
  const reqLimit = snap.day.requests_limit || 0
  const tokLimit = snap.day.tokens_limit || 0
  const monthLimit = snap.month.tokens_limit || 0
  if (reqLimit > 0 && (snap.day.requests_used || 0) >= reqLimit) return true
  if (tokLimit > 0 && snap.day.tokens_used >= tokLimit) return true
  if (monthLimit > 0 && snap.month.tokens_used >= monthLimit) return true
  return false
}

export const useQuota = () => {
  const api = useApi()

  const me = () => api.get<QuotaSnapshot>('/api/v1/quota/me')

  const usage = (range: '7d' | '30d', scope: 'self' | 'all' = 'self') => {
    const q = new URLSearchParams({ range, scope })
    return api.get<UsageReport>(`/api/v1/quota/usage?${q.toString()}`)
  }

  const getPolicy = () => api.get<QuotaPolicy>('/api/v1/admin/quota/policy')

  const putPolicy = (body: Partial<QuotaPolicy>) =>
    api.put<QuotaPolicy>('/api/v1/admin/quota/policy', body)

  const putUserPolicy = (userId: string, body: Partial<QuotaPolicy> & { clear?: boolean }) =>
    api.put<QuotaPolicy | { cleared: boolean }>(`/api/v1/admin/quota/users/${userId}`, body)

  return { me, usage, getPolicy, putPolicy, putUserPolicy }
}
