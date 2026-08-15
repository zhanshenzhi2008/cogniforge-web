<template>
  <div class="cf-page">
    <div class="cf-page-header">
      <div class="cf-page-heading">
        <h1 class="cf-page-title">Models</h1>
        <p class="cf-page-sub">Providers and default models.</p>
      </div>
      <UButton color="primary" icon="i-lucide-plus" @click="handleCreate">
        Add provider
      </UButton>
    </div>

    <!-- 当前生效配置 Banner -->
    <div v-if="activeProvider" class="active-banner">
      <div class="banner-left">
        <div class="banner-icon">
          <UIcon name="i-lucide-cpu" class="size-6" />
        </div>
        <div class="banner-info">
          <div class="banner-title">
            当前生效配置
            <UBadge size="sm" variant="subtle" :color="activeProvider.is_default ? 'info' : 'success'">
              {{ activeProvider.is_default ? '默认' : '首个启用' }}
            </UBadge>
          </div>
          <div class="banner-desc">
            {{ getProviderMeta(activeProvider.provider)?.icon }}
            {{ activeProvider.name }}
            <span class="separator">·</span>
            {{ activeProvider.default_model }}
            <span class="separator">·</span>
            <span :class="['status-dot', activeProvider.status]" />
            {{ statusLabel(activeProvider.status) }}
            <span v-if="activeProvider.last_test_at" class="last-test">
              · 测试于 {{ formatDate(activeProvider.last_test_at) }}
            </span>
          </div>
        </div>
      </div>
      <div class="banner-actions">
        <UButton color="neutral" variant="soft" size="sm" icon="i-lucide-pencil" @click="handleEdit(activeProvider)">
          编辑
        </UButton>
        <UButton color="neutral" variant="soft" size="sm" icon="i-lucide-refresh-cw" @click="handleTest(activeProvider.id)">
          测试连接
        </UButton>
      </div>
    </div>

    <!-- 无生效配置时的提示 -->
    <div v-else class="no-active-banner">
      当前没有生效的 AI 配置，请先
      <UButton color="primary" size="sm" @click="handleCreate">Add provider</UButton>
    </div>

    <!-- 供应商列表 -->
    <div class="cf-panel">
      <div class="card-header">
        <div class="card-header-left">
          <span class="card-header-title">已配置的供应商</span>
          <span class="card-header-count">{{ providers.length }} 个</span>
        </div>
      </div>

      <div v-if="loading" class="cf-state">
        <UIcon name="i-lucide-loader-circle" class="size-6 animate-spin" />
        <span>加载中…</span>
      </div>

      <div v-else-if="providers.length === 0" class="cf-state">
        <UIcon name="i-lucide-boxes" class="size-8 opacity-50" />
        <p>暂无供应商配置，请点击上方添加</p>
      </div>

      <div v-else class="provider-grid">
        <div
          v-for="p in providers"
          :key="p.id"
          class="provider-card"
          :class="{
            'is-enabled': p.is_enabled,
            'is-default': p.is_default,
            'is-error': p.status === 'error',
          }"
        >
          <div class="provider-card-header">
            <div class="provider-meta">
              <div
                class="provider-icon-wrap"
                :style="{ background: getProviderMeta(p.provider)?.color + '18', color: getProviderMeta(p.provider)?.color }"
              >
                {{ getProviderMeta(p.provider)?.icon }}
              </div>
              <div class="provider-title-wrap">
                <div class="provider-name-row">
                  <span class="provider-name">{{ p.name }}</span>
                  <UBadge
                    v-if="p.is_default"
                    size="sm"
                    variant="subtle"
                    color="warning"
                  >
                    默认
                  </UBadge>
                  <UBadge
                    v-else-if="p.is_enabled && !p.is_default"
                    size="sm"
                    variant="subtle"
                    color="success"
                  >
                    启用
                  </UBadge>
                </div>
                <span class="provider-type-label">{{ getProviderMeta(p.provider)?.label || p.provider }}</span>
              </div>
            </div>
            <UTooltip text="删除">
              <UButton
                color="error"
                variant="ghost"
                size="sm"
                icon="i-lucide-trash-2"
                @click="askDelete(p)"
              />
            </UTooltip>
          </div>

          <div class="provider-card-body">
            <div class="provider-fields-grid">
              <div class="provider-field">
                <span class="field-label">默认模型</span>
                <span class="field-value">{{ p.default_model || '—' }}</span>
              </div>
              <div class="provider-field">
                <span class="field-label">状态</span>
                <span :class="['status-badge', p.status]">
                  <span class="dot" />{{ statusLabel(p.status) }}
                </span>
              </div>
            </div>
            <div class="provider-field provider-field--full">
              <span class="field-label">Base URL</span>
              <span class="field-value ellipsis cf-muted">{{ p.base_url || '—' }}</span>
            </div>
            <div v-if="p.last_test_at" class="provider-field provider-field--full">
              <span class="field-label">最近测试</span>
              <span class="field-value cf-muted">{{ formatDate(p.last_test_at) }}</span>
            </div>
          </div>

          <div v-if="p.status === 'error' && p.last_error" class="error-hint">
            <UIcon name="i-lucide-alert-circle" class="size-3 shrink-0" />
            <span class="ellipsis">{{ p.last_error }}</span>
          </div>

          <div class="provider-card-footer">
            <div class="footer-left">
              <UTooltip :text="p.is_enabled ? '禁用' : '启用'">
                <USwitch
                  :model-value="p.is_enabled"
                  size="sm"
                  @update:model-value="handleToggleEnable(p)"
                />
              </UTooltip>
            </div>
            <div class="footer-right">
              <UTooltip v-if="!p.is_default" text="设为默认">
                <UButton
                  color="neutral"
                  variant="ghost"
                  size="sm"
                  icon="i-lucide-star"
                  :loading="settingDefaultId === p.id"
                  @click="handleSetDefault(p.id)"
                />
              </UTooltip>
              <UTooltip text="测试连接">
                <UButton
                  color="neutral"
                  variant="ghost"
                  size="sm"
                  icon="i-lucide-refresh-cw"
                  @click="handleTest(p.id)"
                />
              </UTooltip>
              <UTooltip text="编辑">
                <UButton
                  color="neutral"
                  variant="ghost"
                  size="sm"
                  icon="i-lucide-pencil"
                  @click="handleEdit(p)"
                />
              </UTooltip>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 添加/编辑弹窗 -->
    <UModal
      v-model:open="dialogVisible"
      :title="isEditing ? '编辑供应商' : '添加供应商'"
      :ui="{ content: 'sm:max-w-xl' }"
    >
      <template #body>
        <form id="provider-form" class="form-grid" @submit.prevent="handleSubmit">
          <div class="field">
            <label class="field__label">供应商类型</label>
            <div class="provider-type-grid">
              <div
                v-for="[key, meta] in Object.entries(PROVIDER_META)"
                :key="key"
                class="provider-type-option"
                :class="{ active: form.provider === key }"
                @click="selectProvider(key)"
              >
                <span class="option-icon">{{ meta.icon }}</span>
                <span class="option-label" :class="meta.local ? 'local-hint' : ''">{{ meta.label }}</span>
                <span v-if="meta.local" class="local-badge">本地</span>
              </div>
            </div>
            <p v-if="errors.provider" class="field__error">{{ errors.provider }}</p>
          </div>

          <div class="field">
            <label class="field__label">配置名称</label>
            <UInput
              v-model="form.name"
              class="w-full"
              placeholder="例如：我的 OpenAI"
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
              placeholder="请输入 API Key"
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
              :placeholder="`默认：${form.provider ? PROVIDER_META[form.provider]?.defaultBaseURL : ''}`"
            />
          </div>

          <div class="field">
            <label class="field__label">默认模型</label>
            <UInput v-model="form.default_model" class="w-full" placeholder="例如：gpt-4o" />
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
              JSON 格式，用于 OpenRouter 的 HTTP-Referer 和 X-OpenRouter-Title 等 Header
            </p>
          </div>

          <div class="field">
            <label class="field__label">优先级</label>
            <UInput
              v-model.number="form.priority"
              class="w-full"
              type="number"
              :min="0"
              :max="100"
            />
            <p class="field__hint">数字越小优先级越高，多个启用时使用优先级最高的</p>
          </div>
        </form>
      </template>

      <template #footer>
        <div class="modal-actions">
          <UButton color="neutral" variant="outline" @click="dialogVisible = false">取消</UButton>
          <UButton form="provider-form" type="submit" color="primary" :loading="submitting">
            {{ isEditing ? '保存' : '添加' }}
          </UButton>
        </div>
      </template>
    </UModal>

    <!-- 测试结果弹窗 -->
    <UModal v-model:open="testModalVisible" title="连接测试结果" :ui="{ content: 'sm:max-w-md' }">
      <template #body>
        <div class="test-result">
          <div v-if="testLoading" class="test-loading">
            <UIcon name="i-lucide-loader-circle" class="size-10 animate-spin" />
            <span>正在测试连接...</span>
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
              耗时 {{ testResult.latency_ms }}ms
            </p>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="modal-actions modal-actions--center">
          <UButton color="neutral" variant="outline" @click="testModalVisible = false">关闭</UButton>
          <UButton color="primary" @click="reTest">重新测试</UButton>
        </div>
      </template>
    </UModal>

    <!-- 删除确认 -->
    <UModal v-model:open="deleteVisible" title="删除确认" :ui="{ content: 'sm:max-w-md' }">
      <template #body>
        <p class="delete-text">
          确定要删除供应商「{{ deleting?.name }}」吗？删除后无法恢复。
        </p>
      </template>
      <template #footer>
        <div class="modal-actions">
          <UButton color="neutral" variant="outline" @click="deleteVisible = false">取消</UButton>
          <UButton color="error" :loading="deletingLoading" @click="confirmDelete">删除</UButton>
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
const { list, getActive, create, update, remove, setDefault, test } = useProviders()

const loading = ref(false)
const submitting = ref(false)
const providers = ref<AIProvider[]>([])
const activeProvider = ref<AIProvider | null>(null)
const dialogVisible = ref(false)
const isEditing = ref(false)
const editingId = ref('')

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
  const map: Record<string, string> = {
    active: '正常',
    error: '异常',
    testing: '测试中',
  }
  return map[status] || status
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleString('zh-CN')
}

function selectProvider(key: string) {
  form.provider = key
  form.base_url = PROVIDER_META[key]?.defaultBaseURL || ''
  errors.provider = ''
}

function validate() {
  errors.provider = form.provider ? '' : '请选择供应商类型'
  errors.name = form.name.trim() ? '' : '配置名称不能为空'
  errors.api_key = form.api_key.trim() ? '' : 'API Key 不能为空'
  return !errors.provider && !errors.name && !errors.api_key
}

const handleCreate = () => {
  isEditing.value = false
  editingId.value = ''
  resetForm()
  dialogVisible.value = true
}

const handleEdit = (p: AIProvider) => {
  isEditing.value = true
  editingId.value = p.id
  form.provider = p.provider
  form.name = p.name
  form.api_key = p.api_key || ''
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
  dialogVisible.value = true
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
    toast.add({ title: '删除成功', color: 'success' })
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
  toast.add({ title: newEnabled ? '已启用' : '已禁用', color: 'success' })
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
    toast.add({ title: '已设为默认', color: 'success' })
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
        toast.add({ title: 'Extra Headers 格式错误，请输入有效的 JSON', color: 'error' })
        return
      }
    }

    if (isEditing.value) {
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
      toast.add({ title: '保存成功', color: 'success' })
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
      toast.add({ title: '添加成功', color: 'success' })
    }
    dialogVisible.value = false
    await fetchAll()
  } catch {
    toast.add({ title: isEditing.value ? '保存失败' : '添加失败', color: 'error' })
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
    toast.add({ title: '获取供应商列表失败', color: 'error' })
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchAll()
})
</script>

<style scoped>
/* Active Banner — teal/accent, not purple/indigo */
.active-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 20px;
  background: linear-gradient(135deg, var(--cf-accent) 0%, color-mix(in srgb, var(--cf-accent) 75%, #0d9488) 100%);
  border-radius: 12px;
  color: white;
  margin-bottom: 16px;
  box-shadow: 0 4px 14px color-mix(in srgb, var(--cf-accent) 35%, transparent);
}

.banner-left {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
}

.banner-icon {
  width: 44px;
  height: 44px;
  background: rgba(255, 255, 255, 0.18);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.banner-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.banner-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 15px;
}

.banner-desc {
  font-size: 13px;
  opacity: 0.9;
}

.banner-desc .separator {
  margin: 0 4px;
  opacity: 0.5;
}

.banner-desc .last-test {
  opacity: 0.75;
}

.banner-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.no-active-banner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 28px;
  background: var(--cf-surface, #fff);
  border-radius: 12px;
  border: 1px dashed var(--cf-line);
  margin-bottom: 16px;
  color: var(--cf-ink-soft);
  text-align: center;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
  padding: 10px 10px 0;
}

.card-header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.card-header-title {
  font-weight: 600;
  color: var(--cf-ink);
}

.card-header-count {
  font-size: 12px;
  color: var(--cf-ink-soft);
}

.provider-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 16px;
  padding: 0 10px 10px;
}

.provider-card {
  background: var(--cf-surface, #fff);
  border: 1.5px solid var(--cf-line);
  border-radius: 12px;
  padding: 16px;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.provider-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
}

.provider-card.is-enabled {
  border-color: color-mix(in srgb, var(--cf-accent) 35%, var(--cf-line));
  background: color-mix(in srgb, var(--cf-accent) 6%, transparent);
}

.provider-card.is-error {
  border-color: color-mix(in srgb, var(--cf-danger) 40%, var(--cf-line));
  background: color-mix(in srgb, var(--cf-danger) 6%, transparent);
}

.provider-card.is-default {
  border-color: #fde68a;
}

.provider-card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}

.provider-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.provider-icon-wrap {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}

.provider-title-wrap {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.provider-name-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.provider-name {
  font-weight: 600;
  font-size: 14px;
  color: var(--cf-ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.provider-type-label {
  font-size: 12px;
  color: var(--cf-ink-soft);
}

.provider-card-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.provider-fields-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.provider-field {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  font-size: 12px;
  min-width: 0;
}

.provider-field--full {
  grid-column: 1 / -1;
}

.field-label {
  color: var(--cf-ink-soft);
  width: 56px;
  flex-shrink: 0;
  padding-top: 1px;
}

.field-value {
  font-size: 12px;
  color: var(--cf-ink);
  min-width: 0;
}

.ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.status-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
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

.provider-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 10px;
  border-top: 1px solid var(--cf-line);
  gap: 4px;
}

.footer-left,
.footer-right {
  display: flex;
  align-items: center;
  gap: 4px;
}

.error-hint {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--cf-danger);
  background: color-mix(in srgb, var(--cf-danger) 8%, transparent);
  padding: 6px 8px;
  border-radius: 6px;
}

.status-dot {
  display: inline-block;
  width: 7px;
  height: 7px;
  border-radius: 50%;
}

.status-dot.active { background: #22c55e; }
.status-dot.error { background: #ef4444; }
.status-dot.testing { background: #eab308; }

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

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.modal-actions--center {
  justify-content: center;
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
  .active-banner {
    flex-direction: column;
    align-items: flex-start;
  }

  .provider-type-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
