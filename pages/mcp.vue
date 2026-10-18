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
            <tr
              v-for="srv in servers"
              :key="srv.id"
              class="row-click"
              @click="openDetail(srv)"
            >
              <td>
                <div class="srv-name">
                  <UIcon :name="srv.type === 'built-in' ? 'i-lucide-cpu' : 'i-lucide-globe'" class="size-4" />
                  <span class="name">{{ srv.name }}</span>
                </div>
                <p v-if="srvDesc(srv)" class="srv-desc">{{ srvDesc(srv) }}</p>
              </td>
              <td>
                <UBadge
                  size="sm"
                  variant="subtle"
                  :color="srv.type === 'built-in' ? 'primary' : 'neutral'"
                >
                  {{ srv.type === 'built-in' ? t('mcp.typeBuiltin') : t('mcp.typeHttp') }}
                </UBadge>
              </td>
              <td>
                <UBadge size="sm" variant="subtle" :color="srv.enabled ? 'success' : 'neutral'">
                  {{ srv.enabled ? t('common.enabled') : t('common.disabled') }}
                </UBadge>
              </td>
              <td class="cf-muted">{{ srv.type === 'built-in' ? '—' : d(srv.created_at) }}</td>
              <td>
                <div class="action-btns" @click.stop>
                  <CfButton
                    tone="icon-accent"
                    icon="i-lucide-eye"
                    :tip="t('mcp.viewDetail')"
                    @click="openDetail(srv)"
                  />
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

    <!-- Detail: tools + config -->
    <USlideover
      v-model:open="detailOpen"
      :title="detail?.name || t('mcp.detailTitle')"
      :ui="{ content: 'max-w-md w-full sm:max-w-lg' }"
    >
      <template #body>
        <div v-if="detail" class="detail">
          <div class="detail-meta">
            <UBadge size="sm" variant="subtle" :color="detail.type === 'built-in' ? 'primary' : 'neutral'">
              {{ detail.type === 'built-in' ? t('mcp.typeBuiltin') : t('mcp.typeHttp') }}
            </UBadge>
            <UBadge size="sm" variant="subtle" :color="detail.enabled ? 'success' : 'neutral'">
              {{ detail.enabled ? t('common.enabled') : t('common.disabled') }}
            </UBadge>
          </div>
          <p class="detail-desc">{{ srvDesc(detail) || t('mcp.noDesc') }}</p>

          <div v-if="detail.type === 'http'" class="detail-block">
            <h4>{{ t('mcp.config') }}</h4>
            <dl class="kv">
              <dt>URL</dt>
              <dd class="mono">{{ detail.url || '—' }}</dd>
              <dt>{{ t('mcp.authHeader') }}</dt>
              <dd class="mono">{{ detail.auth_header ? t('mcp.authSet') : t('mcp.authEmpty') }}</dd>
            </dl>
            <p class="hint">{{ t('mcp.httpLimitHint') }}</p>
          </div>
          <div v-else class="detail-block">
            <p class="hint">{{ t('mcp.builtinHint') }}</p>
          </div>

          <div class="detail-block">
            <div class="detail-block-head">
              <h4>{{ t('mcp.tools') }}</h4>
              <span class="cf-muted">{{ t('mcp.toolsCount', { n: detailTools.length }) }}</span>
            </div>
            <div v-if="toolsLoading" class="cf-muted">{{ t('common.loading') }}</div>
            <div v-else-if="!detailTools.length" class="cf-muted">{{ t('mcp.toolsEmpty') }}</div>
            <ul v-else class="tool-list">
              <li v-for="tool in detailTools" :key="tool.name" class="tool-card">
                <div class="tool-name mono">{{ tool.name }}</div>
                <p class="tool-desc">{{ tool.description || '—' }}</p>
                <div v-if="toolParams(tool).length" class="tool-params">
                  <span v-for="p in toolParams(tool)" :key="p" class="param-chip">{{ p }}</span>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </template>
    </USlideover>

    <!-- Create / Edit Modal -->
    <UModal
      v-model:open="dialogVisible"
      :title="dialogMode === 'create' ? t('mcp.createTitle') : t('mcp.editTitle')"
      :description="dialogMode === 'create' ? t('mcp.createDesc') : t('mcp.editDesc')"
      :ui="{ content: 'sm:max-w-lg' }"
    >
      <template #body>
        <form id="mcp-form" class="form-grid" @submit.prevent="handleSubmit">
          <p class="form-hint">{{ t('mcp.feishuHint') }}</p>

          <div class="field">
            <label class="field__label">{{ t('common.name') }} *</label>
            <UInput v-model="form.name" class="w-full" :placeholder="t('mcp.namePh')" />
            <p v-if="errors.name" class="field__error">{{ errors.name }}</p>
          </div>

          <div class="field">
            <label class="field__label">{{ t('mcp.description') }}</label>
            <UInput v-model="form.description" class="w-full" :placeholder="t('mcp.descPh')" />
          </div>

          <div class="field">
            <label class="field__label">{{ t('mcp.url') }} *</label>
            <UInput
              v-model="form.url"
              class="w-full"
              :placeholder="t('mcp.urlPh')"
            />
            <p v-if="errors.url" class="field__error">{{ errors.url }}</p>
          </div>

          <div class="field">
            <label class="field__label">{{ t('mcp.authHeader') }}</label>
            <UInput
              v-model="form.auth_header"
              class="w-full"
              :placeholder="t('mcp.authHeaderPh')"
            />
            <p class="field-hint">{{ t('mcp.authHint') }}</p>
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
import type { McpServer, McpTool } from '@/composables/useMcpServers'

definePageMeta({ layout: 'default' })

const toast = useToast()
const { t, d } = useLocale()
const { list, listTools, create, update, remove } = useMcpServers()

const loading = ref(false)
const submitting = ref(false)
const servers = ref<McpServer[]>([])
const dialogVisible = ref(false)
const dialogMode = ref<'create' | 'edit'>('create')
const editingId = ref('')
const deleteVisible = ref(false)
const deletingLoading = ref(false)
const deleting = ref<McpServer | null>(null)

const detailOpen = ref(false)
const detail = ref<McpServer | null>(null)
const detailTools = ref<McpTool[]>([])
const toolsLoading = ref(false)

const form = reactive({
  name: '',
  description: '',
  url: '',
  auth_header: '',
  enabled: true,
})
const errors = reactive({ name: '', url: '' })

const srvDesc = (srv: McpServer) => {
  const d0 = srv.metadata?.description
  return typeof d0 === 'string' ? d0 : ''
}

const toolParams = (tool: McpTool): string[] => {
  const props = tool.input_schema?.properties
  if (!props || typeof props !== 'object') return []
  return Object.keys(props)
}

const validate = () => {
  errors.name = form.name.trim() ? '' : t('common.nameRequired')
  errors.url = form.url.trim() ? '' : t('mcp.urlRequired')
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

const openDetail = async (srv: McpServer) => {
  detail.value = srv
  detailOpen.value = true
  detailTools.value = []
  toolsLoading.value = true
  const res = await listTools(srv.id)
  toolsLoading.value = false
  if (res.error) {
    toast.add({ title: res.error, color: 'error' })
    return
  }
  detailTools.value = res.data || []
}

const resetForm = () => {
  form.name = ''
  form.description = ''
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
  form.description = srvDesc(srv)
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
    const metadata: Record<string, any> = {}
    if (form.description.trim()) metadata.description = form.description.trim()
    const payload: Partial<McpServer> = {
      name: form.name.trim(),
      type: 'http',
      url: form.url.trim(),
      auth_header: form.auth_header.trim() || undefined,
      enabled: form.enabled,
      metadata,
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

.row-click {
  cursor: pointer;
}

.row-click:hover {
  background: color-mix(in oklab, var(--cf-accent) 6%, transparent);
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

.srv-desc {
  margin: 4px 0 0;
  font-size: 0.75rem;
  color: var(--cf-ink-soft);
  line-height: 1.35;
  max-width: 28rem;
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

.form-hint {
  margin: 0;
  padding: 0.65rem 0.75rem;
  font-size: 0.8125rem;
  line-height: 1.45;
  color: var(--cf-ink-soft);
  background: color-mix(in oklab, var(--cf-accent) 8%, transparent);
  border-radius: 0.5rem;
  border: 1px solid color-mix(in oklab, var(--cf-accent) 22%, var(--cf-line));
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

.field-hint {
  margin: 0;
  font-size: 0.75rem;
  color: var(--cf-ink-soft);
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

.detail {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.detail-meta {
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.detail-desc {
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.5;
  color: var(--cf-ink);
}

.detail-block h4 {
  margin: 0 0 0.5rem;
  font-size: 0.8125rem;
  font-weight: 650;
}

.detail-block-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.detail-block-head h4 {
  margin: 0;
}

.hint {
  margin: 0.5rem 0 0;
  font-size: 0.75rem;
  color: var(--cf-ink-soft);
  line-height: 1.45;
}

.kv {
  display: grid;
  grid-template-columns: 5.5rem 1fr;
  gap: 0.35rem 0.75rem;
  margin: 0;
  font-size: 0.8125rem;
}

.kv dt {
  color: var(--cf-ink-soft);
}

.kv dd {
  margin: 0;
  word-break: break-all;
}

.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.78rem;
}

.tool-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.tool-card {
  padding: 0.65rem 0.75rem;
  border-radius: 0.55rem;
  border: 1px solid color-mix(in oklab, var(--cf-line) 85%, transparent);
  background: color-mix(in oklab, var(--cf-nav-surface, var(--ui-bg)) 50%, transparent);
}

.tool-name {
  font-weight: 650;
  color: var(--cf-ink);
  margin-bottom: 0.25rem;
}

.tool-desc {
  margin: 0;
  font-size: 0.78rem;
  line-height: 1.4;
  color: var(--cf-ink-soft);
}

.tool-params {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
  margin-top: 0.45rem;
}

.param-chip {
  font-size: 0.6875rem;
  padding: 0.1rem 0.4rem;
  border-radius: 0.3rem;
  background: color-mix(in oklab, var(--cf-ink) 6%, transparent);
  color: var(--cf-ink-soft);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}
</style>
