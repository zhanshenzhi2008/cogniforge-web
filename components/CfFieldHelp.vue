<script setup lang="ts">
/**
 * 表单旁帮助图标：悬停显示说明（UTooltip）。
 */
withDefaults(
  defineProps<{
    /** 帮助文案 */
    text: string
    icon?: string
  }>(),
  {
    icon: 'i-lucide-circle-help',
  },
)

const tooltipContent = { side: 'top' as const, collisionPadding: 8 }
const tooltipUi = { content: 'max-w-xs whitespace-normal' }
</script>

<template>
  <UTooltip :text="text" :content="tooltipContent" :ui="tooltipUi">
    <button type="button" class="cf-field-help" :aria-label="text">
      <UIcon :name="icon" class="size-3.5" />
    </button>
  </UTooltip>
</template>

<style scoped>
.cf-field-help {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--cf-muted, #64748b);
  cursor: help;
  line-height: 1;
}

.cf-field-help:hover,
.cf-field-help:focus-visible {
  color: var(--cf-ink);
  outline: none;
}
</style>
