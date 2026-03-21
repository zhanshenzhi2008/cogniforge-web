import { describe, it, expect } from 'vitest'

describe('Health API Composable', () => {
  describe('useHealthApi', () => {
    it('should be importable from useApi', async () => {
      const { useHealthApi } = await import('../useApi')
      const healthApi = useHealthApi()

      expect(healthApi).toBeDefined()
      expect(healthApi.checkHealth).toBeDefined()
      expect(healthApi.checkReady).toBeDefined()
      expect(healthApi.checkLive).toBeDefined()
    })

    it('should return health check functions', async () => {
      const { useHealthApi } = await import('../useApi')
      const healthApi = useHealthApi()

      expect(typeof healthApi.checkHealth).toBe('function')
      expect(typeof healthApi.checkReady).toBe('function')
      expect(typeof healthApi.checkLive).toBe('function')
    })
  })
})

describe('useApi Composable', () => {
  it('should be importable', async () => {
    const { useApi } = await import('../useApi')
    const api = useApi()

    expect(api).toBeDefined()
    expect(api.get).toBeDefined()
    expect(api.post).toBeDefined()
    expect(api.put).toBeDefined()
    expect(api.delete).toBeDefined()
  })

  it('should return API methods', async () => {
    const { useApi } = await import('../useApi')
    const api = useApi()

    expect(typeof api.get).toBe('function')
    expect(typeof api.post).toBe('function')
    expect(typeof api.put).toBe('function')
    expect(typeof api.delete).toBe('function')
  })
})
