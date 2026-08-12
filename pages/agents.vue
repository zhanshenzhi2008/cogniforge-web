<template>
  <div class="agents-page">
    <div class="page-header">
      <h1 class="page-title font-display">我的 Agent</h1>
      <UButton color="primary" icon="i-lucide-plus" @click="handleCreate">
        创建 Agent
      </UButton>
    </div>

    <div class="panel cf-surface">
      <div v-if="loading" class="state-box">
        <UIcon name="i-lucide-loader-circle" class="size-6 animate-spin" />
        <span>加载中…</span>
      </div>

      <div v-else-if="agents.length === 0" class="state-box">
        <UIcon name="i-lucide-bot" class="size-8 opacity-50" />
        <p>暂无 Agent，点击上方按钮创建</p>
      </div>

      <div v-else class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>名称</th>
              <th>描述</th>
              <th>模型</th>
              <th>创建时间</th>
              <th class="col-actions">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="agent in agents" :key="agent.id">
              <td>
                <div class="agent-name">
                  <span class="name">{{ agent.name }}</span>
                  <UBadge
                    size="sm"
                    variant="subtle"
                    :color="agent.status === 'active' ? 'success' : 'neutral'"
                  >
                    {{ agent.status === 'active' ? '启用' : '禁用' }}
                  </UBadge>
                </div>
              </td>
              <td class="muted">{{ agent.description || '—' }}</td>
              <td>
                <UBadge size="sm" variant="subtle" color="primary">{{ agent.model }}</UBadge>
              </td>
              <td class="muted">{{ formatDate(agent.created_at) }}</td>
              <td>
                <div class="action-btns">
                  <UTooltip text="编辑">
                    <UButton
                      color="neutral"
                      variant="ghost"
                      icon="i-lucide-pencil"
                      size="sm"
                      @click="handleEdit(agent)"
                    />
                  </UTooltip>
                  <UTooltip text="对话">
                    <UButton
                      color="neutral"
                      variant="ghost"
                      icon="i-lucide-message-square"
                      size="sm"
                      @click="handleChat(agent)"
                    />
                  </UTooltip>
                  <UTooltip text="删除">
                    <UButton
                      color="error"
                      variant="ghost"
                      icon="i-lucide-trash-2"
                      size="sm"
                      @click="askDelete(agent)"
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
      :title="isEditing ? '编辑 Agent' : '创建 Agent'"
      :ui="{ content: 'sm:max-w-lg' }"
    >
      <template #body>
        <form id="agent-form" class="form-grid" @submit.prevent="handleSubmit">
          <div class="field">
            <label class="field__label">名称</label>
            <UInput v-model="form.name" class="w-full" placeholder="请输入 Agent 名称" />
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

          <div class="field">
            <label class="field__label">模型</label>
            <USelect
              v-model="form.model"
              class="w-full"
              :items="modelOptions"
              placeholder="请选择模型"
            />
            <p v-if="errors.model" class="field__error">{{ errors.model }}</p>
          </div>

          <div class="field">
            <label class="field__label">系统提示</label>
            <UTextarea
              v-model="form.system_prompt"
              class="w-full"
              :rows="4"
              placeholder="定义 Agent 的角色和行为..."
            />
          </div>

          <div class="field">
            <label class="field__label">工具</label>
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
            <label class="field__label">状态</label>
            <div class="status-row">
              <USwitch v-model="statusEnabled" />
              <span>{{ statusEnabled ? '启用' : '禁用' }}</span>
            </div>
          </div>
        </form>
      </template>

      <template #footer>
        <div class="modal-actions">
          <UButton color="neutral" variant="outline" @click="dialogVisible = false">取消</UButton>
          <UButton form="agent-form" type="submit" color="primary" :loading="submitting">
            {{ isEditing ? '保存' : '创建' }}
          </UButton>
        </div>
      </template>
    </UModal>

    <UModal v-model:open="deleteVisible" title="删除确认" :ui="{ content: 'sm:max-w-md' }">
      <template #body>
        <p class="delete-text">
          确定要删除 Agent「{{ deleting?.name }}」吗？此操作不可恢复。
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
import type { Agent, CreateAgentInput, UpdateAgentInput } from '@/composables/useAgents'

definePageMeta({
  layout: 'default',
})

const router = useRouter()
const toast = useToast()
const { list, create, update, remove } = useAgents()

const loading = ref(false)
const submitting = ref(false)
const agents = ref<Agent[]>([])
const dialogVisible = ref(false)
const deleteVisible = ref(false)
const deletingLoading = ref(false)
const deleting = ref<Agent | null>(null)
const isEditing = ref(false)
const editingId = ref('')

const form = reactive({
  name: '',
  description: '',
  model: 'gpt-4o',
  system_prompt: '',
  tools: [] as string[],
})
const statusEnabled = ref(true)
const errors = reactive({ name: '', model: '' })

const modelOptions = [
  { label: 'GPT-4o', value: 'gpt-4o' },
  { label: 'GPT-4o-mini', value: 'gpt-4o-mini' },
  { label: 'Claude 3.5 Sonnet', value: 'claude-3.5-sonnet' },
  { label: 'Claude 3 Haiku', value: 'claude-3-haiku' },
]

const toolOptions = [
  { label: '网页搜索', value: 'web_search' },
  { label: '计算器', value: 'calculator' },
  { label: '代码执行', value: 'code_executor' },
]

function formatDate(value: string) {
  return new Date(value).toLocaleString('zh-CN')
}

function validate() {
  errors.name = form.name.trim() ? '' : '名称不能为空'
  if (form.name.trim().length > 100) errors.name = '名称不能超过 100 个字符'
  errors.model = form.model ? '' : '请选择模型'
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
    toast.add({ title: '获取 Agent 列表失败', color: 'error' })
  } finally {
    loading.value = false
  }
}

const resetForm = () => {
  form.name = ''
  form.description = ''
  form.model = 'gpt-4o'
  form.system_prompt = ''
  form.tools = []
  statusEnabled.value = true
  errors.name = ''
  errors.model = ''
}

const handleCreate = () => {
  isEditing.value = false
  editingId.value = ''
  resetForm()
  dialogVisible.value = true
}

const handleEdit = (agent: Agent) => {
  isEditing.value = true
  editingId.value = agent.id
  form.name = agent.name
  form.description = agent.description || ''
  form.model = agent.model
  form.system_prompt = agent.system_prompt || ''
  form.tools = [...(agent.tools || [])]
  statusEnabled.value = agent.status === 'active'
  errors.name = ''
  errors.model = ''
  dialogVisible.value = true
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
    toast.add({ title: '删除成功', color: 'success' })
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
    if (isEditing.value) {
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
      toast.add({ title: '保存成功', color: 'success' })
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
      toast.add({ title: '创建成功', color: 'success' })
    }
    dialogVisible.value = false
    await fetchAgents()
  } catch {
    toast.add({ title: isEditing.value ? '保存失败' : '创建失败', color: 'error' })
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  fetchAgents()
})
</script>

<style scoped>
.agents-page {
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

.agent-name {
  display: flex;
  align-items: center;
  gap: 8px;
}

.agent-name .name {
  font-weight: 600;
  color: var(--cf-ink);
}

.muted {
  color: var(--cf-ink-soft);
}

.action-btns {
  display: flex;
  align-items: center;
  gap: 2px;
}

.modal-title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 600;
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
