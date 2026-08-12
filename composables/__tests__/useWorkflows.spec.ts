import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref, readonly } from 'vue'

// Create shared mock API
const mockApi = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  del: vi.fn(),
  upload: vi.fn(),
}

// Mock Nuxt auto-imports
vi.mock('#imports', () => ({
  ref,
  readonly,
  useRouter: () => ({ push: vi.fn() }),
  useCookie: () => ({ value: null }),
  useRuntimeConfig: () => ({
    public: { apiBase: 'http://localhost:8080' },
  }),
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

// Mock the entire composable module
vi.mock('../useWorkflows', () => {
  return {
    useWorkflows: () => ({
      list: mockApi.get,
      get: mockApi.get,
      create: mockApi.post,
      update: mockApi.put,
      remove: mockApi.del,
      execute: mockApi.post,
      getExecution: mockApi.get,
      listExecutions: mockApi.get,
      cancelExecution: mockApi.post,
      debug: mockApi.post,
    }),
  }
})

import { useWorkflows } from '../useWorkflows'

describe('useWorkflows', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('useWorkflows', () => {
    it('should be importable and return workflow functions', () => {
      const workflows = useWorkflows()
      expect(workflows).toBeDefined()
      expect(typeof workflows.list).toBe('function')
      expect(typeof workflows.get).toBe('function')
      expect(typeof workflows.create).toBe('function')
      expect(typeof workflows.update).toBe('function')
      expect(typeof workflows.remove).toBe('function')
      expect(typeof workflows.execute).toBe('function')
      expect(typeof workflows.getExecution).toBe('function')
      expect(typeof workflows.listExecutions).toBe('function')
      expect(typeof workflows.cancelExecution).toBe('function')
      expect(typeof workflows.debug).toBe('function')
    })
  })

  describe('list', () => {
    it('should return workflows list', async () => {
      const mockWorkflows = [
        {
          id: 'wf-1',
          user_id: 'user-1',
          name: 'Test Workflow',
          description: 'A test workflow',
          definition: '{"nodes":[],"edges":[]}',
          status: 'draft',
          version: 1,
          created_at: '2026-04-01T00:00:00Z',
          updated_at: '2026-04-01T00:00:00Z',
        },
      ]
      mockApi.get.mockResolvedValueOnce({ code: 2000, data: mockWorkflows })

      const { list } = useWorkflows()
      const result = await list('/api/v1/workflows')

      expect(result.data).toEqual(mockWorkflows)
    })

    it('should return error when API fails', async () => {
      mockApi.get.mockResolvedValueOnce({ error: 'Unauthorized' })

      const { list } = useWorkflows()
      const result = await list('/api/v1/workflows')

      expect(result.error).toBe('Unauthorized')
    })
  })

  describe('get', () => {
    it('should return workflow details by id', async () => {
      const mockWorkflow = {
        id: 'wf-1',
        user_id: 'user-1',
        name: 'Test Workflow',
        description: 'A test workflow',
        definition: '{"nodes":[],"edges":[]}',
        status: 'draft',
        version: 1,
        created_at: '2026-04-01T00:00:00Z',
        updated_at: '2026-04-01T00:00:00Z',
      }
      mockApi.get.mockResolvedValueOnce({ code: 2000, data: mockWorkflow })

      const { get } = useWorkflows()
      const result = await get('/api/v1/workflows/wf-1')

      expect(result.data).toEqual(mockWorkflow)
    })
  })

  describe('create', () => {
    it('should create workflow successfully', async () => {
      const input = { name: 'New Workflow', description: 'A new workflow' }
      const mockWorkflow = {
        id: 'wf-new',
        user_id: 'user-1',
        name: input.name,
        description: input.description,
        status: 'draft',
        version: 1,
      }
      mockApi.post.mockResolvedValueOnce({ code: 2000, data: mockWorkflow })

      const { create } = useWorkflows()
      const result = await create('/api/v1/workflows', input)

      expect(result.data).toEqual(mockWorkflow)
    })
  })

  describe('update', () => {
    it('should update workflow successfully', async () => {
      const input = { name: 'Updated Workflow', description: 'Updated description' }
      const mockWorkflow = {
        id: 'wf-1',
        user_id: 'user-1',
        name: input.name,
        description: input.description,
        status: 'draft',
        version: 2,
      }
      mockApi.put.mockResolvedValueOnce({ code: 2000, data: mockWorkflow })

      const { update } = useWorkflows()
      const result = await update('/api/v1/workflows/wf-1', input)

      expect(result.data).toEqual(mockWorkflow)
    })
  })

  describe('remove', () => {
    it('should delete workflow successfully', async () => {
      mockApi.del.mockResolvedValueOnce({ code: 2000, data: null })

      const { remove } = useWorkflows()
      const result = await remove('/api/v1/workflows/wf-1')

      expect(result.error).toBeUndefined()
    })

    it('should return error when delete fails', async () => {
      mockApi.del.mockResolvedValueOnce({ error: 'Workflow not found' })

      const { remove } = useWorkflows()
      const result = await remove('/api/v1/workflows/non-existent')

      expect(result.error).toBe('Workflow not found')
    })
  })
})
