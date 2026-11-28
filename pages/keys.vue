<template>
  <div class="cf-page">
    <div class="cf-page-header">
      <div class="cf-page-heading">
        <h1 class="cf-page-title">{{ t('keys.title') }}</h1>
        <p class="cf-page-sub">{{ t('keys.sub') }}</p>
      </div>
      <div class="header-actions">
        <CfViewModeToggle v-model="viewMode" storage-key="cf-keys-view" />
        <CfButton tone="primary" icon="i-lucide-plus" @click="handleCreateKey">
          {{ t('keys.new') }}
        </CfButton>
      </div>
    </div>

    <div class="list-toolbar">
      <span class="list-count">{{ t('keys.count', { n: keys.length }) }}</span>
      <span class="list-hint">{{ t('keys.hint') }}</span>
    </div>

    <CfLoadingState v-if="loading" />
    <CfEmptyState
      v-else-if="keys.length === 0"
      :icon="CF_ICONS.key"
      :message="t('keys.empty')"
    />

    <div v-else-if="viewMode === 'card'" class="key-grid">
      <CfResourceCard
        v-for="row in keys"
        :key="row.id"
        :icon="CF_ICONS.key"
        :title="row.name"
        :meta="d(row.created_at)"
        class="key-card"
      >
        <template #actions>
          <CfButton
            tone="icon"
            :icon="row.show ? 'i-lucide-eye-off' : 'i-lucide-eye'"
            :tip="row.show ? t('common.hide') : t('common.show')"
            @click="row.show = !row.show"
          />
          <CfButton
            tone="icon"
            icon="i-lucide-copy"
            :tip="t('keys.copy')"
            @click="copyRowKey(row)"
          />
          <CfButton
            tone="icon-danger"
            icon="i-lucide-trash-2"
            :tip="t('keys.revoke')"
            @click="askDelete(row)"
          />
        </template>
        <template #description>
          <code class="key-secret-text">{{ row.show ? row.key : row.maskedKey }}</code>
        </template>
      </CfResourceCard>
    </div>

    <div v-else class="cf-panel">
      <div class="cf-table-wrap">
        <table class="cf-data-table">
          <thead>
            <tr>
              <th>{{ t('common.name') }}</th>
              <th>{{ t('keys.secret') }}</th>
              <th>{{ t('common.createdAt') }}</th>
              <th class="cf-col-actions">{{ t('common.actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in keys" :key="row.id">
              <td class="name">{{ row.name }}</td>
              <td @click.stop>
                <div class="key-secret-row">
                  <code class="key-secret-text">{{ row.show ? row.key : row.maskedKey }}</code>
                  <CfButton
                    tone="icon"
                    :icon="row.show ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                    :tip="row.show ? t('common.hide') : t('common.show')"
                    @click="row.show = !row.show"
                  />
                </div>
              </td>
              <td class="cf-muted">{{ d(row.created_at) }}</td>
              <td>
                <div class="action-btns">
                  <CfButton
                    tone="icon"
                    icon="i-lucide-copy"
                    :tip="t('keys.copy')"
                    @click="copyRowKey(row)"
                  />
                  <CfButton
                    tone="icon-danger"
                    icon="i-lucide-trash-2"
                    :tip="t('keys.revoke')"
                    @click="askDelete(row)"
                  />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <CfModal
      v-model:open="dialogVisible"
      :title="t('keys.createTitle')"
      :ui="{ content: 'sm:max-w-md' }"
    >
      <template #body>
        <div v-if="newKey" class="new-key-box">
          <UAlert
            color="warning"
            variant="subtle"
            :title="t('keys.saveOnce')"
            :ui="{ root: 'mb-3' }"
          />
          <div class="copy-row">
            <UInput :model-value="newKey" class="w-full" readonly />
            <CfButton tone="primary" icon="i-lucide-copy" @click="copyKey">{{ t('common.copy') }}</CfButton>
          </div>
        </div>

        <form v-else id="key-form" class="form-grid" @submit.prevent="submitCreate">
          <div class="field">
            <label class="field__label">{{ t('common.name') }}</label>
            <UInput
              v-model="form.name"
              class="w-full"
              :placeholder="t('keys.namePh')"
              :color="errors.name ? 'error' : 'neutral'"
              @update:model-value="errors.name = ''"
            />
            <p v-if="errors.name" class="field__error">{{ errors.name }}</p>
          </div>
        </form>
      </template>

      <template v-if="!newKey" #footer>
        <div class="modal-actions">
          <div class="modal-actions__right">
            <CfButton tone="secondary" icon="i-lucide-x" @click="dialogVisible = false">{{ t('common.cancel') }}</CfButton>
            <CfButton
              form="key-form"
              type="submit"
              tone="primary"
              icon="i-lucide-plus"
              :loading="creating"
            >
              {{ t('common.create') }}
            </CfButton>
          </div>
        </div>
      </template>
    </CfModal>

    <CfConfirmModal
      v-model:open="deleteVisible"
      :title="t('keys.revokeTitle')"
      :message="t('keys.revokeText')"
      :confirm-text="t('keys.revoke')"
      confirm-icon="i-lucide-ban"
      :loading="deletingLoading"
      @confirm="confirmDelete"
    />
  </div>
</template>

<script setup lang="ts">
import type { ViewMode } from '@/components/CfViewModeToggle.vue'
import { CF_ICONS } from '~/constants/icons'

interface ApiKey {
  id: string
  name: string
  key: string
  maskedKey: string
  created_at: string
  show?: boolean
}

definePageMeta({
  layout: 'default',
})

const toast = useToast()
const { t, d } = useLocale()
const { get, post, del } = useApi()

const viewMode = ref<ViewMode>('card')
const loading = ref(false)
const creating = ref(false)
const keys = ref<ApiKey[]>([])
const dialogVisible = ref(false)
const deleteVisible = ref(false)
const deletingLoading = ref(false)
const deletingId = ref('')
const newKey = ref('')
const form = reactive({ name: '' })
const errors = reactive({ name: '' })

const fetchKeys = async () => {
  loading.value = true
  try {
    const res = await get<{ keys: any[] }>('/api/v1/keys')
    if (res.error) {
      toast.add({ title: res.error, color: 'error' })
      return
    }
    const keyList = res.data?.keys || []
    keys.value = keyList.map((k: any) => ({
      ...k,
      maskedKey: k.key ? `${k.key.slice(0, 10)}****${k.key.slice(-4)}` : '',
      show: false,
    }))
  } catch {
    toast.add({ title: t('keys.listFail'), color: 'error' })
  } finally {
    loading.value = false
  }
}

const handleCreateKey = () => {
  form.name = ''
  newKey.value = ''
  errors.name = ''
  dialogVisible.value = true
}

const submitCreate = async () => {
  errors.name = form.name.trim() ? '' : t('keys.needName')
  if (errors.name) return

  creating.value = true
  try {
    const res = await post<{ key: string }>('/api/v1/keys', form)
    if (res.error) {
      toast.add({ title: res.error, color: 'error' })
      return
    }
    newKey.value = res.data?.key || ''
    await fetchKeys()
  } catch {
    toast.add({ title: t('common.createFail'), color: 'error' })
  } finally {
    creating.value = false
  }
}

const askDelete = (row: ApiKey) => {
  deletingId.value = row.id
  deleteVisible.value = true
}

const confirmDelete = async () => {
  deletingLoading.value = true
  try {
    const res = await del<{ message?: string }>(`/api/v1/keys/${deletingId.value}`)
    if (res.error) {
      toast.add({ title: res.error, color: 'error' })
      return
    }
    toast.add({ title: res.data?.message || t('keys.revokeOk'), color: 'success' })
    deleteVisible.value = false
    await fetchKeys()
  } finally {
    deletingLoading.value = false
  }
}

const copyKey = async () => {
  await navigator.clipboard.writeText(newKey.value)
  toast.add({ title: t('common.copied'), color: 'success' })
}

const copyRowKey = async (row: ApiKey) => {
  const text = row.show ? row.key : row.maskedKey
  await navigator.clipboard.writeText(text)
  toast.add({
    title: row.show ? t('keys.copiedFull') : t('keys.copiedMasked'),
    color: 'success',
  })
}

onMounted(() => {
  fetchKeys()
})
</script>

<style scoped>
.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.key-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
}

.key-card {
  cursor: default;
}

.list-count {
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--cf-ink-soft);
}

.list-hint {
  font-size: 0.75rem;
  color: var(--cf-ink-soft);
  opacity: 0.85;
}

.name {
  font-weight: 600;
  color: var(--cf-ink);
}

.key-secret-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.key-secret-text {
  font-family: var(--font-mono);
  font-size: 0.8125rem;
  color: var(--cf-ink);
}

.new-key-box {
  padding: 4px 0;
}

.copy-row {
  display: flex;
  gap: 8px;
  align-items: center;
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

.modal-actions__right {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}

.delete-text {
  margin: 0;
  color: var(--cf-ink-soft);
  line-height: 1.5;
}
</style>
