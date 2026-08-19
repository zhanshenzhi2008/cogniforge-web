import { describe, it, expect, vi, beforeEach } from 'vitest'
import { quotaExhausted, type QuotaSnapshot } from '../useQuota'

const { mockApi } = vi.hoisted(() => ({
  mockApi: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    del: vi.fn(),
  },
}))

vi.mock('../useApi', () => ({
  useApi: () => mockApi,
}))

function snap(over: Partial<QuotaSnapshot> = {}): QuotaSnapshot {
  return {
    unlimited: false,
    warn: false,
    day: { requests_used: 0, requests_limit: 30, tokens_used: 0, tokens_limit: 100000, resets_at: '' },
    month: { tokens_used: 0, tokens_limit: 1000000, resets_at: '' },
    ...over,
  }
}

describe('quotaExhausted', () => {
  it('is false when snap is missing', () => {
    expect(quotaExhausted(null)).toBe(false)
    expect(quotaExhausted(undefined)).toBe(false)
  })

  it('is false for unlimited (admin default)', () => {
    expect(quotaExhausted(snap({ unlimited: true, day: { requests_used: 99, requests_limit: 30, tokens_used: 0, tokens_limit: 100000, resets_at: '' } }))).toBe(false)
  })

  it('is true when daily requests hit the cap', () => {
    expect(quotaExhausted(snap({ day: { requests_used: 30, requests_limit: 30, tokens_used: 0, tokens_limit: 100000, resets_at: '' } }))).toBe(true)
  })

  it('is true when daily tokens hit the cap', () => {
    expect(quotaExhausted(snap({ day: { requests_used: 1, requests_limit: 30, tokens_used: 100000, tokens_limit: 100000, resets_at: '' } }))).toBe(true)
  })

  it('is true when monthly tokens hit the cap', () => {
    expect(quotaExhausted(snap({ month: { tokens_used: 1000000, tokens_limit: 1000000, resets_at: '' } }))).toBe(true)
  })

  it('is false when still under all caps', () => {
    expect(quotaExhausted(snap({ day: { requests_used: 29, requests_limit: 30, tokens_used: 99999, tokens_limit: 100000, resets_at: '' } }))).toBe(false)
  })

  it('ignores a zero request limit (treat as unset)', () => {
    expect(quotaExhausted(snap({ day: { requests_used: 5, requests_limit: 0, tokens_used: 0, tokens_limit: 100000, resets_at: '' } }))).toBe(false)
  })
})

describe('useQuota', () => {
  beforeEach(() => {
    mockApi.get.mockReset()
    mockApi.put.mockReset()
  })

  it('calls GET /api/v1/quota/me', async () => {
    mockApi.get.mockResolvedValue({ data: { unlimited: true } })
    const { useQuota } = await import('../useQuota')
    const { me } = useQuota()
    await me()
    expect(mockApi.get).toHaveBeenCalledWith('/api/v1/quota/me')
  })

  it('calls usage with range and scope', async () => {
    mockApi.get.mockResolvedValue({ data: { points: [] } })
    const { useQuota } = await import('../useQuota')
    await useQuota().usage('7d', 'all')
    expect(mockApi.get).toHaveBeenCalledWith('/api/v1/quota/usage?range=7d&scope=all')
  })

  it('loads and updates the default policy', async () => {
    mockApi.get.mockResolvedValue({ data: { daily_requests: 30 } })
    mockApi.put.mockResolvedValue({ data: { daily_requests: 10 } })
    const { useQuota } = await import('../useQuota')
    const api = useQuota()
    await api.getPolicy()
    await api.putPolicy({ daily_requests: 10 })
    expect(mockApi.get).toHaveBeenCalledWith('/api/v1/admin/quota/policy')
    expect(mockApi.put).toHaveBeenCalledWith('/api/v1/admin/quota/policy', { daily_requests: 10 })
  })

  it('clears a per-user override', async () => {
    mockApi.put.mockResolvedValue({ data: { cleared: true } })
    const { useQuota } = await import('../useQuota')
    await useQuota().putUserPolicy('u1', { clear: true })
    expect(mockApi.put).toHaveBeenCalledWith('/api/v1/admin/quota/users/u1', { clear: true })
  })
})
