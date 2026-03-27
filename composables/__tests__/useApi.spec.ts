import { describe, it, expect, vi } from 'vitest'
import { ref, readonly } from 'vue'

// Mock #imports (Nuxt auto-imports) before useAuth is evaluated
vi.mock('#imports', () => ({
  ref,
  readonly,
  useRouter: () => ({ push: vi.fn() }),
  useCookie: () => ({ value: null }),
}))

// Mock useAuth so useApi can be imported without hitting Nuxt internals
vi.mock('../useAuth', () => ({
  useAuth: () => ({
    getToken: vi.fn(() => 'mock-token'),
    redirectToLogin: vi.fn(),
    clearAuth: vi.fn(),
    setAuth: vi.fn(),
    isAuthenticated: { value: false },
    currentUser: { value: null },
    isLoggedIn: vi.fn(() => false),
  }),
}))

import { useApi, useHealthApi } from '../useApi'

// --- useApi tests ---
describe('useApi', () => {
  it('should be importable and return an object', () => {
    const api = useApi()
    expect(api).toBeDefined()
  })

  it('should expose get, post, del methods', () => {
    const api = useApi()
    expect(typeof api.get).toBe('function')
    expect(typeof api.post).toBe('function')
    expect(typeof api.del).toBe('function')
  })
})

// --- useHealthApi tests ---
describe('useHealthApi', () => {
  it('should be importable and return health check functions', () => {
    const healthApi = useHealthApi()
    expect(healthApi).toBeDefined()
    expect(typeof healthApi.checkHealth).toBe('function')
    expect(typeof healthApi.checkReady).toBe('function')
    expect(typeof healthApi.checkLive).toBe('function')
  })
})
