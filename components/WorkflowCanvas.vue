<template>
  <VueFlow
    id="workflow-editor"
    :nodes="nodes"
    :edges="edges"
    :default-viewport="{ x: 50, y: 50, zoom: 1 }"
    :default-edge-options="defaultEdgeOptions"
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
      <WorkflowFlowNode kind="start" :label="data.label" />
    </template>
    <template #node-end="{ data }">
      <WorkflowFlowNode kind="end" :label="data.label" />
    </template>
    <template #node-llm="{ data }">
      <WorkflowFlowNode kind="llm" :label="data.label" />
    </template>
    <template #node-agent="{ data }">
      <WorkflowFlowNode kind="agent" :label="data.label" />
    </template>
    <template #node-team="{ data }">
      <WorkflowFlowNode kind="team" :label="data.label" />
    </template>
    <template #node-condition="{ data }">
      <WorkflowFlowNode kind="condition" :label="data.label" />
    </template>
    <template #node-loop="{ data }">
      <WorkflowFlowNode kind="loop" :label="data.label" />
    </template>
    <template #node-http="{ data }">
      <WorkflowFlowNode kind="http" :label="data.label" />
    </template>
    <template #node-code="{ data }">
      <WorkflowFlowNode kind="code" :label="data.label" />
    </template>
    <template #node-delay="{ data }">
      <WorkflowFlowNode kind="delay" :label="data.label" />
    </template>
    <template #node-wait="{ data }">
      <WorkflowFlowNode kind="wait" :label="data.label" />
    </template>
    <template #node-search="{ data }">
      <WorkflowFlowNode kind="search" :label="data.label" />
    </template>
    <template #node-input="{ data }">
      <WorkflowFlowNode kind="input" :label="data.label" />
    </template>
    <template #node-output="{ data }">
      <WorkflowFlowNode kind="output" :label="data.label" />
    </template>
  </VueFlow>
</template>

<script setup lang="ts">
import { VueFlow, MarkerType, useVueFlow } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { MiniMap } from '@vue-flow/minimap'
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'
import WorkflowFlowNode from '~/components/WorkflowFlowNode.vue'

defineProps<{
  nodes: any[]
  edges: any[]
}>()

/**
 * 箭头端点约定（配合左→右排版）：
 * - 起点：上游节点右侧 source Handle 中心
 * - 终点：下游节点左侧 target Handle 中心，带闭合箭头朝向目标
 * 条件节点：真/假从上下两个 source 出去，减少线交叉
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

const { fitView } = useVueFlow({ id: 'workflow-editor' })

function fitCanvas() {
  fitView({ padding: 0.2, duration: 280 })
}

defineExpose({ fitCanvas })

const emit = defineEmits<{
  (e: 'node-click', event: any): void
  (e: 'pane-click'): void
  (e: 'connect', params: any): void
  (e: 'nodes-change', changes: any[]): void
  (e: 'edges-change', changes: any[]): void
}>()

const handleNodeClick = (event: any) => emit('node-click', event)
const handlePaneClick = () => emit('pane-click')
const handleConnect = (params: any) => emit('connect', params)
const handleNodesChange = (changes: any[]) => emit('nodes-change', changes)
const handleEdgesChange = (changes: any[]) => emit('edges-change', changes)
</script>

<style scoped>
.vue-flow :deep(.vue-flow__handle) {
  width: 10px;
  height: 10px;
  background: #4f46e5;
  border: 2px solid #fff;
  border-radius: 50%;
}

.vue-flow :deep(.vue-flow__handle:hover) {
  background: #7c3aed;
  transform: scale(1.2);
}
</style>
