<template>
  <div class="cf-page">
    <div class="cf-page-header">
      <div class="cf-page-heading">
        <h1 class="cf-page-title">Keys</h1>
        <p class="cf-page-sub">Issue and revoke API credentials.</p>
      </div>
      <UButton color="primary" icon="i-lucide-plus" @click="handleCreateKey">
        New key
      </UButton>
    </div>

    <div class="cf-panel">
      <div v-if="loading" class="cf-state">
        <UIcon name="i-lucide-loader-circle" class="size-6 animate-spin" />
        <span>Loading…</span>
      </div>

      <div v-else-if="keys.length === 0" class="cf-state">
        <UIcon name="i-lucide-key-round" class="size-8 opacity-50" />
        <p>No API keys yet.</p>
      </div>

      <div v-else class="cf-table-wrap">
        <table class="cf-data-table">
          <thead>
            <tr>
              <th>名称</th>
              <th>密钥</th>
              <th>创建时间</th>
              <th class="cf-col-actions">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in keys" :key="row.id">
              <td class="name">{{ row.name }}</td>
              <td>
                <div class="key-secret-row">
                  <code class="key-secret-text">{{ row.show ? row.key : row.maskedKey }}</code>
                  <UTooltip :text="row.show ? '隐藏' : '显示'">
                    <UButton
                      color="neutral"
                      variant="ghost"
                      size="sm"
                      :icon="row.show ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                      @click="row.show = !row.show"
                    />
                  </UTooltip>
                </div>
              </td>
              <td class="cf-muted">{{ formatDate(row.created_at) }}</td>
              <td>
                <UTooltip text="撤销">
                  <UButton
                    color="error"
                    variant="ghost"
                    size="sm"
                    icon="i-lucide-trash-2"
                    @click="askDelete(row)"
                  />
                </UTooltip>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <UModal
      v-model:open="dialogVisible"
      title="创建 API 密钥"
      :ui="{ content: 'sm:max-w-md' }"
    >
      <template #body>
        <div v-if="newKey" class="new-key-box">
          <UAlert
            color="warning"
            variant="subtle"
            title="请妥善保存以下密钥，它只会显示一次。"
            :ui="{ root: 'mb-3' }"
          />
          <div class="copy-row">
            <UInput :model-value="newKey" class="w-full" readonly />
            <UButton color="primary" variant="soft" @click="copyKey">复制</UButton>
          </div>
        </div>

        <form v-else id="key-form" class="form-grid" @submit.prevent="submitCreate">
          <div class="field">
            <label class="field__label">名称</label>
            <UInput
              v-model="form.name"
              class="w-full"
              placeholder="请输入密钥名称"
              :color="errors.name ? 'error' : 'neutral'"
              @update:model-value="errors.name = ''"
            />
            <p v-if="errors.name" class="field__error">{{ errors.name }}</p>
          </div>
        </form>
      </template>

      <template #footer>
        <div class="modal-actions">
          <UButton color="neutral" variant="outline" @click="dialogVisible = false">关闭</UButton>
          <UButton
            v-if="!newKey"
            form="key-form"
            type="submit"
            color="primary"
            :loading="creating"
          >
            创建
          </UButton>
        </div>
      </template>
    </UModal>

    <UModal v-model:open="deleteVisible" title="撤销确认" :ui="{ content: 'sm:max-w-md' }">
      <template #body>
        <p class="delete-text">确定要撤销此 API 密钥吗？此操作不可恢复。</p>
      </template>
      <template #footer>
        <div class="modal-actions">
          <UButton color="neutral" variant="outline" @click="deleteVisible = false">取消</UButton>
          <UButton color="error" :loading="deletingLoading" @click="confirmDelete">撤销</UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
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
const { get, post, del } = useApi()

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

function formatDate(value: string) {
  return new Date(value).toLocaleString('zh-CN')
}

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
    toast.add({ title: '获取密钥列表失败', color: 'error' })
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
  errors.name = form.name.trim() ? '' : '请输入密钥名称'
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
    toast.add({ title: '创建失败', color: 'error' })
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
    toast.add({ title: res.data?.message || '撤销成功', color: 'success' })
    deleteVisible.value = false
    await fetchKeys()
  } finally {
    deletingLoading.value = false
  }
}

const copyKey = async () => {
  await navigator.clipboard.writeText(newKey.value)
  toast.add({ title: '已复制到剪贴板', color: 'success' })
}

onMounted(() => {
  fetchKeys()
})
</script>

<style scoped>
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
