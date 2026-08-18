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

describe('quotaExhausted', () => {
  const base: QuotaSnapshot = {
    unlimited: false,
    warn: false,
    day: { requests_used: 0, requests_limit: 30, tokens_used: 0, tokens_limit: 100000, resets_at: '' },
    month: { tokens_used: 0, tokens_limit: 1000000, resets_at: '' },
  }

  it('is false for unlimited', () => {
    expect(quotaExhausted({ ...base, unlimited: true, day: { ...base.day, requests_used: 99 } })).toBe(false)
  })

  it('is true when daily requests hit the cap', () => {
    expect(quotaExhausted({ ...base, day: { ...base.day, requests_used: 30 } })).toBe(true)
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
})
