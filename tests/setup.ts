/**
 * Vitest 测试环境配置
 *
 * 这个文件在每个测试文件运行前执行
 * 用于配置全局 mocks 和测试环境
 */

import { vi } from 'vitest'

// Mock useRuntimeConfig
const mockUseRuntimeConfig = vi.fn(() => ({
  public: {
    apiBase: 'http://localhost:8080/api/v1'
  }
}))

// Mock useCookie
const mockUseCookie = vi.fn(() => ({
  value: null
}))

// Mock $fetch
const mock$fetch = vi.fn()

// Mock Nuxt 的 auto-imports
vi.mock('nuxt/app', () => ({
  useRuntimeConfig: mockUseRuntimeConfig,
  useCookie: mockUseCookie,
}))

// Mock ofetch/$fetch
vi.mock('ofetch', () => ({
  $fetch: mock$fetch,
  fetch: mock$fetch,
}))

// Mock #imports (Nuxt 的导入别名)
vi.mock('#imports', () => ({
  useRuntimeConfig: mockUseRuntimeConfig,
  useCookie: mockUseCookie,
  $fetch: mock$fetch,
}))

// 全局暴露 mocks 供测试使用
;(globalThis as any).__mockUseRuntimeConfig = mockUseRuntimeConfig
;(globalThis as any).__mockUseCookie = mockUseCookie
;(globalThis as any).__mock$fetch = mock$fetch

// 导出 mocks
export { mockUseRuntimeConfig, mockUseCookie, mock$fetch }
