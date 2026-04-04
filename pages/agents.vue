<template>
  <div class="agents-page">
    <div class="page-header">
      <h2>我的 Agent</h2>
      <el-button type="primary" @click="handleCreate">
        <el-icon><Plus /></el-icon>
        创建 Agent
      </el-button>
    </div>

    <el-card>
      <el-table :data="agents" v-loading="loading" empty-text="暂无 Agent，点击上方按钮创建">
        <el-table-column prop="name" label="名称" min-width="150">
          <template #default="{ row }">
            <div class="agent-name">
              <span class="name">{{ row.name }}</span>
              <el-tag size="small" :type="row.status === 'active' ? 'success' : 'info'">
                {{ row.status === 'active' ? '启用' : '禁用' }}
              </el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="200">
          <template #default="{ row }">
            <span class="description">{{ row.description || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="model" label="模型" width="150">
          <template #default="{ row }">
            <el-tag size="small">{{ row.model }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleEdit(row)">
              编辑
            </el-button>
            <el-button link type="primary" size="small" @click="handleChat(row)">
              对话
            </el-button>
            <el-button link type="danger" size="small" @click="handleDelete(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 创建/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEditing ? '编辑 Agent' : '创建 Agent'"
      width="600px"
      @close="handleDialogClose"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入 Agent 名称" />
        </el-form-item>

        <el-form-item label="描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="2"
            placeholder="请输入描述（可选）"
          />
        </el-form-item>

        <el-form-item label="模型" prop="model">
          <el-select v-model="form.model" placeholder="请选择模型" style="width: 100%">
            <el-option label="GPT-4o" value="gpt-4o" />
            <el-option label="GPT-4o-mini" value="gpt-4o-mini" />
            <el-option label="Claude 3.5 Sonnet" value="claude-3.5-sonnet" />
            <el-option label="Claude 3 Haiku" value="claude-3-haiku" />
          </el-select>
        </el-form-item>

        <el-form-item label="系统提示" prop="system_prompt">
          <el-input
            v-model="form.system_prompt"
            type="textarea"
            :rows="4"
            placeholder="定义 Agent 的角色和行为..."
          />
        </el-form-item>

        <el-form-item label="工具" prop="tools">
          <el-checkbox-group v-model="form.tools">
            <el-checkbox label="web_search">网页搜索</el-checkbox>
            <el-checkbox label="calculator">计算器</el-checkbox>
            <el-checkbox label="code_executor">代码执行</el-checkbox>
          </el-checkbox-group>
        </el-form-item>

        <el-form-item label="状态" prop="status">
          <el-switch
            v-model="form.status"
            active-value="active"
            inactive-value="disabled"
            active-text="启用"
            inactive-text="禁用"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">
          {{ isEditing ? '保存' : '创建' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import type { Agent, CreateAgentInput, UpdateAgentInput } from '@/composables/useAgents'

const router = useRouter()
const { list, create, update, remove } = useAgents()

const loading = ref(false)
const submitting = ref(false)
const agents = ref<Agent[]>([])
const dialogVisible = ref(false)
const isEditing = ref(false)
const editingId = ref('')
const formRef = ref<FormInstance>()

const form = reactive({
  name: '',
  description: '',
  model: 'gpt-4o',
  system_prompt: '',
  tools: [] as string[],
  status: 'active',
})

const rules: FormRules = {
  name: [
    { required: true, message: '名称不能为空', trigger: 'blur' },
    { max: 100, message: '名称不能超过100个字符', trigger: 'blur' },
  ],
  model: [
    { required: true, message: '请选择模型', trigger: 'change' },
  ],
  system_prompt: [
    { max: 10000, message: '系统提示不能超过10000个字符', trigger: 'blur' },
  ],
}

const fetchAgents = async () => {
  loading.value = true
  try {
    const res = await list()
    if (res.error) {
      ElMessage.error(res.error)
      return
    }
    agents.value = res.data || []
  } catch (error) {
    ElMessage.error('获取 Agent 列表失败')
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
  form.status = agent.status
  dialogVisible.value = true
}

const handleChat = (agent: Agent) => {
  router.push(`/playground?agent=${agent.id}`)
}

const handleDelete = async (agent: Agent) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除 Agent「${agent.name}」吗？此操作不可恢复。`,
      '删除确认',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    const res = await remove(agent.id)
    if (res.error) {
      ElMessage.error(res.error)
      return
    }
    ElMessage.success('删除成功')
    await fetchAgents()
  } catch {
    // 用户取消
  }
}

const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    submitting.value = true
    try {
      if (isEditing.value) {
        const input: UpdateAgentInput = {
          name: form.name,
          description: form.description,
          model: form.model,
          system_prompt: form.system_prompt,
          tools: form.tools,
          status: form.status,
        }
        const res = await update(editingId.value, input)
        if (res.error) {
          ElMessage.error(res.error)
          return
        }
        ElMessage.success('保存成功')
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
          ElMessage.error(res.error)
          return
        }
        ElMessage.success('创建成功')
      }
      dialogVisible.value = false
      await fetchAgents()
    } catch (error) {
      ElMessage.error(isEditing.value ? '保存失败' : '创建失败')
    } finally {
      submitting.value = false
    }
  })
}

const handleDialogClose = () => {
  resetForm()
}

const resetForm = () => {
  form.name = ''
  form.description = ''
  form.model = 'gpt-4o'
  form.system_prompt = ''
  form.tools = []
  form.status = 'active'
  formRef.value?.resetFields()
}

const formatTime = (time: string) => {
  return new Date(time).toLocaleString('zh-CN')
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

.description {
  color: #909399;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
