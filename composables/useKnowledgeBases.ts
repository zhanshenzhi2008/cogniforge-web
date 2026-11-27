/**
 * Knowledge Base types and API composable
 */

import { useApi } from './useApi'

export interface KnowledgeFolder {
  id: string
  user_id: string
  name: string
  sort_order: number
  created_at: string
  updated_at: string
}

export interface KnowledgeBase {
  id: string
  user_id: string
  folder_id?: string
  name: string
  description: string
  vector_db: string
  embedding_model: string
  chunk_size?: number
  chunk_overlap?: number
  split_mode?: string
  split_separator?: string
  rag_top_k?: number
  rag_min_score?: number
  rag_top_k_semantic?: number
  rag_min_score_semantic?: number
  rag_top_k_keyword?: number
  rag_min_score_keyword?: number
  rag_top_k_hybrid?: number
  rag_min_score_hybrid?: number
  hybrid_semantic_weight?: number
  search_mode?: 'semantic' | 'keyword' | 'hybrid' | string
  rerank_semantic?: boolean
  rerank_keyword?: boolean
  rerank_hybrid?: boolean
  rerank_provider_semantic?: string
  rerank_provider_keyword?: string
  rerank_provider_hybrid?: string
  visibility?: string
  status: 'active' | 'disabled'
  metadata: Record<string, any>
  doc_count: number
  created_at: string
  updated_at: string
}

export interface CreateKBInput {
  name: string
  description?: string
  folder_id?: string
  vector_db?: string
  embedding_model?: string
  chunk_size?: number
  chunk_overlap?: number
  split_mode?: string
  split_separator?: string
  rag_top_k?: number
  rag_min_score?: number
  rag_top_k_semantic?: number
  rag_min_score_semantic?: number
  rag_top_k_keyword?: number
  rag_min_score_keyword?: number
  rag_top_k_hybrid?: number
  rag_min_score_hybrid?: number
  hybrid_semantic_weight?: number
  search_mode?: string
  rerank_semantic?: boolean
  rerank_keyword?: boolean
  rerank_hybrid?: boolean
  rerank_provider_semantic?: string
  rerank_provider_keyword?: string
  rerank_provider_hybrid?: string
  visibility?: string
}

export interface UpdateKBInput {
  name?: string
  description?: string
  folder_id?: string
  vector_db?: string
  embedding_model?: string
  chunk_size?: number
  chunk_overlap?: number
  split_mode?: string
  split_separator?: string
  rag_top_k?: number
  rag_min_score?: number
  rag_top_k_semantic?: number
  rag_min_score_semantic?: number
  rag_top_k_keyword?: number
  rag_min_score_keyword?: number
  rag_top_k_hybrid?: number
  rag_min_score_hybrid?: number
  hybrid_semantic_weight?: number
  search_mode?: string
  rerank_semantic?: boolean
  rerank_keyword?: boolean
  rerank_hybrid?: boolean
  rerank_provider_semantic?: string
  rerank_provider_keyword?: string
  rerank_provider_hybrid?: string
  visibility?: string
  status?: string
}

export interface ParseOptions {
  chunk_size?: number
  chunk_overlap?: number
  split_mode?: string
  split_separator?: string
}

export interface CreateTextDocInput extends ParseOptions {
  name: string
  content: string
  file_type?: 'md' | 'txt' | string
}

export interface CreateURLDocInput extends ParseOptions {
  url: string
  name?: string
  /** auto | jina | firecrawl | basic */
  engine?: string
}

export interface ChunkPreviewItem {
  index: number
  content: string
  char_count: number
}

export interface ChunkPreviewResponse {
  total_chunks: number
  preview_count: number
  char_count: number
  chunks: ChunkPreviewItem[]
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
  lifecycle_status?: 'draft' | 'review' | 'published' | 'abolished' | string
  effective_at?: string | null
  expire_at?: string | null
  error: string
  chunk_count: number
  vector_count: number
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

export interface DocumentPreview extends Document {
  content: string
  previewable: boolean
  editable?: boolean
  preview_note?: string
  truncated?: boolean
}

export interface UpdateDocContentInput {
  content: string
  reparse?: boolean
}

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
  search_mode?: string
  rerank?: boolean
  rerank_provider_id?: string
  hybrid_semantic_weight?: number
  /** 管理排查：含草稿/审核等非发布文档 */
  include_drafts?: boolean
  /** 管理排查：忽略生效/失效时间窗 */
  ignore_validity?: boolean
}

export const useKnowledgeBases = () => {
  const api = useApi()

  const listFolders = async (): Promise<{ data?: KnowledgeFolder[]; error?: string }> => {
    try {
      const res = await api.get<KnowledgeFolder[]>('/api/v1/knowledge/folders')
      if (res.error) return { error: res.error }
      return { data: res.data || [] }
    } catch (err: any) {
      return { error: err.message || '获取目录失败' }
    }
  }

  const createFolder = async (name: string): Promise<{ data?: KnowledgeFolder; error?: string }> => {
    try {
      const res = await api.post<KnowledgeFolder>('/api/v1/knowledge/folders', { name })
      if (res.error) return { error: res.error }
      return { data: res.data }
    } catch (err: any) {
      return { error: err.message || '创建目录失败' }
    }
  }

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

  const listDocs = async (kbId: string): Promise<{ data?: Document[]; error?: string }> => {
    try {
      const res = await api.get<Document[]>(`/api/v1/knowledge/${kbId}/documents`)
      if (res.error) return { error: res.error }
      return { data: res.data || [] }
    } catch (err: any) {
      return { error: err.message || '获取文档列表失败' }
    }
  }

  const getDoc = async (kbId: string, docId: string): Promise<{ data?: DocumentPreview; error?: string }> => {
    try {
      const res = await api.get<DocumentPreview>(`/api/v1/knowledge/${kbId}/documents/${docId}`)
      if (res.error) return { error: res.error }
      return { data: res.data }
    } catch (err: any) {
      return { error: err.message || '获取文档失败' }
    }
  }

  const updateDocContent = async (
    kbId: string,
    docId: string,
    input: UpdateDocContentInput
  ): Promise<{ data?: DocumentPreview; error?: string }> => {
    try {
      const res = await api.put<DocumentPreview>(`/api/v1/knowledge/${kbId}/documents/${docId}/content`, input)
      if (res.error) return { error: res.error }
      return { data: res.data }
    } catch (err: any) {
      return { error: err.message || '保存文档失败' }
    }
  }

  const appendParseOptions = (formData: FormData, opts?: ParseOptions) => {
    if (!opts) return
    if (opts.chunk_size != null) formData.append('chunk_size', String(opts.chunk_size))
    if (opts.chunk_overlap != null) formData.append('chunk_overlap', String(opts.chunk_overlap))
    if (opts.split_mode) formData.append('split_mode', opts.split_mode)
    if (opts.split_separator != null) formData.append('split_separator', opts.split_separator)
  }

  const uploadDoc = async (
    kbId: string,
    file: File,
    opts?: ParseOptions
  ): Promise<{ data?: Document; error?: string }> => {
    try {
      const formData = new FormData()
      formData.append('file', file)
      appendParseOptions(formData, opts)

      const res = await api.upload<Document>(`/api/v1/knowledge/${kbId}/documents/upload`, formData)
      if (res.error) return { error: res.error }
      return { data: res.data }
    } catch (err: any) {
      return { error: err.message || '上传文档失败' }
    }
  }

  const previewChunks = async (
    kbId: string,
    file: File,
    opts?: ParseOptions
  ): Promise<{ data?: ChunkPreviewResponse; error?: string }> => {
    try {
      const formData = new FormData()
      formData.append('file', file)
      appendParseOptions(formData, opts)

      const res = await api.upload<ChunkPreviewResponse>(
        `/api/v1/knowledge/${kbId}/documents/preview`,
        formData
      )
      if (res.error) return { error: res.error }
      return { data: res.data }
    } catch (err: any) {
      return { error: err.message || '预览分块失败' }
    }
  }

  const createTextDoc = async (
    kbId: string,
    input: CreateTextDocInput
  ): Promise<{ data?: Document; error?: string }> => {
    try {
      const res = await api.post<Document>(`/api/v1/knowledge/${kbId}/documents/text`, input)
      if (res.error) return { error: res.error }
      return { data: res.data }
    } catch (err: any) {
      return { error: err.message || '创建文本文档失败' }
    }
  }

  const createURLDoc = async (
    kbId: string,
    input: CreateURLDocInput
  ): Promise<{ data?: Document; error?: string }> => {
    try {
      const res = await api.post<Document>(`/api/v1/knowledge/${kbId}/documents/url`, input)
      if (res.error) return { error: res.error }
      return { data: res.data }
    } catch (err: any) {
      return { error: err.message || '抓取网页失败' }
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

  const reparseDoc = async (kbId: string, docId: string): Promise<{ data?: Document; error?: string }> => {
    try {
      const res = await api.post<Document>(`/api/v1/knowledge/${kbId}/documents/reparse`, { document_id: docId })
      if (res.error) return { error: res.error }
      return { data: res.data }
    } catch (err: any) {
      return { error: err.message || '重新解析失败' }
    }
  }

  const updateDocLifecycle = async (
    kbId: string,
    docId: string,
    input: {
      lifecycle_status?: string
      effective_at?: string | null
      expire_at?: string | null
      clear_effective?: boolean
      clear_expire?: boolean
    },
  ): Promise<{ data?: Document; error?: string }> => {
    try {
      const res = await api.put<Document>(`/api/v1/knowledge/${kbId}/documents/${docId}/lifecycle`, input)
      if (res.error) return { error: res.error }
      return { data: res.data }
    } catch (err: any) {
      return { error: err.message || '更新文档状态失败' }
    }
  }

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
    listFolders,
    createFolder,
    listKBs,
    getKB,
    createKB,
    updateKB,
    deleteKB,
    listDocs,
    getDoc,
    updateDocContent,
    uploadDoc,
    previewChunks,
    createTextDoc,
    createURLDoc,
    deleteDoc,
    reparseDoc,
    updateDocLifecycle,
    searchKB,
  }
}
