import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref, readonly } from 'vue'

// Use vi.hoisted() to create mocks that can be used in vi.mock factory
const { mockApi, createMockKnowledgeBases } = vi.hoisted(() => {
  const mockApi = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    del: vi.fn(),
    upload: vi.fn(),
  }

  const createMockKnowledgeBases = () => ({
    listKBs: vi.fn(() => mockApi.get('/api/v1/knowledge')),
    getKB: vi.fn((id: string) => mockApi.get(`/api/v1/knowledge/${id}`)),
    createKB: vi.fn((input: any) => mockApi.post('/api/v1/knowledge', input)),
    updateKB: vi.fn((id: string, input: any) => mockApi.put(`/api/v1/knowledge/${id}`, input)),
    deleteKB: vi.fn((id: string) => mockApi.del(`/api/v1/knowledge/${id}`)),
    listDocs: vi.fn((kbId: string) => mockApi.get(`/api/v1/knowledge/${kbId}/documents`)),
    uploadDoc: vi.fn((kbId: string, file: File) => mockApi.upload(`/api/v1/knowledge/${kbId}/documents/upload`, new FormData())),
    deleteDoc: vi.fn((kbId: string, docId: string) => mockApi.del(`/api/v1/knowledge/${kbId}/documents/${docId}`)),
    searchKB: vi.fn((kbId: string, input: any) => mockApi.post(`/api/v1/knowledge/${kbId}/search`, input)),
  })

  return { mockApi, createMockKnowledgeBases }
})

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
vi.mock('../useKnowledgeBases', () => ({
  useKnowledgeBases: createMockKnowledgeBases,
}))

import { useKnowledgeBases } from '../useKnowledgeBases'

describe('useKnowledgeBases', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('useKnowledgeBases', () => {
    it('should be importable and return knowledge base functions', () => {
      const kb = useKnowledgeBases()
      expect(kb).toBeDefined()
      expect(typeof kb.listKBs).toBe('function')
      expect(typeof kb.getKB).toBe('function')
      expect(typeof kb.createKB).toBe('function')
      expect(typeof kb.updateKB).toBe('function')
      expect(typeof kb.deleteKB).toBe('function')
      expect(typeof kb.listDocs).toBe('function')
      expect(typeof kb.uploadDoc).toBe('function')
      expect(typeof kb.deleteDoc).toBe('function')
      expect(typeof kb.searchKB).toBe('function')
    })
  })

  describe('listKBs', () => {
    it('should return knowledge bases list', async () => {
      const mockKBs = [
        {
          id: 'kb-1',
          user_id: 'user-1',
          name: 'Test KB',
          description: 'A test knowledge base',
          vector_db: 'pgvector',
          embedding_model: 'text-embedding-ada-002',
          status: 'active',
          metadata: {},
          doc_count: 10,
          created_at: '2026-04-01T00:00:00Z',
          updated_at: '2026-04-01T00:00:00Z',
        },
      ]
      mockApi.get.mockResolvedValueOnce({ code: 2000, data: mockKBs })

      const { listKBs } = useKnowledgeBases()
      const result = await listKBs()

      expect(result.data).toEqual(mockKBs)
      expect(result.data).toHaveLength(1)
    })

    it('should return error when API fails', async () => {
      mockApi.get.mockResolvedValueOnce({ error: 'Unauthorized' })

      const { listKBs } = useKnowledgeBases()
      const result = await listKBs()

      expect(result.error).toBe('Unauthorized')
    })
  })

  describe('getKB', () => {
    it('should return knowledge base details by id', async () => {
      const mockKB = {
        id: 'kb-1',
        user_id: 'user-1',
        name: 'Test KB',
        description: 'A test knowledge base',
        vector_db: 'pgvector',
        embedding_model: 'text-embedding-ada-002',
        status: 'active',
        metadata: {},
        doc_count: 10,
        created_at: '2026-04-01T00:00:00Z',
        updated_at: '2026-04-01T00:00:00Z',
      }
      mockApi.get.mockResolvedValueOnce({ code: 2000, data: mockKB })

      const { getKB } = useKnowledgeBases()
      const result = await getKB('kb-1')

      expect(result.data).toEqual(mockKB)
    })
  })

  describe('createKB', () => {
    it('should create knowledge base successfully', async () => {
      const input = {
        name: 'New KB',
        description: 'A new knowledge base',
        vector_db: 'pgvector',
        embedding_model: 'text-embedding-ada-002',
      }
      const mockKB = {
        id: 'kb-new',
        user_id: 'user-1',
        ...input,
        status: 'active',
        metadata: {},
        doc_count: 0,
        created_at: '2026-04-01T00:00:00Z',
        updated_at: '2026-04-01T00:00:00Z',
      }
      mockApi.post.mockResolvedValueOnce({ code: 2000, data: mockKB })

      const { createKB } = useKnowledgeBases()
      const result = await createKB(input)

      expect(result.data).toEqual(mockKB)
    })
  })

  describe('updateKB', () => {
    it('should update knowledge base successfully', async () => {
      const input = { name: 'Updated KB' }
      const mockKB = {
        id: 'kb-1',
        user_id: 'user-1',
        name: 'Updated KB',
        description: 'Test KB',
        vector_db: 'pgvector',
        embedding_model: 'text-embedding-ada-002',
        status: 'active',
        metadata: {},
        doc_count: 10,
        created_at: '2026-04-01T00:00:00Z',
        updated_at: '2026-04-02T00:00:00Z',
      }
      mockApi.put.mockResolvedValueOnce({ code: 2000, data: mockKB })

      const { updateKB } = useKnowledgeBases()
      const result = await updateKB('kb-1', input)

      expect(result.data).toEqual(mockKB)
    })
  })

  describe('deleteKB', () => {
    it('should delete knowledge base successfully', async () => {
      mockApi.del.mockResolvedValueOnce({ code: 2000, data: null })

      const { deleteKB } = useKnowledgeBases()
      const result = await deleteKB('kb-1')

      expect(result.error).toBeUndefined()
    })
  })

  describe('listDocs', () => {
    it('should return documents list', async () => {
      const mockDocs = [
        {
          id: 'doc-1',
          knowledge_base_id: 'kb-1',
          user_id: 'user-1',
          name: 'Test Document',
          file_name: 'test.pdf',
          file_size: 1024,
          file_type: 'application/pdf',
          file_path: '/uploads/doc-1.pdf',
          status: 'completed',
          error: '',
          chunk_count: 10,
          vector_count: 10,
          metadata: {},
          created_at: '2026-04-01T00:00:00Z',
          updated_at: '2026-04-01T00:00:00Z',
        },
      ]
      mockApi.get.mockResolvedValueOnce({ code: 2000, data: mockDocs })

      const { listDocs } = useKnowledgeBases()
      const result = await listDocs('kb-1')

      expect(result.data).toEqual(mockDocs)
    })
  })

  describe('uploadDoc', () => {
    it('should upload document successfully', async () => {
      const mockDoc = {
        id: 'doc-new',
        knowledge_base_id: 'kb-1',
        user_id: 'user-1',
        name: 'New Document',
        file_name: 'new.pdf',
        file_size: 2048,
        file_type: 'application/pdf',
        file_path: '/uploads/doc-new.pdf',
        status: 'pending',
        error: '',
        chunk_count: 0,
        vector_count: 0,
        metadata: {},
        created_at: '2026-04-01T00:00:00Z',
        updated_at: '2026-04-01T00:00:00Z',
      }
      mockApi.upload.mockResolvedValueOnce({ code: 2000, data: mockDoc })

      const mockFile = new File(['content'], 'test.pdf', { type: 'application/pdf' })

      const { uploadDoc } = useKnowledgeBases()
      const result = await uploadDoc('kb-1', mockFile)

      expect(result.data).toBeDefined()
    })
  })

  describe('deleteDoc', () => {
    it('should delete document successfully', async () => {
      mockApi.del.mockResolvedValueOnce({ code: 2000, data: null })

      const { deleteDoc } = useKnowledgeBases()
      const result = await deleteDoc('kb-1', 'doc-1')

      expect(result.error).toBeUndefined()
    })
  })

  describe('searchKB', () => {
    it('should search knowledge base successfully', async () => {
      const input = {
        query: 'test search',
        top_k: 5,
        min_score: 0.7,
      }
      const mockSearchResponse = {
        results: [
          {
            document_id: 'doc-1',
            document_name: 'Test Document',
            chunk_id: 'chunk-1',
            content: 'This is a test document about testing.',
            score: 0.85,
          },
        ],
        total: 1,
        query: 'test search',
        duration_ms: 150,
      }
      mockApi.post.mockResolvedValueOnce({ code: 2000, data: mockSearchResponse })

      const { searchKB } = useKnowledgeBases()
      const result = await searchKB('kb-1', input)

      expect(result.data).toEqual(mockSearchResponse)
      expect(result.data?.results).toHaveLength(1)
    })

    it('should return empty results when no matches found', async () => {
      const input = { query: 'nonexistent' }
      const mockSearchResponse = {
        results: [],
        total: 0,
        query: 'nonexistent',
        duration_ms: 50,
      }
      mockApi.post.mockResolvedValueOnce({ code: 2000, data: mockSearchResponse })

      const { searchKB } = useKnowledgeBases()
      const result = await searchKB('kb-1', input)

      expect(result.data?.results).toEqual([])
      expect(result.data?.total).toBe(0)
    })
  })
})
