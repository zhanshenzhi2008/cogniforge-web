<script setup lang="ts">
/**
 * 列表空态：图标 + 文案 + 可选操作（新建等）。
 * 外层是否包 cf-panel 由页面决定。
 */
defineProps<{
  icon?: string
  message?: string
}>()
</script>

<template>
  <div class="cf-state">
    <UIcon v-if="icon" :name="icon" class="size-8 opacity-50" />
    <p v-if="message">{{ message }}</p>
    <slot />
    <div v-if="$slots.action" class="cf-empty__action">
      <slot name="action" />
    </div>
  </div>
</template>

<style scoped>
.cf-empty__action {
  margin-top: 0.25rem;
}
</style>
