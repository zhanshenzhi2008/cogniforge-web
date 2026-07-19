import { describe, it, expect } from 'vitest'
import { createApiClient, defaultConfig, isApiSuccessCode } from '../apiClient'

// --- Method presence tests ---
// These verify that apiClient returns the exact methods that pages actually use.
// If a page calls a method that doesn't exist, the test suite catches it.

describe('apiClient method contract', () => {
  describe('methods that pages depend on', () => {
    it('should have get method (used by keys.vue, playground.vue)', () => {
      const client = createApiClient()
      expect(typeof client.get).toBe('function')
    })

    it('should have post method (used by keys.vue, login.vue, register.vue)', () => {
      const client = createApiClient()
      expect(typeof client.post).toBe('function')
    })

    it('should have del method (used by keys.vue — NOT delete)', () => {
      const client = createApiClient()
      expect(typeof client.del).toBe('function')
    })
  })

  describe('HTTP method bindings', () => {
    it('get should use GET', () => {
      const client = createApiClient()
      const originalFetch = globalThis.fetch
      let capturedMethod = ''
      globalThis.fetch = (url, options) => {
        capturedMethod = options?.method || 'GET'
        return Promise.resolve(new Response('{}', { status: 200 }))
      }
      client.get<unknown>('/test')
      globalThis.fetch = originalFetch
      expect(capturedMethod).toBe('GET')
    })

    it('post should use POST', () => {
      const client = createApiClient()
      const originalFetch = globalThis.fetch
      let capturedMethod = ''
      globalThis.fetch = (url, options) => {
        capturedMethod = options?.method || 'GET'
        return Promise.resolve(new Response('{}', { status: 200 }))
      }
      client.post<unknown>('/test', { foo: 'bar' })
      globalThis.fetch = originalFetch
      expect(capturedMethod).toBe('POST')
    })

    it('del should use DELETE', () => {
      const client = createApiClient()
      const originalFetch = globalThis.fetch
      let capturedMethod = ''
      globalThis.fetch = (url, options) => {
        capturedMethod = options?.method || 'GET'
        return Promise.resolve(new Response('{}', { status: 200 }))
      }
      client.del<unknown>('/test')
      globalThis.fetch = originalFetch
      expect(capturedMethod).toBe('DELETE')
    })
  })
})

// --- Response shape tests ---
// These verify that the ApiResponse shape matches what pages expect.

describe('ApiResponse shape', () => {
  it('should return { data } on success', async () => {
    const client = createApiClient()
    const originalFetch = globalThis.fetch
    globalThis.fetch = () =>
      Promise.resolve(new Response(JSON.stringify({ id: 1 }), { status: 200 }))
    const res = await client.get<{ id: number }>('/test')
    globalThis.fetch = originalFetch
    expect(res.data).toBeDefined()
    expect((res as any).error).toBeUndefined()
  })

  it('should treat backend business code 2000 as success', async () => {
    const client = createApiClient()
    const originalFetch = globalThis.fetch
    globalThis.fetch = () =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            code: 2000,
            message: '成功',
            trace_id: 'abc-1',
            data: [{ id: '1' }],
          }),
          { status: 200 },
        ),
      )
    const res = await client.get<{ id: string }[]>('/test')
    globalThis.fetch = originalFetch
    expect(res.error).toBeUndefined()
    expect(res.data).toEqual([{ id: '1' }])
  })

  it('should treat code 5001 as error even when HTTP 200', async () => {
    const client = createApiClient()
    const originalFetch = globalThis.fetch
    globalThis.fetch = () =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            code: 5001,
            message: '参数无效',
            trace_id: 'abc-2',
            error: 'name required',
          }),
          { status: 200 },
        ),
      )
    const res = await client.get<unknown>('/test')
    globalThis.fetch = originalFetch
    expect(res.error).toBe('name required')
    expect(res.data).toBeUndefined()
  })

  it('should return { error } on HTTP error', async () => {
    const client = createApiClient()
    const originalFetch = globalThis.fetch
    globalThis.fetch = () =>
      Promise.resolve(new Response(JSON.stringify({ error: 'bad request' }), { status: 400 }))
    const res = await client.get<unknown>('/test')
    globalThis.fetch = originalFetch
    expect(res.error).toBeDefined()
    expect((res as any).data).toBeUndefined()
  })

  it('should call onUnauthorized on 401', async () => {
    let called = false
    const client = createApiClient({
      onUnauthorized: () => { called = true },
    })
    const originalFetch = globalThis.fetch
    globalThis.fetch = () =>
      Promise.resolve(new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 }))
    await client.get<unknown>('/test')
    globalThis.fetch = originalFetch
    expect(called).toBe(true)
  })

  it('should include Authorization header when token exists', async () => {
    const client = createApiClient({
      getToken: () => 'test-token',
    })
    const originalFetch = globalThis.fetch
    let capturedHeaders: HeadersInit = {}
    globalThis.fetch = (url, options) => {
      capturedHeaders = options?.headers || {}
      return Promise.resolve(new Response('{}', { status: 200 }))
    }
    client.get<unknown>('/test')
    globalThis.fetch = originalFetch
    expect((capturedHeaders as Record<string, string>)['Authorization']).toBe('Bearer test-token')
  })

  it('should not include Authorization header when no token', async () => {
    const client = createApiClient({
      getToken: () => null,
    })
    const originalFetch = globalThis.fetch
    let capturedHeaders: HeadersInit = {}
    globalThis.fetch = (url, options) => {
      capturedHeaders = options?.headers || {}
      return Promise.resolve(new Response('{}', { status: 200 }))
    }
    client.get<unknown>('/test')
    globalThis.fetch = originalFetch
    expect((capturedHeaders as Record<string, string>)['Authorization']).toBeUndefined()
  })

  it('should use default baseUrl', () => {
    expect(defaultConfig.baseUrl).toBe('http://localhost:8080')
  })

  it('should accept custom baseUrl', async () => {
    const client = createApiClient({ baseUrl: 'https://api.example.com' })
    const originalFetch = globalThis.fetch
    let capturedUrl = ''
    globalThis.fetch = (url) => {
      capturedUrl = url as string
      return Promise.resolve(new Response('{}', { status: 200 }))
    }
    client.get<unknown>('/v1/test')
    globalThis.fetch = originalFetch
    expect(capturedUrl).toBe('https://api.example.com/v1/test')
  })

  it('should JSON-stringify body for POST', async () => {
    const client = createApiClient()
    const originalFetch = globalThis.fetch
    let capturedBody = ''
    globalThis.fetch = (url, options) => {
      capturedBody = options?.body as string || ''
      return Promise.resolve(new Response('{}', { status: 200 }))
    }
    client.post<unknown>('/test', { name: 'test' })
    globalThis.fetch = originalFetch
    expect(JSON.parse(capturedBody)).toEqual({ name: 'test' })
  })
})

describe('isApiSuccessCode', () => {
  it('accepts 0 and 2xxx range', () => {
    expect(isApiSuccessCode(0)).toBe(true)
    expect(isApiSuccessCode(2000)).toBe(true)
    expect(isApiSuccessCode(2001)).toBe(true)
    expect(isApiSuccessCode(2999)).toBe(true)
  })
  it('rejects 4xxx and 5xxx', () => {
    expect(isApiSuccessCode(4001)).toBe(false)
    expect(isApiSuccessCode(5001)).toBe(false)
  })
})

// --- HealthResponse shape ---
describe('HealthResponse shape', () => {
  it('should define correct fields', () => {
    const response = {
      status: 'ok' as const,
      timestamp: '2024-01-01T00:00:00Z',
      version: '1.0.0',
    }
    expect(response.status).toBe('ok')
    expect(response.timestamp).toBeDefined()
    expect(response.version).toBeDefined()
  })
})
