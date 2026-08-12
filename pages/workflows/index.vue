<template>
  <div class="workflows-page">
    <div class="page-header">
      <h1 class="page-title font-display">工作流</h1>
      <UButton color="primary" icon="i-lucide-plus" @click="handleCreate">
        创建工作流
      </UButton>
    </div>

    <div class="panel cf-surface">
      <div v-if="loading" class="state-box">
        <UIcon name="i-lucide-loader-circle" class="size-6 animate-spin" />
        <span>加载中…</span>
      </div>

      <div v-else-if="workflows.length === 0" class="state-box">
        <UIcon name="i-lucide-git-branch" class="size-8 opacity-50" />
        <p>暂无工作流，点击上方按钮创建</p>
      </div>

      <div v-else class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>名称</th>
              <th>描述</th>
              <th>版本</th>
              <th>创建时间</th>
              <th class="col-actions">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="workflow in workflows" :key="workflow.id">
              <td>
                <div class="workflow-name">
                  <a
                    :href="`/workflows/${encodeURIComponent(workflow.id)}`"
                    class="name-link"
                    @click.prevent="navigateTo(`/workflows/${encodeURIComponent(workflow.id)}`)"
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
              <td class="muted">{{ workflow.description || '—' }}</td>
              <td class="muted">v{{ workflow.version }}</td>
              <td class="muted">{{ formatDate(workflow.created_at) }}</td>
              <td>
                <div class="action-btns">
                  <UTooltip text="画布">
                    <UButton
                      color="neutral"
                      variant="ghost"
                      icon="i-lucide-external-link"
                      size="sm"
                      @click="navigateTo(`/workflows/${encodeURIComponent(workflow.id)}`)"
                    />
                  </UTooltip>
                  <UTooltip text="执行">
                    <UButton
                      color="neutral"
                      variant="ghost"
                      icon="i-lucide-rocket"
                      size="sm"
                      @click="handleExecute(workflow)"
                    />
                  </UTooltip>
                  <UTooltip text="删除">
                    <UButton
                      color="error"
                      variant="ghost"
                      icon="i-lucide-trash-2"
                      size="sm"
                      @click="askDelete(workflow)"
                    />
                  </UTooltip>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <UModal
      v-model:open="dialogVisible"
      title="创建工作流"
      :ui="{ content: 'sm:max-w-lg' }"
    >
      <template #body>
        <form id="workflow-form" class="form-grid" @submit.prevent="handleSubmit">
          <div class="field">
            <label class="field__label">名称</label>
            <UInput v-model="form.name" class="w-full" placeholder="请输入工作流名称" />
            <p v-if="errors.name" class="field__error">{{ errors.name }}</p>
          </div>

          <div class="field">
            <label class="field__label">描述</label>
            <UTextarea
              v-model="form.description"
              class="w-full"
              :rows="2"
              placeholder="请输入描述（可选）"
            />
          </div>
        </form>
      </template>

      <template #footer>
        <div class="modal-actions">
          <UButton color="neutral" variant="outline" @click="dialogVisible = false">取消</UButton>
          <UButton form="workflow-form" type="submit" color="primary" :loading="submitting">
            创建
          </UButton>
        </div>
      </template>
    </UModal>

    <UModal v-model:open="deleteVisible" title="删除确认" :ui="{ content: 'sm:max-w-md' }">
      <template #body>
        <p class="delete-text">
          确定要删除工作流「{{ deleting?.name }}」吗？此操作不可恢复。
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
import type { Workflow } from '@/composables/useWorkflows'

definePageMeta({
  layout: 'default',
})

/** 与 [id].vue 中一致：仅用于本地验证动态路由 + 画布能否渲染 */
const CANVAS_SMOKE_ID = '__canvas_smoke__'

const toast = useToast()
const { list, create, remove, execute } = useWorkflows()

const openSmokeTest = () => {
  navigateTo(`/workflows/${CANVAS_SMOKE_ID}`)
}

const openFirstWorkflow = () => {
  const id = workflows.value[0]?.id
  if (!id) {
    toast.add({ title: '列表为空', color: 'warning' })
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

function formatDate(value: string) {
  return new Date(value).toLocaleString('zh-CN')
}

function statusColor(status: string): 'neutral' | 'success' | 'warning' {
  switch (status) {
    case 'published': return 'success'
    case 'archived': return 'warning'
    case 'draft':
    default: return 'neutral'
  }
}

function statusText(status: string) {
  switch (status) {
    case 'draft': return '草稿'
    case 'published': return '已发布'
    case 'archived': return '已归档'
    default: return status
  }
}

function validate() {
  errors.name = form.name.trim() ? '' : '名称不能为空'
  if (form.name.trim().length > 100) errors.name = '名称不能超过 100 个字符'
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
    toast.add({ title: '获取工作流列表失败', color: 'error' })
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

const handleExecute = async (workflow: Workflow) => {
  const res = await execute(workflow.id)
  if (res.error) {
    toast.add({ title: res.error, color: 'error' })
    return
  }
  toast.add({ title: `工作流已启动，执行ID: ${res.executionId}`, color: 'success' })
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
    toast.add({ title: '删除成功', color: 'success' })
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
    toast.add({ title: '创建成功', color: 'success' })
    dialogVisible.value = false
    await fetchWorkflows()
  } catch {
    toast.add({ title: '创建失败', color: 'error' })
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  fetchWorkflows()
})
</script>

<style scoped>
.workflows-page {
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px 20px 40px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.page-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--cf-ink);
}

.panel {
  border-radius: 10px;
  padding: 8px;
  min-height: 220px;
}

.state-box {
  min-height: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: var(--cf-ink-soft);
}

.table-wrap {
  width: 100%;
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.data-table th,
.data-table td {
  padding: 12px 14px;
  text-align: left;
  border-bottom: 1px solid var(--cf-line);
  vertical-align: middle;
}

.data-table th {
  color: var(--cf-ink-soft);
  font-weight: 500;
  white-space: nowrap;
}

.col-actions {
  width: 140px;
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

.muted {
  color: var(--cf-ink-soft);
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

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 8px;
}

.delete-text {
  margin: 0 0 16px;
  color: var(--cf-ink-soft);
  line-height: 1.5;
}
</style>
