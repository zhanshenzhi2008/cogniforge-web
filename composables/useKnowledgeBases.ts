/**
 * Knowledge Base types and API composable
 */

export interface KnowledgeBase {
  id: string
  user_id: string
  name: string
  description: string
  vector_db: string
  embedding_model: string
  status: 'active' | 'disabled'
  metadata: Record<string, any>
  doc_count: number
  created_at: string
  updated_at: string
}

export interface CreateKBInput {
  name: string
  description?: string
  vector_db?: string
  embedding_model?: string
}

export interface UpdateKBInput {
  name?: string
  description?: string
  vector_db?: string
  embedding_model?: string
  status?: string
}

export interface Document {
  id: string
  knowledge_base_id: string
  user_id: string
  name: string
  file_name: string
  file_size: number
  file_type: string
  file_path: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  error: string
  chunk_count: number
  vector_count: number
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

// 检索相关类型
export interface SearchResult {
  document_id: string
  document_name: string
  chunk_id: string
  content: string
  score: number
}

export interface SearchResponse {
  results: SearchResult[]
  total: number
  query: string
  duration_ms: number
}

export interface SearchInput {
  query: string
  top_k?: number
  min_score?: number
}

export const useKnowledgeBases = () => {
  const api = useApi()

  // ==================== Knowledge Base APIs ====================

  const listKBs = async (): Promise<{ data?: KnowledgeBase[]; error?: string }> => {
    try {
      const res = await api.get<KnowledgeBase[]>('/api/v1/knowledge')
      if (res.error) return { error: res.error }
      return { data: res.data || [] }
    } catch (err: any) {
      return { error: err.message || '获取知识库列表失败' }
    }
  }

  const getKB = async (id: string): Promise<{ data?: KnowledgeBase; error?: string }> => {
    try {
      const res = await api.get<KnowledgeBase>(`/api/v1/knowledge/${id}`)
      if (res.error) return { error: res.error }
      return { data: res.data }
    } catch (err: any) {
      return { error: err.message || '获取知识库详情失败' }
    }
  }

  const createKB = async (input: CreateKBInput): Promise<{ data?: KnowledgeBase; error?: string }> => {
    try {
      const res = await api.post<KnowledgeBase>('/api/v1/knowledge', input)
      if (res.error) return { error: res.error }
      return { data: res.data }
    } catch (err: any) {
      return { error: err.message || '创建知识库失败' }
    }
  }

  const updateKB = async (id: string, input: UpdateKBInput): Promise<{ data?: KnowledgeBase; error?: string }> => {
    try {
      const res = await api.put<KnowledgeBase>(`/api/v1/knowledge/${id}`, input)
      if (res.error) return { error: res.error }
      return { data: res.data }
    } catch (err: any) {
      return { error: err.message || '更新知识库失败' }
    }
  }

  const deleteKB = async (id: string): Promise<{ error?: string }> => {
    try {
      const res = await api.del(`/api/v1/knowledge/${id}`)
      if (res.error) return { error: res.error }
      return {}
    } catch (err: any) {
      return { error: err.message || '删除知识库失败' }
    }
  }

  // ==================== Document APIs ====================

  const listDocs = async (kbId: string): Promise<{ data?: Document[]; error?: string }> => {
    try {
      const res = await api.get<Document[]>(`/api/v1/knowledge/${kbId}/documents`)
      if (res.error) return { error: res.error }
      return { data: res.data || [] }
    } catch (err: any) {
      return { error: err.message || '获取文档列表失败' }
    }
  }

  const uploadDoc = async (kbId: string, file: File): Promise<{ data?: Document; error?: string }> => {
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await api.upload<Document>(`/api/v1/knowledge/${kbId}/documents`, formData)
      if (res.error) return { error: res.error }
      return { data: res.data }
    } catch (err: any) {
      return { error: err.message || '上传文档失败' }
    }
  }

  const deleteDoc = async (kbId: string, docId: string): Promise<{ error?: string }> => {
    try {
      const res = await api.del(`/api/v1/knowledge/${kbId}/documents/${docId}`)
      if (res.error) return { error: res.error }
      return {}
    } catch (err: any) {
      return { error: err.message || '删除文档失败' }
    }
  }

  // ==================== Search APIs ====================

  const searchKB = async (kbId: string, input: SearchInput): Promise<{ data?: SearchResponse; error?: string }> => {
    try {
      const res = await api.post<SearchResponse>(`/api/v1/knowledge/${kbId}/search`, input)
      if (res.error) return { error: res.error }
      return { data: res.data }
    } catch (err: any) {
      return { error: err.message || '检索失败' }
    }
  }

  return {
    // Knowledge Base
    listKBs,
    getKB,
    createKB,
    updateKB,
    deleteKB,
    // Documents
    listDocs,
    uploadDoc,
    deleteDoc,
    // Search
    searchKB,
  }
}
