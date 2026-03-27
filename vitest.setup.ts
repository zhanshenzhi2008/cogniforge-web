// Vitest global setup — provides mock implementations for Nuxt auto-imports
// so that composables (e.g. useApi calling useAuth) work in vitest without a full Nuxt runtime.

import { vi, ref as makeRef, readonly } from 'vitest'

vi.mock('#imports', () => ({
  ref: makeRef,
  readonly,
  useRouter: () => ({
    push: vi.fn(),
  }),
  useCookie: vi.fn(() => ({ value: null })),
}))

// Mock the useAuth module that composables/useApi.ts explicitly imports
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
