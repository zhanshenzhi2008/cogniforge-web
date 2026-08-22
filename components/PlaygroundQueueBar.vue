<template>
  <div v-if="items.length > 0" class="queue-bar">
    <div class="queue-bar-head">
      <span class="queue-bar-title">{{ t('play.queueTitle', { n: items.length }) }}</span>
      <span class="queue-bar-hint">{{ t('play.queueHint') }}</span>
    </div>

    <ul class="queue-list">
      <li
        v-for="(item, idx) in items"
        :key="item.id"
        class="queue-item"
        :class="{
          'is-sending': item.status === 'sending',
          'is-editing': editingId === item.id,
        }"
      >
        <span class="queue-idx">{{ idx + 1 }}</span>

        <div class="queue-body">
          <span class="queue-text">{{ item.content || t('play.queueImageOnly') }}</span>
          <span v-if="item.images?.length" class="queue-img-badge">
            {{ t('play.queueImages', { n: item.images.length }) }}
          </span>
        </div>

        <span v-if="editingId === item.id" class="queue-editing">
          <span class="queue-editing-label">{{ t('play.queueEditing') }}</span>
          <button
            type="button"
            class="queue-editing-x"
            :title="t('play.queueCancelEdit')"
            :aria-label="t('play.queueCancelEdit')"
            @click="$emit('cancel-edit')"
          >
            ×
          </button>
        </span>

        <template v-else>
          <span class="queue-status">
            {{ item.status === 'sending' ? t('play.queueSending') : t('play.queueWaiting') }}
          </span>
          <span class="queue-actions">
            <CfButton
              tone="icon"
              icon="i-lucide-pencil"
              :tip="t('play.queueEdit')"
              :disabled="item.status === 'sending'"
              @click="$emit('edit', item.id)"
            />
            <CfButton
              tone="icon"
              icon="i-lucide-arrow-up"
              :tip="t('play.queueMoveUp')"
              :disabled="item.status === 'sending' || idx === 0"
              @click="$emit('move', item.id, -1)"
            />
            <CfButton
              tone="icon"
              icon="i-lucide-arrow-down"
              :tip="t('play.queueMoveDown')"
              :disabled="item.status === 'sending' || idx === items.length - 1"
              @click="$emit('move', item.id, 1)"
            />
            <CfButton
              tone="icon-danger"
              icon="i-lucide-trash-2"
              :tip="t('play.queueDelete')"
              :disabled="item.status === 'sending'"
              @click="remove(item.id)"
            />
          </span>
        </template>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import type { ConversationQueueItem } from '@/composables/useConversations'

const props = defineProps<{
  items: ConversationQueueItem[]
  editingId?: string
}>()

const emit = defineEmits<{
  (e: 'update', items: ConversationQueueItem[]): void
  (e: 'move', id: string, delta: number): void
  (e: 'edit', id: string): void
  (e: 'cancel-edit'): void
}>()

const { t } = useLocale()

function remove(id: string) {
  const target = props.items.find(i => i.id === id)
  if (!target || target.status === 'sending') return
  emit('update', props.items.filter(i => i.id !== id))
}
</script>

<style scoped>
.queue-bar {
  margin-bottom: 10px;
  border: 1px solid color-mix(in oklab, var(--cf-ink) 12%, transparent);
  border-radius: 12px;
  background: color-mix(in oklab, var(--cf-ink) 3%, transparent);
  overflow: hidden;
}

.queue-bar-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 12px;
  border-bottom: 1px solid color-mix(in oklab, var(--cf-ink) 10%, transparent);
}

.queue-bar-title {
  font-size: 12px;
  font-weight: 650;
  color: var(--cf-ink);
}

.queue-bar-hint {
  font-size: 11px;
  color: var(--cf-ink-soft);
}

.queue-list {
  list-style: none;
  margin: 0;
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.queue-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  border-radius: 8px;
}

.queue-item.is-sending {
  opacity: 0.72;
}

.queue-item.is-editing {
  background: color-mix(in oklab, var(--cf-accent) 8%, transparent);
}

.queue-idx {
  width: 18px;
  font-size: 12px;
  font-weight: 650;
  color: var(--cf-ink-soft);
  text-align: center;
}

.queue-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  padding: 4px 2px;
}

.queue-text {
  width: 100%;
  font-size: 13px;
  color: var(--cf-ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.queue-img-badge {
  font-size: 11px;
  color: var(--cf-ink-soft);
}

.queue-status {
  flex-shrink: 0;
  font-size: 11px;
  color: var(--cf-ink-soft);
}

.queue-actions {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.queue-editing {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
  font-size: 12px;
  font-weight: 650;
  color: var(--cf-accent, var(--cf-ink));
}

.queue-editing-x {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  padding: 0;
  border: none;
  border-radius: 999px;
  background: color-mix(in oklab, var(--cf-ink) 8%, transparent);
  color: var(--cf-ink);
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
}

.queue-editing-x:hover {
  background: color-mix(in oklab, var(--cf-ink) 16%, transparent);
}
</style>
