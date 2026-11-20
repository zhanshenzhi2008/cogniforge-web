<template>
  <div class="view-toggle" role="group" :aria-label="ariaLabel || t('common.viewMode')">
    <CfButton
      :tone="modelValue === 'card' ? 'icon-accent' : 'icon'"
      icon="i-lucide-layout-grid"
      :tip="t('common.viewCards')"
      @click="emit('update:modelValue', 'card')"
    />
    <CfButton
      :tone="modelValue === 'list' ? 'icon-accent' : 'icon'"
      icon="i-lucide-list"
      :tip="t('common.viewList')"
      @click="emit('update:modelValue', 'list')"
    />
  </div>
</template>

<script lang="ts">
export type ViewMode = 'card' | 'list'
</script>

<script setup lang="ts">
const props = defineProps<{
  modelValue: ViewMode
  storageKey?: string
  ariaLabel?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [mode: ViewMode]
}>()

const { t } = useLocale()

watch(
  () => props.modelValue,
  (mode) => {
    if (!import.meta.client || !props.storageKey) return
    localStorage.setItem(props.storageKey, mode)
  },
)

onMounted(() => {
  if (!import.meta.client || !props.storageKey) return
  const saved = localStorage.getItem(props.storageKey)
  if ((saved === 'card' || saved === 'list') && saved !== props.modelValue) {
    emit('update:modelValue', saved)
  }
})
</script>

<style scoped>
.view-toggle {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px;
  border-radius: 10px;
  border: 1px solid var(--cf-line);
  background: var(--cf-nav-surface, var(--cf-bg-elevated));
}
</style>
