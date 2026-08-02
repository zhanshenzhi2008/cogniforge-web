<template>
  <div class="models-page">
    <div class="page-header">
      <h2>模型配置</h2>
    </div>

    <!-- 当前生效配置 Banner -->
    <div v-if="activeProvider" class="active-banner">
      <div class="banner-left">
        <div class="banner-icon">
          <n-icon :component="HardwareChipOutline" size="24" />
        </div>
        <div class="banner-info">
          <div class="banner-title">
            当前生效配置
            <n-tag :type="activeProvider.is_default ? 'info' : 'success'" size="small" :bordered="false">
              {{ activeProvider.is_default ? '默认' : '首个启用' }}
            </n-tag>
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
        <n-button size="small" @click="handleEdit(activeProvider)">
          <template #icon>
            <n-icon :component="PencilOutline" />
          </template>
          编辑
        </n-button>
        <n-button size="small" @click="handleTest(activeProvider.id)">
          <template #icon>
            <n-icon :component="RefreshOutline" />
          </template>
          测试连接
        </n-button>
      </div>
    </div>

    <!-- 无生效配置时的提示 -->
    <div v-if="!activeProvider" class="no-active-banner">
      当前没有生效的 AI 配置，请先
      <n-button type="primary" size="small" @click="handleCreate">添加供应商</n-button>
    </div>

    <!-- 供应商列表 -->
    <n-card class="provider-list-card">
      <template #header>
        <div class="card-header">
          <div class="card-header-left">
            <span>已配置的供应商</span>
            <n-text depth="3" style="font-size: 12px">{{ providers.length }} 个</n-text>
          </div>
          <n-button type="primary" size="small" @click="handleCreate">
            <template #icon>
              <n-icon :component="AddOutline" />
            </template>
            添加供应商
          </n-button>
        </div>
      </template>
      <n-spin :show="loading">
        <div v-if="providers.length > 0" class="provider-grid">
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
            <!-- Card header -->
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
                    <n-tag
                      v-if="p.is_default"
                      type="warning"
                      size="small"
                      :bordered="false"
                    >默认</n-tag>
                    <n-tag
                      v-else-if="p.is_enabled && !p.is_default"
                      type="success"
                      size="small"
                      :bordered="false"
                    >启用</n-tag>
                  </div>
                  <span class="provider-type-label">{{ getProviderMeta(p.provider)?.label || p.provider }}</span>
                </div>
              </div>
              <n-dropdown :options="getDropdownOptions(p)" @select="(key) => handleAction(key, p)">
                <n-button quaternary circle size="tiny" @click.stop>
                  <template #icon>
                    <n-icon :component="EllipsisHorizontalOutline" />
                  </template>
                </n-button>
              </n-dropdown>
            </div>

            <!-- Card fields — 2 col grid -->
            <div class="provider-card-body">
              <div class="provider-fields-grid">
                <div class="provider-field">
                  <span class="field-label">默认模型</span>
                  <n-text class="field-value">{{ p.default_model || '—' }}</n-text>
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
                <n-text class="field-value ellipsis" depth="3">{{ p.base_url || '—' }}</n-text>
              </div>
              <div v-if="p.last_test_at" class="provider-field provider-field--full">
                <span class="field-label">最近测试</span>
                <n-text class="field-value" depth="3" style="font-size: 12px">{{ formatDate(p.last_test_at) }}</n-text>
              </div>
            </div>

            <!-- Error hint -->
            <div v-if="p.status === 'error' && p.last_error" class="error-hint">
              <n-icon :component="AlertCircleOutline" size="12" />
              <span class="ellipsis">{{ p.last_error }}</span>
            </div>

            <!-- Card footer -->
            <div class="provider-card-footer">
              <div class="footer-left">
                <n-tooltip :style="{ maxWidth: '300px' }">
                  <template #trigger>
                    <n-button
                      size="small"
                      quaternary
                      circle
                      @click="handleToggleEnable(p)"
                    >
                      <template #icon>
                        <n-icon :component="PowerOutline" size="16" />
                      </template>
                    </n-button>
                  </template>
                </n-tooltip>
              </div>
              <div class="footer-right">
                <n-tooltip v-if="!p.is_default" trigger="hover">
                  <template #trigger>
                    <n-button
                      size="small"
                      quaternary
                      circle
                      :loading="settingDefaultId === p.id"
                      @click="handleSetDefault(p.id)"
                    >
                      <template #icon>
                        <n-icon :component="StarOutline" size="16" />
                      </template>
                    </n-button>
                  </template>
                  设为默认
                </n-tooltip>
                <n-tooltip trigger="hover">
                  <template #trigger>
                    <n-button
                      size="small"
                      quaternary
                      circle
                      @click="handleTest(p.id)"
                    >
                      <template #icon>
                        <n-icon :component="RefreshOutline" size="16" />
                      </template>
                    </n-button>
                  </template>
                  测试连接
                </n-tooltip>
                <n-tooltip trigger="hover">
                  <template #trigger>
                    <n-button
                      size="small"
                      quaternary
                      circle
                      @click="handleEdit(p)"
                    >
                      <template #icon>
                        <n-icon :component="PencilOutline" size="16" />
                      </template>
                    </n-button>
                  </template>
                  编辑
                </n-tooltip>
              </div>
            </div>
          </div>
        </div>

        <n-empty v-else description="暂无供应商配置，请点击上方" />
      </n-spin>
    </n-card>

    <!-- 添加/编辑弹窗 -->
    <n-modal
      v-model:show="dialogVisible"
      preset="card"
      :title="isEditing ? '编辑供应商' : '添加供应商'"
      style="width: 580px; max-width: 90vw"
      :segmented="{ content: true, footer: true }"
    >
      <n-form ref="formRef" :model="form" :rules="rules" label-placement="top">
        <!-- 供应商类型选择 -->
        <n-form-item label="供应商类型" path="provider">
          <n-grid :cols="4" :x-gap="8" :y-gap="8">
            <n-gi v-for="[key, meta] in Object.entries(PROVIDER_META)" :key="key">
              <div
                class="provider-type-option"
                :class="{ active: form.provider === key }"
                @click="selectProvider(key)"
              >
                <span class="option-icon">{{ meta.icon }}</span>
                <span class="option-label" :class="meta.local ? 'local-hint' : ''">{{ meta.label }}</span>
                <span v-if="meta.local" class="local-badge">本地</span>
              </div>
            </n-gi>
          </n-grid>
        </n-form-item>

        <n-form-item label="配置名称" path="name">
          <n-input v-model:value="form.name" placeholder="例如：我的 OpenAI" />
        </n-form-item>

        <n-form-item label="API Key" path="api_key">
          <n-input
            v-model:value="form.api_key"
            type="password"
            show-password-on="click"
            placeholder="请输入 API Key"
          />
        </n-form-item>

        <n-form-item label="Base URL" path="base_url">
          <n-input v-model:value="form.base_url" :placeholder="`默认：${form.provider ? PROVIDER_META[form.provider]?.defaultBaseURL : ''}`" />
        </n-form-item>

        <n-form-item label="默认模型" path="default_model">
          <n-input v-model:value="form.default_model" placeholder="例如：gpt-4o" />
        </n-form-item>

        <!-- OpenRouter 专用字段 -->
        <n-collapse-transition :show="form.provider === 'openrouter'">
          <n-form-item label="Extra Headers" path="extra_headers">
            <n-input
              v-model:value="form.extra_headers_raw"
              type="textarea"
              :autosize="{ minRows: 2, maxRows: 4 }"
              placeholder='{"HTTP-Referer": "https://your-site.com", "X-OpenRouter-Title": "Your App"}'
            />
            <n-text depth="3" style="font-size: 12px; margin-top: 4px">
              JSON 格式，用于 OpenRouter 的 HTTP-Referer 和 X-OpenRouter-Title 等 Header
            </n-text>
          </n-form-item>
        </n-collapse-transition>

        <n-form-item label="优先级" path="priority">
          <n-input-number v-model:value="form.priority" :min="0" :max="100" style="width: 100%" />
          <n-text depth="3" style="font-size: 12px; margin-top: 4px">
            数字越小优先级越高，多个启用时使用优先级最高的
          </n-text>
        </n-form-item>
      </n-form>

      <template #footer>
        <n-space justify="end">
          <n-button @click="dialogVisible = false">取消</n-button>
          <n-button type="primary" :loading="submitting" @click="handleSubmit">
            {{ isEditing ? '保存' : '添加' }}
          </n-button>
        </n-space>
      </template>
    </n-modal>

    <!-- 测试结果弹窗 -->
    <n-modal
      v-model:show="testModalVisible"
      preset="card"
      title="连接测试结果"
      style="width: 420px; max-width: 90vw"
    >
      <div class="test-result">
        <div v-if="testLoading" class="test-loading">
          <n-spin size="large" />
          <n-text>正在测试连接...</n-text>
        </div>
        <div v-else-if="testResult" class="test-result-body">
          <div class="result-icon" :class="testResult.success ? 'success' : 'error'">
            <n-icon :component="testResult.success ? CheckmarkCircleOutline : AlertCircleOutline" size="48" />
          </div>
          <n-text class="result-message">{{ testResult.message }}</n-text>
          <n-text v-if="testResult.latency_ms" depth="3" style="font-size: 13px">
            耗时 {{ testResult.latency_ms }}ms
          </n-text>
        </div>
      </div>
      <template #footer>
        <n-space justify="center">
          <n-button @click="testModalVisible = false">关闭</n-button>
          <n-button type="primary" @click="reTest">重新测试</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import {
  AddOutline,
  PencilOutline,
  EllipsisHorizontalOutline,
  RefreshOutline,
  HardwareChipOutline,
  AlertCircleOutline,
  CheckmarkCircleOutline,
  StarOutline,
  PowerOutline,
} from '@/constants/icons'
import { NButton, NIcon, NTag, NDropdown, NText, NCard, NSpin, NEmpty, NModal, NFormItem, NInput, NInputNumber, NForm, NCollapseTransition, NSpace, NTooltip, useMessage, useDialog } from 'naive-ui'
import type { FormInst } from 'naive-ui'
import { useProviders, PROVIDER_META, type AIProvider, type CreateProviderInput, type UpdateProviderInput, type TestResult } from '@/composables/useProviders'

definePageMeta({ layout: 'default' })

const message = useMessage()
const dialog = useDialog()
const { list, get, getActive, create, update, remove, setDefault, test } = useProviders()

const loading = ref(false)
const submitting = ref(false)
const providers = ref<AIProvider[]>([])
const activeProvider = ref<AIProvider | null>(null)
const dialogVisible = ref(false)
const isEditing = ref(false)
const editingId = ref('')
const formRef = ref<FormInst>()

const testingId = ref('')
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

const rules = {
  provider: [{ required: true, message: '请选择供应商类型', trigger: 'change' }],
  name: [{ required: true, message: '配置名称不能为空', trigger: 'blur' }],
  api_key: [{ required: true, message: 'API Key 不能为空', trigger: 'blur' }],
}

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
}

function getDropdownOptions(p: AIProvider) {
  const opts = [
    { label: '编辑', key: 'edit', icon: () => h(NIcon, { component: PencilOutline, size: 16 }) },
    { label: '删除', key: 'delete', icon: () => h(NIcon, { component: AlertCircleOutline, size: 16 }) },
  ]
  return opts
}

function handleAction(key: string, p: AIProvider) {
  if (key === 'edit') handleEdit(p)
  else if (key === 'delete') handleDelete(p)
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
  dialogVisible.value = true
}

const handleDelete = async (p: AIProvider) => {
  dialog.warning({
    title: '删除确认',
    content: `确定要删除供应商「${p.name}」吗？删除后无法恢复。`,
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      const res = await remove(p.id)
      if (res.error) {
        message.error(res.error)
        return
      }
      message.success('删除成功')
      await fetchAll()
    },
  })
}

const handleToggleEnable = async (p: AIProvider) => {
  const newEnabled = !p.is_enabled
  const input: UpdateProviderInput = { is_enabled: newEnabled }
  const res = await update(p.id, input)
  if (res.error) {
    message.error(res.error)
    return
  }
  message.success(newEnabled ? '已启用' : '已禁用')
  await fetchAll()
}

const handleSetDefault = async (id: string) => {
  settingDefaultId.value = id
  try {
    const res = await setDefault(id)
    if (res.error) {
      message.error(res.error)
      return
    }
    message.success('已设为默认')
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
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch {
    return
  }

  submitting.value = true
  try {
    // 解析 extra_headers
    let extraHeaders: Record<string, any> | undefined
    if (form.extra_headers_raw.trim()) {
      try {
        extraHeaders = JSON.parse(form.extra_headers_raw)
      } catch {
        message.error('Extra Headers 格式错误，请输入有效的 JSON')
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
        message.error(res.error)
        return
      }
      message.success('保存成功')
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
        message.error(res.error)
        return
      }
      message.success('添加成功')
    }
    dialogVisible.value = false
    await fetchAll()
  } catch {
    message.error(isEditing.value ? '保存失败' : '添加失败')
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
  formRef.value?.restoreValidation()
}

const fetchAll = async () => {
  loading.value = true
  try {
    const [listRes, activeRes] = await Promise.all([list(), getActive()])
    if (listRes.error) {
      message.error(listRes.error)
      return
    }
    providers.value = listRes.data || []
    activeProvider.value = activeRes.data || null
  } catch {
    message.error('获取供应商列表失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchAll()
})
</script>

<style scoped>
.models-page {
  padding: 20px;
  max-width: 1200px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.page-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

/* Active Banner */
.active-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);
  border-radius: 12px;
  color: white;
  margin-bottom: 16px;
  box-shadow: 0 4px 14px rgba(37, 99, 235, 0.3);
}

.banner-left {
  display: flex;
  align-items: center;
  gap: 14px;
}

.banner-icon {
  width: 44px;
  height: 44px;
  background: rgba(255, 255, 255, 0.18);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.banner-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
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
  opacity: 0.85;
}

.banner-desc .separator {
  margin: 0 4px;
  opacity: 0.5;
}

.banner-desc .last-test {
  opacity: 0.7;
}

.banner-actions {
  display: flex;
  gap: 8px;
}

.no-active-banner {
  padding: 32px;
  background: white;
  border-radius: 12px;
  border: 1px dashed #d1d5db;
  margin-bottom: 16px;
  text-align: center;
}

/* Provider list */
.provider-list-card {
  margin-top: 8px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 500;
}

.card-header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Responsive grid — auto-fill, min 340px per card */
.provider-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 16px;
}

/* Card */
.provider-card {
  background: white;
  border: 1.5px solid #e5e7eb;
  border-radius: 12px;
  padding: 16px;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  gap: 12px;
  cursor: default;
}

.provider-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.09);
}

.provider-card.is-enabled {
  border-color: #bbf7d0;
  background: #f0fdf4;
}

.provider-card.is-error {
  border-color: #fecaca;
  background: #fef2f2;
}

.provider-card.is-default {
  border-color: #fde68a;
}

/* Card header */
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
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.provider-type-label {
  font-size: 12px;
  color: #94a3b8;
}

/* Card body */
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
  color: #9ca3af;
  width: 56px;
  flex-shrink: 0;
  padding-top: 1px;
}

.field-value {
  font-size: 12px;
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

/* Footer */
.provider-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 10px;
  border-top: 1px solid #f3f4f6;
  gap: 4px;
}

.footer-left {
  display: flex;
  align-items: center;
  gap: 4px;
}

.footer-right {
  display: flex;
  align-items: center;
  gap: 2px;
}

/* Error hint */
.error-hint {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #dc2626;
  background: #fef2f2;
  padding: 6px 8px;
  border-radius: 6px;
}

/* Status dot */
.status-dot {
  display: inline-block;
  width: 7px;
  height: 7px;
  border-radius: 50%;
}

.status-dot.active { background: #22c55e; }
.status-dot.error { background: #ef4444; }
.status-dot.testing { background: #eab308; }

/* Provider type selector */
.provider-type-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 10px 4px;
  border: 1.5px solid #e5e7eb;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.15s;
  background: white;
  position: relative;
}

.provider-type-option:hover {
  border-color: #93c5fd;
  background: #eff6ff;
  transform: translateY(-1px);
}

.provider-type-option.active {
  border-color: #2563eb;
  background: #eff6ff;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

.option-icon {
  font-size: 20px;
}

.option-label {
  font-size: 11px;
  text-align: center;
  color: #374151;
  line-height: 1.2;
}

.option-label.local-hint {
  color: #64748b;
  font-size: 10px;
}

.local-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  background: #64748b;
  color: white;
  font-size: 9px;
  padding: 1px 5px;
  border-radius: 6px;
  font-weight: 600;
  letter-spacing: 0.02em;
}

/* Test result */
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
  font-size: 14px;
}
</style>
