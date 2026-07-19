import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref, readonly } from 'vue'

// Mock #imports (Nuxt auto-imports) before useSessions is evaluated
vi.mock('#imports', () => ({
  ref,
  readonly,
  useRouter: () => ({ push: vi.fn() }),
  useCookie: () => ({ value: null }),
}))

// Mock useAuth
vi.mock('../useAuth', () => ({
  useAuth: () => ({
    getToken: vi.fn(() => 'mock-token'),
    redirectToLogin: vi.fn(),
    clearAuth: vi.fn(),
    setAuth: vi.fn(),
    isAuthenticated: { value: true },
    currentUser: { value: { id: 'user-1', email: 'test@example.com', name: 'Test User' } },
    isLoggedIn: vi.fn(() => true),
  }),
}))

// Import after mocks are set up
import { useSessions } from '../useSessions'

// Helper to create fetch mock
const mockFetchResponse = (data: any, status = 200) => {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
  })
}

describe('useSessions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('useSessions', () => {
    it('should be importable and return session functions', () => {
      const sessions = useSessions()
      expect(sessions).toBeDefined()
      expect(typeof sessions.getSessions).toBe('function')
      expect(typeof sessions.revokeSession).toBe('function')
      expect(typeof sessions.revokeAllOtherSessions).toBe('function')
    })
  })

  describe('getSessions', () => {
    it('should return empty array when no sessions exist', async () => {
      const mockResponse = {
        code: 2000,
        message: 'success',
        data: [],
      }
      globalThis.fetch = mockFetchResponse(mockResponse)

      const { getSessions } = useSessions()
      const result = await getSessions()

      expect(result).toEqual([])
      expect(globalThis.fetch).toHaveBeenCalledWith(
        'http://localhost:8080/api/sessions',
        expect.objectContaining({ method: 'GET' })
      )
    })

    it('should return sessions list when sessions exist', async () => {
      const mockSessions = [
        {
          id: 'session-1',
          user_id: 'user-1',
          token_id: 'token-1',
          user_agent: 'Mozilla/5.0',
          ip_address: '192.168.1.1',
          device: 'Desktop',
          location: 'Shanghai, China',
          expires_at: '2026-04-28T00:00:00Z',
          last_used: '2026-04-21T10:00:00Z',
          is_active: true,
          created_at: '2026-04-20T00:00:00Z',
          updated_at: '2026-04-21T10:00:00Z',
        },
        {
          id: 'session-2',
          user_id: 'user-1',
          token_id: 'token-2',
          user_agent: 'Mozilla/5.0 (iPhone)',
          ip_address: '10.0.0.1',
          device: 'Mobile',
          location: 'Beijing, China',
          expires_at: '2026-04-28T00:00:00Z',
          last_used: '2026-04-20T15:00:00Z',
          is_active: true,
          created_at: '2026-04-19T00:00:00Z',
          updated_at: '2026-04-20T15:00:00Z',
        },
      ]
      const mockResponse = {
        code: 2000,
        message: 'success',
        data: mockSessions,
      }
      globalThis.fetch = mockFetchResponse(mockResponse)

      const { getSessions } = useSessions()
      const result = await getSessions()

      expect(result).toEqual(mockSessions)
      expect(result).toHaveLength(2)
    })

    it('should throw error when API returns error', async () => {
      const mockResponse = {
        code: 401,
        message: 'Unauthorized',
        error: 'Unauthorized',
      }
      globalThis.fetch = mockFetchResponse(mockResponse, 401)

      const { getSessions } = useSessions()
      await expect(getSessions()).rejects.toThrow()
    })

    it('should return empty array when response data is undefined', async () => {
      const mockResponse = {
        code: 2000,
        message: 'success',
      }
      globalThis.fetch = mockFetchResponse(mockResponse)

      const { getSessions } = useSessions()
      const result = await getSessions()

      expect(result).toEqual([])
    })
  })

  describe('revokeSession', () => {
    it('should revoke session successfully', async () => {
      const mockResponse = {
        code: 2000,
        message: 'Session revoked',
        data: null,
      }
      globalThis.fetch = mockFetchResponse(mockResponse)

      const { revokeSession } = useSessions()
      await expect(revokeSession('session-1')).resolves.toBeUndefined()

      expect(globalThis.fetch).toHaveBeenCalledWith(
        'http://localhost:8080/api/sessions/session-1',
        expect.objectContaining({ method: 'DELETE' })
      )
    })

    it('should throw error when revoke fails', async () => {
      const mockResponse = {
        code: 404,
        message: 'Session not found',
        error: 'Session not found',
      }
      globalThis.fetch = mockFetchResponse(mockResponse, 404)

      const { revokeSession } = useSessions()
      await expect(revokeSession('invalid-session')).rejects.toThrow()
    })
  })

  describe('revokeAllOtherSessions', () => {
    it('should revoke all sessions except current', async () => {
      const mockSessions = [
        { id: 'session-1', is_active: true, is_current: true },
        { id: 'session-2', is_active: true, is_current: false },
        { id: 'session-3', is_active: false, is_current: false },
      ]

      let callCount = 0
      globalThis.fetch = vi.fn().mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          // First call: getSessions
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ code: 2000, data: mockSessions }),
          })
        } else {
          // Subsequent calls: revoke
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ code: 2000, data: null }),
          })
        }
      })

      const { revokeAllOtherSessions } = useSessions()
      await expect(revokeAllOtherSessions()).resolves.toBeUndefined()

      // Should be called 3 times: 1 for getSessions + 2 for revoke
      expect(globalThis.fetch).toHaveBeenCalledTimes(3)
    })

    it('should not call delete when no other sessions exist', async () => {
      const mockSessions = [{ id: 'session-1', is_active: true, is_current: true }]

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ code: 2000, data: mockSessions }),
      })

      const { revokeAllOtherSessions } = useSessions()
      await revokeAllOtherSessions()

      // Should only be called once for getSessions
      expect(globalThis.fetch).toHaveBeenCalledTimes(1)
    })
  })
})
