import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockApi, createMockWorkflows } = vi.hoisted(() => {
  const mockApi = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    del: vi.fn(),
  }

  const createMockWorkflows = () => ({
    list: vi.fn(() => mockApi.get()),
    get: vi.fn((id: string) => mockApi.get(id)),
    create: vi.fn((input: unknown) => mockApi.post(input)),
    update: vi.fn((id: string, input: unknown) => mockApi.put(id, input)),
    remove: vi.fn((id: string) => mockApi.del(id)),
    execute: vi.fn((id: string, input?: unknown) => mockApi.post(id, input)),
    getExecution: vi.fn((id: string, executionId: string) => mockApi.get(id, executionId)),
    listExecutions: vi.fn((id: string) => mockApi.get(id)),
    cancelExecution: vi.fn((id: string, executionId: string) => mockApi.post(id, executionId)),
    debug: vi.fn((id: string, input?: unknown) => mockApi.post(id, input)),
  })

  return { mockApi, createMockWorkflows }
})

vi.mock('../useWorkflows', () => ({
  useWorkflows: createMockWorkflows,
}))

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
      mockApi.get.mockResolvedValueOnce({ data: mockWorkflows })

      const { list } = useWorkflows()
      const result = await list()

      expect(result.data).toEqual(mockWorkflows)
    })

    it('should return error when API fails', async () => {
      mockApi.get.mockResolvedValueOnce({ error: 'Unauthorized' })

      const { list } = useWorkflows()
      const result = await list()

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
      mockApi.get.mockResolvedValueOnce({ data: mockWorkflow })

      const { get } = useWorkflows()
      const result = await get('wf-1')

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
      mockApi.post.mockResolvedValueOnce({ data: mockWorkflow })

      const { create } = useWorkflows()
      const result = await create(input)

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
      mockApi.put.mockResolvedValueOnce({ data: mockWorkflow })

      const { update } = useWorkflows()
      const result = await update('wf-1', input)

      expect(result.data).toEqual(mockWorkflow)
    })
  })

  describe('remove', () => {
    it('should delete workflow successfully', async () => {
      mockApi.del.mockResolvedValueOnce({})

      const { remove } = useWorkflows()
      const result = await remove('wf-1')

      expect(result.error).toBeUndefined()
    })

    it('should return error when delete fails', async () => {
      mockApi.del.mockResolvedValueOnce({ error: 'Workflow not found' })

      const { remove } = useWorkflows()
      const result = await remove('non-existent')

      expect(result.error).toBe('Workflow not found')
    })
  })
})
