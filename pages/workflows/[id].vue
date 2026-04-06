<template>
  <div class="workflow-editor">
    <div class="editor-header">
      <n-button @click="handleBack">
        <template #icon>
          <n-icon :component="ArrowBackOutline" />
        </template>
        返回
      </n-button>
      <h3>{{ workflowName }}</h3>
      <n-tag v-if="currentWorkflow" :type="statusType(currentWorkflow.status)" size="small" style="margin-right: 8px">
        {{ statusText(currentWorkflow.status) }}
      </n-tag>
      <n-tag v-else-if="isSmokeTest" type="warning" size="small" style="margin-right: 8px">
        路由测试
      </n-tag>
      <n-space>
        <n-popover trigger="click" placement="bottom-end" :show-arrow="false">
          <template #trigger>
            <n-button :disabled="isSmokeTest">
              <template #icon>
                <n-icon :component="CreateOutline" />
              </template>
              编辑
            </n-button>
          </template>
          <div class="edit-popover">
            <n-form :model="workflowBasicInfo" label-placement="top" label-width="60">
              <n-form-item label="名称">
                <n-input v-model:value="workflowBasicInfo.name" placeholder="工作流名称" />
              </n-form-item>
              <n-form-item label="描述">
                <n-input
                  v-model:value="workflowBasicInfo.description"
                  type="textarea"
                  :autosize="{ minRows: 2, maxRows: 4 }"
                  placeholder="工作流描述"
                />
              </n-form-item>
            </n-form>
            <div class="edit-popover-footer">
              <n-button size="small" @click="handleCancelEdit">取消</n-button>
              <n-button type="primary" size="small" :loading="savingBasic" @click="handleSaveBasic">保存</n-button>
            </div>
          </div>
        </n-popover>
        <n-button :disabled="isSmokeTest" @click="handleSave" :loading="saving">保存</n-button>
        <n-button :disabled="isSmokeTest" type="primary" @click="handleExecute" :loading="executing">执行</n-button>
      </n-space>
    </div>

    <div class="editor-container">
      <div class="node-palette">
        <div class="palette-title">节点</div>
        <div
          v-for="type in nodeTypes"
          :key="type"
          class="palette-item"
          :data-type="type"
        >
          <n-icon :component="getNodeIcon(type)" />
          {{ getNodeLabel(type) }}
        </div>
      </div>

      <div ref="canvasRef" class="canvas-container">
        <ClientOnly>
          <WorkflowCanvas
            :nodes="nodes"
            :edges="edges"
            @node-click="handleNodeClick"
            @pane-click="handlePaneClick"
            @connect="handleConnect"
            @nodes-change="handleNodesChange"
            @edges-change="handleEdgesChange"
          />
          <template #fallback>
            <div class="canvas-loading">加载画布中...</div>
          </template>
        </ClientOnly>
      </div>
    </div>

    <n-drawer v-model:show="configDrawer" :width="400" placement="right">
      <n-drawer-content :title="selectedNode ? `配置 ${getNodeLabel(selectedNode.type)}` : '节点配置'">
        <template v-if="selectedNode">
          <n-form :model="nodeConfig" label-placement="top">
            <n-form-item label="节点名称">
              <n-input v-model:value="nodeConfig.name" placeholder="请输入节点名称" />
            </n-form-item>

            <n-form-item label="模型" v-if="selectedNode.type === 'llm'">
              <n-select v-model:value="nodeConfig.model" :options="modelOptions" placeholder="请选择模型" />
            </n-form-item>

            <n-form-item label="系统提示" v-if="selectedNode.type === 'llm'">
              <n-input
                v-model:value="nodeConfig.systemPrompt"
                type="textarea"
                :autosize="{ minRows: 3, maxRows: 8 }"
                placeholder="定义 Agent 的角色和行为..."
              />
            </n-form-item>

            <n-form-item label="描述" v-if="selectedNode.type === 'condition'">
              <n-input
                v-model:value="nodeConfig.description"
                type="textarea"
                :autosize="{ minRows: 2, maxRows: 4 }"
                placeholder="条件描述..."
              />
            </n-form-item>

            <n-form-item label="搜索词" v-if="selectedNode.type === 'search'">
              <n-input v-model:value="nodeConfig.query" placeholder="搜索关键词..." />
            </n-form-item>

            <n-form-item label="变量名" v-if="selectedNode.type === 'input' || selectedNode.type === 'output'">
              <n-input v-model:value="nodeConfig.variable" placeholder="变量名称..." />
            </n-form-item>
          </n-form>
        </template>

        <template #footer>
          <n-space justify="space-between">
            <n-button type="error" @click="handleDeleteNode" :disabled="!selectedNode">删除节点</n-button>
            <n-space>
              <n-button @click="configDrawer = false">取消</n-button>
              <n-button type="primary" @click="saveNodeConfig">保存</n-button>
            </n-space>
          </n-space>
        </template>
      </n-drawer-content>
    </n-drawer>
  </div>
</template>

<script setup lang="ts">
import WorkflowCanvas from '~/components/WorkflowCanvas.vue'

import { ArrowBackOutline, ChatboxEllipsesOutline, GitBranchOutline, SearchOutline, DownloadOutline, CloudUploadOutline, CreateOutline } from '@vicons/ionicons5'
import { NButton, NIcon, NSpace, NSelect, NInput, NForm, NFormItem, NDrawer, NDrawerContent, NTag, useMessage, NPopover } from 'naive-ui'
import { useRoute } from 'vue-router'
import { useWorkflows, type WorkflowDefinition } from '@/composables/useWorkflows'

/** 与列表页「测试画布」按钮一致：不调后端，只验证动态路由 + Vue Flow */
const CANVAS_SMOKE_ID = '__canvas_smoke__'

definePageMeta({
  layout: 'default',
})

const route = useRoute()
const message = useMessage()
const { get, update, execute } = useWorkflows()

const canvasRef = ref<HTMLElement>()

const workflowId = computed(() => {
  const raw = route.params.id
  return typeof raw === 'string' ? raw : Array.isArray(raw) ? raw[0] ?? '' : ''
})

const isSmokeTest = computed(() => workflowId.value === CANVAS_SMOKE_ID)

const workflowName = ref('新工作流')

const saving = ref(false)
const savingBasic = ref(false)
const executing = ref(false)
const configDrawer = ref(false)
const selectedNode = ref<any>(null)
const editPopoverShow = ref(false)

const workflowBasicInfo = reactive({
  name: '',
  description: '',
})

const nodes = ref<any[]>([])
const edges = ref<any[]>([])

const nodeConfig = reactive({
  name: '',
  model: 'gpt-4o',
  systemPrompt: '',
  description: '',
  query: '',
  variable: '',
})

const currentWorkflow = ref<any>(null)

const nodeTypes = ['llm', 'condition', 'input', 'output', 'search']

const modelOptions = [
  { label: 'GPT-4o', value: 'gpt-4o' },
  { label: 'GPT-4o-mini', value: 'gpt-4o-mini' },
  { label: 'Claude 3.5 Sonnet', value: 'claude-3.5-sonnet' },
  { label: 'Claude 3 Haiku', value: 'claude-3-haiku' },
]

const getNodeIcon = (type: string) => {
  const icons: Record<string, any> = {
    llm: ChatboxEllipsesOutline,
    condition: GitBranchOutline,
    search: SearchOutline,
    input: DownloadOutline,
    output: CloudUploadOutline,
  }
  return icons[type] || ChatboxEllipsesOutline
}

const getNodeLabel = (type: string) => {
  const labels: Record<string, string> = {
    llm: 'LLM 节点',
    condition: '条件节点',
    search: '搜索节点',
    input: '输入节点',
    output: '输出节点',
  }
  return labels[type] || type
}

const loadWorkflow = async () => {
  if (!workflowId.value) {
    message.warning('缺少工作流 ID')
    return
  }

  currentWorkflow.value = null
  nodes.value = []
  edges.value = []

  if (isSmokeTest.value) {
    workflowName.value = '画布渲染测试（不调接口）'
    workflowBasicInfo.name = workflowName.value
    workflowBasicInfo.description = '用于验证 /workflows/:id 与 Vue Flow 是否正常'
    nodes.value = [
      {
        id: 'smoke-llm',
        type: 'llm',
        position: { x: 120, y: 80 },
        data: { label: '测试 LLM 节点' },
      },
    ]
    edges.value = []
    return
  }

  const res = await get(workflowId.value)
  if (res.error) {
    message.error(res.error)
    return
  }

  currentWorkflow.value = res.data
  const workflow = res.data
  if (workflow) {
    workflowName.value = workflow.name
    workflowBasicInfo.name = workflow.name
    workflowBasicInfo.description = workflow.description || ''
    if (workflow.definition) {
      try {
        const def: WorkflowDefinition = typeof workflow.definition === 'string'
          ? JSON.parse(workflow.definition)
          : workflow.definition
        nodes.value = def.nodes?.map((n: any) => ({
          id: n.id,
          type: n.type,
          position: n.position,
          data: {
            label: n.data?.label || getNodeLabel(n.type),
            ...n.data,
          },
        })) || []

        edges.value = def.edges?.map((e: any) => ({
          id: e.id,
          source: e.source,
          target: e.target,
          animated: true,
          style: { stroke: '#4f46e5' },
        })) || []
      } catch {
        nodes.value = []
        edges.value = []
      }
    }
  }
}

watch(workflowId, async (newId, oldId) => {
  if (newId && newId !== oldId) {
    await loadWorkflow()
  }
}, { immediate: true })

const statusType = (status: string) => {
  switch (status) {
    case 'draft': return 'default' as const
    case 'published': return 'success' as const
    case 'archived': return 'warning' as const
    default: return 'default' as const
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

const handleCancelEdit = () => {
  editPopoverShow.value = false
}

const handleSaveBasic = async () => {
  if (isSmokeTest.value) {
    message.info('测试路由下不调用保存接口')
    return
  }
  savingBasic.value = true
  try {
    const res = await update(workflowId.value, {
      name: workflowBasicInfo.name,
      description: workflowBasicInfo.description,
    })
    if (res.error) {
      message.error(res.error)
      return
    }
    workflowName.value = workflowBasicInfo.name
    if (currentWorkflow.value) {
      currentWorkflow.value.name = workflowBasicInfo.name
      currentWorkflow.value.description = workflowBasicInfo.description
    }
    message.success('基本信息已保存')
    editPopoverShow.value = false
  } catch {
    message.error('保存失败')
  } finally {
    savingBasic.value = false
  }
}

const handleNodesChange = (changes: any[]) => {
  changes.forEach(change => {
    if (change.type === 'position' && change.position) {
      const node = nodes.value.find(n => n.id === change.id)
      if (node) {
        node.position = change.position
      }
    }
  })
}

const handleEdgesChange = (changes: any[]) => {
  // handle edge changes
}

const handleConnect = (params: any) => {
  edges.value.push({
    id: `e${params.source}-${params.target}`,
    source: params.source,
    target: params.target,
    animated: true,
  })
}

const addNode = (type: string) => {
  const newNode = {
    id: `node-${Date.now()}`,
    type,
    position: { x: Math.random() * 300 + 50, y: Math.random() * 200 + 50 },
    data: {
      label: getNodeLabel(type),
    },
  }
  nodes.value.push(newNode)
}

const handleNodeClick = (event: any) => {
  selectedNode.value = event.node
  nodeConfig.name = event.node.data?.label || ''
  nodeConfig.model = event.node.data?.model || 'gpt-4o'
  nodeConfig.systemPrompt = event.node.data?.systemPrompt || ''
  nodeConfig.description = event.node.data?.description || ''
  nodeConfig.query = event.node.data?.query || ''
  nodeConfig.variable = event.node.data?.variable || ''
  configDrawer.value = true
}

const handlePaneClick = () => {
  selectedNode.value = null
  configDrawer.value = false
}

const saveNodeConfig = () => {
  if (!selectedNode.value) return

  const node = nodes.value.find(n => n.id === selectedNode.value.id)
  if (node) {
    node.data = {
      ...node.data,
      label: nodeConfig.name,
      model: nodeConfig.model,
      systemPrompt: nodeConfig.systemPrompt,
      description: nodeConfig.description,
      query: nodeConfig.query,
      variable: nodeConfig.variable,
    }
  }

  message.success('节点配置已保存')
  configDrawer.value = false
}

const handleDeleteNode = () => {
  if (!selectedNode.value) return
  nodes.value = nodes.value.filter(n => n.id !== selectedNode.value.id)
  edges.value = edges.value.filter(e => e.source !== selectedNode.value.id && e.target !== selectedNode.value.id)
  selectedNode.value = null
  configDrawer.value = false
  message.success('节点已删除')
}

const handleSave = async () => {
  if (isSmokeTest.value) {
    message.info('测试路由下不调用保存接口')
    return
  }
  saving.value = true
  try {
    const definition: WorkflowDefinition = {
      nodes: nodes.value.map(n => ({
        id: n.id,
        type: n.type,
        position: n.position,
        data: {
          label: n.data?.label,
          model: n.data?.model,
          systemPrompt: n.data?.systemPrompt,
          description: n.data?.description,
          query: n.data?.query,
          variable: n.data?.variable,
        },
      })),
      edges: edges.value.map(e => ({
        id: e.id,
        source: e.source,
        target: e.target,
      })),
    }

    const res = await update(workflowId.value, {
      name: workflowName.value,
      definition,
    })

    if (res.error) {
      message.error(res.error)
      return
    }

    message.success('工作流已保存')
  } catch {
    message.error('保存失败')
  } finally {
    saving.value = false
  }
}

const handleExecute = async () => {
  if (isSmokeTest.value) {
    message.info('测试路由下不调用执行接口')
    return
  }
  if (!currentWorkflow.value) {
    message.error('请先保存工作流')
    return
  }
  if (currentWorkflow.value.status === 'draft') {
    message.warning('草稿状态工作流不能执行，请先发布')
    return
  }
  if (currentWorkflow.value.status === 'archived') {
    message.warning('已归档的工作流不能执行')
    return
  }

  executing.value = true
  try {
    const res = await execute(workflowId.value)
    if (res.error) {
      message.error(res.error)
      return
    }
    message.success(`工作流已启动，执行ID: ${res.executionId}`)
  } catch {
    message.error('执行失败')
  } finally {
    executing.value = false
  }
}

const handleBack = () => {
  navigateTo('/workflows')
}

onMounted(() => {
  nextTick(() => {
    const palette = document.querySelector('.node-palette')
    if (palette) {
      palette.addEventListener('click', (e) => {
        const item = (e.target as HTMLElement).closest('.palette-item') as HTMLElement
        if (item && item.dataset.type) {
          addNode(item.dataset.type)
        }
      })
    }
  })
})
</script>

<style scoped>
.workflow-editor {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 56px);
  background: #f8fafc;
}

.editor-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 20px;
  background: #fff;
  border-bottom: 1px solid #e2e8f0;
}

.editor-header h3 {
  margin: 0;
  flex: 1;
  font-size: 16px;
}

.editor-container {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.node-palette {
  width: 160px;
  background: #fff;
  border-right: 1px solid #e2e8f0;
  padding: 12px;
  flex-shrink: 0;
}

.palette-title {
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  margin-bottom: 12px;
  text-transform: uppercase;
}

.palette-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  margin-bottom: 8px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.palette-item:hover {
  border-color: #4f46e5;
  background: #f0f0ff;
}

.canvas-container {
  flex: 1;
  position: relative;
}

.canvas-container :deep(.vue-flow) {
  width: 100%;
  height: 100%;
}

.canvas-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: #64748b;
  font-size: 14px;
}

.flow-node {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-radius: 8px;
  border: 2px solid #e2e8f0;
  background: #fff;
  font-size: 13px;
  min-width: 100px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
}

.flow-node:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.flow-node-llm {
  border-color: #4f46e5;
  color: #4f46e5;
}

.flow-node-condition {
  border-color: #f59e0b;
  color: #f59e0b;
}

.flow-node-search {
  border-color: #10b981;
  color: #10b981;
}

.flow-node-input {
  border-color: #3b82f6;
  color: #3b82f6;
}

.flow-node-output {
  border-color: #8b5cf6;
  color: #8b5cf6;
}

.canvas-container :deep(.vue-flow__edge-path) {
  stroke: #4f46e5;
  stroke-width: 2;
}

.canvas-container :deep(.vue-flow__minimap) {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.canvas-container :deep(.vue-flow__controls) {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.edit-popover {
  width: 280px;
  padding: 8px 0;
}

.edit-popover-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}
</style>
