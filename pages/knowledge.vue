<template>
  <div class="cf-page">
    <div class="cf-page-header">
      <div class="cf-page-heading">
        <h1 class="cf-page-title">Knowledge</h1>
        <p class="cf-page-sub">Upload docs for retrieval.</p>
      </div>
      <UButton color="primary" icon="i-lucide-plus" @click="handleCreate">
        New knowledge base
      </UButton>
    </div>

    <div v-if="loading" class="cf-state">
      <UIcon name="i-lucide-loader-circle" class="size-6 animate-spin" />
      <span>加载中…</span>
    </div>

    <div v-else-if="knowledgeBases.length === 0" class="cf-state">
      <UIcon name="i-lucide-book-open" class="size-8 opacity-50" />
      <p>暂无知识库，点击上方按钮创建</p>
    </div>

    <div v-else class="kb-grid">
      <div
        v-for="kb in knowledgeBases"
        :key="kb.id"
        class="kb-card cf-surface"
        @click="handleSelectKB(kb)"
      >
        <div class="kb-header">
          <div class="kb-name">
            <UIcon name="i-lucide-book-open" class="size-5 shrink-0" />
            <span>{{ kb.name }}</span>
            <UBadge
              size="sm"
              variant="subtle"
              :color="kb.status === 'active' ? 'success' : 'neutral'"
            >
              {{ kb.status === 'active' ? '启用' : '禁用' }}
            </UBadge>
          </div>
          <UDropdownMenu :items="getKBMenuItems(kb)" @click.stop>
            <UButton
              color="neutral"
              variant="ghost"
              icon="i-lucide-ellipsis"
              size="sm"
              @click.stop
            />
          </UDropdownMenu>
        </div>

        <p class="kb-description">{{ kb.description || '暂无描述' }}</p>

        <div class="kb-meta">
          <div class="meta-left">
            <span class="meta-item">
              <UIcon name="i-lucide-file-text" class="size-3.5" />
              {{ kb.doc_count }} 文档
            </span>
            <span class="meta-item">
              <UIcon name="i-lucide-server" class="size-3.5" />
              {{ kb.vector_db || 'chroma' }}
            </span>
          </div>
          <span class="meta-item">{{ formatDate(kb.created_at) }}</span>
        </div>
      </div>
    </div>

    <!-- Create / Edit KB -->
    <UModal
      v-model:open="dialogVisible"
      :title="isEditing ? '编辑知识库' : '创建知识库'"
      :ui="{ content: 'sm:max-w-lg' }"
    >
      <template #body>
        <form id="kb-form" class="form-grid" @submit.prevent="handleSubmit">
          <div class="field">
            <label class="field__label">名称</label>
            <UInput
              v-model="form.name"
              class="w-full"
              placeholder="请输入知识库名称"
              :color="errors.name ? 'error' : undefined"
              @update:model-value="errors.name = ''"
            />
            <p v-if="errors.name" class="field__error">{{ errors.name }}</p>
          </div>

          <div class="field">
            <label class="field__label">描述</label>
            <UTextarea
              v-model="form.description"
              class="w-full"
              :rows="2"
              placeholder="请输入描述（可选）"
            />
          </div>

          <div class="field">
            <label class="field__label">向量数据库</label>
            <USelect
              v-model="form.vector_db"
              class="w-full"
              :items="vectorDbOptions"
              placeholder="选择向量数据库"
            />
          </div>

          <div class="field">
            <label class="field__label">Embedding 模型</label>
            <USelect
              v-model="form.embedding_model"
              class="w-full"
              :items="embeddingModelOptions"
              placeholder="选择 Embedding 模型"
            />
          </div>
        </form>
      </template>

      <template #footer>
        <div class="modal-actions">
          <UButton color="neutral" variant="outline" @click="dialogVisible = false">取消</UButton>
          <UButton form="kb-form" type="submit" color="primary" :loading="submitting">
            {{ isEditing ? '保存' : '创建' }}
          </UButton>
        </div>
      </template>
    </UModal>

    <!-- Delete KB confirm -->
    <UModal v-model:open="deleteVisible" title="删除确认" :ui="{ content: 'sm:max-w-md' }">
      <template #body>
        <p class="delete-text">
          确定要删除知识库「{{ deleting?.name }}」吗？删除后无法恢复。
        </p>
      </template>
      <template #footer>
        <div class="modal-actions">
          <UButton color="neutral" variant="outline" @click="deleteVisible = false">取消</UButton>
          <UButton color="error" :loading="deletingLoading" @click="confirmDelete">删除</UButton>
        </div>
      </template>
    </UModal>

    <!-- Documents Slideover -->
    <USlideover
      v-model:open="drawerVisible"
      :title="selectedKB?.name || '知识库'"
      :description="`${documents.length} 个文档`"
      :ui="{ content: 'max-w-2xl w-full' }"
    >
      <template #body>
        <div class="drawer-header-actions">
          <UButton
            color="primary"
            size="sm"
            icon="i-lucide-cloud-upload"
            @click="uploadModalVisible = true"
          >
            上传文档
          </UButton>
        </div>

        <UTabs v-model="drawerActiveTab" :items="drawerTabs" class="w-full">
          <template #docs>
            <div v-if="docsLoading" class="cf-state cf-state--compact">
              <UIcon name="i-lucide-loader-circle" class="size-5 animate-spin" />
              <span>加载中…</span>
            </div>

            <div v-else-if="documents.length === 0" class="cf-state cf-state--compact">
              <UIcon name="i-lucide-file" class="size-7 opacity-50" />
              <p>暂无文档，请点击上方按钮上传</p>
            </div>

            <div v-else class="cf-table-wrap">
              <table class="cf-data-table">
                <thead>
                  <tr>
                    <th>名称</th>
                    <th>状态</th>
                    <th>分块</th>
                    <th>大小</th>
                    <th>时间</th>
                    <th class="cf-col-actions">操作</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="doc in documents" :key="doc.id">
                    <td>
                      <div class="doc-name-cell">
                        <UIcon :name="getFileIcon(doc.file_type)" class="size-4 shrink-0 opacity-60" />
                        <span class="doc-name">{{ doc.name }}</span>
                      </div>
                    </td>
                    <td>
                      <UBadge size="sm" variant="subtle" :color="docStatusColor(doc.status)">
                        {{ docStatusLabel(doc.status) }}
                      </UBadge>
                    </td>
                    <td class="cf-muted">{{ doc.chunk_count || '—' }}</td>
                    <td class="cf-muted">{{ formatFileSize(doc.file_size) }}</td>
                    <td class="cf-muted">{{ formatDate(doc.created_at) }}</td>
                    <td>
                      <div class="action-btns">
                        <UTooltip text="重新解析">
                          <UButton
                            color="neutral"
                            variant="ghost"
                            icon="i-lucide-refresh-cw"
                            size="sm"
                            @click="handleReparseDoc(doc)"
                          />
                        </UTooltip>
                        <UTooltip text="删除">
                          <UButton
                            color="error"
                            variant="ghost"
                            icon="i-lucide-trash-2"
                            size="sm"
                            @click="askDeleteDoc(doc)"
                          />
                        </UTooltip>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </template>

          <template #search>
            <div class="search-panel">
              <UTextarea
                v-model="searchQuery"
                class="w-full"
                :rows="2"
                placeholder="输入检索关键词..."
                @keydown.enter.ctrl="handleSearch"
              />
              <div class="search-actions">
                <UButton
                  color="primary"
                  icon="i-lucide-search"
                  :loading="searchLoading"
                  @click="handleSearch"
                >
                  检索
                </UButton>
                <UButton color="neutral" variant="outline" @click="searchQuery = ''">清空</UButton>
                <span class="search-hint">支持 Ctrl+Enter 快捷检索</span>
              </div>
            </div>

            <div v-if="searchResults.length > 0" class="search-results">
              <div class="results-header">
                <span>找到 {{ searchResults.length }} 条相关结果</span>
                <span class="cf-muted">耗时 {{ searchDuration }}ms</span>
              </div>

              <div v-for="result in searchResults" :key="result.chunk_id" class="result-item">
                <div class="result-header">
                  <span class="result-doc-name">{{ result.document_name }}</span>
                  <UBadge size="sm" variant="subtle" :color="getScoreColor(result.score)">
                    相似度: {{ (result.score * 100).toFixed(1) }}%
                  </UBadge>
                </div>
                <div class="result-content">{{ result.content }}</div>
              </div>
            </div>

            <div v-else-if="!searchLoading && hasSearched" class="cf-state cf-state--compact">
              <UIcon name="i-lucide-search-x" class="size-7 opacity-50" />
              <p>未找到相关结果</p>
            </div>
          </template>
        </UTabs>
      </template>

      <template #footer>
        <div class="modal-actions">
          <UButton color="neutral" variant="outline" @click="drawerVisible = false">关闭</UButton>
        </div>
      </template>
    </USlideover>

    <!-- Upload Modal -->
    <UModal
      v-model:open="uploadModalVisible"
      title="上传文档"
      :ui="{ content: 'sm:max-w-lg' }"
    >
      <template #body>
        <UFileUpload
          v-model="uploadFiles"
          multiple
          accept=".pdf,.txt,.md,.docx,.html"
          label="点击或拖拽文件到此处上传"
          description="支持 PDF、TXT、MD、DOCX、HTML，单个文件不超过 50MB"
          layout="list"
        />
      </template>

      <template #footer>
        <div class="modal-actions">
          <UButton color="neutral" variant="outline" @click="handleUploadCancel">取消</UButton>
          <UButton
            color="primary"
            :loading="uploadLoading"
            :disabled="!uploadFiles?.length"
            @click="handleUploadSubmit"
          >
            上传
          </UButton>
        </div>
      </template>
    </UModal>

    <!-- Delete Doc confirm -->
    <UModal v-model:open="deleteDocVisible" title="删除确认" :ui="{ content: 'sm:max-w-md' }">
      <template #body>
        <p class="delete-text">
          确定要删除文档「{{ deletingDoc?.name }}」吗？
        </p>
      </template>
      <template #footer>
        <div class="modal-actions">
          <UButton color="neutral" variant="outline" @click="deleteDocVisible = false">取消</UButton>
          <UButton color="error" :loading="deletingDocLoading" @click="confirmDeleteDoc">删除</UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'
import type {
  KnowledgeBase,
  Document,
  CreateKBInput,
  UpdateKBInput,
  SearchResult,
} from '@/composables/useKnowledgeBases'

definePageMeta({
  layout: 'default',
})

const toast = useToast()
const { listKBs, createKB, updateKB, deleteKB, listDocs, uploadDoc, deleteDoc, reparseDoc, searchKB } =
  useKnowledgeBases()

const loading = ref(false)
const submitting = ref(false)
const knowledgeBases = ref<KnowledgeBase[]>([])
const dialogVisible = ref(false)
const isEditing = ref(false)
const editingId = ref('')

const deleteVisible = ref(false)
const deletingLoading = ref(false)
const deleting = ref<KnowledgeBase | null>(null)

const form = reactive({
  name: '',
  description: '',
  vector_db: 'chroma',
  embedding_model: 'text-embedding-ada-002',
})
const errors = reactive({ name: '' })

const vectorDbOptions = [
  { label: 'PGVector', value: 'pgvector' },
  { label: 'Chroma', value: 'chroma' },
  { label: 'Qdrant', value: 'qdrant' },
  { label: 'Weaviate', value: 'weaviate' },
  { label: 'Milvus', value: 'milvus' },
]

const embeddingModelOptions = [
  { label: 'text-embedding-ada-002 (OpenAI)', value: 'text-embedding-ada-002' },
  { label: 'text-embedding-3-small', value: 'text-embedding-3-small' },
  { label: 'text-embedding-3-large', value: 'text-embedding-3-large' },
]

// Documents
const drawerVisible = ref(false)
const drawerActiveTab = ref('docs')
const docsLoading = ref(false)
const documents = ref<Document[]>([])
const selectedKB = ref<KnowledgeBase | null>(null)

const deleteDocVisible = ref(false)
const deletingDocLoading = ref(false)
const deletingDoc = ref<Document | null>(null)

// Upload
const uploadModalVisible = ref(false)
const uploadFiles = ref<File[] | null>(null)
const uploadLoading = ref(false)

// Search
const searchQuery = ref('')
const searchLoading = ref(false)
const searchResults = ref<SearchResult[]>([])
const searchDuration = ref(0)
const hasSearched = ref(false)

const drawerTabs = computed(() => [
  {
    label: '文档管理',
    value: 'docs',
    slot: 'docs' as const,
    badge: documents.value.length || undefined,
  },
  {
    label: '检索测试',
    value: 'search',
    slot: 'search' as const,
    badge: searchResults.value.length || undefined,
  },
])

function getFileIcon(fileType: string) {
  const icons: Record<string, string> = {
    pdf: 'i-lucide-file-text',
    txt: 'i-lucide-file',
    md: 'i-lucide-file',
    docx: 'i-lucide-file',
    html: 'i-lucide-code',
  }
  return icons[fileType] || 'i-lucide-file'
}

function docStatusLabel(status: string) {
  const map: Record<string, string> = {
    pending: '等待中',
    processing: '处理中',
    completed: '已完成',
    failed: '失败',
  }
  return map[status] || status
}

function docStatusColor(status: string): 'success' | 'warning' | 'error' | 'neutral' {
  const map: Record<string, 'success' | 'warning' | 'error' | 'neutral'> = {
    pending: 'neutral',
    processing: 'warning',
    completed: 'success',
    failed: 'error',
  }
  return map[status] || 'neutral'
}

function getKBMenuItems(kb: KnowledgeBase): DropdownMenuItem[] {
  return [
    {
      label: '编辑',
      icon: 'i-lucide-pencil',
      onSelect: () => handleEdit(kb),
    },
    {
      label: '删除',
      icon: 'i-lucide-trash-2',
      color: 'error' as const,
      onSelect: () => askDelete(kb),
    },
  ]
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('zh-CN')
}

function formatFileSize(bytes: number): string {
  if (!bytes) return '—'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

function getScoreColor(score: number): 'success' | 'warning' | 'neutral' {
  if (score >= 0.7) return 'success'
  if (score >= 0.5) return 'warning'
  return 'neutral'
}

function validate() {
  errors.name = form.name.trim() ? '' : '名称不能为空'
  if (form.name.trim().length > 100) errors.name = '名称不能超过 100 个字符'
  return !errors.name
}

const fetchKnowledgeBases = async () => {
  loading.value = true
  try {
    const res = await listKBs()
    if (res.error) {
      toast.add({ title: res.error, color: 'error' })
      return
    }
    knowledgeBases.value = res.data || []
  } catch {
    toast.add({ title: '获取知识库列表失败', color: 'error' })
  } finally {
    loading.value = false
  }
}

const fetchDocuments = async (kbId: string) => {
  docsLoading.value = true
  try {
    const res = await listDocs(kbId)
    if (res.error) {
      toast.add({ title: res.error, color: 'error' })
      return
    }
    documents.value = res.data || []
  } catch {
    toast.add({ title: '获取文档列表失败', color: 'error' })
  } finally {
    docsLoading.value = false
  }
}

const refreshInterval = ref<ReturnType<typeof setInterval> | null>(null)

const startDocRefresh = () => {
  stopDocRefresh()
  refreshInterval.value = setInterval(() => {
    if (
      selectedKB.value &&
      documents.value.some((d) => d.status === 'pending' || d.status === 'processing')
    ) {
      fetchDocuments(selectedKB.value.id)
    }
  }, 3000)
}

const stopDocRefresh = () => {
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value)
    refreshInterval.value = null
  }
}

watch(drawerVisible, (val) => {
  if (!val) stopDocRefresh()
})

const handleSelectKB = async (kb: KnowledgeBase) => {
  selectedKB.value = kb
  drawerVisible.value = true
  drawerActiveTab.value = 'docs'
  await fetchDocuments(kb.id)
  const hasProcessing = documents.value.some(
    (d) => d.status === 'pending' || d.status === 'processing',
  )
  if (hasProcessing) {
    startDocRefresh()
  }
}

const handleCreate = () => {
  isEditing.value = false
  editingId.value = ''
  resetForm()
  dialogVisible.value = true
}

const handleEdit = (kb: KnowledgeBase) => {
  isEditing.value = true
  editingId.value = kb.id
  form.name = kb.name
  form.description = kb.description || ''
  form.vector_db = kb.vector_db || 'chroma'
  form.embedding_model = kb.embedding_model || 'text-embedding-ada-002'
  errors.name = ''
  dialogVisible.value = true
}

const askDelete = (kb: KnowledgeBase) => {
  deleting.value = kb
  deleteVisible.value = true
}

const confirmDelete = async () => {
  if (!deleting.value) return
  deletingLoading.value = true
  try {
    const res = await deleteKB(deleting.value.id)
    if (res.error) {
      toast.add({ title: res.error, color: 'error' })
      return
    }
    toast.add({ title: '删除成功', color: 'success' })
    deleteVisible.value = false
    await fetchKnowledgeBases()
  } finally {
    deletingLoading.value = false
  }
}

const handleUploadCancel = () => {
  uploadFiles.value = null
  uploadModalVisible.value = false
}

const handleSearch = async () => {
  if (!selectedKB.value || !searchQuery.value.trim()) {
    toast.add({ title: '请输入检索关键词', color: 'warning' })
    return
  }

  searchLoading.value = true
  hasSearched.value = true
  searchResults.value = []

  try {
    const res = await searchKB(selectedKB.value!.id, {
      query: searchQuery.value.trim(),
      top_k: 10,
      min_score: 0.3,
    })

    if (res.error) {
      toast.add({ title: res.error, color: 'error' })
      return
    }

    if (res.data) {
      searchResults.value = res.data.results
      searchDuration.value = res.data.duration_ms || 0
    }
  } catch {
    toast.add({ title: '检索失败', color: 'error' })
  } finally {
    searchLoading.value = false
  }
}

const handleUploadSubmit = async () => {
  if (!selectedKB.value || !uploadFiles.value?.length) return

  uploadLoading.value = true
  let successCount = 0
  let failCount = 0

  for (const file of uploadFiles.value) {
    const res = await uploadDoc(selectedKB.value!.id, file)
    if (res.error) {
      failCount++
    } else {
      successCount++
    }
  }

  uploadLoading.value = false

  if (failCount === 0) {
    toast.add({ title: `成功上传 ${successCount} 个文档`, color: 'success' })
  } else {
    toast.add({ title: `成功 ${successCount} 个，失败 ${failCount} 个`, color: 'warning' })
  }

  handleUploadCancel()
  if (selectedKB.value) {
    await fetchDocuments(selectedKB.value.id)
    await fetchKnowledgeBases()
    startDocRefresh()
  }
}

const askDeleteDoc = (doc: Document) => {
  deletingDoc.value = doc
  deleteDocVisible.value = true
}

const confirmDeleteDoc = async () => {
  if (!selectedKB.value || !deletingDoc.value) return

  deletingDocLoading.value = true
  try {
    const res = await deleteDoc(selectedKB.value!.id, deletingDoc.value.id)
    if (res.error) {
      toast.add({ title: res.error, color: 'error' })
      return
    }
    toast.add({ title: '删除成功', color: 'success' })
    deleteDocVisible.value = false
    await fetchDocuments(selectedKB.value!.id)
    await fetchKnowledgeBases()
  } finally {
    deletingDocLoading.value = false
  }
}

const handleReparseDoc = async (doc: Document) => {
  if (!selectedKB.value) return

  const res = await reparseDoc(selectedKB.value!.id, doc.id)
  if (res.error) {
    toast.add({ title: res.error, color: 'error' })
    return
  }
  toast.add({ title: '文档已提交重新解析', color: 'success' })
  await fetchDocuments(selectedKB.value!.id)
  startDocRefresh()
}

const handleSubmit = async () => {
  if (!validate()) return

  submitting.value = true
  try {
    if (isEditing.value) {
      const input: UpdateKBInput = {
        name: form.name,
        description: form.description,
        vector_db: form.vector_db,
        embedding_model: form.embedding_model,
      }
      const res = await updateKB(editingId.value, input)
      if (res.error) {
        toast.add({ title: res.error, color: 'error' })
        return
      }
      toast.add({ title: '保存成功', color: 'success' })
    } else {
      const input: CreateKBInput = {
        name: form.name,
        description: form.description,
        vector_db: form.vector_db,
        embedding_model: form.embedding_model,
      }
      const res = await createKB(input)
      if (res.error) {
        toast.add({ title: res.error, color: 'error' })
        return
      }
      toast.add({ title: '创建成功', color: 'success' })
    }
    dialogVisible.value = false
    await fetchKnowledgeBases()
  } catch {
    toast.add({ title: isEditing.value ? '保存失败' : '创建失败', color: 'error' })
  } finally {
    submitting.value = false
  }
}

const resetForm = () => {
  form.name = ''
  form.description = ''
  form.vector_db = 'chroma'
  form.embedding_model = 'text-embedding-ada-002'
  errors.name = ''
}

onMounted(() => {
  fetchKnowledgeBases()
})

onUnmounted(() => {
  stopDocRefresh()
})
</script>

<style scoped>
.cf-state--compact {
  min-height: 160px;
}

.kb-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}

.kb-card {
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  border: 1.5px solid var(--cf-line);
  transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
}

.kb-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
  border-color: color-mix(in srgb, var(--cf-accent) 35%, var(--cf-line));
}

.kb-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  gap: 8px;
}

.kb-name {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 1rem;
  color: var(--cf-ink);
  min-width: 0;
}

.kb-description {
  color: var(--cf-ink-soft);
  font-size: 0.875rem;
  margin: 0 0 12px;
  min-height: 40px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.kb-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.75rem;
  color: var(--cf-ink-soft);
  gap: 8px;
}

.meta-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.drawer-header-actions {
  padding-bottom: 12px;
  border-bottom: 1px solid var(--cf-line);
  margin-bottom: 12px;
}

.cf-table-wrap {
  margin-top: 8px;
}

.doc-name-cell {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.doc-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--cf-ink);
}

.action-btns {
  display: flex;
  align-items: center;
  gap: 2px;
}

.search-panel {
  padding: 12px 0;
}

.search-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  flex-wrap: wrap;
}

.search-hint {
  font-size: 0.75rem;
  color: var(--cf-ink-soft);
  margin-left: 4px;
}

.search-results {
  margin-top: 16px;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--cf-line);
  font-size: 0.875rem;
  color: var(--cf-ink);
}

.result-item {
  padding: 12px;
  margin-bottom: 12px;
  background: color-mix(in srgb, var(--cf-ink) 3%, transparent);
  border-radius: 8px;
  border: 1px solid var(--cf-line);
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  gap: 8px;
}

.result-doc-name {
  font-weight: 600;
  color: var(--cf-ink);
}

.result-content {
  font-size: 0.875rem;
  color: var(--cf-ink-soft);
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}

.form-grid {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field__label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--cf-ink);
}

.field__error {
  margin: 0;
  font-size: 0.75rem;
  color: var(--cf-danger);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.delete-text {
  margin: 0;
  color: var(--cf-ink-soft);
  line-height: 1.5;
}
</style>
