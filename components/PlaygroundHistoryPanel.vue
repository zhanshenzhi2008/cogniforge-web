<template>
  <div class="history-panel">
    <CfButton
      tone="primary"
      icon="i-lucide-plus"
      class="w-full"
      @click="$emit('new')"
    >
      {{ t('play.newChat') }}
    </CfButton>

    <p class="history-label">{{ t('play.history') }}</p>

    <p v-if="items.length === 0" class="history-empty">
      {{ t('play.historyEmpty') }}
    </p>

    <ul v-else class="history-list">
      <li
        v-for="item in items"
        :key="item.id"
        class="history-item"
        :class="{ 'is-active': item.id === activeId }"
      >
        <button
          type="button"
          class="history-item-main"
          @click="$emit('select', item.id)"
        >
          <span class="history-item-title">{{ item.title || t('play.newChat') }}</span>
          <span class="history-item-time">{{ formatTime(item.updated_at) }}</span>
        </button>
        <span class="history-item-del" @click.stop>
          <CfButton
            tone="icon-danger"
            icon="i-lucide-trash-2"
            :tip="t('play.deleteChat')"
            @click="$emit('delete', item.id)"
          />
        </span>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import type { ConversationSummary } from '@/composables/useConversations'

defineProps<{
  items: ConversationSummary[]
  activeId: string
}>()

defineEmits<{
  (e: 'new'): void
  (e: 'select', id: string): void
  (e: 'delete', id: string): void
}>()

const { t, locale } = useLocale()


function formatTime(iso: string) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleString(locale.value === 'zh-CN' ? 'zh-CN' : 'en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<style scoped>
.history-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
  height: 100%;
}

.history-label {
  margin: 4px 0 0;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--cf-ink-soft);
}

.history-empty {
  margin: 0;
  font-size: 13px;
  color: var(--cf-ink-soft);
  line-height: 1.5;
}

.history-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow-y: auto;
  min-height: 0;
  flex: 1;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 2px;
  border-radius: 10px;
  padding: 2px;
}

.history-item:hover,
.history-item.is-active {
  background: color-mix(in oklab, var(--cf-ink) 6%, transparent);
}

.history-item.is-active {
  background: color-mix(in oklab, var(--cf-accent) 12%, transparent);
}

.history-item-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  padding: 8px 10px;
  border: 0;
  background: transparent;
  color: inherit;
  text-align: left;
  cursor: pointer;
  border-radius: 8px;
}

.history-item-title {
  width: 100%;
  font-size: 13px;
  font-weight: 550;
  color: var(--cf-ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.history-item-time {
  font-size: 11px;
  color: var(--cf-ink-soft);
}

.history-item-del {
  opacity: 0.55;
  flex-shrink: 0;
}

.history-item:hover .history-item-del,
.history-item:focus-within .history-item-del {
  opacity: 1;
}
</style>
