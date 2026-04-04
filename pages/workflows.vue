<template>
  <div class="workflows-page">
    <div class="page-header">
      <h2>工作流</h2>
      <n-button type="primary" @click="handleCreate">
        <template #icon>
          <n-icon :component="AddOutline" />
        </template>
        创建工作流
      </n-button>
    </div>

    <n-card>
      <n-spin :show="loading">
        <n-data-table
          :columns="columns"
          :data="workflows"
          :pagination="false"
          :row-key="(row: Workflow) => row.id"
          size="large"
        />
        <n-empty v-if="!loading && workflows.length === 0" description="暂无工作流，点击上方按钮创建" style="margin-top: 40px" />
      </n-spin>
    </n-card>

    <n-modal
      v-model:show="dialogVisible"
      preset="card"
      :title="isEditing ? '编辑工作流' : '创建工作流'"
      style="width: 500px; max-width: 90vw"
      :segmented="{ content: true, footer: true }"
    >
      <n-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-placement="top"
      >
        <n-form-item label="名称" path="name">
          <n-input v-model:value="form.name" placeholder="请输入工作流名称" />
        </n-form-item>

        <n-form-item label="描述" path="description">
          <n-input
            v-model:value="form.description"
            type="textarea"
            :autosize="{ minRows: 2, maxRows: 4 }"
            placeholder="请输入描述（可选）"
          />
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
import type { Workflow, CreateWorkflowInput } from '@/composables/useWorkflows'

definePageMeta({
  layout: 'default',
})

const router = useRouter()
const message = useMessage()
const { list, create, remove } = useWorkflows()

const loading = ref(false)
const submitting = ref(false)
const workflows = ref<Workflow[]>([])
const dialogVisible = ref(false)
const isEditing = ref(false)
const formRef = ref()

const form = reactive({
  name: '',
  description: '',
})

const rules = {
  name: [
    { required: true, message: '名称不能为空', trigger: 'blur' },
    { max: 100, message: '名称不能超过 100 个字符', trigger: 'blur' },
  ],
}

const statusType = (status: string) => {
  switch (status) {
    case 'draft': return 'default'
    case 'published': return 'success'
    case 'archived': return 'warning'
    default: return 'default'
  }
}

const statusText = (status: string) => {
  switch (status) {
    case 'draft': return '草稿'
    case 'published': return '已发布'
    case 'archived': return '已归档'
    default: return status
  }
}

const columns: DataTableColumns<Workflow> = [
  {
    title: '名称',
    key: 'name',
    width: 200,
    render(row) {
      return h('div', { class: 'workflow-name' }, [
        h('span', { class: 'name' }, row.name),
        h(NTag, {
          size: 'small',
          type: statusType(row.status) as any,
          bordered: false,
        }, { default: () => statusText(row.status) }),
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
    title: '版本',
    key: 'version',
    width: 80,
    render(row) {
      return `v${row.version}`
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
        h(NButton, { text: true, type: 'info', size: 'small', onClick: () => handleExecute(row) }, { default: () => '执行' }),
        h(NButton, { text: true, type: 'error', size: 'small', onClick: () => handleDelete(row) }, { default: () => '删除' }),
      ])
    },
  },
]

const fetchWorkflows = async () => {
  loading.value = true
  try {
    const res = await list()
    if (res.error) {
      message.error(res.error)
      return
    }
    workflows.value = res.data || []
  } catch {
    message.error('获取工作流列表失败')
  } finally {
    loading.value = false
  }
}

const handleCreate = () => {
  isEditing.value = false
  resetForm()
  dialogVisible.value = true
}

const handleEdit = (workflow: Workflow) => {
  router.push(`/workflows/${workflow.id}`)
}

const handleExecute = async (workflow: Workflow) => {
  const res = await useWorkflows().execute(workflow.id)
  if (res.error) {
    message.error(res.error)
    return
  }
  message.success(`工作流已启动，执行ID: ${res.executionId}`)
}

const handleDelete = async (workflow: Workflow) => {
  const dialog = useDialog()
  dialog.warning({
    title: '删除确认',
    content: `确定要删除工作流「${workflow.name}」吗？此操作不可恢复。`,
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      const res = await remove(workflow.id)
      if (res.error) {
        message.error(res.error)
        return
      }
      message.success('删除成功')
      await fetchWorkflows()
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
    const input: CreateWorkflowInput = {
      name: form.name,
      description: form.description,
    }
    const res = await create(input)
    if (res.error) {
      message.error(res.error)
      return
    }
    message.success('创建成功')
    dialogVisible.value = false
    await fetchWorkflows()
  } catch {
    message.error('创建失败')
  } finally {
    submitting.value = false
  }
}

const resetForm = () => {
  form.name = ''
  form.description = ''
  formRef.value?.restoreValidation()
}

onMounted(() => {
  fetchWorkflows()
})
</script>

<style scoped>
.workflows-page {
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

.workflow-name {
  display: flex;
  align-items: center;
  gap: 8px;
}

.workflow-name .name {
  font-weight: 500;
}

.action-btns {
  display: flex;
  gap: 4px;
}
</style>
