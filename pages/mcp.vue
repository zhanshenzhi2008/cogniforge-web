<template>
  <div class="cf-page">
    <div class="cf-page-header">
      <div class="cf-page-heading">
        <h1 class="cf-page-title">{{ t('mcp.title') }}</h1>
        <p class="cf-page-sub">{{ t('mcp.sub') }}</p>
      </div>
      <CfButton tone="primary" icon="i-lucide-plus" @click="handleCreate">
        {{ t('mcp.new') }}
      </CfButton>
    </div>

    <div class="list-toolbar">
      <span class="list-count">{{ t('mcp.count', { n: servers.length }) }}</span>
    </div>

    <div class="cf-panel">
      <div v-if="loading" class="cf-state">
        <UIcon name="i-lucide-loader-circle" class="size-6 animate-spin" />
        <span>{{ t('common.loading') }}</span>
      </div>

      <div v-else-if="servers.length === 0" class="cf-state">
        <UIcon name="i-lucide-plug" class="size-8 opacity-50" />
        <p>{{ t('mcp.empty') }}</p>
      </div>

      <div v-else class="cf-table-wrap">
        <table class="cf-data-table">
          <thead>
            <tr>
              <th>{{ t('common.name') }}</th>
              <th>{{ t('mcp.type') }}</th>
              <th>{{ t('common.status') }}</th>
              <th>{{ t('common.createdAt') }}</th>
              <th class="cf-col-actions">{{ t('common.actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="srv in servers" :key="srv.id">
              <td>
                <div class="srv-name">
                  <UIcon :name="srv.type === 'built-in' ? 'i-lucide-cpu' : 'i-lucide-globe'" class="size-4" />
                  <span class="name">{{ srv.name }}</span>
                  <UBadge v-if="srv.type === 'built-in'" size="xs" variant="subtle" color="primary">
                    {{ t('mcp.builtIn') }}
                  </UBadge>
                </div>
              </td>
              <td>
                <span class="cf-muted">{{ srv.type === 'built-in' ? t('mcp.typeBuiltin') : t('mcp.typeHttp') }}</span>
              </td>
              <td>
                <UBadge size="sm" variant="subtle" :color="srv.enabled ? 'success' : 'neutral'">
                  {{ srv.enabled ? t('common.enabled') : t('common.disabled') }}
                </UBadge>
              </td>
              <td class="cf-muted">{{ d(srv.created_at) }}</td>
              <td>
                <div class="action-btns">
                  <CfButton
                    v-if="srv.type !== 'built-in'"
                    tone="icon-accent"
                    icon="i-lucide-pencil"
                    :tip="t('common.edit')"
                    @click="handleEdit(srv)"
                  />
                  <CfButton
                    v-if="srv.type !== 'built-in'"
                    tone="icon-danger"
                    icon="i-lucide-trash-2"
                    :tip="t('common.delete')"
                    @click="askDelete(srv)"
                  />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Create / Edit Modal -->
    <UModal
      v-model:open="dialogVisible"
      :title="dialogMode === 'create' ? t('mcp.createTitle') : t('mcp.editTitle')"
      :description="dialogMode === 'create' ? t('mcp.createDesc') : t('mcp.editDesc')"
      :ui="{ content: 'sm:max-w-lg' }"
    >
      <template #body>
        <form id="mcp-form" class="form-grid" @submit.prevent="handleSubmit">
          <div class="field">
            <label class="field__label">{{ t('common.name') }} *</label>
            <UInput v-model="form.name" class="w-full" :placeholder="t('mcp.namePh')" />
            <p v-if="errors.name" class="field__error">{{ errors.name }}</p>
          </div>

          <div class="field">
            <label class="field__label">{{ t('mcp.type') }}</label>
            <USelect
              v-model="form.type"
              class="w-full"
              :items="typeOptions"
              :disabled="dialogMode === 'edit'"
            />
          </div>

          <div v-if="form.type === 'http'" class="field">
            <label class="field__label">{{ t('mcp.url') }} *</label>
            <UInput
              v-model="form.url"
              class="w-full"
              placeholder="https://your-mcp-server.com/mcp"
            />
            <p v-if="errors.url" class="field__error">{{ errors.url }}</p>
          </div>

          <div v-if="form.type === 'http'" class="field">
            <label class="field__label">{{ t('mcp.authHeader') }}</label>
            <UInput
              v-model="form.auth_header"
              class="w-full"
              :placeholder="t('mcp.authHeaderPh')"
            />
          </div>

          <div class="field field--row">
            <label class="field__label">{{ t('common.status') }}</label>
            <div class="status-row">
              <USwitch v-model="form.enabled" />
              <span>{{ form.enabled ? t('common.enabled') : t('common.disabled') }}</span>
            </div>
          </div>
        </form>
      </template>

      <template #footer>
        <div class="modal-actions">
          <div class="modal-actions__right">
            <CfButton tone="secondary" icon="i-lucide-x" @click="dialogVisible = false">
              {{ t('common.cancel') }}
            </CfButton>
            <CfButton
              form="mcp-form"
              type="submit"
              tone="primary"
              :icon="dialogMode === 'edit' ? 'i-lucide-check' : 'i-lucide-plus'"
              :loading="submitting"
            >
              {{ dialogMode === 'edit' ? t('common.save') : t('common.create') }}
            </CfButton>
          </div>
        </div>
      </template>
    </UModal>

    <!-- Delete Confirm -->
    <UModal v-model:open="deleteVisible" :title="t('common.deleteConfirm')" :ui="{ content: 'sm:max-w-md' }">
      <template #body>
        <p class="delete-text">
          {{ t('mcp.deleteText', { name: deleting?.name ?? '' }) }}
        </p>
      </template>
      <template #footer>
        <div class="modal-actions">
          <div class="modal-actions__right">
            <CfButton tone="secondary" icon="i-lucide-x" @click="deleteVisible = false">
              {{ t('common.cancel') }}
            </CfButton>
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
  </div>
</template>

<script setup lang="ts">
import type { McpServer } from '@/composables/useMcpServers'

definePageMeta({ layout: 'default' })

const toast = useToast()
const { t, d } = useLocale()
const { list, create, update, remove } = useMcpServers()

const loading = ref(false)
const submitting = ref(false)
const servers = ref<McpServer[]>([])
const dialogVisible = ref(false)
const dialogMode = ref<'create' | 'edit'>('create')
const editingId = ref('')
const deleteVisible = ref(false)
const deletingLoading = ref(false)
const deleting = ref<McpServer | null>(null)

const form = reactive({
  name: '',
  type: 'http',
  url: '',
  auth_header: '',
  enabled: true,
})
const errors = reactive({ name: '', url: '' })

const typeOptions = [
  { label: 'HTTP Server', value: 'http' },
  { label: t('mcp.builtIn'), value: 'built-in' },
]

const validate = () => {
  errors.name = form.name.trim() ? '' : t('common.nameRequired')
  if (form.type === 'http' && !form.url.trim()) {
    errors.url = t('mcp.urlRequired')
  }
  return !errors.name && !errors.url
}

const fetchServers = async () => {
  loading.value = true
  try {
    const res = await list()
    if (res.error) {
      toast.add({ title: res.error, color: 'error' })
      return
    }
    servers.value = res.data || []
  } catch {
    toast.add({ title: t('mcp.listFail'), color: 'error' })
  } finally {
    loading.value = false
  }
}

const resetForm = () => {
  form.name = ''
  form.type = 'http'
  form.url = ''
  form.auth_header = ''
  form.enabled = true
  errors.name = ''
  errors.url = ''
}

const handleCreate = () => {
  dialogMode.value = 'create'
  editingId.value = ''
  resetForm()
  dialogVisible.value = true
}

const handleEdit = (srv: McpServer) => {
  dialogMode.value = 'edit'
  editingId.value = srv.id
  form.name = srv.name
  form.type = srv.type
  form.url = srv.url || ''
  form.auth_header = srv.auth_header || ''
  form.enabled = srv.enabled
  errors.name = ''
  errors.url = ''
  dialogVisible.value = true
}

const askDelete = (srv: McpServer) => {
  deleting.value = srv
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
    await fetchServers()
  } finally {
    deletingLoading.value = false
  }
}

const handleSubmit = async () => {
  if (!validate()) return
  submitting.value = true
  try {
    const payload = {
      name: form.name,
      type: form.type,
      url: form.url || undefined,
      auth_header: form.auth_header || undefined,
      enabled: form.enabled,
    }
    if (dialogMode.value === 'edit') {
      const res = await update(editingId.value, payload)
      if (res.error) {
        toast.add({ title: res.error, color: 'error' })
        return
      }
      toast.add({ title: t('common.saveOk'), color: 'success' })
    } else {
      const res = await create(payload)
      if (res.error) {
        toast.add({ title: res.error, color: 'error' })
        return
      }
      toast.add({ title: t('common.createOk'), color: 'success' })
    }
    dialogVisible.value = false
    await fetchServers()
  } catch {
    toast.add({ title: dialogMode.value === 'edit' ? t('common.saveFail') : t('common.createFail'), color: 'error' })
  } finally {
    submitting.value = false
  }
}

onMounted(() => { fetchServers() })
</script>

<style scoped>
.list-count {
  font-size: 0.8rem;
  color: var(--cf-ink-soft);
}

.srv-name {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--cf-ink);
}

.srv-name .name {
  font-weight: 600;
}

.action-btns {
  display: flex;
  align-items: center;
  gap: 2px;
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

.field--row {
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
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

.status-row {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--cf-ink-soft);
  font-size: 0.875rem;
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
