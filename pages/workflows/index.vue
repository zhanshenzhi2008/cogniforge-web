<template>
  <div class="cf-page">
    <div class="cf-page-header">
      <div class="cf-page-heading">
        <h1 class="cf-page-title">{{ t('flows.title') }}</h1>
        <p class="cf-page-sub">{{ t('flows.sub') }}</p>
      </div>
      <CfButton tone="primary" icon="i-lucide-plus" @click="handleCreate">
        {{ t('flows.new') }}
      </CfButton>
    </div>

    <div class="list-toolbar">
      <span class="list-count">{{ t('flows.count', { n: workflows.length }) }}</span>
      <span class="list-hint">{{ t('flows.hint') }}</span>
    </div>

    <div class="cf-panel">
      <div v-if="loading" class="cf-state">
        <UIcon name="i-lucide-loader-circle" class="size-6 animate-spin" />
        <span>{{ t('common.loading') }}</span>
      </div>

      <div v-else-if="workflows.length === 0" class="cf-state">
        <UIcon name="i-lucide-git-branch" class="size-8 opacity-50" />
        <p>{{ t('flows.empty') }}</p>
      </div>

      <div v-else class="cf-table-wrap">
        <table class="cf-data-table">
          <thead>
            <tr>
              <th>{{ t('common.name') }}</th>
              <th>{{ t('common.description') }}</th>
              <th>{{ t('flows.version') }}</th>
              <th>{{ t('common.createdAt') }}</th>
              <th class="cf-col-actions">{{ t('common.actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="workflow in workflows"
              :key="workflow.id"
              :title="t('flows.hint')"
              @dblclick="openCanvas(workflow)"
            >
              <td>
                <div class="workflow-name">
                  <a
                    :href="`/workflows/${encodeURIComponent(workflow.id)}`"
                    class="name-link"
                    @click.prevent="openCanvas(workflow)"
                  >
                    {{ workflow.name }}
                  </a>
                  <UBadge
                    size="sm"
                    variant="subtle"
                    :color="statusColor(workflow.status)"
                  >
                    {{ statusText(workflow.status) }}
                  </UBadge>
                </div>
              </td>
              <td class="cf-muted">{{ workflow.description || '—' }}</td>
              <td class="cf-muted">v{{ workflow.version }}</td>
              <td class="cf-muted">{{ d(workflow.created_at) }}</td>
              <td @dblclick.stop>
                <div class="action-btns">
                  <CfButton
                    tone="icon"
                    icon="i-lucide-external-link"
                    :tip="t('flows.canvas')"
                    @click="openCanvas(workflow)"
                  />
                  <CfButton
                    tone="icon"
                    icon="i-lucide-rocket"
                    :tip="t('flows.run')"
                    @click="handleExecute(workflow)"
                  />
                  <CfButton
                    tone="icon-danger"
                    icon="i-lucide-trash-2"
                    :tip="t('common.delete')"
                    @click="askDelete(workflow)"
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
      :title="t('flows.createTitle')"
      :ui="{ content: 'sm:max-w-lg' }"
    >
      <template #body>
        <form id="workflow-form" class="form-grid" @submit.prevent="handleSubmit">
          <div class="field">
            <label class="field__label">{{ t('common.name') }}</label>
            <UInput v-model="form.name" class="w-full" :placeholder="t('flows.namePh')" />
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
        </form>
      </template>

      <template #footer>
        <div class="modal-actions">
          <div class="modal-actions__right">
            <CfButton tone="secondary" icon="i-lucide-x" @click="dialogVisible = false">{{ t('common.cancel') }}</CfButton>
            <CfButton
              form="workflow-form"
              type="submit"
              tone="primary"
              icon="i-lucide-plus"
              :loading="submitting"
            >
              {{ t('common.create') }}
            </CfButton>
          </div>
        </div>
      </template>
    </UModal>

    <UModal v-model:open="deleteVisible" :title="t('common.deleteConfirm')" :ui="{ content: 'sm:max-w-md' }">
      <template #body>
        <p class="delete-text">
          {{ t('flows.deleteText', { name: deleting?.name ?? '' }) }}
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
import type { Workflow } from '@/composables/useWorkflows'

definePageMeta({
  layout: 'default',
})

/** Same as the list page: local-only check that the dynamic route + canvas render. */
const CANVAS_SMOKE_ID = '__canvas_smoke__'

const toast = useToast()
const { t, d } = useLocale()
const { list, create, remove, execute } = useWorkflows()

const openSmokeTest = () => {
  navigateTo(`/workflows/${CANVAS_SMOKE_ID}`)
}

const openFirstWorkflow = () => {
  const id = workflows.value[0]?.id
  if (!id) {
    toast.add({ title: t('flows.listEmpty'), color: 'warning' })
    return
  }
  navigateTo(`/workflows/${encodeURIComponent(id)}`)
}

const loading = ref(false)
const submitting = ref(false)
const workflows = ref<Workflow[]>([])
const dialogVisible = ref(false)
const deleteVisible = ref(false)
const deletingLoading = ref(false)
const deleting = ref<Workflow | null>(null)

const form = reactive({
  name: '',
  description: '',
})
const errors = reactive({ name: '' })

function statusColor(status: string): 'neutral' | 'success' | 'warning' {
  switch (status) {
    case 'published': return 'success'
    case 'archived': return 'warning'
    case 'draft':
    default: return 'neutral'
  }
}

function statusText(status: string) {
  if (status === 'draft' || status === 'published' || status === 'archived') {
    return t(`status.${status}`)
  }
  return status
}

function validate() {
  errors.name = form.name.trim() ? '' : t('common.nameRequired')
  if (form.name.trim().length > 100) errors.name = t('common.nameTooLong')
  return !errors.name
}

const fetchWorkflows = async () => {
  loading.value = true
  try {
    const res = await list()
    if (res.error) {
      toast.add({ title: res.error, color: 'error' })
      return
    }
    workflows.value = res.data || []
  } catch {
    toast.add({ title: t('flows.listFail'), color: 'error' })
  } finally {
    loading.value = false
  }
}

const handleCreate = () => {
  form.name = ''
  form.description = ''
  errors.name = ''
  dialogVisible.value = true
}

const openCanvas = (workflow: Workflow) => {
  navigateTo(`/workflows/${encodeURIComponent(workflow.id)}`)
}

const handleExecute = async (workflow: Workflow) => {
  const res = await execute(workflow.id)
  if (res.error) {
    toast.add({ title: res.error, color: 'error' })
    return
  }
  toast.add({ title: t('flows.started', { id: res.executionId }), color: 'success' })
}

const askDelete = (workflow: Workflow) => {
  deleting.value = workflow
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
    await fetchWorkflows()
  } finally {
    deletingLoading.value = false
  }
}

const handleSubmit = async () => {
  if (!validate()) return
  submitting.value = true
  try {
    const res = await create({
      name: form.name,
      description: form.description,
    })
    if (res.error) {
      toast.add({ title: res.error, color: 'error' })
      return
    }
    toast.add({ title: t('common.createOk'), color: 'success' })
    dialogVisible.value = false
    await fetchWorkflows()
  } catch {
    toast.add({ title: t('common.createFail'), color: 'error' })
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  fetchWorkflows()
})
</script>

<style scoped>

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

.workflow-name {
  display: flex;
  align-items: center;
  gap: 8px;
}

.workflow-name .name-link {
  font-weight: 600;
  color: var(--cf-ink);
  cursor: pointer;
  text-decoration: none;
  transition: color 0.15s;
}

.workflow-name .name-link:hover {
  color: var(--cf-accent, #4f46e5);
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
