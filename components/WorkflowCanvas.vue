<template>
  <VueFlow
    id="workflow-editor"
    :nodes="nodes"
    :edges="edges"
    :default-viewport="{ x: 50, y: 50, zoom: 1 }"
    :default-edge-options="defaultEdgeOptions"
    :connection-mode="ConnectionMode.Loose"
    :connection-radius="36"
    :connection-line-options="connectionLineOptions"
    :nodes-connectable="true"
    :nodes-draggable="true"
    :elements-selectable="true"
    :edges-updatable="true"
    :connect-on-click="true"
    :is-valid-connection="isValidConnection"
    :default-marker-color="'#4f46e5'"
    @node-click="handleNodeClick"
    @pane-click="handlePaneClick"
    @connect="handleConnect"
    @nodes-change="handleNodesChange"
    @edges-change="handleEdgesChange"
  >
    <Background pattern-color="#aaa" :gap="16" />
    <Controls />
    <MiniMap />

    <template #node-start="{ data }">
      <WorkflowFlowNode
        kind="start"
        :label="data.label"
        :hint="bindNodeHint('start', data)"
      />
    </template>
    <template #node-end="{ data }">
      <WorkflowFlowNode kind="end" :label="data.label" :hint="data.streamProgress" />
    </template>
    <template #node-llm="{ data }">
      <WorkflowFlowNode
        kind="llm"
        :label="data.label"
        :hint="bindNodeHint('llm', data)"
        :unbound="isWorkflowBindUnbound('llm', data)"
      />
    </template>
    <template #node-agent="{ data }">
      <WorkflowFlowNode
        kind="agent"
        :label="data.label"
        :hint="bindNodeHint('agent', data)"
        :unbound="isWorkflowBindUnbound('agent', data)"
      />
    </template>
    <template #node-team="{ data }">
      <WorkflowFlowNode
        kind="team"
        :label="data.label"
        :hint="bindNodeHint('team', data)"
        :unbound="isWorkflowBindUnbound('team', data)"
      />
    </template>
    <template #node-condition="{ data }">
      <WorkflowFlowNode
        kind="condition"
        :label="data.label"
        :hint="bindNodeHint('condition', data)"
        :unbound="isWorkflowBindUnbound('condition', data)"
      />
    </template>
    <template #node-loop="{ data }">
      <WorkflowFlowNode
        kind="loop"
        :label="data.label"
        :hint="bindNodeHint('loop', data)"
        :unbound="isWorkflowBindUnbound('loop', data)"
      />
    </template>
    <template #node-http="{ data }">
      <WorkflowFlowNode
        kind="http"
        :label="data.label"
        :hint="bindNodeHint('http', data)"
        :unbound="isWorkflowBindUnbound('http', data)"
      />
    </template>
    <template #node-code="{ data }">
      <WorkflowFlowNode
        kind="code"
        :label="data.label"
        :hint="bindNodeHint('code', data)"
        :unbound="isWorkflowBindUnbound('code', data)"
      />
    </template>
    <template #node-delay="{ data }">
      <WorkflowFlowNode
        kind="delay"
        :label="data.label"
        :hint="bindNodeHint('delay', data)"
      />
    </template>
    <template #node-wait="{ data }">
      <WorkflowFlowNode
        kind="wait"
        :label="data.label"
        :hint="bindNodeHint('wait', data)"
      />
    </template>
    <template #node-search="{ data }">
      <WorkflowFlowNode
        kind="search"
        :label="data.label"
        :hint="bindNodeHint('search', data)"
        :unbound="isWorkflowBindUnbound('search', data)"
      />
    </template>
    <template #node-subflow="{ data }">
      <WorkflowFlowNode
        kind="subflow"
        :label="data.label"
        :hint="bindNodeHint('subflow', data)"
        :unbound="isWorkflowBindUnbound('subflow', data)"
      />
    </template>
    <template #node-input="{ data }">
      <WorkflowFlowNode kind="input" :label="data.label" :hint="data.streamProgress" />
    </template>
    <template #node-output="{ data }">
      <WorkflowFlowNode kind="output" :label="data.label" :hint="data.streamProgress" />
    </template>
  </VueFlow>
</template>

<script setup lang="ts">
import {
  VueFlow,
  MarkerType,
  ConnectionMode,
  ConnectionLineType,
  useVueFlow,
  type Connection,
} from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { MiniMap } from '@vue-flow/minimap'
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'
import WorkflowFlowNode from '~/components/WorkflowFlowNode.vue'
import { isWorkflowBindUnbound } from '@/utils/workflowNodeMeta'

defineProps<{
  nodes: any[]
  edges: any[]
}>()

/** 流式进度优先；已绑定则显示资源名副文案 */
function bindNodeHint(kind: string, data: Record<string, unknown> | null | undefined) {
  const stream = String(data?.streamProgress || '').trim()
  if (stream) return stream
  if (isWorkflowBindUnbound(kind, data)) return undefined
  const caption = String(data?.bindCaption || '').trim()
  return caption || undefined
}

/**
 * 箭头端点约定（ProcessOn 风格线头拖拽）：
 * - 从节点右侧/上下 source 线头拖出，跟鼠标移动
 * - 落到目标左侧 target 线头（Loose 模式也可落到节点附近）
 * 条件节点：真/假从上下两个 source 出去
 */
const defaultEdgeOptions = {
  animated: true,
  markerEnd: {
    type: MarkerType.ArrowClosed,
    width: 18,
    height: 18,
    color: '#4f46e5',
  },
  style: { stroke: '#4f46e5', strokeWidth: 2 },
}

const connectionLineOptions = {
  type: ConnectionLineType.Bezier,
  style: {
    stroke: '#4f46e5',
    strokeWidth: 2,
    strokeDasharray: '6 4',
  },
  markerEnd: MarkerType.ArrowClosed,
}

function isValidConnection(connection: Connection) {
  if (!connection.source || !connection.target) return false
  if (connection.source === connection.target) return false
  return true
}

const { fitView } = useVueFlow({ id: 'workflow-editor' })

function fitCanvas() {
  fitView({ padding: 0.2, duration: 280 })
}

defineExpose({ fitCanvas })

const emit = defineEmits<{
  (e: 'node-click', event: any): void
  (e: 'pane-click'): void
  (e: 'connect', params: Connection): void
  (e: 'nodes-change', changes: any[]): void
  (e: 'edges-change', changes: any[]): void
}>()

const handleNodeClick = (event: any) => emit('node-click', event)
const handlePaneClick = () => emit('pane-click')
const handleConnect = (params: Connection) => emit('connect', params)
const handleNodesChange = (changes: any[]) => emit('nodes-change', changes)
const handleEdgesChange = (changes: any[]) => emit('edges-change', changes)
</script>

<style scoped>
/* 拖线时全局线头更醒目 */
.vue-flow :deep(.vue-flow__connection-path) {
  stroke: #4f46e5;
  stroke-width: 2;
}

.vue-flow :deep(.vue-flow__handle) {
  z-index: 2;
}
</style>
