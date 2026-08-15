<template>
  <div class="cf-page">
    <div class="cf-page-header">
      <div class="cf-page-heading">
        <h1 class="cf-page-title">{{ t('kb.title') }}</h1>
        <p class="cf-page-sub">{{ t('kb.sub') }}</p>
      </div>
      <CfButton tone="primary" icon="i-lucide-plus" @click="handleCreate">
        {{ t('kb.new') }}
      </CfButton>
    </div>

    <div class="list-toolbar">
      <span class="list-count">{{ t('kb.count', { n: knowledgeBases.length }) }}</span>
      <span class="list-hint">{{ t('kb.hint') }}</span>
    </div>

    <div v-if="loading" class="cf-state">
      <UIcon name="i-lucide-loader-circle" class="size-6 animate-spin" />
      <span>{{ t('common.loading') }}</span>
    </div>

    <div v-else-if="knowledgeBases.length === 0" class="cf-state">
      <UIcon name="i-lucide-book-open" class="size-8 opacity-50" />
      <p>{{ t('kb.empty') }}</p>
    </div>

    <div v-else class="kb-grid">
      <div
        v-for="kb in knowledgeBases"
        :key="kb.id"
        class="kb-card cf-surface"
        :title="t('kb.hint')"
        @click="onCardClick(kb)"
        @dblclick="onCardDblClick(kb)"
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
              {{ kb.status === 'active' ? t('common.enabled') : t('common.disabled') }}
            </UBadge>
          </div>
          <UDropdownMenu :items="getKBMenuItems(kb)" @click.stop>
            <CfButton
              tone="icon"
              icon="i-lucide-ellipsis"
              :tip="t('common.more')"
              @click.stop
            />
          </UDropdownMenu>
        </div>

        <p class="kb-description">{{ kb.description || t('common.noDesc') }}</p>

        <div class="kb-meta">
          <div class="meta-left">
            <span class="meta-item">
              <UIcon name="i-lucide-file-text" class="size-3.5" />
              {{ t('kb.docs', { n: kb.doc_count }) }}
            </span>
            <span class="meta-item">
              <UIcon name="i-lucide-server" class="size-3.5" />
              {{ kb.vector_db || 'chroma' }}
            </span>
          </div>
          <span class="meta-item">{{ d(kb.created_at) }}</span>
        </div>
      </div>
    </div>

    <!-- Create / View / Edit KB -->
    <UModal
      v-model:open="dialogVisible"
      :title="dialogTitle"
      :description="dialogDescription"
      :ui="{ content: 'sm:max-w-lg' }"
    >
      <template #body>
        <div v-if="dialogMode === 'view' && viewingKB" class="detail-sheet">
          <div class="detail-hero">
            <span class="detail-hero-icon">
              <UIcon name="i-lucide-book-open" class="size-6" />
            </span>
            <div class="detail-hero-text">
              <div class="detail-hero-name">{{ viewingKB.name }}</div>
              <div class="detail-hero-sub">
                <UBadge
                  size="sm"
                  variant="subtle"
                  :color="viewingKB.status === 'active' ? 'success' : 'neutral'"
                >
                  {{ viewingKB.status === 'active' ? t('common.enabled') : t('common.disabled') }}
                </UBadge>
                <UBadge size="sm" variant="subtle" color="neutral">
                  {{ t('kb.docs', { n: viewingKB.doc_count }) }}
                </UBadge>
              </div>
            </div>
          </div>

          <dl class="detail-list">
            <div class="detail-row">
              <dt>{{ t('common.name') }}</dt>
              <dd>{{ viewingKB.name }}</dd>
            </div>
            <div class="detail-row detail-row--block">
              <dt>{{ t('common.description') }}</dt>
              <dd>{{ viewingKB.description || '—' }}</dd>
            </div>
            <div class="detail-row">
              <dt>{{ t('common.status') }}</dt>
              <dd>{{ viewingKB.status === 'active' ? t('common.enabled') : t('common.disabled') }}</dd>
            </div>
            <div class="detail-row">
              <dt>{{ t('kb.vector') }}</dt>
              <dd>{{ viewingKB.vector_db || 'chroma' }}</dd>
            </div>
            <div class="detail-row">
              <dt>{{ t('kb.embedding') }}</dt>
              <dd>{{ viewingKB.embedding_model || '—' }}</dd>
            </div>
            <div class="detail-row">
              <dt>{{ t('kb.docCount') }}</dt>
              <dd>{{ viewingKB.doc_count }}</dd>
            </div>
            <div class="detail-row">
              <dt>{{ t('common.createdAt') }}</dt>
              <dd>{{ d(viewingKB.created_at) }}</dd>
            </div>
            <div class="detail-row">
              <dt>{{ t('common.updatedAt') }}</dt>
              <dd>{{ d(viewingKB.updated_at) }}</dd>
            </div>
          </dl>
        </div>

        <form v-else id="kb-form" class="form-grid" @submit.prevent="handleSubmit">
          <div class="field">
            <label class="field__label">{{ t('common.name') }}</label>
            <UInput
              v-model="form.name"
              class="w-full"
              :placeholder="t('kb.namePh')"
              :color="errors.name ? 'error' : undefined"
              @update:model-value="errors.name = ''"
            />
            <p v-if="errors.name" class="field__error">{{ errors.name }}</p>
          </div>

          <div class="field">
            <label class="field__label">{{ t('common.description') }}</label>
            <UTextarea
              v-model="form.description"
              class="w-full"
              :rows="2"
              :placeholder="t('common.optionalDesc')"
            />
          </div>

          <div class="field">
            <label class="field__label">{{ t('kb.vector') }}</label>
            <USelect
              v-model="form.vector_db"
              class="w-full"
              :items="vectorDbOptions"
              :placeholder="t('kb.pickVector')"
            />
          </div>

          <div class="field">
            <label class="field__label">{{ t('kb.embedding') }}</label>
            <USelect
              v-model="form.embedding_model"
              class="w-full"
              :items="embeddingModelOptions"
              :placeholder="t('kb.pickEmbedding')"
            />
          </div>
        </form>
      </template>

      <template #footer>
        <div class="modal-actions" :class="{ 'modal-actions--view': dialogMode === 'view' }">
          <template v-if="dialogMode === 'view'">
            <div class="modal-actions__right">
              <CfButton tone="primary" icon="i-lucide-pencil" @click="enterEditFromView">
                {{ t('common.edit') }}
              </CfButton>
            </div>
          </template>
          <template v-else>
            <div class="modal-actions__left">
              <CfButton
                v-if="dialogMode === 'edit' && cameFromView"
                tone="secondary"
                icon="i-lucide-arrow-left"
                @click="dialogMode = 'view'"
              >
                {{ t('common.detail') }}
              </CfButton>
            </div>
            <div class="modal-actions__right">
              <CfButton tone="secondary" icon="i-lucide-x" @click="dialogVisible = false">
                {{ t('common.cancel') }}
              </CfButton>
              <CfButton
                form="kb-form"
                type="submit"
                tone="primary"
                :icon="dialogMode === 'edit' ? 'i-lucide-check' : 'i-lucide-plus'"
                :loading="submitting"
              >
                {{ dialogMode === 'edit' ? t('common.save') : t('common.create') }}
              </CfButton>
            </div>
          </template>
        </div>
      </template>
    </UModal>

    <!-- Delete KB confirm -->
    <UModal v-model:open="deleteVisible" :title="t('common.deleteConfirm')" :ui="{ content: 'sm:max-w-md' }">
      <template #body>
        <p class="delete-text">
          {{ t('kb.deleteText', { name: deleting?.name ?? '' }) }}
        </p>
      </template>
      <template #footer>
        <div class="modal-actions">
          <div class="modal-actions__right">
            <CfButton tone="secondary" icon="i-lucide-x" @click="deleteVisible = false">{{ t('common.cancel') }}</CfButton>
            <CfButton
              tone="danger"
              strong
              icon="i-lucide-trash-2"
              :loading="deletingLoading"
              @click="confirmDelete"
            >
              {{ t('common.delete') }}
            </CfButton>
          </div>
        </div>
      </template>
    </UModal>

    <!-- Documents Slideover -->
    <USlideover
      v-model:open="drawerVisible"
      :title="selectedKB?.name || t('kb.fallbackTitle')"
      :description="t('kb.docsDrawer', { n: documents.length })"
      :ui="{ content: 'max-w-2xl w-full' }"
    >
      <template #body>
        <div class="drawer-header-actions">
          <CfButton tone="primary" icon="i-lucide-cloud-upload" @click="uploadModalVisible = true">
            {{ t('kb.upload') }}
          </CfButton>
        </div>

        <UTabs v-model="drawerActiveTab" :items="drawerTabs" class="w-full">
          <template #docs>
            <div v-if="docsLoading" class="cf-state cf-state--compact">
              <UIcon name="i-lucide-loader-circle" class="size-5 animate-spin" />
              <span>{{ t('common.loading') }}</span>
            </div>

            <div v-else-if="documents.length === 0" class="cf-state cf-state--compact">
              <UIcon name="i-lucide-file" class="size-7 opacity-50" />
              <p>{{ t('kb.noDocs') }}</p>
            </div>

            <div v-else class="cf-table-wrap">
              <table class="cf-data-table">
                <thead>
                  <tr>
                    <th>{{ t('common.name') }}</th>
                    <th>{{ t('common.status') }}</th>
                    <th>{{ t('kb.chunks') }}</th>
                    <th>{{ t('kb.size') }}</th>
                    <th>{{ t('kb.time') }}</th>
                    <th class="cf-col-actions">{{ t('common.actions') }}</th>
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
                    <td class="cf-muted">{{ d(doc.created_at) }}</td>
                    <td>
                      <div class="action-btns">
                        <CfButton
                          tone="icon"
                          icon="i-lucide-refresh-cw"
                          :tip="t('kb.reparse')"
                          @click="handleReparseDoc(doc)"
                        />
                        <CfButton
                          tone="icon-danger"
                          icon="i-lucide-trash-2"
                          :tip="t('common.delete')"
                          @click="askDeleteDoc(doc)"
                        />
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
                :placeholder="t('kb.searchPh')"
                @keydown.enter.ctrl="handleSearch"
              />
              <div class="search-actions">
                <CfButton
                  tone="primary"
                  icon="i-lucide-search"
                  :loading="searchLoading"
                  @click="handleSearch"
                >
                  {{ t('kb.search') }}
                </CfButton>
                <CfButton tone="secondary" icon="i-lucide-eraser" @click="searchQuery = ''">{{ t('kb.clear') }}</CfButton>
                <span class="search-hint">{{ t('kb.searchHint') }}</span>
              </div>
            </div>

            <div v-if="searchResults.length > 0" class="search-results">
              <div class="results-header">
                <span>{{ t('kb.searchHits', { n: searchResults.length }) }}</span>
                <span class="cf-muted">{{ t('kb.searchMs', { ms: searchDuration }) }}</span>
              </div>

              <div v-for="result in searchResults" :key="result.chunk_id" class="result-item">
                <div class="result-header">
                  <span class="result-doc-name">{{ result.document_name }}</span>
                  <UBadge size="sm" variant="subtle" :color="getScoreColor(result.score)">
                    {{ t('kb.score', { n: (result.score * 100).toFixed(1) }) }}
                  </UBadge>
                </div>
                <div class="result-content">{{ result.content }}</div>
              </div>
            </div>

            <div v-else-if="!searchLoading && hasSearched" class="cf-state cf-state--compact">
              <UIcon name="i-lucide-search-x" class="size-7 opacity-50" />
              <p>{{ t('kb.noHits') }}</p>
            </div>
          </template>
        </UTabs>
      </template>
    </USlideover>

    <!-- Upload Modal -->
    <UModal
      v-model:open="uploadModalVisible"
      :title="t('kb.uploadTitle')"
      :ui="{ content: 'sm:max-w-lg' }"
    >
      <template #body>
        <UFileUpload
          v-model="uploadFiles"
          multiple
          accept=".pdf,.txt,.md,.docx,.html"
          :label="t('kb.uploadLabel')"
          :description="t('kb.uploadDesc')"
          layout="list"
        />
      </template>

      <template #footer>
        <div class="modal-actions">
          <div class="modal-actions__right">
            <CfButton tone="secondary" icon="i-lucide-x" @click="handleUploadCancel">{{ t('common.cancel') }}</CfButton>
            <CfButton
              tone="primary"
              icon="i-lucide-cloud-upload"
              :loading="uploadLoading"
              :disabled="!uploadFiles?.length"
              @click="handleUploadSubmit"
            >
              {{ t('kb.upload') }}
            </CfButton>
          </div>
        </div>
      </template>
    </UModal>

    <!-- Delete Doc confirm -->
    <UModal v-model:open="deleteDocVisible" :title="t('common.deleteConfirm')" :ui="{ content: 'sm:max-w-md' }">
      <template #body>
        <p class="delete-text">
          {{ t('kb.deleteDocText', { name: deletingDoc?.name ?? '' }) }}
        </p>
      </template>
      <template #footer>
        <div class="modal-actions">
          <div class="modal-actions__right">
            <CfButton tone="secondary" icon="i-lucide-x" @click="deleteDocVisible = false">{{ t('common.cancel') }}</CfButton>
            <CfButton
              tone="danger"
              strong
              icon="i-lucide-trash-2"
              :loading="deletingDocLoading"
              @click="confirmDeleteDoc"
            >
              {{ t('common.delete') }}
            </CfButton>
          </div>
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
const { t, d } = useLocale()
const { listKBs, createKB, updateKB, deleteKB, listDocs, uploadDoc, deleteDoc, reparseDoc, searchKB } =
  useKnowledgeBases()

const loading = ref(false)
const submitting = ref(false)
const knowledgeBases = ref<KnowledgeBase[]>([])
const dialogVisible = ref(false)
const dialogMode = ref<'create' | 'view' | 'edit'>('create')
const cameFromView = ref(false)
const editingId = ref('')
const viewingKB = ref<KnowledgeBase | null>(null)

const dialogTitle = computed(() => {
  if (dialogMode.value === 'create') return t('kb.createTitle')
  if (dialogMode.value === 'view') return t('kb.viewTitle')
  return t('kb.editTitle')
})

const dialogDescription = computed(() => {
  if (dialogMode.value === 'create') return t('kb.createDesc')
  if (dialogMode.value === 'view') return t('kb.viewDesc')
  return t('kb.editDesc')
})

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
    label: t('kb.docsManage'),
    value: 'docs',
    slot: 'docs' as const,
    badge: documents.value.length || undefined,
  },
  {
    label: t('kb.searchTest'),
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
  if (status === 'pending' || status === 'processing' || status === 'completed' || status === 'failed') {
    return t(`status.${status}`)
  }
  return status
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
      label: t('kb.docsManage'),
      icon: 'i-lucide-file-text',
      onSelect: () => handleSelectKB(kb, 'docs'),
    },
    {
      label: t('kb.searchTest'),
      icon: 'i-lucide-search',
      onSelect: () => handleSelectKB(kb, 'search'),
    },
    {
      label: t('common.edit'),
      icon: 'i-lucide-pencil',
      onSelect: () => handleEdit(kb),
    },
    {
      label: t('common.delete'),
      icon: 'i-lucide-trash-2',
      color: 'error' as const,
      onSelect: () => askDelete(kb),
    },
  ]
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
  errors.name = form.name.trim() ? '' : t('common.nameRequired')
  if (form.name.trim().length > 100) errors.name = t('common.nameTooLong')
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
    toast.add({ title: t('kb.listFail'), color: 'error' })
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
    toast.add({ title: t('kb.docListFail'), color: 'error' })
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

const handleSelectKB = async (kb: KnowledgeBase, tab: 'docs' | 'search' = 'docs') => {
  selectedKB.value = kb
  drawerVisible.value = true
  drawerActiveTab.value = tab
  await fetchDocuments(kb.id)
  const hasProcessing = documents.value.some(
    (d) => d.status === 'pending' || d.status === 'processing',
  )
  if (hasProcessing) {
    startDocRefresh()
  }
}

let cardClickTimer: ReturnType<typeof setTimeout> | null = null

const onCardClick = (kb: KnowledgeBase) => {
  if (cardClickTimer) clearTimeout(cardClickTimer)
  cardClickTimer = setTimeout(() => {
    cardClickTimer = null
    handleSelectKB(kb)
  }, 250)
}

const onCardDblClick = (kb: KnowledgeBase) => {
  if (cardClickTimer) {
    clearTimeout(cardClickTimer)
    cardClickTimer = null
  }
  handleView(kb)
}

const fillFormFromKB = (kb: KnowledgeBase) => {
  form.name = kb.name
  form.description = kb.description || ''
  form.vector_db = kb.vector_db || 'chroma'
  form.embedding_model = kb.embedding_model || 'text-embedding-ada-002'
  errors.name = ''
}

const handleCreate = () => {
  dialogMode.value = 'create'
  cameFromView.value = false
  editingId.value = ''
  viewingKB.value = null
  resetForm()
  dialogVisible.value = true
}

const handleView = (kb: KnowledgeBase) => {
  dialogMode.value = 'view'
  cameFromView.value = true
  viewingKB.value = kb
  editingId.value = kb.id
  fillFormFromKB(kb)
  dialogVisible.value = true
}

const handleEdit = (kb: KnowledgeBase) => {
  dialogMode.value = 'edit'
  cameFromView.value = false
  viewingKB.value = kb
  editingId.value = kb.id
  fillFormFromKB(kb)
  dialogVisible.value = true
}

const enterEditFromView = () => {
  if (!viewingKB.value) return
  dialogMode.value = 'edit'
  cameFromView.value = true
  fillFormFromKB(viewingKB.value)
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
    toast.add({ title: t('common.deleteOk'), color: 'success' })
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
    toast.add({ title: t('kb.needQuery'), color: 'warning' })
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
    toast.add({ title: t('kb.searchFail'), color: 'error' })
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
    toast.add({ title: t('kb.uploadOk', { n: successCount }), color: 'success' })
  } else {
    toast.add({ title: t('kb.uploadPartial', { ok: successCount, fail: failCount }), color: 'warning' })
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
    toast.add({ title: t('common.deleteOk'), color: 'success' })
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
  toast.add({ title: t('kb.reparseOk'), color: 'success' })
  await fetchDocuments(selectedKB.value!.id)
  startDocRefresh()
}

const handleSubmit = async () => {
  if (!validate()) return

  submitting.value = true
  try {
    if (dialogMode.value === 'edit') {
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
      toast.add({ title: t('common.saveOk'), color: 'success' })
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
      toast.add({ title: t('common.createOk'), color: 'success' })
    }
    dialogVisible.value = false
    await fetchKnowledgeBases()
  } catch {
    toast.add({ title: dialogMode.value === 'edit' ? t('common.saveFail') : t('common.createFail'), color: 'error' })
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
  if (cardClickTimer) {
    clearTimeout(cardClickTimer)
    cardClickTimer = null
  }
})
</script>

<style scoped>
.cf-state--compact {
  min-height: 160px;
}

.list-count {
  font-size: 0.8rem;
  color: var(--cf-ink-soft);
}

.list-hint {
  font-size: 0.8rem;
  color: var(--cf-ink-soft);
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

.detail-sheet {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.detail-hero {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 14px;
  border-radius: 10px;
  border: 1px solid var(--cf-line);
  background: color-mix(in oklab, var(--cf-accent) 6%, var(--cf-nav-surface, var(--cf-bg-elevated)));
}

.detail-hero-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: var(--cf-accent);
  background: color-mix(in oklab, var(--cf-accent) 14%, transparent);
}

.detail-hero-text {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.detail-hero-name {
  font-family: var(--font-display);
  font-size: 1.2rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--cf-ink);
  line-height: 1.2;
}

.detail-hero-sub {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}

.detail-list {
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0;
  border: 1px solid var(--cf-line);
  border-radius: 10px;
  overflow: hidden;
}

.detail-row {
  display: grid;
  grid-template-columns: 110px 1fr;
  gap: 12px;
  padding: 11px 14px;
  border-bottom: 1px solid var(--cf-line);
  align-items: start;
}

.detail-row:last-child {
  border-bottom: 0;
}

.detail-row dt {
  margin: 0;
  font-size: 0.75rem;
  font-weight: 500;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: var(--cf-ink-soft);
  padding-top: 2px;
}

.detail-row dd {
  margin: 0;
  font-size: 0.9rem;
  color: var(--cf-ink);
  min-width: 0;
  word-break: break-word;
}

.detail-row--block {
  grid-template-columns: 1fr;
  gap: 6px;
}

.modal-actions__right {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}

.modal-actions__left {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-right: auto;
}

.delete-text {
  margin: 0;
  color: var(--cf-ink-soft);
  line-height: 1.5;
}
</style>
