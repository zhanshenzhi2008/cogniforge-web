<template>
  <div class="cf-page">
    <div class="cf-page-header">
      <div class="cf-page-heading">
        <h1 class="cf-page-title">{{ t('agents.title') }}</h1>
        <p class="cf-page-sub">{{ t('agents.sub') }}</p>
      </div>
      <CfButton tone="primary" icon="i-lucide-plus" @click="handleCreate">
        {{ t('agents.new') }}
      </CfButton>
    </div>

    <div class="list-toolbar">
      <span class="list-count">{{ t('agents.count', { n: agents.length }) }}</span>
      <span class="list-hint">{{ t('common.hintDblclickDetail') }}</span>
    </div>

    <div class="cf-panel">
      <div v-if="loading" class="cf-state">
        <UIcon name="i-lucide-loader-circle" class="size-6 animate-spin" />
        <span>{{ t('common.loading') }}</span>
      </div>

      <div v-else-if="agents.length === 0" class="cf-state">
        <UIcon name="i-lucide-bot" class="size-8 opacity-50" />
        <p>{{ t('agents.empty') }}</p>
      </div>

      <div v-else class="cf-table-wrap">
        <table class="cf-data-table">
          <thead>
            <tr>
              <th>{{ t('common.name') }}</th>
              <th>{{ t('common.description') }}</th>
              <th>{{ t('common.model') }}</th>
              <th>{{ t('common.createdAt') }}</th>
              <th class="cf-col-actions">{{ t('common.actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="agent in agents"
              :key="agent.id"
              class="list-row"
              @dblclick="handleView(agent)"
            >
              <td>
                <div class="agent-name">
                  <span class="name">{{ agent.name }}</span>
                  <UBadge
                    size="sm"
                    variant="subtle"
                    :color="agent.status === 'active' ? 'success' : 'neutral'"
                  >
                    {{ agent.status === 'active' ? t('common.enabled') : t('common.disabled') }}
                  </UBadge>
                </div>
              </td>
              <td class="cf-muted">{{ agent.description || '—' }}</td>
              <td>
                <UBadge size="sm" variant="subtle" color="primary">{{ agent.model }}</UBadge>
              </td>
              <td class="cf-muted">{{ d(agent.created_at) }}</td>
              <td @dblclick.stop>
                <div class="action-btns">
                  <CfButton
                    tone="icon-accent"
                    icon="i-lucide-pencil"
                    :tip="t('common.edit')"
                    @click="handleEdit(agent)"
                  />
                  <CfButton
                    tone="icon"
                    icon="i-lucide-message-square"
                    :tip="t('agents.chat')"
                    @click="handleChat(agent)"
                  />
                  <CfButton
                    tone="icon-danger"
                    icon="i-lucide-trash-2"
                    :tip="t('common.delete')"
                    @click="askDelete(agent)"
                  />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <UModal
      v-model:open="dialogVisible"
      :title="dialogTitle"
      :description="dialogDescription"
      :ui="{ content: 'sm:max-w-lg' }"
    >
      <template #body>
        <!-- View: read-only detail sheet -->
        <div v-if="dialogMode === 'view' && viewingAgent" class="detail-sheet">
          <div class="detail-hero">
            <span class="detail-hero-icon">
              <UIcon name="i-lucide-bot" class="size-6" />
            </span>
            <div class="detail-hero-text">
              <div class="detail-hero-name">{{ viewingAgent.name }}</div>
              <div class="detail-hero-sub">
                <UBadge size="sm" variant="subtle" color="primary">{{ viewingAgent.model }}</UBadge>
                <UBadge
                  size="sm"
                  variant="subtle"
                  :color="viewingAgent.status === 'active' ? 'success' : 'neutral'"
                >
                  {{ viewingAgent.status === 'active' ? t('common.enabled') : t('common.disabled') }}
                </UBadge>
              </div>
            </div>
          </div>

          <dl class="detail-list">
            <div class="detail-row">
              <dt>{{ t('common.name') }}</dt>
              <dd>{{ viewingAgent.name }}</dd>
            </div>
            <div class="detail-row detail-row--block">
              <dt>{{ t('common.description') }}</dt>
              <dd>{{ viewingAgent.description || '—' }}</dd>
            </div>
            <div class="detail-row">
              <dt>{{ t('common.model') }}</dt>
              <dd>{{ viewingAgent.model }}</dd>
            </div>
            <div class="detail-row">
              <dt>{{ t('common.status') }}</dt>
              <dd>{{ viewingAgent.status === 'active' ? t('common.enabled') : t('common.disabled') }}</dd>
            </div>
            <div class="detail-row detail-row--block">
              <dt>{{ t('agents.systemPrompt') }}</dt>
              <dd>
                <pre v-if="viewingAgent.system_prompt" class="detail-pre">{{ viewingAgent.system_prompt }}</pre>
                <span v-else>—</span>
              </dd>
            </div>
            <div class="detail-row">
              <dt>{{ t('agents.tools') }}</dt>
              <dd>
                <div v-if="viewingAgent.tools?.length" class="detail-tools">
                  <UBadge
                    v-for="tool in viewingAgent.tools"
                    :key="tool"
                    size="sm"
                    variant="subtle"
                    color="neutral"
                  >
                    {{ toolLabel(tool) }}
                  </UBadge>
                </div>
                <span v-else>—</span>
              </dd>
            </div>
            <div class="detail-row">
              <dt>{{ t('common.createdAt') }}</dt>
              <dd>{{ d(viewingAgent.created_at) }}</dd>
            </div>
            <div class="detail-row">
              <dt>{{ t('common.updatedAt') }}</dt>
              <dd>{{ d(viewingAgent.updated_at) }}</dd>
            </div>
          </dl>
        </div>

        <!-- Create / Edit form -->
        <form v-else id="agent-form" class="form-grid" @submit.prevent="handleSubmit">
          <div class="field">
            <label class="field__label">{{ t('common.name') }}</label>
            <UInput v-model="form.name" class="w-full" :placeholder="t('agents.namePh')" />
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
            <label class="field__label">{{ t('common.model') }}</label>
            <USelect
              v-model="form.model"
              class="w-full"
              :items="modelOptions"
              :placeholder="t('agents.pickModel')"
            />
            <p v-if="errors.model" class="field__error">{{ errors.model }}</p>
          </div>

          <div class="field">
            <label class="field__label">{{ t('agents.systemPrompt') }}</label>
            <UTextarea
              v-model="form.system_prompt"
              class="w-full"
              :rows="4"
              :placeholder="t('agents.systemPh')"
            />
          </div>

          <div class="field">
            <label class="field__label">{{ t('agents.tools') }}</label>
            <div class="tools">
              <UCheckbox
                v-for="tool in toolOptions"
                :key="tool.value"
                v-model="form.tools"
                :value="tool.value"
                :label="tool.label"
              />
            </div>
          </div>

          <div class="field field--row">
            <label class="field__label">{{ t('common.status') }}</label>
            <div class="status-row">
              <USwitch v-model="statusEnabled" />
              <span>{{ statusEnabled ? t('common.enabled') : t('common.disabled') }}</span>
            </div>
          </div>
        </form>
      </template>

      <template #footer>
        <div class="modal-actions" :class="{ 'modal-actions--view': dialogMode === 'view' }">
          <template v-if="dialogMode === 'view'">
            <div class="modal-actions__right">
              <CfButton
                tone="primary"
                icon="i-lucide-pencil"
                @click="enterEditFromView"
              >
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
                form="agent-form"
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
    </UModal>

    <UModal v-model:open="deleteVisible" :title="t('common.deleteConfirm')" :ui="{ content: 'sm:max-w-md' }">
      <template #body>
        <p class="delete-text">
          {{ t('agents.deleteText', { name: deleting?.name ?? '' }) }}
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
    </UModal>
  </div>
</template>

<script setup lang="ts">
import type { Agent, CreateAgentInput, UpdateAgentInput } from '@/composables/useAgents'

definePageMeta({
  layout: 'default',
})

const router = useRouter()
const toast = useToast()
const { t, d } = useLocale()
const { list, create, update, remove } = useAgents()
const { list: listModels } = useModels()

const loading = ref(false)
const submitting = ref(false)
const agents = ref<Agent[]>([])
const dialogVisible = ref(false)
const dialogMode = ref<'create' | 'view' | 'edit'>('create')
const cameFromView = ref(false)
const viewingAgent = ref<Agent | null>(null)
const deleteVisible = ref(false)
const deletingLoading = ref(false)
const deleting = ref<Agent | null>(null)
const editingId = ref('')

const dialogTitle = computed(() => {
  if (dialogMode.value === 'create') return t('agents.createTitle')
  if (dialogMode.value === 'view') return t('agents.viewTitle')
  return t('agents.editTitle')
})

const dialogDescription = computed(() => {
  if (dialogMode.value === 'create') return t('agents.createDesc')
  if (dialogMode.value === 'view') return t('agents.viewDesc')
  return t('agents.editDesc')
})

const form = reactive({
  name: '',
  description: '',
  model: '',
  system_prompt: '',
  tools: [] as string[],
})
const statusEnabled = ref(true)
const errors = reactive({ name: '', model: '' })

const modelOptions = ref<{ label: string; value: string }[]>([])

const firstConfiguredModel = () => modelOptions.value[0]?.value || ''

const fetchModelOptions = async () => {
  const res = await listModels()
  modelOptions.value = (res.data || [])
    .filter(m => m.id)
    .map(m => ({ label: m.name || m.id, value: m.id }))
  if (!form.model && firstConfiguredModel()) {
    form.model = firstConfiguredModel()
  }
}

const toolOptions = computed(() => [
  { label: t('agents.tool.web'), value: 'web_search' },
  { label: t('agents.tool.calc'), value: 'calculator' },
  { label: t('agents.tool.code'), value: 'code_executor' },
])

function toolLabel(value: string) {
  return toolOptions.value.find((item) => item.value === value)?.label || value
}

function validate() {
  errors.name = form.name.trim() ? '' : t('common.nameRequired')
  if (form.name.trim().length > 100) errors.name = t('common.nameTooLong')
  errors.model = form.model ? '' : t('agents.needModel')
  return !errors.name && !errors.model
}

const fetchAgents = async () => {
  loading.value = true
  try {
    const res = await list()
    if (res.error) {
      toast.add({ title: res.error, color: 'error' })
      return
    }
    agents.value = res.data || []
  } catch {
    toast.add({ title: t('agents.listFail'), color: 'error' })
  } finally {
    loading.value = false
  }
}

const resetForm = () => {
  form.name = ''
  form.description = ''
  form.model = firstConfiguredModel()
  form.system_prompt = ''
  form.tools = []
  statusEnabled.value = true
  errors.name = ''
  errors.model = ''
}

function fillFormFromAgent(agent: Agent) {
  form.name = agent.name
  form.description = agent.description || ''
  form.model = agent.model
  form.system_prompt = agent.system_prompt || ''
  form.tools = [...(agent.tools || [])]
  statusEnabled.value = agent.status === 'active'
  errors.name = ''
  errors.model = ''
}

const handleCreate = () => {
  dialogMode.value = 'create'
  cameFromView.value = false
  editingId.value = ''
  viewingAgent.value = null
  resetForm()
  dialogVisible.value = true
}

const handleView = (agent: Agent) => {
  dialogMode.value = 'view'
  cameFromView.value = true
  viewingAgent.value = agent
  editingId.value = agent.id
  fillFormFromAgent(agent)
  dialogVisible.value = true
}

const handleEdit = (agent: Agent) => {
  dialogMode.value = 'edit'
  cameFromView.value = false
  viewingAgent.value = agent
  editingId.value = agent.id
  fillFormFromAgent(agent)
  dialogVisible.value = true
}

const enterEditFromView = () => {
  if (!viewingAgent.value) return
  dialogMode.value = 'edit'
  cameFromView.value = true
  fillFormFromAgent(viewingAgent.value)
}

const handleChat = (agent: Agent) => {
  router.push(`/playground?agent=${agent.id}`)
}

const askDelete = (agent: Agent) => {
  deleting.value = agent
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
    await fetchAgents()
  } finally {
    deletingLoading.value = false
  }
}

const handleSubmit = async () => {
  if (!validate()) return
  submitting.value = true
  try {
    if (dialogMode.value === 'edit') {
      const input: UpdateAgentInput = {
        name: form.name,
        description: form.description,
        model: form.model,
        system_prompt: form.system_prompt,
        tools: form.tools,
        status: statusEnabled.value ? 'active' : 'disabled',
      }
      const res = await update(editingId.value, input)
      if (res.error) {
        toast.add({ title: res.error, color: 'error' })
        return
      }
      toast.add({ title: t('common.saveOk'), color: 'success' })
    } else {
      const input: CreateAgentInput = {
        name: form.name,
        description: form.description,
        model: form.model,
        system_prompt: form.system_prompt,
        tools: form.tools,
      }
      const res = await create(input)
      if (res.error) {
        toast.add({ title: res.error, color: 'error' })
        return
      }
      toast.add({ title: t('common.createOk'), color: 'success' })
    }
    dialogVisible.value = false
    await fetchAgents()
  } catch {
    toast.add({ title: dialogMode.value === 'edit' ? t('common.saveFail') : t('common.createFail'), color: 'error' })
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  fetchAgents()
  fetchModelOptions()
})
</script>

<style scoped>

.list-count {
  font-size: 0.8rem;
  color: var(--cf-ink-soft);
}

.list-hint {
  font-size: 0.8rem;
  color: var(--cf-ink-soft);
}

.list-row {
  cursor: pointer;
}

.agent-name {
  display: flex;
  align-items: center;
  gap: 8px;
}

.agent-name .name {
  font-weight: 600;
  color: var(--cf-ink);
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

.tools {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 16px;
}

.status-row {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--cf-ink-soft);
  font-size: 0.875rem;
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

.detail-tools {
  display: flex;
  flex-wrap: wrap;
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
</style>
