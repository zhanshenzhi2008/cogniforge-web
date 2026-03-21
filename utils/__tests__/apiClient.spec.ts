import { describe, it, expect } from 'vitest'
import { createApiClient, defaultConfig } from '../apiClient'

describe('createApiClient', () => {
  describe('initialization', () => {
    it('should create client with default config', () => {
      const client = createApiClient()
      expect(client).toBeDefined()
    })

    it('should use default baseUrl', () => {
      expect(defaultConfig.baseUrl).toBe('http://localhost:8080')
    })

    it('should accept custom baseUrl', () => {
      const client = createApiClient({ baseUrl: 'https://api.example.com' })
      expect(client).toBeDefined()
    })
  })

  describe('get method', () => {
    it('should have get method', () => {
      const client = createApiClient()
      expect(client.get).toBeDefined()
      expect(typeof client.get).toBe('function')
    })
  })

  describe('post method', () => {
    it('should have post method', () => {
      const client = createApiClient()
      expect(client.post).toBeDefined()
      expect(typeof client.post).toBe('function')
    })
  })

  describe('put method', () => {
    it('should have put method', () => {
      const client = createApiClient()
      expect(client.put).toBeDefined()
      expect(typeof client.put).toBe('function')
    })
  })

  describe('delete method', () => {
    it('should have delete method', () => {
      const client = createApiClient()
      expect(client.delete).toBeDefined()
      expect(typeof client.delete).toBe('function')
    })
  })
})

describe('ApiResponse type', () => {
  it('should support success response with data', () => {
    const response = { data: { id: 1 } }
    expect(response.data).toBeDefined()
  })

  it('should support error response', () => {
    const response = { error: 'Something went wrong' }
    expect(response.error).toBeDefined()
  })

  it('should support message field', () => {
    const response = { message: 'Success' }
    expect(response.message).toBeDefined()
  })
})

describe('HealthResponse type', () => {
  it('should define correct shape for health check', () => {
    const response = {
      status: 'ok',
      timestamp: '2024-01-01T00:00:00Z',
      version: '1.0.0',
    }
    expect(response.status).toBe('ok')
    expect(response.timestamp).toBeDefined()
    expect(response.version).toBeDefined()
  })
})
