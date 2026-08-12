<template>
  <VueFlow
    :nodes="nodes"
    :edges="edges"
    :default-viewport="{ x: 50, y: 50, zoom: 1 }"
    @node-click="handleNodeClick"
    @pane-click="handlePaneClick"
    @connect="handleConnect"
    @nodes-change="handleNodesChange"
    @edges-change="handleEdgesChange"
  >
    <Background pattern-color="#aaa" :gap="16" />
    <Controls />
    <MiniMap />
    <template #node-llm="{ data }">
      <div class="flow-node flow-node-llm">
        <Handle id="t" type="target" :position="Position.Left" />
        <UIcon name="i-lucide-message-square" class="size-4" />
        <span>{{ data.label }}</span>
        <Handle id="s" type="source" :position="Position.Right" />
      </div>
    </template>
    <template #node-condition="{ data }">
      <div class="flow-node flow-node-condition">
        <Handle id="t" type="target" :position="Position.Left" />
        <UIcon name="i-lucide-git-branch" class="size-4" />
        <span>{{ data.label }}</span>
        <Handle id="s-top" type="source" :position="Position.Top" />
        <Handle id="s-bottom" type="source" :position="Position.Bottom" />
      </div>
    </template>
    <template #node-search="{ data }">
      <div class="flow-node flow-node-search">
        <Handle id="t" type="target" :position="Position.Left" />
        <UIcon name="i-lucide-search" class="size-4" />
        <span>{{ data.label }}</span>
        <Handle id="s" type="source" :position="Position.Right" />
      </div>
    </template>
    <template #node-input="{ data }">
      <div class="flow-node flow-node-input">
        <UIcon name="i-lucide-download" class="size-4" />
        <span>{{ data.label }}</span>
        <Handle id="s" type="source" :position="Position.Right" />
      </div>
    </template>
    <template #node-output="{ data }">
      <div class="flow-node flow-node-output">
        <Handle id="t" type="target" :position="Position.Left" />
        <UIcon name="i-lucide-upload" class="size-4" />
        <span>{{ data.label }}</span>
      </div>
    </template>
  </VueFlow>
</template>

<script setup lang="ts">
import { VueFlow, Handle, Position } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { MiniMap } from '@vue-flow/minimap'
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'

defineProps<{
  nodes: any[]
  edges: any[]
}>()

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

.flow-node {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 8px;
  background: var(--cf-surface, #fff);
  border: 1px solid var(--cf-line, #e5e7eb);
  font-size: 13px;
  box-shadow: 0 1px 2px rgb(0 0 0 / 0.06);
}

.flow-node-llm {
  border-color: #6366f1;
}

.flow-node-condition {
  border-color: #f59e0b;
}

.flow-node-search {
  border-color: #0ea5e9;
}

.flow-node-input {
  border-color: #22c55e;
}

.flow-node-output {
  border-color: #a855f7;
}
</style>
