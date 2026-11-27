<script setup lang="ts">
/**
 * 列表加载态：转圈 + 文案。外层是否包 cf-panel 由页面决定。
 */
defineProps<{
  text?: string
}>()

const { t } = useLocale()
</script>

<template>
  <div class="cf-state">
    <UIcon name="i-lucide-loader-circle" class="size-6 animate-spin" />
    <span>{{ text || t('common.loading') }}</span>
  </div>
</template>
