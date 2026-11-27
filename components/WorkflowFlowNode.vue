<template>
  <div
    class="flow-node"
    :class="[
      `flow-node-${meta.tone}`,
      { 'flow-node--unbound': unbound },
      { 'flow-node--orphan': orphan && !unbound && !deadEnd && !branchGap },
      { 'flow-node--dead-end': deadEnd && !unbound && !orphan },
      { 'flow-node--branch-gap': branchGap && !unbound && !orphan && !deadEnd },
    ]"
  >
    <!-- 左侧入口线头：结束/普通节点可接；开始节点无入口 -->
    <Handle
      v-if="meta.handles !== 'start'"
      id="t"
      type="target"
      class="flow-handle flow-handle--target"
      :position="Position.Left"
      :connectable="true"
    />

    <UIcon :name="meta.icon" class="flow-node__icon size-4" />
    <div class="flow-node__text">
      <span class="flow-node__label">{{ label }}</span>
      <span
        v-if="displayHint"
        class="flow-node__hint"
        :class="{
          'flow-node__hint--warn': unbound && !hint,
          'flow-node__hint--orphan': orphan && !unbound && !deadEnd && !branchGap && !hint,
          'flow-node__hint--dead-end': deadEnd && !unbound && !orphan && !hint,
          'flow-node__hint--branch-gap': branchGap && !unbound && !orphan && !deadEnd && !hint,
        }"
        :title="displayHint"
      >{{ displayHint }}</span>
    </div>

    <span
      v-if="unbound"
      class="flow-node__badge"
      :title="unboundHint"
      aria-hidden="true"
    >!</span>
    <span
      v-else-if="orphan"
      class="flow-node__badge flow-node__badge--orphan"
      :title="orphanHint"
      aria-hidden="true"
    >?</span>
    <span
      v-else-if="deadEnd"
      class="flow-node__badge flow-node__badge--dead-end"
      :title="deadEndHint"
      aria-hidden="true"
    >×</span>
    <span
      v-else-if="branchGap"
      class="flow-node__badge flow-node__badge--branch-gap"
      :title="branchGapHint"
      aria-hidden="true"
    >≠</span>

    <!-- 条件：上下两个出口（真/假），鼠标从线头拖出 -->
    <template v-if="meta.handles === 'branch'">
      <Handle
        id="s-top"
        type="source"
        class="flow-handle flow-handle--source flow-handle--branch-top"
        :position="Position.Top"
        :connectable="true"
      />
      <span class="flow-handle-tag flow-handle-tag--top">{{ trueLabel }}</span>
      <Handle
        id="s-bottom"
        type="source"
        class="flow-handle flow-handle--source flow-handle--branch-bottom"
        :position="Position.Bottom"
        :connectable="true"
      />
      <span class="flow-handle-tag flow-handle-tag--bottom">{{ falseLabel }}</span>
    </template>

    <!-- 右侧出口线头：结束节点无出口 -->
    <Handle
      v-else-if="meta.handles !== 'end'"
      id="s"
      type="source"
      class="flow-handle flow-handle--source"
      :position="Position.Right"
      :connectable="true"
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
  /** 调试流式进度等短提示（优先于未绑定提示） */
  hint?: string
  /** 必填资源未绑定时醒目标记 */
  unbound?: boolean
  /** 从开始节点不可达 */
  orphan?: boolean
  /** 可达但无出边（死胡同） */
  deadEnd?: boolean
  /** 条件节点缺真/假出边 */
  branchGap?: boolean
}>()

const { t } = useLocale()
const meta = computed(() => getWorkflowNodeMeta(props.kind))
const trueLabel = computed(() => t('editor.branchTrue'))
const falseLabel = computed(() => t('editor.branchFalse'))
const unboundHint = computed(() => t('editor.nodeUnboundHint'))
const orphanHint = computed(() => t('editor.nodeOrphanHint'))
const deadEndHint = computed(() => t('editor.nodeDeadEndHint'))
const branchGapHint = computed(() => t('editor.nodeBranchGapHint'))
const displayHint = computed(() => {
  if (props.hint) return props.hint
  if (props.unbound) return unboundHint.value
  if (props.orphan) return orphanHint.value
  if (props.deadEnd) return deadEndHint.value
  if (props.branchGap) return branchGapHint.value
  return ''
})
</script>

<style scoped>
.flow-node {
  position: relative;
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 108px;
  padding: 10px 14px;
  border-radius: 8px;
  background: var(--cf-surface, #fff);
  border: 1px solid var(--cf-line, #e5e7eb);
  font-size: 13px;
  box-shadow: 0 1px 2px rgb(0 0 0 / 0.06);
}

.flow-node--unbound {
  border-color: #f59e0b;
  border-style: dashed;
  background: #fffbeb;
  box-shadow: 0 0 0 2px rgb(245 158 11 / 0.22);
}

.flow-node--orphan {
  border-color: #64748b;
  border-style: dashed;
  background: #f8fafc;
  box-shadow: 0 0 0 2px rgb(100 116 139 / 0.2);
  opacity: 0.92;
}

.flow-node--dead-end {
  border-color: #7c3aed;
  border-style: dashed;
  background: #f5f3ff;
  box-shadow: 0 0 0 2px rgb(124 58 237 / 0.22);
}

.flow-node--branch-gap {
  border-color: #d97706;
  border-style: dashed;
  background: #fffbeb;
  box-shadow: 0 0 0 2px rgb(217 119 6 / 0.22);
}

.flow-node__badge {
  position: absolute;
  top: -7px;
  right: -7px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #f59e0b;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  line-height: 16px;
  text-align: center;
  box-shadow: 0 0 0 2px #fff;
  pointer-events: none;
}

.flow-node__badge--orphan {
  background: #64748b;
}

.flow-node__badge--dead-end {
  background: #7c3aed;
}

.flow-node__badge--branch-gap {
  background: #d97706;
}

.flow-node__icon {
  flex-shrink: 0;
  opacity: 0.9;
}

.flow-node__text {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.flow-node__label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.flow-node__hint {
  max-width: 160px;
  font-size: 10px;
  line-height: 1.25;
  color: #4f46e5;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.flow-node__hint--warn {
  color: #b45309;
}

.flow-node__hint--orphan {
  color: #64748b;
}

.flow-node__hint--dead-end {
  color: #6d28d9;
}

.flow-node__hint--branch-gap {
  color: #b45309;
}

/* ProcessOn 风格线头：常显淡点，悬停放大可拖 */
.flow-node :deep(.flow-handle) {
  width: 12px;
  height: 12px;
  border: 2px solid #fff;
  border-radius: 50%;
  background: #6366f1;
  opacity: 0.55;
  transition: opacity 0.15s ease, transform 0.15s ease, background 0.15s ease;
  box-shadow: 0 0 0 1px rgb(99 102 241 / 0.25);
}

.flow-node:hover :deep(.flow-handle),
.flow-node :deep(.flow-handle:hover),
.flow-node :deep(.flow-handle.connecting),
.flow-node :deep(.vue-flow__handle-connecting),
.flow-node :deep(.vue-flow__handle-valid) {
  opacity: 1;
  transform: scale(1.35);
  background: #4f46e5;
  cursor: crosshair;
}

.flow-node :deep(.flow-handle--target) {
  background: #0ea5e9;
}

.flow-node:hover :deep(.flow-handle--target),
.flow-node :deep(.flow-handle--target:hover) {
  background: #0284c7;
}

.flow-handle-tag {
  position: absolute;
  font-size: 10px;
  line-height: 1;
  color: #92400e;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.15s ease;
}

.flow-node:hover .flow-handle-tag {
  opacity: 0.9;
}

.flow-handle-tag--top {
  top: -16px;
  left: 50%;
  transform: translateX(-50%);
}

.flow-handle-tag--bottom {
  bottom: -16px;
  left: 50%;
  transform: translateX(-50%);
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
.flow-node-subflow { border-color: #0d9488; }
.flow-node-input { border-color: #22c55e; }
.flow-node-output { border-color: #9333ea; }
.flow-node-default { border-color: #94a3b8; }

.flow-node--unbound.flow-node-llm,
.flow-node--unbound.flow-node-http,
.flow-node--unbound.flow-node-code,
.flow-node--unbound.flow-node-condition,
.flow-node--unbound.flow-node-agent,
.flow-node--unbound.flow-node-team,
.flow-node--unbound.flow-node-search,
.flow-node--unbound.flow-node-subflow {
  border-color: #f59e0b;
}
</style>
