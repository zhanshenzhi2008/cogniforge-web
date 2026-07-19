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
        <n-icon :component="ChatboxEllipsesOutline" />
        <span>{{ data.label }}</span>
        <Handle id="s" type="source" :position="Position.Right" />
      </div>
    </template>
    <template #node-condition="{ data }">
      <div class="flow-node flow-node-condition">
        <Handle id="t" type="target" :position="Position.Left" />
        <n-icon :component="GitBranchOutline" />
        <span>{{ data.label }}</span>
        <Handle id="s-top" type="source" :position="Position.Top" />
        <Handle id="s-bottom" type="source" :position="Position.Bottom" />
      </div>
    </template>
    <template #node-search="{ data }">
      <div class="flow-node flow-node-search">
        <Handle id="t" type="target" :position="Position.Left" />
        <n-icon :component="SearchOutline" />
        <span>{{ data.label }}</span>
        <Handle id="s" type="source" :position="Position.Right" />
      </div>
    </template>
    <template #node-input="{ data }">
      <div class="flow-node flow-node-input">
        <n-icon :component="DownloadOutline" />
        <span>{{ data.label }}</span>
        <Handle id="s" type="source" :position="Position.Right" />
      </div>
    </template>
    <template #node-output="{ data }">
      <div class="flow-node flow-node-output">
        <Handle id="t" type="target" :position="Position.Left" />
        <n-icon :component="CloudUploadOutline" />
        <span>{{ data.label }}</span>
      </div>
    </template>

    <Background pattern-color="#aaa" :gap="16" />
    <Controls />
    <MiniMap />
  </VueFlow>
</template>

<script setup lang="ts">
import { VueFlow, Handle, Position } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { MiniMap } from '@vue-flow/minimap'
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'

import {
  ChatboxEllipsesOutline,
  GitBranchOutline,
  SearchOutline,
  DownloadOutline,
  CloudUploadOutline,
} from '@vicons/ionicons5'
import { NIcon } from 'naive-ui'

const props = defineProps<{
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
</style>
