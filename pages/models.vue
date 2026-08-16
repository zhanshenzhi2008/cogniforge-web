<template>
  <div class="cf-page models-page">
    <div class="cf-page-header">
      <div class="cf-page-heading">
        <h1 class="cf-page-title">{{ t('models.title') }}</h1>
        <p class="cf-page-sub">{{ t('models.sub') }}</p>
      </div>
      <div class="header-actions">
        <div class="view-toggle" role="group" :aria-label="t('models.viewMode')">
          <CfButton
            :tone="viewMode === 'card' ? 'icon-accent' : 'icon'"
            icon="i-lucide-layout-grid"
            :tip="t('models.cards')"
            @click="setViewMode('card')"
          />
          <CfButton
            :tone="viewMode === 'list' ? 'icon-accent' : 'icon'"
            icon="i-lucide-list"
            :tip="t('models.list')"
            @click="setViewMode('list')"
          />
        </div>
        <CfButton tone="primary" icon="i-lucide-plus" @click="handleCreate">
          {{ t('models.add') }}
        </CfButton>
      </div>
    </div>

    <!-- Active provider — one-line strip -->
    <div v-if="activeProvider" class="active-strip">
      <span class="active-strip-label">{{ t('models.active') }}</span>
      <span class="active-strip-icon">{{ getProviderMeta(activeProvider.provider)?.icon }}</span>
      <span class="active-strip-name">{{ activeProvider.name }}</span>
      <span class="active-strip-sep">·</span>
      <span class="active-strip-model">{{ activeProvider.default_model }}</span>
      <span class="active-strip-sep">·</span>
      <span :class="['status-badge', activeProvider.status]">
        <span class="dot" />{{ statusLabel(activeProvider.status) }}
      </span>
      <UBadge
        size="sm"
        variant="subtle"
        :color="activeProvider.is_default ? 'warning' : 'success'"
        class="active-strip-badge"
      >
        {{ activeProvider.is_default ? t('models.default') : t('models.firstEnabled') }}
      </UBadge>
      <div class="active-strip-actions">
        <CfButton tone="icon-accent" icon="i-lucide-pencil" :tip="t('common.edit')" @click="handleEdit(activeProvider)" />
        <CfButton tone="icon" icon="i-lucide-refresh-cw" :tip="t('models.test')" @click="handleTest(activeProvider.id)" />
      </div>
    </div>

    <div v-else class="no-active-strip">
      {{ t('models.noActive') }}
      <CfButton tone="primary" icon="i-lucide-plus" @click="handleCreate">{{ t('models.add') }}</CfButton>
    </div>

    <div class="list-toolbar">
      <span class="list-count">{{ t('models.count', { n: providers.length }) }}</span>
      <span class="list-hint">{{ t('models.hint') }}</span>
    </div>

    <div v-if="loading" class="cf-panel">
      <div class="cf-state">
        <UIcon name="i-lucide-loader-circle" class="size-6 animate-spin" />
        <span>{{ t('common.loading') }}</span>
      </div>
    </div>

    <div v-else-if="providers.length === 0" class="cf-panel">
      <div class="cf-state">
        <UIcon name="i-lucide-boxes" class="size-8 opacity-50" />
        <p>{{ t('models.empty') }}</p>
      </div>
    </div>

    <!-- Card view (default): compact 3–4+ columns -->
    <div v-else-if="viewMode === 'card'" class="provider-grid">
      <div
        v-for="p in providers"
        :key="p.id"
        class="provider-card"
        :class="{
          'is-enabled': p.is_enabled,
          'is-default': p.is_default,
          'is-error': p.status === 'error',
        }"
        :title="t('models.hint')"
        @dblclick="handleView(p)"
      >
        <div class="provider-card-top">
          <div class="provider-cell">
            <span
              class="provider-icon"
              :style="{ background: getProviderMeta(p.provider)?.color + '18', color: getProviderMeta(p.provider)?.color }"
            >
              {{ getProviderMeta(p.provider)?.icon }}
            </span>
            <div class="provider-cell-text">
              <div class="provider-name-row">
                <span class="provider-name" :title="p.name">{{ p.name }}</span>
                <UBadge v-if="p.is_default" size="sm" variant="subtle" color="warning">{{ t('models.default') }}</UBadge>
              </div>
              <span class="provider-type">{{ getProviderMeta(p.provider)?.label || p.provider }}</span>
            </div>
          </div>
        </div>

        <div class="provider-card-meta">
          <code class="model-code" :title="p.default_model || ''">{{ p.default_model || '—' }}</code>
          <span :class="['status-badge', p.status]" :title="p.status === 'error' ? p.last_error || '' : undefined">
            <span class="dot" />{{ statusLabel(p.status) }}
          </span>
        </div>
        <div class="provider-card-url cf-muted" :title="p.base_url || ''">{{ p.base_url || '—' }}</div>

        <div class="provider-card-footer" @dblclick.stop>
          <USwitch
            :model-value="p.is_enabled"
            size="sm"
            @update:model-value="handleToggleEnable(p)"
          />
          <div class="action-btns">
            <CfButton
              v-if="!p.is_default"
              tone="icon"
              icon="i-lucide-star"
              :tip="t('models.setDefault')"
              :loading="settingDefaultId === p.id"
              @click="handleSetDefault(p.id)"
            />
            <CfButton tone="icon" icon="i-lucide-refresh-cw" :tip="t('models.test')" @click="handleTest(p.id)" />
            <CfButton tone="icon-accent" icon="i-lucide-pencil" :tip="t('common.edit')" @click="handleEdit(p)" />
            <CfButton tone="icon-danger" icon="i-lucide-trash-2" :tip="t('common.delete')" @click="askDelete(p)" />
          </div>
        </div>
      </div>
    </div>

    <!-- List view -->
    <div v-else class="cf-panel">
      <div class="cf-table-wrap">
        <table class="cf-data-table">
          <thead>
            <tr>
              <th>{{ t('models.provider') }}</th>
              <th>{{ t('common.model') }}</th>
              <th>{{ t('common.status') }}</th>
              <th>Base URL</th>
              <th>{{ t('models.enable') }}</th>
              <th class="cf-col-actions actions-col">{{ t('common.actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="p in providers"
              :key="p.id"
              class="list-row"
              :class="{
                'row-default': p.is_default,
                'row-error': p.status === 'error',
              }"
              :title="t('models.hint')"
              @dblclick="handleView(p)"
            >
              <td>
                <div class="provider-cell">
                  <span
                    class="provider-icon"
                    :style="{ background: getProviderMeta(p.provider)?.color + '18', color: getProviderMeta(p.provider)?.color }"
                  >
                    {{ getProviderMeta(p.provider)?.icon }}
                  </span>
                  <div class="provider-cell-text">
                    <div class="provider-name-row">
                      <span class="provider-name">{{ p.name }}</span>
                      <UBadge v-if="p.is_default" size="sm" variant="subtle" color="warning">{{ t('models.default') }}</UBadge>
                    </div>
                    <span class="provider-type">{{ getProviderMeta(p.provider)?.label || p.provider }}</span>
                  </div>
                </div>
              </td>
              <td>
                <code class="model-code">{{ p.default_model || '—' }}</code>
              </td>
              <td>
                <span :class="['status-badge', p.status]" :title="p.status === 'error' ? p.last_error || '' : undefined">
                  <span class="dot" />{{ statusLabel(p.status) }}
                </span>
              </td>
              <td class="cf-muted url-cell" :title="p.base_url || ''">{{ p.base_url || '—' }}</td>
              <td @dblclick.stop>
                <USwitch
                  :model-value="p.is_enabled"
                  size="sm"
                  @update:model-value="handleToggleEnable(p)"
                />
              </td>
              <td @dblclick.stop>
                <div class="action-btns">
                  <CfButton
                    v-if="!p.is_default"
                    tone="icon"
                    icon="i-lucide-star"
                    :tip="t('models.setDefault')"
                    :loading="settingDefaultId === p.id"
                    @click="handleSetDefault(p.id)"
                  />
                  <CfButton tone="icon" icon="i-lucide-refresh-cw" :tip="t('models.test')" @click="handleTest(p.id)" />
                  <CfButton tone="icon-accent" icon="i-lucide-pencil" :tip="t('common.edit')" @click="handleEdit(p)" />
                  <CfButton tone="icon-danger" icon="i-lucide-trash-2" :tip="t('common.delete')" @click="askDelete(p)" />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Add / view / edit (same modal) -->
    <UModal
      v-model:open="dialogVisible"
      :title="dialogTitle"
      :description="dialogDescription"
      :ui="{ content: 'sm:max-w-xl' }"
    >
      <template #body>
        <!-- View: read-only detail sheet -->
        <div v-if="dialogMode === 'view' && viewingProvider" class="detail-sheet">
          <div class="detail-hero">
            <span
              class="detail-hero-icon"
              :style="{
                background: getProviderMeta(viewingProvider.provider)?.color + '18',
                color: getProviderMeta(viewingProvider.provider)?.color,
              }"
            >
              {{ getProviderMeta(viewingProvider.provider)?.icon }}
            </span>
            <div class="detail-hero-text">
              <div class="detail-hero-name">{{ viewingProvider.name }}</div>
              <div class="detail-hero-sub">
                {{ getProviderMeta(viewingProvider.provider)?.label || viewingProvider.provider }}
                <span class="active-strip-sep">·</span>
                <span :class="['status-badge', viewingProvider.status]">
                  <span class="dot" />{{ statusLabel(viewingProvider.status) }}
                </span>
              </div>
              <div class="detail-hero-badges">
                <UBadge v-if="viewingProvider.is_default" size="sm" variant="subtle" color="warning">{{ t('models.default') }}</UBadge>
                <UBadge
                  size="sm"
                  variant="subtle"
                  :color="viewingProvider.is_enabled ? 'success' : 'neutral'"
                >
                  {{ viewingProvider.is_enabled ? t('models.enabledOn') : t('models.enabledOff') }}
                </UBadge>
              </div>
            </div>
          </div>

          <dl class="detail-list">
            <div class="detail-row">
              <dt>{{ t('models.defaultModel') }}</dt>
              <dd><code class="model-code">{{ viewingProvider.default_model || '—' }}</code></dd>
            </div>
            <div class="detail-row">
              <dt>Base URL</dt>
              <dd class="detail-mono">{{ viewingProvider.base_url || '—' }}</dd>
            </div>
            <div class="detail-row">
              <dt>API Key</dt>
              <dd class="detail-mono">{{ maskApiKey(viewingProvider.api_key) }}</dd>
            </div>
            <div class="detail-row">
              <dt>{{ t('models.priority') }}</dt>
              <dd>{{ viewingProvider.priority }}</dd>
            </div>
            <div v-if="viewingProvider.extra_headers" class="detail-row detail-row--block">
              <dt>Extra Headers</dt>
              <dd>
                <pre class="detail-pre">{{ formatExtraHeaders(viewingProvider.extra_headers) }}</pre>
              </dd>
            </div>
            <div class="detail-row">
              <dt>{{ t('models.lastTest') }}</dt>
              <dd>{{ d(viewingProvider.last_test_at) }}</dd>
            </div>
            <div v-if="viewingProvider.status === 'error' && viewingProvider.last_error" class="detail-row detail-row--block">
              <dt>{{ t('models.lastError') }}</dt>
              <dd class="detail-error">{{ viewingProvider.last_error }}</dd>
            </div>
            <div class="detail-row">
              <dt>{{ t('common.createdAt') }}</dt>
              <dd>{{ d(viewingProvider.created_at) }}</dd>
            </div>
            <div class="detail-row">
              <dt>{{ t('common.updatedAt') }}</dt>
              <dd>{{ d(viewingProvider.updated_at) }}</dd>
            </div>
          </dl>
        </div>

        <!-- Create / Edit form -->
        <form v-else id="provider-form" class="form-grid" @submit.prevent="handleSubmit">
          <div class="field">
            <label class="field__label">{{ t('models.providerType') }}</label>
            <div class="provider-type-grid" :class="{ 'is-locked': dialogMode === 'edit' }">
              <div
                v-for="[key, meta] in Object.entries(PROVIDER_META)"
                :key="key"
                class="provider-type-option"
                :class="{ active: form.provider === key, disabled: dialogMode === 'edit' && form.provider !== key }"
                @click="dialogMode === 'create' && selectProvider(key)"
              >
                <span class="option-icon">{{ meta.icon }}</span>
                <span class="option-label" :class="meta.local ? 'local-hint' : ''">{{ meta.label }}</span>
                <span v-if="meta.local" class="local-badge">{{ t('models.local') }}</span>
              </div>
            </div>
            <p v-if="errors.provider" class="field__error">{{ errors.provider }}</p>
            <p v-if="dialogMode === 'edit'" class="field__hint">{{ t('models.typeLocked') }}</p>
          </div>

          <div class="field">
            <label class="field__label">{{ t('models.configName') }}</label>
            <UInput
              v-model="form.name"
              class="w-full"
              :placeholder="t('models.configNamePh')"
              :color="errors.name ? 'error' : undefined"
              @update:model-value="errors.name = ''"
            />
            <p v-if="errors.name" class="field__error">{{ errors.name }}</p>
          </div>

          <div class="field">
            <label class="field__label">API Key</label>
            <UInput
              v-model="form.api_key"
              class="w-full"
              type="password"
              :placeholder="dialogMode === 'edit' ? t('models.keyKeep') : t('models.keyPh')"
              :color="errors.api_key ? 'error' : undefined"
              @update:model-value="errors.api_key = ''"
            />
            <p v-if="errors.api_key" class="field__error">{{ errors.api_key }}</p>
          </div>

          <div class="field">
            <label class="field__label">Base URL</label>
            <UInput
              v-model="form.base_url"
              class="w-full"
              :placeholder="t('models.baseDefault', { url: form.provider ? PROVIDER_META[form.provider]?.defaultBaseURL : '' })"
            />
          </div>

          <div class="field">
            <label class="field__label">{{ t('models.defaultModel') }}</label>
            <USelect
              v-if="suggestedModelItems.length"
              :model-value="form.default_model"
              :items="suggestedModelItems"
              value-key="value"
              class="w-full"
              @update:model-value="form.default_model = $event"
            />
            <UInput
              v-else
              v-model="form.default_model"
              class="w-full"
              :placeholder="t('models.modelPh')"
            />
            <p v-if="form.provider === 'deepseek'" class="field__hint">{{ t('models.deepseekHint') }}</p>
          </div>

          <div v-if="form.provider === 'openrouter'" class="field">
            <label class="field__label">Extra Headers</label>
            <UTextarea
              v-model="form.extra_headers_raw"
              class="w-full"
              :rows="3"
              placeholder='{"HTTP-Referer": "https://your-site.com", "X-OpenRouter-Title": "Your App"}'
            />
            <p class="field__hint">
              {{ t('models.headersHint') }}
            </p>
          </div>

          <div class="field">
            <label class="field__label">{{ t('models.priority') }}</label>
            <UInput
              v-model.number="form.priority"
              class="w-full"
              type="number"
              :min="0"
              :max="100"
            />
            <p class="field__hint">{{ t('models.priorityHint') }}</p>
          </div>
        </form>
      </template>

      <template #footer>
        <div class="modal-actions" :class="{ 'modal-actions--view': dialogMode === 'view' }">
          <template v-if="dialogMode === 'view'">
            <div class="modal-actions__right">
              <CfButton
                tone="secondary"
                icon="i-lucide-refresh-cw"
                @click="viewingProvider && handleTest(viewingProvider.id)"
              >
                {{ t('models.test') }}
              </CfButton>
              <CfButton tone="primary" icon="i-lucide-pencil" @click="enterEditFromView">
                {{ t('common.edit') }}
              </CfButton>
            </div>
          </template>
          <template v-else>
            <div class="modal-actions__left">
              <CfButton
                v-if="dialogMode === 'edit'"
                tone="secondary"
                icon="i-lucide-arrow-left"
                @click="dialogMode = 'view'"
              >
                {{ t('common.detail') }}
              </CfButton>
            </div>
            <div class="modal-actions__right">
              <CfButton tone="secondary" icon="i-lucide-x" @click="dialogVisible = false">{{ t('common.cancel') }}</CfButton>
              <CfButton
                form="provider-form"
                type="submit"
                tone="primary"
                :icon="dialogMode === 'edit' ? 'i-lucide-check' : 'i-lucide-plus'"
                :loading="submitting"
              >
                {{ dialogMode === 'edit' ? t('common.save') : t('common.add') }}
              </CfButton>
            </div>
          </template>
        </div>
      </template>
    </UModal>

    <!-- Connection test result -->
    <UModal v-model:open="testModalVisible" :title="t('models.testTitle')" :ui="{ content: 'sm:max-w-md' }">
      <template #body>
        <div class="test-result">
          <div v-if="testLoading" class="test-loading">
            <UIcon name="i-lucide-loader-circle" class="size-10 animate-spin" />
            <span>{{ t('models.testing') }}</span>
          </div>
          <div v-else-if="testResult" class="test-result-body">
            <div class="result-icon" :class="testResult.success ? 'success' : 'error'">
              <UIcon
                :name="testResult.success ? 'i-lucide-check-circle' : 'i-lucide-alert-circle'"
                class="size-12"
              />
            </div>
            <p class="result-message">{{ testResult.message }}</p>
            <p v-if="testResult.latency_ms" class="result-latency">
              {{ t('models.latency', { ms: testResult.latency_ms }) }}
            </p>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="modal-actions">
          <div class="modal-actions__right">
            <CfButton tone="primary" icon="i-lucide-refresh-cw" @click="reTest">{{ t('models.retest') }}</CfButton>
          </div>
        </div>
      </template>
    </UModal>

    <!-- Delete confirm -->
    <UModal v-model:open="deleteVisible" :title="t('common.deleteConfirm')" :ui="{ content: 'sm:max-w-md' }">
      <template #body>
        <p class="delete-text">
          {{ t('models.deleteText', { name: deleting?.name ?? '' }) }}
        </p>
      </template>
      <template #footer>
        <div class="modal-actions">
          <div class="modal-actions__right">
            <CfButton tone="secondary" icon="i-lucide-x" @click="deleteVisible = false">{{ t('common.cancel') }}</CfButton>
            <CfButton tone="danger" strong icon="i-lucide-trash-2" :loading="deletingLoading" @click="confirmDelete">
              {{ t('common.delete') }}
            </CfButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import {
  useProviders,
  PROVIDER_META,
  type AIProvider,
  type CreateProviderInput,
  type UpdateProviderInput,
  type TestResult,
} from '@/composables/useProviders'

definePageMeta({ layout: 'default' })

const toast = useToast()
const { t, d } = useLocale()
const { list, getActive, create, update, remove, setDefault, test } = useProviders()

const loading = ref(false)
const submitting = ref(false)
const providers = ref<AIProvider[]>([])
const activeProvider = ref<AIProvider | null>(null)
const dialogVisible = ref(false)
const dialogMode = ref<'create' | 'view' | 'edit'>('create')
const editingId = ref('')
const viewingProvider = ref<AIProvider | null>(null)

type ModelsViewMode = 'card' | 'list'
const VIEW_STORAGE_KEY = 'cf-models-view'
const viewMode = ref<ModelsViewMode>('card')

const dialogTitle = computed(() => {
  if (dialogMode.value === 'create') return t('models.createTitle')
  if (dialogMode.value === 'view') return t('models.viewTitle')
  return t('models.editTitle')
})

const dialogDescription = computed(() => {
  if (dialogMode.value === 'create') return t('models.createDesc')
  if (dialogMode.value === 'view') return t('models.viewDesc')
  return t('models.editDesc')
})

function setViewMode(mode: ModelsViewMode) {
  viewMode.value = mode
  if (import.meta.client) {
    localStorage.setItem(VIEW_STORAGE_KEY, mode)
  }
}

const deleteVisible = ref(false)
const deletingLoading = ref(false)
const deleting = ref<AIProvider | null>(null)

const settingDefaultId = ref('')
const testModalVisible = ref(false)
const testLoading = ref(false)
const testResult = ref<TestResult | null>(null)
const testingProviderId = ref('')

const form = reactive({
  provider: 'openai',
  name: '',
  api_key: '',
  base_url: '',
  default_model: '',
  extra_headers_raw: '',
  priority: 10,
})

const errors = reactive({
  provider: '',
  name: '',
  api_key: '',
})

function getProviderMeta(key: string) {
  return PROVIDER_META[key]
}

function statusLabel(status: string): string {
  if (status === 'active' || status === 'error' || status === 'testing') {
    return t(`status.${status}`)
  }
  return status
}

function maskApiKey(key?: string) {
  if (!key) return '—'
  if (/[*•]/.test(key)) return key
  if (key.length <= 8) return '••••••••'
  return `${key.slice(0, 3)}••••${key.slice(-4)}`
}

function formatExtraHeaders(headers: Record<string, any> | null) {
  if (!headers) return '—'
  try {
    return JSON.stringify(headers, null, 2)
  } catch {
    return String(headers)
  }
}

function selectProvider(key: string) {
  form.provider = key
  form.base_url = PROVIDER_META[key]?.defaultBaseURL || ''
  const suggested = PROVIDER_META[key]?.suggestedModels
  if (dialogMode.value === 'create' && suggested?.length) {
    form.default_model = suggested[0].value
  }
  errors.provider = ''
}

const suggestedModelItems = computed(() => PROVIDER_META[form.provider]?.suggestedModels || [])

function validate() {
  errors.provider = form.provider ? '' : t('models.needType')
  errors.name = form.name.trim() ? '' : t('models.needName')
  if (dialogMode.value === 'create') {
    errors.api_key = form.api_key.trim() ? '' : t('models.needKey')
  } else {
    errors.api_key = ''
  }
  return !errors.provider && !errors.name && !errors.api_key
}

function fillFormFromProvider(p: AIProvider) {
  form.provider = p.provider
  form.name = p.name
  form.api_key = ''
  form.base_url = p.base_url || ''
  form.default_model = p.default_model || ''
  form.priority = p.priority
  if (p.extra_headers) {
    try {
      form.extra_headers_raw = JSON.stringify(p.extra_headers, null, 2)
    } catch {
      form.extra_headers_raw = ''
    }
  } else {
    form.extra_headers_raw = ''
  }
  errors.provider = ''
  errors.name = ''
  errors.api_key = ''
}

const handleCreate = () => {
  dialogMode.value = 'create'
  editingId.value = ''
  viewingProvider.value = null
  resetForm()
  dialogVisible.value = true
}

const handleView = (p: AIProvider) => {
  dialogMode.value = 'view'
  viewingProvider.value = p
  editingId.value = p.id
  fillFormFromProvider(p)
  dialogVisible.value = true
}

const handleEdit = (p: AIProvider) => {
  dialogMode.value = 'edit'
  viewingProvider.value = p
  editingId.value = p.id
  fillFormFromProvider(p)
  dialogVisible.value = true
}

const enterEditFromView = () => {
  if (!viewingProvider.value) return
  dialogMode.value = 'edit'
  fillFormFromProvider(viewingProvider.value)
}

const askDelete = (p: AIProvider) => {
  deleting.value = p
  deleteVisible.value = true
}

const confirmDelete = async () => {
  if (!deleting.value) return
  deletingLoading.value = true
  try {
    const res = await remove(deleting.value.id)
    if (res.error) {
      toast.add({ title: res.error, color: 'error' })
      return
    }
    toast.add({ title: t('common.deleteOk'), color: 'success' })
    deleteVisible.value = false
    await fetchAll()
  } finally {
    deletingLoading.value = false
  }
}

const handleToggleEnable = async (p: AIProvider) => {
  const newEnabled = !p.is_enabled
  const input: UpdateProviderInput = { is_enabled: newEnabled }
  const res = await update(p.id, input)
  if (res.error) {
    toast.add({ title: res.error, color: 'error' })
    return
  }
  toast.add({ title: newEnabled ? t('models.enabledToast') : t('models.disabledToast'), color: 'success' })
  await fetchAll()
}

const handleSetDefault = async (id: string) => {
  settingDefaultId.value = id
  try {
    const res = await setDefault(id)
    if (res.error) {
      toast.add({ title: res.error, color: 'error' })
      return
    }
    toast.add({ title: t('models.defaultToast'), color: 'success' })
    await fetchAll()
  } finally {
    settingDefaultId.value = ''
  }
}

const handleTest = async (id: string) => {
  testingProviderId.value = id
  testResult.value = null
  testModalVisible.value = true
  testLoading.value = true
  const res = await test(id)
  testLoading.value = false
  if (res.error) {
    testResult.value = { success: false, message: res.error, latency_ms: 0 }
  } else if (res.data) {
    testResult.value = res.data
  }
}

const reTest = async () => {
  if (testingProviderId.value) {
    await handleTest(testingProviderId.value)
  }
}

const handleSubmit = async () => {
  if (!validate()) return

  submitting.value = true
  try {
    let extraHeaders: Record<string, any> | undefined
    if (form.extra_headers_raw.trim()) {
      try {
        extraHeaders = JSON.parse(form.extra_headers_raw)
      } catch {
        toast.add({ title: t('models.headersBad'), color: 'error' })
        return
      }
    }

    if (dialogMode.value === 'edit') {
      const input: UpdateProviderInput = {
        name: form.name,
        base_url: form.base_url,
        api_key: form.api_key || undefined,
        default_model: form.default_model,
        extra_headers: extraHeaders,
        priority: form.priority,
      }
      const res = await update(editingId.value, input)
      if (res.error) {
        toast.add({ title: res.error, color: 'error' })
        return
      }
      toast.add({ title: t('common.saveOk'), color: 'success' })
    } else {
      const input: CreateProviderInput = {
        provider: form.provider,
        name: form.name,
        api_key: form.api_key,
        base_url: form.base_url,
        default_model: form.default_model,
        extra_headers: extraHeaders,
        priority: form.priority,
      }
      const res = await create(input)
      if (res.error) {
        toast.add({ title: res.error, color: 'error' })
        return
      }
      toast.add({ title: t('models.addOk'), color: 'success' })
    }
    dialogVisible.value = false
    await fetchAll()
  } catch {
    toast.add({ title: dialogMode.value === 'edit' ? t('common.saveFail') : t('models.addFail'), color: 'error' })
  } finally {
    submitting.value = false
  }
}

const resetForm = () => {
  form.provider = 'openai'
  form.name = ''
  form.api_key = ''
  form.base_url = PROVIDER_META['openai']?.defaultBaseURL || ''
  form.default_model = ''
  form.extra_headers_raw = ''
  form.priority = 10
  errors.provider = ''
  errors.name = ''
  errors.api_key = ''
}

const fetchAll = async () => {
  loading.value = true
  try {
    const [listRes, activeRes] = await Promise.all([list(), getActive()])
    if (listRes.error) {
      toast.add({ title: listRes.error, color: 'error' })
      return
    }
    providers.value = listRes.data || []
    activeProvider.value = activeRes.data || null
  } catch {
    toast.add({ title: t('models.listFail'), color: 'error' })
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (import.meta.client) {
    const saved = localStorage.getItem(VIEW_STORAGE_KEY)
    if (saved === 'card' || saved === 'list') {
      viewMode.value = saved
    }
  }
  fetchAll()
})
</script>

<style scoped>
.models-page {
  max-width: 1360px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.view-toggle {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px;
  border-radius: 10px;
  border: 1px solid var(--cf-line);
  background: var(--cf-nav-surface, var(--cf-bg-elevated));
}

.list-count {
  font-size: 0.8rem;
  color: var(--cf-ink-soft);
  letter-spacing: 0.01em;
}

.list-hint {
  font-size: 0.75rem;
  color: var(--cf-ink-soft);
  opacity: 0.85;
}

.provider-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
  gap: 12px;
}

.provider-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid var(--cf-line);
  background: var(--cf-nav-surface, var(--cf-bg-elevated));
  min-width: 0;
  cursor: pointer;
  transition: border-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease;
}

.provider-card:hover {
  border-color: color-mix(in oklab, var(--cf-accent) 35%, var(--cf-line));
  transform: translateY(-1px);
}

.provider-card:focus-visible {
  outline: 2px solid var(--cf-accent);
  outline-offset: 2px;
}

.list-row {
  cursor: pointer;
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
  font-size: 22px;
  flex-shrink: 0;
}

.detail-hero-text {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
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
  font-size: 0.85rem;
  color: var(--cf-ink-soft);
}

.detail-hero-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 4px;
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

.detail-mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.82rem;
}

.detail-pre {
  margin: 0;
  padding: 10px 12px;
  border-radius: 8px;
  background: color-mix(in oklab, var(--cf-ink) 4%, transparent);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.78rem;
  white-space: pre-wrap;
  word-break: break-word;
  color: var(--cf-ink);
}

.detail-error {
  color: var(--cf-danger);
  font-size: 0.85rem;
  line-height: 1.45;
}

.provider-type-grid.is-locked .provider-type-option.disabled {
  opacity: 0.35;
  pointer-events: none;
}

.provider-type-grid.is-locked .provider-type-option:not(.active) {
  cursor: default;
}

.provider-card.is-enabled {
  border-color: color-mix(in oklab, var(--cf-accent) 28%, var(--cf-line));
}

.provider-card.is-default {
  box-shadow: inset 3px 0 0 var(--cf-accent);
}

.provider-card.is-error {
  border-color: color-mix(in oklab, var(--cf-danger) 35%, var(--cf-line));
  background: color-mix(in oklab, var(--cf-danger) 4%, var(--cf-nav-surface, var(--cf-bg-elevated)));
}

.provider-card-top {
  min-width: 0;
}

.provider-card-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-width: 0;
}

.provider-card-meta .model-code {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}

.provider-card-url {
  font-size: 0.72rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.provider-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  padding-top: 6px;
  border-top: 1px solid var(--cf-line);
}

.active-strip {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px 10px;
  padding: 10px 14px;
  margin-bottom: 14px;
  border-radius: 8px;
  border: 1px solid color-mix(in oklab, var(--cf-accent) 28%, var(--cf-line));
  background: color-mix(in oklab, var(--cf-accent) 8%, var(--cf-nav-surface, var(--cf-bg-elevated)));
  font-size: 0.875rem;
}

.active-strip-label {
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--cf-accent-ink, var(--cf-accent));
}

.active-strip-icon {
  font-size: 1rem;
  line-height: 1;
}

.active-strip-name {
  font-weight: 600;
  color: var(--cf-ink);
}

.active-strip-model {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.8rem;
  color: var(--cf-ink);
}

.active-strip-sep {
  color: var(--cf-ink-soft);
  opacity: 0.55;
}

.active-strip-badge {
  margin-left: 2px;
}

.active-strip-actions {
  display: flex;
  gap: 2px;
  margin-left: auto;
}

.no-active-strip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  margin-bottom: 14px;
  border-radius: 8px;
  border: 1px dashed var(--cf-line);
  color: var(--cf-ink-soft);
  font-size: 0.875rem;
}

.provider-cell {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.provider-icon {
  width: 28px;
  height: 28px;
  border-radius: 7px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  flex-shrink: 0;
}

.provider-cell-text {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.provider-name-row {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.provider-name {
  font-weight: 600;
  color: var(--cf-ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.provider-type {
  font-size: 0.75rem;
  color: var(--cf-ink-soft);
}

.model-code {
  font-size: 0.8rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  color: var(--cf-ink);
  background: transparent;
}

.url-cell {
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.action-btns {
  display: flex;
  align-items: center;
  gap: 2px;
}

.actions-col {
  width: 168px;
}

.row-default td:first-child {
  box-shadow: inset 3px 0 0 var(--cf-accent);
}

.row-error td {
  background: color-mix(in oklab, var(--cf-danger) 4%, transparent);
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.8rem;
  white-space: nowrap;
}

.status-badge .dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.status-badge.active { color: #16a34a; }
.status-badge.active .dot { background: #16a34a; }
.status-badge.error { color: #dc2626; }
.status-badge.error .dot { background: #dc2626; }
.status-badge.testing { color: #ca8a04; }
.status-badge.testing .dot { background: #ca8a04; }

.provider-type-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.provider-type-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 10px 4px;
  border: 1.5px solid var(--cf-line);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.15s;
  background: var(--cf-surface, #fff);
  position: relative;
}

.provider-type-option:hover {
  border-color: color-mix(in srgb, var(--cf-accent) 50%, var(--cf-line));
  background: color-mix(in srgb, var(--cf-accent) 8%, transparent);
  transform: translateY(-1px);
}

.provider-type-option.active {
  border-color: var(--cf-accent);
  background: color-mix(in srgb, var(--cf-accent) 10%, transparent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--cf-accent) 15%, transparent);
}

.option-icon {
  font-size: 20px;
}

.option-label {
  font-size: 11px;
  text-align: center;
  color: var(--cf-ink);
  line-height: 1.2;
}

.option-label.local-hint {
  color: var(--cf-ink-soft);
  font-size: 10px;
}

.local-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  background: var(--cf-ink-soft);
  color: white;
  font-size: 9px;
  padding: 1px 5px;
  border-radius: 6px;
  font-weight: 600;
  letter-spacing: 0.02em;
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

.field__hint {
  margin: 0;
  font-size: 12px;
  color: var(--cf-ink-soft);
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

.test-result {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 16px 0;
}

.test-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: var(--cf-ink-soft);
}

.test-result-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  text-align: center;
}

.result-icon.success { color: #16a34a; }
.result-icon.error { color: #dc2626; }

.result-message {
  margin: 0;
  font-size: 14px;
  color: var(--cf-ink);
}

.result-latency {
  margin: 0;
  font-size: 13px;
  color: var(--cf-ink-soft);
}

@media (max-width: 640px) {
  .active-strip-actions {
    margin-left: 0;
    width: 100%;
  }

  .provider-grid {
    grid-template-columns: 1fr;
  }

  .provider-type-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .url-cell {
    max-width: 120px;
  }
}

@media (min-width: 1100px) {
  .provider-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (min-width: 1400px) {
  .provider-grid {
    grid-template-columns: repeat(5, 1fr);
  }
}
</style>
