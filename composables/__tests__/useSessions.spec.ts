import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useSessions } from '../useSessions'

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

describe('useSessions', () => {
  beforeEach(() => {
    mockApi.get.mockReset()
    mockApi.del.mockReset()
  })

  it('loads GET /api/v1/settings/sessions with useApi (not Nuxt $fetch)', async () => {
    mockApi.get.mockResolvedValue({ data: [] })
    const { getSessions } = useSessions()
    const res = await getSessions()
    expect(mockApi.get).toHaveBeenCalledWith('/api/v1/settings/sessions')
    expect(res.data).toEqual([])
    expect(res.error).toBeUndefined()
  })

  it('returns the session list', async () => {
    const rows = [{ id: 's1', device: 'Desktop', is_active: true }]
    mockApi.get.mockResolvedValue({ data: rows })
    const { getSessions } = useSessions()
    expect((await getSessions()).data).toEqual(rows)
  })

  it('never returns a non-array (HTML/object would freeze v-for)', async () => {
    mockApi.get.mockResolvedValue({ data: '<!DOCTYPE html>' })
    const { getSessions } = useSessions()
    expect((await getSessions()).data).toEqual([])

    mockApi.get.mockResolvedValue({ data: { code: 2000 } })
    expect((await getSessions()).data).toEqual([])
  })

  it('surfaces API errors without throwing', async () => {
    mockApi.get.mockResolvedValue({ error: 'Unauthorized' })
    const { getSessions } = useSessions()
    const res = await getSessions()
    expect(res.data).toEqual([])
    expect(res.error).toBe('Unauthorized')
  })

  it('revokes via DELETE /api/v1/settings/sessions/:id', async () => {
    mockApi.del.mockResolvedValue({ data: undefined })
    const { revokeSession } = useSessions()
    const res = await revokeSession('session-1')
    expect(mockApi.del).toHaveBeenCalledWith('/api/v1/settings/sessions/session-1')
    expect(res.error).toBeUndefined()
  })
})
