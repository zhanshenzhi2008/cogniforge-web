<script setup lang="ts">
/**
 * CogniForge unified button — one API, scene tones.
 *
 * primary   实心主题色（登录 / 保存 / 确认）— 能点
 * secondary 描边（取消 / 返回）— 能点，但不是主操作
 * danger    实心警示（删除确认）
 * 禁用一律灰色，不再留浅青绿，避免看起来还能点。
 *
 * 大按钮（primary / secondary / danger）必须带图标；
 * 文字可与图标并排（默认），或仅作 tip 悬浮（label-mode="tip"）。
 * 小按钮（icon*）永远仅图标 + tip。
 */
import { computed, useSlots } from 'vue'
import { cfButtonRootClass, mapCfButtonTone, type CfButtonTone } from '~/utils/cfButtonTone'

export type { CfButtonTone }

export type CfLabelMode = 'inline' | 'tip'

const DEFAULT_ICONS: Record<CfButtonTone, string> = {
  primary: 'i-lucide-check',
  secondary: 'i-lucide-x',
  danger: 'i-lucide-trash-2',
  icon: 'i-lucide-circle',
  'icon-accent': 'i-lucide-pencil',
  'icon-danger': 'i-lucide-trash-2',
}

const props = withDefaults(
  defineProps<{
    tone?: CfButtonTone
    /** 大按钮强烈建议传入；未传时用 tone 默认图标 */
    icon?: string
    /** 悬浮文案；icon 钮必填；label-mode=tip 时用作提示 */
    tip?: string
    /**
     * inline = 图标+文字（好看的默认）
     * tip = 只显示图标，文字进悬浮（大按钮也适用）
     */
    labelMode?: CfLabelMode
    loading?: boolean
    disabled?: boolean
    type?: 'button' | 'submit' | 'reset'
    form?: string
    strong?: boolean
    block?: boolean
  }>(),
  {
    tone: 'primary',
    labelMode: 'inline',
    type: 'button',
    loading: false,
    disabled: false,
    strong: false,
    block: false,
  },
)

const slots = useSlots()

function extractSlotText(nodes: ReturnType<NonNullable<typeof slots.default>> | undefined): string {
  if (!nodes?.length) return ''
  return nodes
    .map((n) => {
      if (typeof n.children === 'string') return n.children
      if (Array.isArray(n.children)) return extractSlotText(n.children as typeof nodes)
      return ''
    })
    .join('')
    .replace(/\s+/g, ' ')
    .trim()
}

const slotLabel = computed(() => extractSlotText(slots.default?.()))

const isCompactTone = computed(() => props.tone.startsWith('icon'))

/** tip-only：小图标钮，或大按钮选择 labelMode=tip */
const showLabelInline = computed(() => {
  if (isCompactTone.value) return false
  if (props.labelMode === 'tip') return false
  return !!slots.default
})

const resolvedIcon = computed(
  () => props.icon || DEFAULT_ICONS[props.tone] || 'i-lucide-circle',
)

const tipText = computed(() => {
  if (props.tip) return props.tip
  if (props.labelMode === 'tip' || isCompactTone.value) return slotLabel.value || undefined
  return undefined
})

const useTooltip = computed(() => {
  if (isCompactTone.value) return !!tipText.value
  return props.labelMode === 'tip' && !!tipText.value
})

const mapped = computed(() => mapCfButtonTone(props.tone))

const rootClass = computed(() =>
  cfButtonRootClass(props.tone, {
    showLabelInline: showLabelInline.value,
    block: props.block,
  }),
)

const ariaLabel = computed(() => tipText.value || slotLabel.value || undefined)
</script>

<template>
  <UTooltip v-if="useTooltip" :text="tipText!">
    <UButton
      :class="rootClass"
      :color="mapped.color"
      :variant="mapped.variant"
      :size="mapped.size"
      :icon="resolvedIcon"
      :loading="loading"
      :disabled="disabled"
      :type="type"
      :form="form"
      :aria-label="ariaLabel"
      :block="block && showLabelInline"
    >
      <template v-if="showLabelInline">
        <slot />
      </template>
    </UButton>
  </UTooltip>
  <UButton
    v-else
    :class="rootClass"
    :color="mapped.color"
    :variant="mapped.variant"
    :size="mapped.size"
    :icon="resolvedIcon"
    :loading="loading"
    :disabled="disabled"
    :type="type"
    :form="form"
    :aria-label="ariaLabel"
    :block="block"
  >
    <template v-if="showLabelInline">
      <slot />
    </template>
  </UButton>
</template>
