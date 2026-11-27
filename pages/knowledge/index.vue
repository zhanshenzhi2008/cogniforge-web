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
      <UInput
        v-model="listQuery"
        class="kb-list-search"
        icon="i-lucide-search"
        :placeholder="t('kb.listSearchPh')"
      />
      <span class="list-count">{{ t('kb.count', { n: filteredKnowledgeBases.length }) }}</span>
      <span class="list-hint">{{ t('kb.openDocsHint') }}</span>
    </div>

    <div v-if="loading" class="cf-state">
      <UIcon name="i-lucide-loader-circle" class="size-6 animate-spin" />
      <span>{{ t('common.loading') }}</span>
    </div>

    <div v-else-if="knowledgeBases.length === 0" class="cf-state">
      <UIcon :name="CF_ICONS.knowledge" class="size-8 opacity-50" />
      <p>{{ t('kb.empty') }}</p>
    </div>

    <div v-else-if="filteredKnowledgeBases.length === 0" class="cf-state">
      <UIcon name="i-lucide-search-x" class="size-8 opacity-50" />
      <p>{{ t('kb.listNoMatch') }}</p>
    </div>

    <div v-else class="kb-grid">
          <div
            v-for="kb in filteredKnowledgeBases"
            :key="kb.id"
            class="kb-card cf-surface"
            :title="t('kb.openDocsHint')"
            @click="openKnowledge(kb)"
          >
            <div class="kb-header">
              <div class="kb-name">
                <UIcon :name="CF_ICONS.knowledge" class="size-5 shrink-0" />
                <span>{{ kb.name }}</span>
                <UBadge
                  size="sm"
                  variant="subtle"
                  :color="kb.status === 'active' ? 'success' : 'neutral'"
                >
                  {{ kb.status === 'active' ? t('common.enabled') : t('common.disabled') }}
                </UBadge>
              </div>
              <div class="action-btns" @click.stop>
                <CfButton
                  tone="icon-accent"
                  icon="i-lucide-file-text"
                  :tip="t('kb.docsManage')"
                  @click="openKnowledge(kb)"
                />
                <CfButton
                  tone="icon-accent"
                  icon="i-lucide-pencil"
                  :tip="t('common.edit')"
                  @click="handleEdit(kb)"
                />
                <CfButton
                  tone="icon-danger"
                  icon="i-lucide-trash-2"
                  :tip="t('common.delete')"
                  @click="askDelete(kb)"
                />
              </div>
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
              <UIcon :name="CF_ICONS.knowledge" class="size-6" />
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
              :disabled="dialogMode === 'edit'"
              :portal="false"
              :ui="{ content: 'z-[10000]' }"
            />
          </div>

          <div class="field">
            <label class="field__label">{{ t('kb.embedding') }}</label>
            <USelect
              v-model="form.embedding_model"
              class="w-full"
              :portal="false"
              :disabled="dialogMode === 'edit'"
              :ui="{ content: 'z-[10000]' }"
              :items="embeddingModelOptions"
              :placeholder="t('kb.pickEmbedding')"
            />
            <p class="field__hint">{{ t('kb.embeddingLockHint') }}</p>
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
              <CfButton tone="secondary" @click="dialogVisible = false">
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

    <CfConfirmModal
      v-model:open="deleteVisible"
      :message="t('kb.deleteText', { name: deleting?.name ?? '' })"
      :loading="deletingLoading"
      @confirm="confirmDelete"
    />
  </div>
</template>

<script setup lang="ts">
import type {
  KnowledgeBase,
  CreateKBInput,
  UpdateKBInput,
} from '@/composables/useKnowledgeBases'
import { CF_ICONS } from '~/constants/icons'

definePageMeta({
  layout: 'default',
})

const toast = useToast()
const { t, d } = useLocale()
const {
  listKBs,
  createKB,
  updateKB,
  deleteKB,
} = useKnowledgeBases()

const loading = ref(false)
const submitting = ref(false)
const knowledgeBases = ref<KnowledgeBase[]>([])
const listQuery = ref('')
const filteredKnowledgeBases = computed(() => {
  const q = listQuery.value.trim().toLowerCase()
  if (!q) return knowledgeBases.value
  return knowledgeBases.value.filter((kb) => {
    const name = kb.name.toLowerCase()
    const desc = (kb.description || '').toLowerCase()
    return name.includes(q) || desc.includes(q)
  })
})
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
  vector_db: 'pgvector',
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

function validate() {
  errors.name = form.name.trim() ? '' : t('common.nameRequired')
  if (form.name.trim().length > 100) errors.name = t('common.nameTooLong')
  return !errors.name
}

const fetchKnowledgeBases = async () => {
  loading.value = true
  try {
    const kbRes = await listKBs()
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

const handleSubmit = async () => {
  if (!validate()) return

  submitting.value = true
  try {
    if (dialogMode.value === 'edit') {
      const input: UpdateKBInput = {
        name: form.name,
        description: form.description,
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
  form.vector_db = 'pgvector'
  form.embedding_model = 'text-embedding-ada-002'
  errors.name = ''
}

function openKnowledge(kb: KnowledgeBase) {
  navigateTo(`/knowledge/${kb.id}`)
}

const fillFormFromKB = (kb: KnowledgeBase) => {
  form.name = kb.name
  form.description = kb.description || ''
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

onMounted(() => {
  fetchKnowledgeBases()
})
</script>

<style scoped>
.cf-state--compact {
  min-height: 160px;
}

.list-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}

.kb-list-search {
  width: min(100%, 280px);
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

.kb-header .action-btns {
  flex-shrink: 0;
  opacity: 1;
  transition: opacity 0.15s ease;
}

/* 鼠标设备：悬停/焦点才显示操作图标，减少视觉噪音 */
@media (hover: hover) and (pointer: fine) {
  .kb-header .action-btns {
    opacity: 0;
    pointer-events: none;
  }

  .kb-card:hover .kb-header .action-btns,
  .kb-card:focus-within .kb-header .action-btns {
    opacity: 1;
    pointer-events: auto;
  }
}

.kb-name {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 1rem;
  color: var(--cf-ink);
  min-width: 0;
  flex: 1;
}

.kb-name > span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--cf-line);
  margin-bottom: 12px;
}

.upload-panel {
  margin-bottom: 16px;
  padding: 14px;
  border: 1px solid var(--cf-line);
  border-radius: 12px;
  background: color-mix(in srgb, var(--cf-ink) 2.5%, transparent);
}

.drawer-tabs-list {
  align-items: center;
}

.drawer-tabs-settings {
  margin-left: auto;
  flex-shrink: 0;
}

.upload-panel__head {
  display: flex;
  align-items: flex-start;
  margin-bottom: 14px;
}

.upload-stepper {
  flex: 1;
  min-width: 0;
}

.upload-stepper__list {
  display: flex;
  align-items: center;
  gap: 0;
  margin: 0;
  padding: 0;
  list-style: none;
}

.upload-stepper__item {
  flex: 0 1 auto;
  min-width: 0;
}

.upload-stepper__btn {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  max-width: 100%;
  margin: 0;
  padding: 6px 8px;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: var(--cf-ink-soft);
  text-align: left;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}

.upload-stepper__btn:hover:not(:disabled) {
  background: color-mix(in srgb, var(--cf-ink) 4%, transparent);
  color: var(--cf-ink);
}

.upload-stepper__btn:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--cf-accent, #0f9f8a) 55%, transparent);
  outline-offset: 2px;
}

.upload-stepper__btn:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.upload-stepper__index {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 28px;
  height: 28px;
  border-radius: 999px;
  border: 1.5px solid var(--cf-line);
  background: var(--cf-bg, #fff);
  color: var(--cf-ink-soft);
  font-size: 0.8125rem;
  font-weight: 600;
  line-height: 1;
}

.upload-stepper__text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  padding-top: 2px;
}

.upload-stepper__title {
  font-size: 0.875rem;
  font-weight: 600;
  line-height: 1.25;
  color: inherit;
}

.upload-stepper__desc {
  font-size: 0.75rem;
  line-height: 1.35;
  color: var(--cf-ink-soft);
  font-weight: 400;
}

.upload-stepper__item--on .upload-stepper__btn {
  color: var(--cf-ink);
}

.upload-stepper__item--on .upload-stepper__index {
  border-color: var(--cf-accent, #0f9f8a);
  background: var(--cf-accent, #0f9f8a);
  color: #fff;
}

.upload-stepper__item--done .upload-stepper__index {
  border-color: var(--cf-accent, #0f9f8a);
  background: color-mix(in srgb, var(--cf-accent, #0f9f8a) 16%, transparent);
  color: var(--cf-accent-ink, #087a6a);
}

.upload-stepper__item--done .upload-stepper__title {
  color: var(--cf-ink);
}

.upload-stepper__rail {
  flex: 1 1 48px;
  min-width: 24px;
  max-width: 120px;
  height: 2px;
  margin: 0 4px;
  align-self: center;
  border-radius: 999px;
  background: var(--cf-line);
}

.upload-stepper__item--done + .upload-stepper__rail {
  background: color-mix(in srgb, var(--cf-accent, #0f9f8a) 55%, var(--cf-line));
}

.upload-panel__actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 14px;
}

.upload-panel__actions-end {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}

.doc-pager {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 12px;
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

.docs-workspace--preview-max {
  grid-template-columns: 1fr;
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

.docs-preview-pane--max {
  min-height: min(78vh, 820px);
  max-height: min(82vh, 900px);
}

.preview-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 12px;
  border-bottom: 1px solid var(--cf-line);
}

.preview-toolbar__actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.preview-mode-switch {
  display: inline-flex;
  padding: 2px;
  border-radius: 8px;
  border: 1px solid var(--cf-line);
  background: color-mix(in srgb, var(--cf-ink) 4%, transparent);
}

.preview-mode-btn {
  border: 0;
  background: transparent;
  color: var(--cf-ink-soft);
  font-size: 0.75rem;
  line-height: 1;
  padding: 6px 10px;
  border-radius: 6px;
  cursor: pointer;
}

.preview-mode-btn--active {
  background: var(--cf-nav-surface, var(--ui-bg, #fff));
  color: var(--cf-ink);
  box-shadow: 0 1px 2px color-mix(in srgb, #0b1220 12%, transparent);
}

.preview-dirty {
  color: #b54708;
  font-weight: 600;
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

.preview-editor {
  flex: 1;
  min-height: 200px;
  width: 100%;
  border: 0;
  resize: none;
  padding: 14px 16px;
  margin: 0;
  background: transparent;
  color: var(--cf-ink);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.82rem;
  line-height: 1.55;
  outline: none;
}

.preview-edit-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border-top: 1px solid var(--cf-line);
  background: color-mix(in srgb, var(--cf-ink) 3%, transparent);
}

.preview-edit-bar__actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
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
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 4px 0 12px;
}

.search-textarea {
  width: 100%;
}

.search-textarea :deep(textarea) {
  min-height: 96px;
  line-height: 1.5;
  resize: vertical;
}

.search-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
}

.search-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
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
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--cf-ink);
}

.field__help {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--cf-muted, #64748b);
  cursor: help;
  line-height: 1;
}

.field__help:hover,
.field__help:focus-visible {
  color: var(--cf-ink);
  outline: none;
}

.field__error {
  margin: 0;
  font-size: 0.75rem;
  color: var(--cf-danger);
}

.field__hint {
  margin: 0;
  font-size: 0.75rem;
  line-height: 1.45;
  color: var(--cf-muted, #64748b);
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

.upload-file-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.upload-file-list__item {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 0.8125rem;
  color: var(--cf-ink-soft);
}

.upload-file-list__name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--cf-ink);
}

.upload-file-list__item--bad .upload-file-list__name,
.upload-file-list__item--bad {
  color: var(--cf-danger);
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

.search-params {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.field--compact {
  min-width: 140px;
  flex: 0 0 auto;
}

.search-param-input {
  width: 120px;
}

.settings-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding-top: 4px;
}

.settings-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px;
  border: 1px solid var(--cf-line);
  border-radius: 10px;
}

.settings-section__title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--cf-ink);
}

.settings-section__desc,
.settings-note {
  margin: 0;
  font-size: 0.8125rem;
  color: var(--cf-ink-soft);
  line-height: 1.45;
}

.settings-actions {
  display: flex;
  justify-content: flex-end;
}
</style>
