<template>
  <div
    v-if="open && items.length"
    class="prompt-mention"
    role="listbox"
    :aria-label="ariaLabel"
  >
    <p class="prompt-mention__hint">{{ hint }}</p>
    <button
      v-for="(item, idx) in items"
      :key="item.id"
      type="button"
      class="prompt-mention__item"
      :class="{ 'prompt-mention__item--on': idx === activeIndex }"
      role="option"
      :aria-selected="idx === activeIndex"
      @mousedown.prevent="emit('pick', item)"
      @mouseenter="activeIndex = idx"
    >
      <UIcon v-if="item.icon" :name="item.icon" class="size-3.5 shrink-0 opacity-70" />
      <span class="prompt-mention__label">{{ item.label }}</span>
      <span v-if="item.group" class="prompt-mention__group">{{ item.group }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
export type PromptMentionItem = {
  id: string
  label: string
  group?: string
  icon?: string
  /** Inserted into textarea (may be empty if only binding). */
  insert: string
  kind: 'var' | 'skill' | 'tool' | 'kb'
  /** Resource id for @ binding */
  resourceId?: string
}

const props = defineProps<{
  open: boolean
  items: PromptMentionItem[]
  hint: string
  ariaLabel?: string
}>()

const emit = defineEmits<{
  pick: [item: PromptMentionItem]
  close: []
}>()

const activeIndex = ref(0)

watch(
  () => props.items,
  () => {
    activeIndex.value = 0
  },
)

watch(
  () => props.open,
  (v) => {
    if (v) activeIndex.value = 0
  },
)

function onKey(e: KeyboardEvent) {
  if (!props.open || !props.items.length) return false
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    activeIndex.value = (activeIndex.value + 1) % props.items.length
    return true
  }
  if (e.key === 'ArrowUp') {
    e.preventDefault()
    activeIndex.value = (activeIndex.value - 1 + props.items.length) % props.items.length
    return true
  }
  if (e.key === 'Enter' || e.key === 'Tab') {
    e.preventDefault()
    const item = props.items[activeIndex.value]
    if (item) emit('pick', item)
    return true
  }
  if (e.key === 'Escape') {
    e.preventDefault()
    emit('close')
    return true
  }
  return false
}

defineExpose({ onKey })
</script>

<style scoped>
.prompt-mention {
  position: absolute;
  left: 0;
  right: 0;
  top: calc(100% + 4px);
  z-index: 40;
  max-height: 220px;
  overflow: auto;
  padding: 6px;
  border-radius: 10px;
  border: 1px solid var(--cf-line);
  background: var(--cf-bg-elevated, var(--ui-bg));
  box-shadow: 0 8px 24px color-mix(in oklab, var(--cf-ink) 12%, transparent);
}

.prompt-mention__hint {
  margin: 0 6px 4px;
  font-size: 0.7rem;
  color: var(--ui-text-muted);
}

.prompt-mention__item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 6px 8px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.prompt-mention__item--on,
.prompt-mention__item:hover {
  background: color-mix(in oklab, var(--ui-primary) 12%, transparent);
}

.prompt-mention__label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.8125rem;
}

.prompt-mention__group {
  flex-shrink: 0;
  font-size: 0.7rem;
  color: var(--ui-text-muted);
}
</style>
