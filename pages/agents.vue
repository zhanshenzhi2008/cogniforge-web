<template>
  <div class="agents-page">
    <div class="page-header">
      <h2>我的 Agent</h2>
      <n-button type="primary" @click="handleCreate">
        <template #icon>
          <n-icon :component="AddOutline" />
        </template>
        创建 Agent
      </n-button>
    </div>

    <n-card>
      <n-spin :show="loading">
        <n-data-table
          :columns="columns"
          :data="agents"
          :pagination="false"
          :row-key="(row: Agent) => row.id"
          size="large"
        />
        <n-empty v-if="!loading && agents.length === 0" description="暂无 Agent，点击上方按钮创建" style="margin-top: 40px" />
      </n-spin>
    </n-card>

    <n-modal
      v-model:show="dialogVisible"
      preset="card"
      :title="isEditing ? '编辑 Agent' : '创建 Agent'"
      style="width: 600px; max-width: 90vw"
      :segmented="{ content: true, footer: true }"
    >
      <n-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-placement="top"
      >
        <n-form-item label="名称" path="name">
          <n-input v-model:value="form.name" placeholder="请输入 Agent 名称" />
        </n-form-item>

        <n-form-item label="描述" path="description">
          <n-input
            v-model:value="form.description"
            type="textarea"
            :autosize="{ minRows: 2, maxRows: 4 }"
            placeholder="请输入描述（可选）"
          />
        </n-form-item>

        <n-form-item label="模型" path="model">
          <n-select
            v-model:value="form.model"
            :options="modelOptions"
            placeholder="请选择模型"
          />
        </n-form-item>

        <n-form-item label="系统提示" path="system_prompt">
          <n-input
            v-model:value="form.system_prompt"
            type="textarea"
            :autosize="{ minRows: 3, maxRows: 8 }"
            placeholder="定义 Agent 的角色和行为..."
          />
        </n-form-item>

        <n-form-item label="工具" path="tools">
          <n-checkbox-group v-model:value="form.tools">
            <n-space>
              <n-checkbox value="web_search" label="网页搜索" />
              <n-checkbox value="calculator" label="计算器" />
              <n-checkbox value="code_executor" label="代码执行" />
            </n-space>
          </n-checkbox-group>
        </n-form-item>

        <n-form-item label="状态" path="status">
          <n-switch
            v-model:value="form.statusActive"
            :checked-value="'active'"
            :unchecked-value="'disabled'"
          >
            <template #checked>启用</template>
            <template #unchecked>禁用</template>
          </n-switch>
        </n-form-item>
      </n-form>

      <template #footer>
        <n-space justify="end">
          <n-button @click="dialogVisible = false">取消</n-button>
          <n-button type="primary" :loading="submitting" @click="handleSubmit">
            {{ isEditing ? '保存' : '创建' }}
          </n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { AddOutline } from '@vicons/ionicons5'
import { NButton, NTag } from 'naive-ui'
import { useMessage, useDialog } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import type { Agent, CreateAgentInput, UpdateAgentInput } from '@/composables/useAgents'

definePageMeta({
  layout: 'default',
})

const router = useRouter()
const message = useMessage()
const { list, create, update, remove } = useAgents()

const loading = ref(false)
const submitting = ref(false)
const agents = ref<Agent[]>([])
const dialogVisible = ref(false)
const isEditing = ref(false)
const editingId = ref('')
const formRef = ref()

const form = reactive({
  name: '',
  description: '',
  model: 'gpt-4o',
  system_prompt: '',
  tools: [] as string[],
  statusActive: 'active' as 'active' | 'disabled',
})

const rules = {
  name: [
    { required: true, message: '名称不能为空', trigger: 'blur' },
    { max: 100, message: '名称不能超过 100 个字符', trigger: 'blur' },
  ],
  model: [
    { required: true, message: '请选择模型', trigger: 'change' },
  ],
}

const modelOptions = [
  { label: 'GPT-4o', value: 'gpt-4o' },
  { label: 'GPT-4o-mini', value: 'gpt-4o-mini' },
  { label: 'Claude 3.5 Sonnet', value: 'claude-3.5-sonnet' },
  { label: 'Claude 3 Haiku', value: 'claude-3-haiku' },
]

const columns: DataTableColumns<Agent> = [
  {
    title: '名称',
    key: 'name',
    width: 180,
    render(row) {
      return h('div', { class: 'agent-name' }, [
        h('span', { class: 'name' }, row.name),
        h(NTag, {
          size: 'small',
          type: row.status === 'active' ? 'success' : 'default',
          bordered: false,
        }, { default: () => row.status === 'active' ? '启用' : '禁用' }),
      ])
    },
  },
  {
    title: '描述',
    key: 'description',
    ellipsis: { tooltip: true },
    render(row) {
      return row.description || '—'
    },
  },
  {
    title: '模型',
    key: 'model',
    width: 160,
    render(row) {
      return h(NTag, { size: 'small', bordered: false }, { default: () => row.model })
    },
  },
  {
    title: '创建时间',
    key: 'created_at',
    width: 180,
    render(row) {
      return new Date(row.created_at).toLocaleString('zh-CN')
    },
  },
  {
    title: '操作',
    key: 'actions',
    width: 200,
    render(row) {
      return h('div', { class: 'action-btns' }, [
        h(NButton, { text: true, type: 'primary', size: 'small', onClick: () => handleEdit(row) }, { default: () => '编辑' }),
        h(NButton, { text: true, type: 'primary', size: 'small', onClick: () => handleChat(row) }, { default: () => '对话' }),
        h(NButton, { text: true, type: 'error', size: 'small', onClick: () => handleDelete(row) }, { default: () => '删除' }),
      ])
    },
  },
]

const fetchAgents = async () => {
  loading.value = true
  try {
    const res = await list()
    if (res.error) {
      message.error(res.error)
      return
    }
    agents.value = res.data || []
  } catch {
    message.error('获取 Agent 列表失败')
  } finally {
    loading.value = false
  }
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
  form.statusActive = agent.status as 'active' | 'disabled'
  dialogVisible.value = true
}

const handleChat = (agent: Agent) => {
  router.push(`/playground?agent=${agent.id}`)
}

const handleDelete = async (agent: Agent) => {
  const dialog = useDialog()
  dialog.warning({
    title: '删除确认',
    content: `确定要删除 Agent「${agent.name}」吗？此操作不可恢复。`,
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      const res = await remove(agent.id)
      if (res.error) {
        message.error(res.error)
        return
      }
      message.success('删除成功')
      await fetchAgents()
    },
  })
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
    if (isEditing.value) {
      const input: UpdateAgentInput = {
        name: form.name,
        description: form.description,
        model: form.model,
        system_prompt: form.system_prompt,
        tools: form.tools,
        status: form.statusActive,
      }
      const res = await update(editingId.value, input)
      if (res.error) {
        message.error(res.error)
        return
      }
      message.success('保存成功')
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
        message.error(res.error)
        return
      }
      message.success('创建成功')
    }
    dialogVisible.value = false
    await fetchAgents()
  } catch {
    message.error(isEditing.value ? '保存失败' : '创建失败')
  } finally {
    submitting.value = false
  }
}

const resetForm = () => {
  form.name = ''
  form.description = ''
  form.model = 'gpt-4o'
  form.system_prompt = ''
  form.tools = []
  form.statusActive = 'active'
  formRef.value?.restoreValidation()
}

onMounted(() => {
  fetchAgents()
})
</script>

<style scoped>
.agents-page {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
}

.agent-name {
  display: flex;
  align-items: center;
  gap: 8px;
}

.agent-name .name {
  font-weight: 500;
}

.action-btns {
  display: flex;
  gap: 4px;
}
</style>
