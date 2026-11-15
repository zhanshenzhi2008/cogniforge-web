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

    <div v-else class="kb-sections">
      <section v-for="group in kbGroups" :key="group.key" class="kb-section">
        <h2 class="kb-section-title">
          <UIcon name="i-lucide-folder" class="size-4 shrink-0 opacity-70" />
          <span>{{ group.label }}</span>
          <span class="kb-section-count">{{ group.items.length }}</span>
        </h2>
        <div class="kb-grid">
          <div
            v-for="kb in group.items"
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
      </section>
    </div>

    <!-- Create / View / Edit KB -->
    <CfModal
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
              <dt>{{ t('kb.folder') }}</dt>
              <dd>{{ folderNameById.get(viewingKB.folder_id || '') || t('kb.noFolder') }}</dd>
            </div>
            <div class="detail-row">
              <dt>{{ t('kb.vector') }}</dt>
              <dd>{{ viewingKB.vector_db || 'pgvector' }}</dd>
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
            <label class="field__label">{{ t('kb.folder') }}</label>
            <USelect
              v-model="form.folder_id"
              class="w-full"
              :items="folderSelectItems"
              :placeholder="t('kb.pickFolder')"
              @update:model-value="onFolderSelect"
            />
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
    </CfModal>

    <!-- Delete KB confirm -->
    <CfModal v-model:open="deleteVisible" :title="t('common.deleteConfirm')" :ui="{ content: 'sm:max-w-md' }">
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
    </CfModal>

    <!-- Documents Slideover：列表 + 预览（对标 Dify / FastGPT） -->
    <USlideover
      v-model:open="drawerVisible"
      :title="selectedKB?.name || t('kb.fallbackTitle')"
      :description="t('kb.docsDrawer', { n: documents.length })"
      :ui="{ content: 'max-w-5xl w-full' }"
    >
      <template #body>
        <div class="drawer-header-actions">
          <CfButton
            tone="primary"
            icon="i-lucide-cloud-upload"
            @click="openUploadModal"
          >
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

            <div v-else class="docs-workspace" :class="{ 'docs-workspace--preview': !!previewDoc }">
              <div class="docs-list-pane">
                <div class="cf-table-wrap">
                  <table class="cf-data-table">
                    <thead>
                      <tr>
                        <th>{{ t('common.name') }}</th>
                        <th>{{ t('common.status') }}</th>
                        <th v-if="!previewDoc">{{ t('kb.chunks') }}</th>
                        <th v-if="!previewDoc">{{ t('kb.size') }}</th>
                        <th v-if="!previewDoc">{{ t('kb.time') }}</th>
                        <th class="cf-col-actions">{{ t('common.actions') }}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        v-for="doc in documents"
                        :key="doc.id"
                        class="doc-row"
                        :class="{ 'doc-row--active': previewDoc?.id === doc.id }"
                        @click="openDocPreview(doc)"
                      >
                        <td>
                          <button
                            type="button"
                            class="doc-name-cell doc-name-btn"
                            :title="t('kb.openPreview')"
                            @click.stop="openDocPreview(doc)"
                          >
                            <UIcon :name="getFileIcon(doc.file_type)" class="size-4 shrink-0 opacity-60" />
                            <span class="doc-name">{{ doc.name }}</span>
                          </button>
                        </td>
                        <td>
                          <UBadge size="sm" variant="subtle" :color="docStatusColor(doc.status)">
                            {{ docStatusLabel(doc.status) }}
                          </UBadge>
                        </td>
                        <td v-if="!previewDoc" class="cf-muted">{{ doc.chunk_count || '—' }}</td>
                        <td v-if="!previewDoc" class="cf-muted">{{ formatFileSize(doc.file_size) }}</td>
                        <td v-if="!previewDoc" class="cf-muted">{{ d(doc.created_at) }}</td>
                        <td @click.stop>
                          <div class="action-btns">
                            <CfButton
                              tone="icon"
                              icon="i-lucide-scan-text"
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
              </div>

              <aside v-if="previewDoc" class="docs-preview-pane">
                <div class="preview-toolbar">
                  <div class="preview-title-wrap">
                    <UIcon :name="getFileIcon(previewDoc.file_type)" class="size-4 shrink-0 opacity-70" />
                    <span class="preview-title">{{ previewDoc.name }}</span>
                  </div>
                  <CfButton
                    tone="icon"
                    icon="i-lucide-x"
                    :tip="t('kb.closePreview')"
                    @click="closeDocPreview"
                  />
                </div>
                <div class="preview-meta">
                  <UBadge size="sm" variant="subtle" :color="docStatusColor(previewDoc.status)">
                    {{ docStatusLabel(previewDoc.status) }}
                  </UBadge>
                  <span class="cf-muted">{{ t('kb.chunks') }} {{ previewDoc.chunk_count || 0 }}</span>
                  <span class="cf-muted">{{ formatFileSize(previewDoc.file_size) }}</span>
                </div>
                <div v-if="previewDoc.error" class="preview-error">{{ previewDoc.error }}</div>
                <div v-if="previewLoading" class="cf-state cf-state--compact">
                  <UIcon name="i-lucide-loader-circle" class="size-5 animate-spin" />
                  <span>{{ t('common.loading') }}</span>
                </div>
                <div v-else-if="!previewDoc.previewable" class="preview-empty">
                  <UIcon name="i-lucide-eye-off" class="size-7 opacity-50" />
                  <p>{{ previewDoc.preview_note || t('kb.previewUnsupported') }}</p>
                </div>
                <template v-else>
                  <p v-if="previewDoc.truncated" class="preview-truncated">{{ t('kb.previewTruncated') }}</p>
                  <div
                    v-if="previewDoc.file_type === 'md' || previewDoc.file_type === 'html'"
                    class="preview-body preview-body--md chat-markdown"
                    v-html="renderPreviewMarkdown(previewDoc.content)"
                  />
                  <pre v-else class="preview-body preview-body--plain">{{ previewDoc.content }}</pre>
                </template>
              </aside>
            </div>
          </template>

          <template #search>
            <div class="search-panel">
              <div class="search-row">
                <UInput
                  v-model="searchQuery"
                  class="search-input"
                  :placeholder="t('kb.searchPh')"
                  icon="i-lucide-search"
                  @keydown.enter.prevent="handleSearch"
                />
                <CfButton
                  tone="primary"
                  icon="i-lucide-search"
                  label-mode="tip"
                  :tip="t('kb.search')"
                  :loading="searchLoading"
                  @click="handleSearch"
                />
                <CfButton
                  tone="secondary"
                  icon="i-lucide-eraser"
                  label-mode="tip"
                  :tip="t('kb.clear')"
                  @click="clearSearch"
                />
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

    <!-- Upload Modal：选文件 → 分段配置/预览 → 确认上传 -->
    <CfModal
      v-model:open="uploadModalVisible"
      :title="uploadStep === 1 ? t('kb.uploadTitle') : t('kb.parseTitle')"
      :ui="{ content: uploadStep === 1 ? 'sm:max-w-lg' : 'sm:max-w-2xl' }"
    >
      <template #body>
        <div v-if="uploadStep === 1">
          <UFileUpload
            v-model="uploadFiles"
            multiple
            accept=".pdf,.txt,.md,.docx,.html"
            :label="t('kb.uploadLabel')"
            :description="t('kb.uploadDesc')"
            layout="list"
          />
        </div>
        <div v-else class="parse-step">
          <p class="parse-step__hint">{{ t('kb.parseHint', { n: uploadFiles?.length || 0 }) }}</p>
          <div class="parse-grid">
            <div class="field">
              <label class="field__label">{{ t('kb.splitMode') }}</label>
              <USelect
                v-model="parseForm.split_mode"
                :items="splitModeOptions"
                value-key="value"
                class="w-full"
              />
            </div>
            <div class="field">
              <label class="field__label">{{ t('kb.chunkSize') }}</label>
              <UInput v-model.number="parseForm.chunk_size" type="number" :min="64" :max="4000" />
            </div>
            <div class="field">
              <label class="field__label">{{ t('kb.chunkOverlap') }}</label>
              <UInput v-model.number="parseForm.chunk_overlap" type="number" :min="0" :max="2000" />
            </div>
            <div v-if="parseForm.split_mode === 'separator'" class="field">
              <label class="field__label">{{ t('kb.splitSeparator') }}</label>
              <UInput v-model="parseForm.split_separator" :placeholder="t('kb.splitSeparatorPh')" />
            </div>
          </div>
          <div class="parse-preview-actions">
            <CfButton
              tone="secondary"
              icon="i-lucide-eye"
              :loading="chunkPreviewLoading"
              :disabled="!uploadFiles?.length"
              @click="handlePreviewChunks"
            >
              {{ t('kb.previewChunks') }}
            </CfButton>
            <span v-if="chunkPreview" class="cf-muted">
              {{ t('kb.previewSummary', { total: chunkPreview.total_chunks, chars: chunkPreview.char_count }) }}
            </span>
          </div>
          <div v-if="chunkPreview?.chunks?.length" class="chunk-preview-list">
            <div
              v-for="chunk in chunkPreview.chunks"
              :key="chunk.index"
              class="chunk-preview-item"
            >
              <div class="chunk-preview-item__meta">
                #{{ chunk.index + 1 }} · {{ chunk.char_count }} {{ t('kb.chars') }}
              </div>
              <pre class="chunk-preview-item__body">{{ chunk.content }}</pre>
            </div>
          </div>
        </div>
      </template>

      <template #footer>
        <div class="modal-actions">
          <div class="modal-actions__left">
            <CfButton v-if="uploadStep === 2" tone="secondary" icon="i-lucide-arrow-left" @click="uploadStep = 1">
              {{ t('common.back') }}
            </CfButton>
          </div>
          <div class="modal-actions__right">
            <CfButton tone="secondary" icon="i-lucide-x" @click="handleUploadCancel">{{ t('common.cancel') }}</CfButton>
            <CfButton
              v-if="uploadStep === 1"
              tone="primary"
              icon="i-lucide-arrow-right"
              :disabled="!uploadFiles?.length"
              @click="goParseStep"
            >
              {{ t('kb.nextParse') }}
            </CfButton>
            <CfButton
              v-else
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
    </CfModal>

    <!-- Create folder -->
    <CfModal
      v-model:open="folderModalVisible"
      :title="t('kb.newFolder')"
      :ui="{ content: 'sm:max-w-md' }"
    >
      <template #body>
        <div class="field">
          <label class="field__label">{{ t('kb.folderName') }}</label>
          <UInput
            v-model="folderNameInput"
            class="w-full"
            :placeholder="t('kb.folderNamePh')"
            @keydown.enter.prevent="submitCreateFolder"
          />
        </div>
      </template>
      <template #footer>
        <div class="modal-actions">
          <div class="modal-actions__right">
            <CfButton tone="secondary" icon="i-lucide-x" @click="folderModalVisible = false">
              {{ t('common.cancel') }}
            </CfButton>
            <CfButton
              tone="primary"
              icon="i-lucide-plus"
              :loading="folderSubmitting"
              @click="submitCreateFolder"
            >
              {{ t('common.create') }}
            </CfButton>
          </div>
        </div>
      </template>
    </CfModal>

    <!-- Delete Doc confirm -->
    <CfModal v-model:open="deleteDocVisible" :title="t('common.deleteConfirm')" :ui="{ content: 'sm:max-w-md' }">
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
    </CfModal>
  </div>
</template>

<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'
import type {
  KnowledgeBase,
  KnowledgeFolder,
  Document,
  DocumentPreview,
  CreateKBInput,
  UpdateKBInput,
  SearchResult,
  ParseOptions,
  ChunkPreviewResponse,
} from '@/composables/useKnowledgeBases'
import { renderChatMarkdown } from '~/utils/chatMarkdown'

definePageMeta({
  layout: 'default',
})

const toast = useToast()
const { t, d } = useLocale()
const {
  listFolders,
  createFolder,
  listKBs,
  createKB,
  updateKB,
  deleteKB,
  listDocs,
  getDoc,
  uploadDoc,
  previewChunks,
  deleteDoc,
  reparseDoc,
  searchKB,
} = useKnowledgeBases()

const loading = ref(false)
const submitting = ref(false)
const knowledgeBases = ref<KnowledgeBase[]>([])
const folders = ref<KnowledgeFolder[]>([])
const dialogVisible = ref(false)
const dialogMode = ref<'create' | 'view' | 'edit'>('create')
const cameFromView = ref(false)
const editingId = ref('')
const viewingKB = ref<KnowledgeBase | null>(null)
const folderModalVisible = ref(false)
const folderNameInput = ref('')
const folderSubmitting = ref(false)

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

/** USelect 禁止空字符串 value；未分类 / 新建用哨兵 */
const NONE_FOLDER = '__none__'
const CREATE_FOLDER = '__create_folder__'

const form = reactive({
  name: '',
  description: '',
  folder_id: NONE_FOLDER as string,
  vector_db: 'pgvector',
  embedding_model: 'text-embedding-ada-002',
})
const errors = reactive({ name: '' })
/** 点「新建目录」前记下当前选项，取消时还原 */
const folderIdBeforeCreate = ref(NONE_FOLDER)

const folderSelectItems = computed(() => [
  { label: t('kb.noFolder'), value: NONE_FOLDER },
  ...folders.value.map((f) => ({ label: f.name, value: f.id })),
  { label: t('kb.newFolderInList'), value: CREATE_FOLDER, icon: 'i-lucide-plus' },
])

function resolvedFolderId(raw: string) {
  return !raw || raw === NONE_FOLDER || raw === CREATE_FOLDER ? '' : raw
}

function onFolderSelect(value: string) {
  if (value === CREATE_FOLDER) {
    const restore = folderIdBeforeCreate.value || NONE_FOLDER
    nextTick(() => {
      form.folder_id = restore
      openCreateFolder()
    })
    return
  }
  folderIdBeforeCreate.value = value || NONE_FOLDER
}

const folderNameById = computed(() => {
  const map = new Map<string, string>()
  for (const f of folders.value) map.set(f.id, f.name)
  return map
})

const kbGroups = computed(() => {
  const groups: { key: string; label: string; items: KnowledgeBase[] }[] = []
  const byFolder = new Map<string, KnowledgeBase[]>()
  const uncategorized: KnowledgeBase[] = []

  for (const kb of knowledgeBases.value) {
    if (kb.folder_id) {
      const list = byFolder.get(kb.folder_id) || []
      list.push(kb)
      byFolder.set(kb.folder_id, list)
    } else {
      uncategorized.push(kb)
    }
  }

  for (const f of folders.value) {
    const items = byFolder.get(f.id)
    if (items?.length) {
      groups.push({ key: f.id, label: f.name, items })
      byFolder.delete(f.id)
    }
  }
  // 目录已删但仍挂着 folder_id 的库
  for (const [fid, items] of byFolder) {
    groups.push({
      key: fid,
      label: folderNameById.value.get(fid) || t('kb.unknownFolder'),
      items,
    })
  }
  if (uncategorized.length || groups.length === 0) {
    groups.push({ key: '__none__', label: t('kb.noFolder'), items: uncategorized })
  }
  return groups
})

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
const previewDoc = ref<DocumentPreview | null>(null)
const previewLoading = ref(false)

watch(drawerVisible, (open) => {
  if (!open) closeDocPreview()
})

watch(drawerActiveTab, (tab) => {
  if (tab !== 'docs') closeDocPreview()
})

function renderPreviewMarkdown(content: string) {
  return renderChatMarkdown(content || '')
}

async function openDocPreview(doc: Document) {
  if (!selectedKB.value) return
  previewLoading.value = true
  previewDoc.value = {
    ...doc,
    content: '',
    previewable: false,
  }
  const res = await getDoc(selectedKB.value.id, doc.id)
  previewLoading.value = false
  if (res.error || !res.data) {
    toast.add({ title: res.error || t('kb.previewFail'), color: 'error' })
    return
  }
  previewDoc.value = res.data
}

function closeDocPreview() {
  previewDoc.value = null
  previewLoading.value = false
}

const deleteDocVisible = ref(false)
const deletingDocLoading = ref(false)
const deletingDoc = ref<Document | null>(null)

// Upload
const uploadModalVisible = ref(false)
const uploadFiles = ref<File[] | null>(null)
const uploadLoading = ref(false)
const uploadStep = ref<1 | 2>(1)
const chunkPreviewLoading = ref(false)
const chunkPreview = ref<ChunkPreviewResponse | null>(null)
const parseForm = reactive({
  chunk_size: 512,
  chunk_overlap: 50,
  split_mode: 'recursive',
  split_separator: '\\n\\n',
})
const splitModeOptions = computed(() => [
  { label: t('kb.splitRecursive'), value: 'recursive' },
  { label: t('kb.splitFixed'), value: 'fixed' },
  { label: t('kb.splitSeparator'), value: 'separator' },
])

function currentParseOptions(): ParseOptions {
  return {
    chunk_size: Number(parseForm.chunk_size) || 512,
    chunk_overlap: Number(parseForm.chunk_overlap) || 0,
    split_mode: parseForm.split_mode || 'recursive',
    split_separator:
      parseForm.split_mode === 'separator'
        ? parseForm.split_separator.replace(/\\n/g, '\n')
        : '\n\n',
  }
}

function resetUploadState() {
  uploadFiles.value = null
  uploadStep.value = 1
  chunkPreview.value = null
  chunkPreviewLoading.value = false
  parseForm.chunk_size = selectedKB.value?.chunk_size || 512
  parseForm.chunk_overlap = selectedKB.value?.chunk_overlap ?? 50
  parseForm.split_mode = selectedKB.value?.split_mode || 'recursive'
  const sep = selectedKB.value?.split_separator || '\n\n'
  parseForm.split_separator = sep === '\n\n' ? '\\n\\n' : sep
}

function goParseStep() {
  if (!uploadFiles.value?.length) {
    toast.add({ title: t('kb.needFiles'), color: 'warning' })
    return
  }
  chunkPreview.value = null
  uploadStep.value = 2
}

async function handlePreviewChunks() {
  if (!selectedKB.value || !uploadFiles.value?.length) return
  chunkPreviewLoading.value = true
  try {
    const res = await previewChunks(selectedKB.value.id, uploadFiles.value[0], currentParseOptions())
    if (res.error) {
      toast.add({ title: res.error, color: 'error' })
      return
    }
    chunkPreview.value = res.data || null
  } finally {
    chunkPreviewLoading.value = false
  }
}

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

const fetchFolders = async () => {
  const res = await listFolders()
  if (res.error) {
    toast.add({ title: res.error, color: 'error' })
    return
  }
  folders.value = res.data || []
}

const fetchKnowledgeBases = async () => {
  loading.value = true
  try {
    const [kbRes] = await Promise.all([listKBs(), fetchFolders()])
    if (kbRes.error) {
      toast.add({ title: kbRes.error, color: 'error' })
      return
    }
    knowledgeBases.value = kbRes.data || []
  } catch {
    toast.add({ title: t('kb.listFail'), color: 'error' })
  } finally {
    loading.value = false
  }
}

function openCreateFolder() {
  folderNameInput.value = ''
  folderModalVisible.value = true
}

async function submitCreateFolder() {
  const name = folderNameInput.value.trim()
  if (!name) {
    toast.add({ title: t('kb.folderNameRequired'), color: 'warning' })
    return
  }
  folderSubmitting.value = true
  try {
    const res = await createFolder(name)
    if (res.error || !res.data) {
      toast.add({ title: res.error || t('kb.folderCreateFail'), color: 'error' })
      return
    }
    folders.value = [...folders.value, res.data]
    form.folder_id = res.data.id
    folderIdBeforeCreate.value = res.data.id
    folderModalVisible.value = false
    toast.add({ title: t('kb.folderCreateOk'), color: 'success' })
  } finally {
    folderSubmitting.value = false
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
  closeDocPreview()
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
  form.folder_id = kb.folder_id || NONE_FOLDER
  folderIdBeforeCreate.value = form.folder_id
  form.vector_db = kb.vector_db || 'pgvector'
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

function openUploadModal() {
  resetUploadState()
  uploadModalVisible.value = true
}

const handleUploadCancel = () => {
  resetUploadState()
  uploadModalVisible.value = false
}

function clearSearch() {
  searchQuery.value = ''
  searchResults.value = []
  hasSearched.value = false
  searchDuration.value = 0
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
  if (!selectedKB.value) return
  if (!uploadFiles.value?.length) {
    toast.add({ title: t('kb.needFiles'), color: 'warning' })
    return
  }

  uploadLoading.value = true
  let successCount = 0
  let failCount = 0

  const opts = currentParseOptions()
  for (const file of uploadFiles.value) {
    const res = await uploadDoc(selectedKB.value!.id, file, opts)
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
    if (previewDoc.value?.id === deletingDoc.value.id) closeDocPreview()
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
        folder_id: resolvedFolderId(form.folder_id),
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
      const folderId = resolvedFolderId(form.folder_id)
      const input: CreateKBInput = {
        name: form.name,
        description: form.description,
        folder_id: folderId || undefined,
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
  form.folder_id = NONE_FOLDER
  folderIdBeforeCreate.value = NONE_FOLDER
  form.vector_db = 'pgvector'
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

.kb-sections {
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.kb-section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 12px;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--cf-ink);
}

.kb-section-count {
  font-size: 0.75rem;
  font-weight: 500;
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

.docs-workspace {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 280px;
}

.docs-workspace--preview {
  display: grid;
  grid-template-columns: minmax(240px, 0.95fr) minmax(280px, 1.2fr);
  gap: 14px;
  align-items: stretch;
}

@media (max-width: 900px) {
  .docs-workspace--preview {
    grid-template-columns: 1fr;
  }
}

.docs-list-pane {
  min-width: 0;
}

.docs-preview-pane {
  display: flex;
  flex-direction: column;
  min-height: 320px;
  max-height: min(70vh, 640px);
  border: 1px solid var(--cf-line);
  border-radius: 12px;
  background: color-mix(in srgb, var(--cf-ink) 2.5%, transparent);
  overflow: hidden;
}

.preview-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 12px;
  border-bottom: 1px solid var(--cf-line);
}

.preview-title-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.preview-title {
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--cf-ink);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.preview-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  font-size: 0.75rem;
  border-bottom: 1px solid var(--cf-line);
}

.preview-error {
  margin: 8px 12px 0;
  padding: 8px 10px;
  border-radius: 8px;
  font-size: 0.8rem;
  color: #b42318;
  background: color-mix(in srgb, #f04438 12%, transparent);
}

.preview-truncated {
  margin: 8px 12px 0;
  font-size: 0.75rem;
  color: var(--cf-ink-soft);
}

.preview-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 24px;
  color: var(--cf-ink-soft);
  text-align: center;
}

.preview-body {
  flex: 1;
  overflow: auto;
  padding: 14px 16px 18px;
  margin: 0;
}

.preview-body--md {
  font-size: 0.9rem;
  line-height: 1.65;
  color: var(--cf-ink);
}

.preview-body--plain {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.8rem;
  line-height: 1.55;
  white-space: pre-wrap;
  word-break: break-word;
  color: var(--cf-ink);
}

.cf-table-wrap {
  margin-top: 8px;
}

.doc-row {
  cursor: pointer;
}

.doc-row--active {
  background: color-mix(in srgb, var(--cf-accent) 10%, transparent);
}

.doc-name-cell {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.doc-name-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  max-width: 100%;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  text-align: left;
}

.doc-name-btn:hover .doc-name {
  color: var(--cf-accent);
  text-decoration: underline;
  text-underline-offset: 3px;
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
  padding: 4px 0 12px;
}

.search-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.search-input {
  flex: 1;
  min-width: 0;
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

.parse-step {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.parse-step__hint {
  margin: 0;
  font-size: 0.875rem;
  color: var(--cf-ink-soft);
}

.parse-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.parse-preview-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.chunk-preview-list {
  max-height: 280px;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
  border: 1px solid var(--cf-line);
  border-radius: 10px;
  padding: 10px;
}

.chunk-preview-item {
  padding: 8px 10px;
  border-radius: 8px;
  background: color-mix(in oklab, var(--cf-ink) 3%, transparent);
}

.chunk-preview-item__meta {
  font-size: 0.75rem;
  color: var(--cf-ink-soft);
  margin-bottom: 4px;
}

.chunk-preview-item__body {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 0.8125rem;
  line-height: 1.45;
  font-family: var(--font-mono, ui-monospace, monospace);
  color: var(--cf-ink);
}

@media (max-width: 640px) {
  .parse-grid {
    grid-template-columns: 1fr;
  }
}
</style>
