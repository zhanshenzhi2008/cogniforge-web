<template>
  <div class="flow-node" :class="`flow-node-${meta.tone}`">
    <Handle
      v-if="meta.handles !== 'start'"
      id="t"
      type="target"
      :position="Position.Left"
    />
    <UIcon :name="meta.icon" class="flow-node__icon size-4" />
    <span class="flow-node__label">{{ label }}</span>
    <template v-if="meta.handles === 'branch'">
      <Handle id="s-top" type="source" :position="Position.Top" />
      <Handle id="s-bottom" type="source" :position="Position.Bottom" />
    </template>
    <Handle
      v-else-if="meta.handles !== 'end'"
      id="s"
      type="source"
      :position="Position.Right"
    />
  </div>
</template>

<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'
import { computed } from 'vue'
import { getWorkflowNodeMeta } from '@/utils/workflowNodeMeta'

const props = defineProps<{
  kind: string
  label?: string
}>()

const meta = computed(() => getWorkflowNodeMeta(props.kind))
</script>

<style scoped>
.flow-node {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 108px;
  padding: 8px 12px;
  border-radius: 8px;
  background: var(--cf-surface, #fff);
  border: 1px solid var(--cf-line, #e5e7eb);
  font-size: 13px;
  box-shadow: 0 1px 2px rgb(0 0 0 / 0.06);
}

.flow-node__icon {
  flex-shrink: 0;
  opacity: 0.9;
}

.flow-node__label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.flow-node-start { border-color: #16a34a; }
.flow-node-end { border-color: #64748b; }
.flow-node-llm { border-color: #6366f1; }
.flow-node-agent { border-color: #2563eb; }
.flow-node-team { border-color: #7c3aed; }
.flow-node-condition { border-color: #f59e0b; }
.flow-node-loop { border-color: #14b8a6; }
.flow-node-http { border-color: #0ea5e9; }
.flow-node-code { border-color: #475569; }
.flow-node-delay { border-color: #a855f7; }
.flow-node-wait { border-color: #ea580c; }
.flow-node-search { border-color: #0284c7; }
.flow-node-input { border-color: #22c55e; }
.flow-node-output { border-color: #9333ea; }
.flow-node-default { border-color: #94a3b8; }
</style>
