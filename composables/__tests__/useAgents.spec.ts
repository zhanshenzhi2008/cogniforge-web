import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref, readonly } from 'vue'

// Use vi.hoisted() to create mocks that can be used in vi.mock factory
const { mockApi, createMockAgents } = vi.hoisted(() => {
  const mockApi = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    del: vi.fn(),
    upload: vi.fn(),
  }

  const createMockAgents = () => ({
    list: vi.fn(() => mockApi.get('/api/v1/agents')),
    get: vi.fn((id: string) => mockApi.get(`/api/v1/agents/${id}`)),
    create: vi.fn((input: any) => mockApi.post('/api/v1/agents', input)),
    update: vi.fn((id: string, input: any) => mockApi.put(`/api/v1/agents/${id}`, input)),
    remove: vi.fn((id: string) => mockApi.del(`/api/v1/agents/${id}`)),
  })

  return { mockApi, createMockAgents }
})

// Mock Nuxt auto-imports
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

// Mock the entire composable module
vi.mock('../useAgents', () => ({
  useAgents: createMockAgents,
}))

import { useAgents } from '../useAgents'

describe('useAgents', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('useAgents', () => {
    it('should be importable and return agent functions', () => {
      const agents = useAgents()
      expect(agents).toBeDefined()
      expect(typeof agents.list).toBe('function')
      expect(typeof agents.get).toBe('function')
      expect(typeof agents.create).toBe('function')
      expect(typeof agents.update).toBe('function')
      expect(typeof agents.remove).toBe('function')
    })
  })

  describe('list', () => {
    it('should return agents list', async () => {
      const mockAgents = [
        {
          id: 'agent-1',
          user_id: 'user-1',
          name: 'Test Agent',
          description: 'A test agent',
          model: 'gpt-4',
          system_prompt: 'You are a helpful assistant.',
          tools: ['search', 'calculator'],
          memory_type: 'buffer',
          memory_turns: 10,
          input_filter: false,
          output_filter: false,
          status: 'active',
          metadata: {},
          created_at: '2026-04-01T00:00:00Z',
          updated_at: '2026-04-01T00:00:00Z',
        },
      ]
      mockApi.get.mockResolvedValueOnce({ code: 2000, data: mockAgents })

      const { list } = useAgents()
      const result = await list()

      expect(result.data).toEqual(mockAgents)
      expect(result.data).toHaveLength(1)
    })

    it('should return error when API fails', async () => {
      mockApi.get.mockResolvedValueOnce({ error: 'Unauthorized' })

      const { list } = useAgents()
      const result = await list()

      expect(result.error).toBe('Unauthorized')
    })
  })

  describe('get', () => {
    it('should return agent details by id', async () => {
      const mockAgent = {
        id: 'agent-1',
        user_id: 'user-1',
        name: 'Test Agent',
        description: 'A test agent',
        model: 'gpt-4',
        system_prompt: 'You are a helpful assistant.',
        tools: ['search'],
        memory_type: 'buffer',
        memory_turns: 10,
        input_filter: false,
        output_filter: false,
        status: 'active',
        metadata: {},
        created_at: '2026-04-01T00:00:00Z',
        updated_at: '2026-04-01T00:00:00Z',
      }
      mockApi.get.mockResolvedValueOnce({ code: 2000, data: mockAgent })

      const { get } = useAgents()
      const result = await get('agent-1')

      expect(result.data).toEqual(mockAgent)
    })

    it('should return error when agent not found', async () => {
      mockApi.get.mockResolvedValueOnce({ error: 'Agent not found' })

      const { get } = useAgents()
      const result = await get('non-existent')

      expect(result.error).toBe('Agent not found')
    })
  })

  describe('create', () => {
    it('should create agent successfully', async () => {
      const input = {
        name: 'New Agent',
        description: 'A new agent',
        model: 'gpt-4',
        system_prompt: 'You are a helpful assistant.',
        tools: ['search'],
      }
      const mockAgent = {
        id: 'agent-new',
        user_id: 'user-1',
        ...input,
        memory_type: 'buffer',
        memory_turns: 10,
        input_filter: false,
        output_filter: false,
        status: 'active',
        metadata: {},
        created_at: '2026-04-01T00:00:00Z',
        updated_at: '2026-04-01T00:00:00Z',
      }
      mockApi.post.mockResolvedValueOnce({ code: 2000, data: mockAgent })

      const { create } = useAgents()
      const result = await create(input)

      expect(result.data).toEqual(mockAgent)
    })

    it('should return error when create fails', async () => {
      mockApi.post.mockResolvedValueOnce({ error: 'Invalid input' })

      const { create } = useAgents()
      const result = await create({ name: '', model: '' })

      expect(result.error).toBe('Invalid input')
    })
  })

  describe('update', () => {
    it('should update agent successfully', async () => {
      const input = {
        name: 'Updated Agent',
        description: 'Updated description',
        system_prompt: 'You are a better assistant.',
      }
      const mockAgent = {
        id: 'agent-1',
        user_id: 'user-1',
        name: input.name,
        description: input.description,
        model: 'gpt-4',
        system_prompt: input.system_prompt,
        tools: ['search'],
        memory_type: 'buffer',
        memory_turns: 10,
        input_filter: false,
        output_filter: false,
        status: 'active',
        metadata: {},
        created_at: '2026-04-01T00:00:00Z',
        updated_at: '2026-04-02T00:00:00Z',
      }
      mockApi.put.mockResolvedValueOnce({ code: 2000, data: mockAgent })

      const { update } = useAgents()
      const result = await update('agent-1', input)

      expect(result.data).toEqual(mockAgent)
    })

    it('should update agent status', async () => {
      const input = { status: 'disabled' }
      mockApi.put.mockResolvedValueOnce({ code: 2000, data: { id: 'agent-1', status: 'disabled' } })

      const { update } = useAgents()
      const result = await update('agent-1', input)

      expect(result.data?.status).toBe('disabled')
    })
  })

  describe('remove', () => {
    it('should delete agent successfully', async () => {
      mockApi.del.mockResolvedValueOnce({ code: 2000, data: null })

      const { remove } = useAgents()
      const result = await remove('agent-1')

      expect(result.error).toBeUndefined()
    })

    it('should return error when delete fails', async () => {
      mockApi.del.mockResolvedValueOnce({ error: 'Agent not found' })

      const { remove } = useAgents()
      const result = await remove('non-existent')

      expect(result.error).toBe('Agent not found')
    })
  })
})
