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
      <n-space>
        <n-button @click="handleSave" :loading="saving">保存</n-button>
        <n-button type="primary" @click="handleExecute" :loading="executing">执行</n-button>
      </n-space>
    </div>

    <div class="editor-container">
      <div class="node-palette">
        <div class="palette-title">节点</div>
        <div
          v-for="type in nodeTypes"
          :key="type"
          class="palette-item"
          draggable="true"
          @dragstart="onDragStart($event, type)"
        >
          <n-icon :component="getNodeIcon(type)" />
          {{ getNodeLabel(type) }}
        </div>
      </div>

      <div class="canvas-container" @drop="onDrop" @dragover.prevent>
        <VueFlow
          v-model:nodes="nodes"
          v-model:edges="edges"
          :node-types="nodeTypes"
          fit-view-on-init
          @node-click="handleNodeClick"
          @pane-click="handlePaneClick"
        >
          <Background pattern-color="#aaa" :gap="16" />
          <Controls />
          <MiniMap />
        </VueFlow>
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
import { VueFlow, useVueFlow, Background, Controls, MiniMap, Panel, type Node } from '@vue-flow/core'
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'

import { ArrowBackOutline, ChatboxEllipsesOutline, GitBranchOutline, SearchOutline, DownloadOutline, UploadOutline } from '@vicons/ionicons5'
import { NButton, NIcon, NSpace, NSelect, NInput, NForm, NFormItem, NDrawer, NDrawerContent, NEmpty } from 'naive-ui'
import { useMessage } from 'naive-ui'
import { useRoute, useRouter } from 'vue-router'
import { useWorkflows, type WorkflowDefinition } from '@/composables/useWorkflows'

definePageMeta({
  layout: 'default',
})

const route = useRoute()
const router = useRouter()
const message = useMessage()
const { get, update, execute } = useWorkflows()

const workflowId = computed(() => route.params.id as string)
const workflowName = ref('新工作流')
const saving = ref(false)
const executing = ref(false)
const configDrawer = ref(false)
const selectedNode = ref<any>(null)
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
    input: UploadOutline,
    output: DownloadOutline,
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
  if (!workflowId.value || workflowId.value === 'new') return

  const res = await get(workflowId.value)
  if (res.error) {
    message.error(res.error)
    return
  }

  const workflow = res.data
  if (workflow) {
    workflowName.value = workflow.name
    if (workflow.definition) {
      try {
        const def: WorkflowDefinition = JSON.parse(workflow.definition)
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

const onDragStart = (event: DragEvent, type: string) => {
  event.dataTransfer?.setData('application/vueflow-type', type)
}

const onDrop = (event: DragEvent) => {
  const type = event.dataTransfer?.getData('application/vueflow-type')
  if (!type) return

  const canvas = event.currentTarget as HTMLElement
  const rect = canvas.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top

  const newNode = {
    id: `node-${Date.now()}`,
    type,
    position: { x, y },
    data: {
      label: getNodeLabel(type),
      config: {},
    },
  }

  nodes.value.push(newNode)
}

const handleNodeClick = (event: any) => {
  selectedNode.value = event.node
  nodeConfig.name = event.node.data?.label || ''
  nodeConfig.model = event.node.data?.config?.model || 'gpt-4o'
  nodeConfig.systemPrompt = event.node.data?.config?.systemPrompt || ''
  nodeConfig.description = event.node.data?.config?.description || ''
  nodeConfig.query = event.node.data?.config?.query || ''
  nodeConfig.variable = event.node.data?.config?.variable || ''
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
      config: {
        model: nodeConfig.model,
        systemPrompt: nodeConfig.systemPrompt,
        description: nodeConfig.description,
        query: nodeConfig.query,
        variable: nodeConfig.variable,
      },
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
  saving.value = true
  try {
    const definition: WorkflowDefinition = {
      nodes: nodes.value.map(n => ({
        id: n.id,
        type: n.type,
        position: n.position,
        data: {
          label: n.data?.label,
          ...n.data?.config,
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
  router.push('/workflows')
}

onMounted(() => {
  loadWorkflow()
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
  padding: 8px 12px;
  margin-bottom: 8px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  cursor: grab;
  font-size: 13px;
  transition: all 0.2s;
}

.palette-item:hover {
  border-color: #4f46e5;
  background: #f0f0ff;
}

.palette-item:active {
  cursor: grabbing;
}

.canvas-container {
  flex: 1;
  position: relative;
}

.canvas-container :deep(.vue-flow) {
  width: 100%;
  height: 100%;
}

.canvas-container :deep(.vue-flow__node) {
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  background: #fff;
  font-size: 13px;
  min-width: 120px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.canvas-container :deep(.vue-flow__node.selected) {
  border-color: #4f46e5;
  box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.2);
}

.canvas-container :deep(.vue-flow__edge-path) {
  stroke: #4f46e5;
  stroke-width: 2;
}
</style>
