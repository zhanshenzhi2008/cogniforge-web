<template>
  <div class="knowledge-page">
    <div class="page-header">
      <h2>知识库</h2>
      <n-button type="primary" @click="handleCreate">
        <template #icon>
          <n-icon :component="AddOutline" />
        </template>
        创建知识库
      </n-button>
    </div>

    <n-grid :cols="3" :x-gap="16" :y-gap="16" responsive="screen" item-responsive>
      <n-gi v-for="kb in knowledgeBases" :key="kb.id" :span="3">
        <n-card class="kb-card" hoverable @click="handleSelectKB(kb)">
          <div class="kb-header">
            <div class="kb-name">
              <n-icon :component="BookOutline" size="20" />
              <span>{{ kb.name }}</span>
              <n-tag size="small" :type="kb.status === 'active' ? 'success' : 'default'" bordered={false}>
                {{ kb.status === 'active' ? '启用' : '禁用' }}
              </n-tag>
            </div>
            <n-dropdown :options="getKBDropdownOptions(kb)" @select="(key) => handleKBAction(key, kb)">
              <n-button quaternary circle size="small" @click.stop>
                <template #icon>
                  <n-icon :component="EllipsisHorizontalOutline" />
                </template>
              </n-button>
            </n-dropdown>
          </div>

          <p class="kb-description">{{ kb.description || '暂无描述' }}</p>

          <div class="kb-meta">
            <n-space :size="16">
              <span class="meta-item">
                <n-icon :component="DocumentTextOutline" />
                {{ kb.doc_count }} 文档
              </span>
              <span class="meta-item">
                <n-icon :component="ServerOutline" />
                {{ kb.vector_db || 'chroma' }}
              </span>
            </n-space>
            <span class="meta-item">
              {{ formatDate(kb.created_at) }}
            </span>
          </div>
        </n-card>
      </n-gi>
    </n-grid>

    <n-empty v-if="!loading && knowledgeBases.length === 0" description="暂无知识库，点击上方按钮创建" style="margin-top: 40px" />

    <!-- KB Dialog -->
    <n-modal
      v-model:show="dialogVisible"
      preset="card"
      :title="isEditing ? '编辑知识库' : '创建知识库'"
      style="width: 500px; max-width: 90vw"
      :segmented="{ content: true, footer: true }"
    >
      <n-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-placement="top"
      >
        <n-form-item label="名称" path="name">
          <n-input v-model:value="form.name" placeholder="请输入知识库名称" />
        </n-form-item>

        <n-form-item label="描述" path="description">
          <n-input
            v-model:value="form.description"
            type="textarea"
            :autosize="{ minRows: 2, maxRows: 4 }"
            placeholder="请输入描述（可选）"
          />
        </n-form-item>

        <n-form-item label="向量数据库" path="vector_db">
          <n-select
            v-model:value="form.vector_db"
            :options="vectorDbOptions"
            placeholder="选择向量数据库"
          />
        </n-form-item>

        <n-form-item label="Embedding 模型" path="embedding_model">
          <n-select
            v-model:value="form.embedding_model"
            :options="embeddingModelOptions"
            placeholder="选择 Embedding 模型"
          />
        </n-form-item>
      </n-form>

      <template #footer>
        <n-space justify="end">
          <n-button @click="dialogVisible = false">取消</n-button>
          <n-button type="primary" :loading="submitting" @click="handleSubmit">
            {{ isEditing ? '保存' : '创建' }}
          </n-button>
        </n-space>
      </template>
    </n-modal>

    <!-- Documents Drawer -->
    <n-drawer
      v-model:show="drawerVisible"
      :width="700"
      placement="right"
      :title="`知识库 - ${selectedKB?.name || ''}`"
    >
      <n-drawer-content>
        <n-tabs type="line" animated>
          <n-tab-pane name="docs" tab="文档管理">
            <template #header>
              <div class="tab-header">
                <span>文档管理</span>
                <n-button type="primary" size="tiny" @click="uploadModalVisible = true">
                  <template #icon>
                    <n-icon :component="CloudUploadOutline" />
                  </template>
                  上传
                </n-button>
              </div>
            </template>

            <n-spin :show="docsLoading">
              <n-data-table
                :columns="docColumns"
                :data="documents"
                :pagination="false"
                :row-key="(row: Document) => row.id"
              />
              <n-empty v-if="!docsLoading && documents.length === 0" description="暂无文档，请上传" />
            </n-spin>
          </n-tab-pane>

          <n-tab-pane name="search" tab="检索测试">
            <template #header>
              <div class="tab-header">
                <span>检索测试</span>
              </div>
            </template>

            <div class="search-panel">
              <n-input
                v-model:value="searchQuery"
                type="textarea"
                placeholder="输入检索关键词..."
                :autosize="{ minRows: 2, maxRows: 4 }"
                @keydown.enter.ctrl="handleSearch"
              />
              <n-space style="margin-top: 12px">
                <n-button type="primary" :loading="searchLoading" @click="handleSearch">
                  <template #icon>
                    <n-icon :component="SearchOutline" />
                  </template>
                  检索
                </n-button>
                <n-button @click="searchQuery = ''">清空</n-button>
                <n-text depth="3" style="margin-left: 12px; font-size: 12px">
                  支持 Ctrl+Enter 快捷检索
                </n-text>
              </n-space>
            </div>

            <div v-if="searchResults.length > 0" class="search-results">
              <div class="results-header">
                <n-text>找到 {{ searchResults.length }} 条相关结果</n-text>
                <n-text depth="3" style="font-size: 12px">
                  耗时 {{ searchDuration }}ms
                </n-text>
              </div>

              <div v-for="result in searchResults" :key="result.chunk_id" class="result-item">
                <div class="result-header">
                  <span class="result-doc-name">{{ result.document_name }}</span>
                  <n-tag size="small" :type="getScoreTagType(result.score)">
                    相似度: {{ (result.score * 100).toFixed(1) }}%
                  </n-tag>
                </div>
                <div class="result-content">{{ result.content }}</div>
              </div>
            </div>

            <n-empty v-else-if="!searchLoading && hasSearched" description="未找到相关结果" style="margin-top: 40px" />
          </n-tab-pane>
        </n-tabs>

        <template #footer>
          <n-space justify="end">
            <n-button @click="drawerVisible = false">关闭</n-button>
          </n-space>
        </template>
      </n-drawer-content>
    </n-drawer>

    <!-- Upload Modal -->
    <n-modal
      v-model:show="uploadModalVisible"
      preset="card"
      title="上传文档"
      style="width: 500px; max-width: 90vw"
      :segmented="{ content: true, footer: true }"
    >
      <n-upload
        v-model:file-list="uploadFileList"
        :max="5"
        accept=".pdf,.txt,.md,.docx,.html"
        multiple
        draggable
      >
        <n-space vertical align="center" :size="12">
          <n-icon :component="CloudUploadOutline" size="48" depth="3" />
          <n-text>点击或拖拽文件到此处上传</n-text>
          <n-text depth="3" style="font-size: 12px">
            支持 PDF、TXT、MD、DOCX、HTML，单个文件不超过 50MB
          </n-text>
        </n-space>
      </n-upload>

      <template #footer>
        <n-space justify="end">
          <n-button @click="handleUploadCancel">取消</n-button>
          <n-button type="primary" :loading="uploadLoading" :disabled="uploadFileList.length === 0" @click="handleUploadSubmit">
            上传
          </n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import {
  AddOutline,
  BookOutline,
  DocumentTextOutline,
  ServerOutline,
  CloudUploadOutline,
  PencilOutline,
  TrashOutline,
  EllipsisHorizontalOutline,
  SearchOutline,
} from '@/constants/icons'
import { NButton, NIcon, NTag, NDropdown, NDrawer, NUpload, NTabs, NTabPane, useMessage, useDialog } from 'naive-ui'
import type { DataTableColumns, FormInst } from 'naive-ui'
import type { KnowledgeBase, Document, CreateKBInput, UpdateKBInput, SearchResult, SearchResponse } from '@/composables/useKnowledgeBases'

definePageMeta({
  layout: 'default',
})

const message = useMessage()
const dialog = useDialog()
const { listKBs, createKB, updateKB, deleteKB, listDocs, uploadDoc, deleteDoc, searchKB } = useKnowledgeBases()

const loading = ref(false)
const submitting = ref(false)
const knowledgeBases = ref<KnowledgeBase[]>([])
const dialogVisible = ref(false)
const isEditing = ref(false)
const editingId = ref('')
const formRef = ref<FormInst>()

const form = reactive({
  name: '',
  description: '',
  vector_db: 'chroma',
  embedding_model: 'text-embedding-ada-002',
})

const rules = {
  name: [
    { required: true, message: '名称不能为空', trigger: 'blur' },
    { max: 100, message: '名称不能超过 100 个字符', trigger: 'blur' },
  ],
}

const vectorDbOptions = [
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
const docsLoading = ref(false)
const documents = ref<Document[]>([])
const selectedKB = ref<KnowledgeBase | null>(null)

// 上传相关
const uploadModalVisible = ref(false)
const uploadFileList = ref<any[]>([])
const uploadLoading = ref(false)

// 检索相关
const searchQuery = ref('')
const searchLoading = ref(false)
const searchResults = ref<SearchResult[]>([])
const searchDuration = ref(0)
const hasSearched = ref(false)

const docColumns: DataTableColumns<Document> = [
  {
    title: '名称',
    key: 'name',
    width: 180,
    ellipsis: { tooltip: true },
  },
  {
    title: '状态',
    key: 'status',
    width: 100,
    render(row) {
      const statusMap: Record<string, { type: 'success' | 'warning' | 'error' | 'info' | 'default'; label: string }> = {
        pending: { type: 'default', label: '等待中' },
        processing: { type: 'warning', label: '处理中' },
        completed: { type: 'success', label: '已完成' },
        failed: { type: 'error', label: '失败' },
      }
      const status = statusMap[row.status] || { type: 'default', label: row.status }
      return h(NTag, { size: 'small', type: status.type, bordered: false }, { default: () => status.label })
    },
  },
  {
    title: '大小',
    key: 'file_size',
    width: 100,
    render(row) {
      return formatFileSize(row.file_size)
    },
  },
  {
    title: '操作',
    key: 'actions',
    width: 80,
    render(row) {
      return h('div', { class: 'action-btns' }, [
        h(
          NButton,
          {
            quaternary: true,
            circle: true,
            size: 'small',
            onClick: () => handleDeleteDoc(row),
          },
          { icon: () => h(NIcon, { component: TrashOutline, size: 16 }) },
        ),
      ])
    },
  },
]

function getKBDropdownOptions(kb: KnowledgeBase) {
  return [
    { label: '编辑', key: 'edit', icon: () => h(NIcon, { component: PencilOutline, size: 16 }) },
    { label: '删除', key: 'delete', icon: () => h(NIcon, { component: TrashOutline, size: 16 }) },
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

const fetchKnowledgeBases = async () => {
  loading.value = true
  try {
    const res = await listKBs()
    if (res.error) {
      message.error(res.error)
      return
    }
    knowledgeBases.value = res.data || []
  } catch {
    message.error('获取知识库列表失败')
  } finally {
    loading.value = false
  }
}

const fetchDocuments = async (kbId: string) => {
  docsLoading.value = true
  try {
    const res = await listDocs(kbId)
    if (res.error) {
      message.error(res.error)
      return
    }
    documents.value = res.data || []
  } catch {
    message.error('获取文档列表失败')
  } finally {
    docsLoading.value = false
  }
}

const handleSelectKB = async (kb: KnowledgeBase) => {
  selectedKB.value = kb
  drawerVisible.value = true
  await fetchDocuments(kb.id)
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
  dialogVisible.value = true
}

const handleDelete = async (kb: KnowledgeBase) => {
  dialog.warning({
    title: '删除确认',
    content: `确定要删除知识库「${kb.name}」吗？删除后无法恢复。`,
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      const res = await deleteKB(kb.id)
      if (res.error) {
        message.error(res.error)
        return
      }
      message.success('删除成功')
      await fetchKnowledgeBases()
    },
  })
}

const handleKBAction = (key: string, kb: KnowledgeBase) => {
  if (key === 'edit') {
    handleEdit(kb)
  } else if (key === 'delete') {
    handleDelete(kb)
  }
}

const handleUploadCancel = () => {
  uploadFileList.value = []
  uploadModalVisible.value = false
}

// 检索相关函数
const handleSearch = async () => {
  if (!selectedKB.value || !searchQuery.value.trim()) {
    message.warning('请输入检索关键词')
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
      message.error(res.error)
      return
    }

    if (res.data) {
      searchResults.value = res.data.results
      searchDuration.value = res.data.duration_ms || 0
    }
  } catch {
    message.error('检索失败')
  } finally {
    searchLoading.value = false
  }
}

const getScoreTagType = (score: number): 'success' | 'warning' | 'error' | 'info' | 'default' => {
  if (score >= 0.7) return 'success'
  if (score >= 0.5) return 'warning'
  return 'default'
}

const handleUploadSubmit = async () => {
  if (!selectedKB.value || uploadFileList.value.length === 0) return

  uploadLoading.value = true
  let successCount = 0
  let failCount = 0

  for (const file of uploadFileList.value) {
    if (file.file) {
      const res = await uploadDoc(selectedKB.value!.id, file.file)
      if (res.error) {
        failCount++
      } else {
        successCount++
      }
    }
  }

  uploadLoading.value = false

  if (failCount === 0) {
    message.success(`成功上传 ${successCount} 个文档`)
  } else {
    message.warning(`成功 ${successCount} 个，失败 ${failCount} 个`)
  }

  handleUploadCancel()
  // 刷新文档列表
  if (selectedKB.value) {
    await fetchDocuments(selectedKB.value.id)
    await fetchKnowledgeBases()
  }
}

const handleDeleteDoc = async (doc: Document) => {
  if (!selectedKB.value) return

  dialog.warning({
    title: '删除确认',
    content: `确定要删除文档「${doc.name}」吗？`,
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      const res = await deleteDoc(selectedKB.value!.id, doc.id)
      if (res.error) {
        message.error(res.error)
        return
      }
      message.success('删除成功')
      await fetchDocuments(selectedKB.value!.id)
      await fetchKnowledgeBases()
    },
  })
}

const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
  } catch {
    return
  }

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
        message.error(res.error)
        return
      }
      message.success('保存成功')
    } else {
      const input: CreateKBInput = {
        name: form.name,
        description: form.description,
        vector_db: form.vector_db,
        embedding_model: form.embedding_model,
      }
      const res = await createKB(input)
      if (res.error) {
        message.error(res.error)
        return
      }
      message.success('创建成功')
    }
    dialogVisible.value = false
    await fetchKnowledgeBases()
  } catch {
    message.error(isEditing.value ? '保存失败' : '创建失败')
  } finally {
    submitting.value = false
  }
}

const resetForm = () => {
  form.name = ''
  form.description = ''
  form.vector_db = 'chroma'
  form.embedding_model = 'text-embedding-ada-002'
  formRef.value?.restoreValidation()
}

onMounted(() => {
  fetchKnowledgeBases()
})
</script>

<style scoped>
.knowledge-page {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
}

.kb-card {
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.kb-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.kb-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.kb-name {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 16px;
}

.kb-description {
  color: #666;
  font-size: 14px;
  margin: 0 0 12px 0;
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
  font-size: 12px;
  color: #999;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.action-btns {
  display: flex;
  align-items: center;
  gap: 8px;
}

.action-btns :deep(.n-button) {
  opacity: 0.75;
  transition: opacity 0.2s, transform 0.15s;
}

.action-btns :deep(.n-button:hover) {
  opacity: 1;
  transform: scale(1.1);
}

.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.tab-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.search-panel {
  padding: 12px 0;
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
  border-bottom: 1px solid #f0f0f0;
}

.result-item {
  padding: 12px;
  margin-bottom: 12px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e8e8e8;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.result-doc-name {
  font-weight: 600;
  color: #333;
}

.result-content {
  font-size: 14px;
  color: #666;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
