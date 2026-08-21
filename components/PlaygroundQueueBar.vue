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

        <template v-if="editingId === item.id">
          <textarea
            v-model="editDraft"
            class="queue-edit"
            rows="2"
            @keydown="onEditKeydown"
          />
          <div class="queue-edit-actions">
            <CfButton tone="primary" icon="i-lucide-check" @click="saveEdit">
              {{ t('play.queueSave') }}
            </CfButton>
            <CfButton tone="secondary" icon="i-lucide-x" @click="cancelEdit">
              {{ t('common.cancel') }}
            </CfButton>
            <CfButton tone="danger" icon="i-lucide-trash-2" @click="remove(item.id)">
              {{ t('play.queueDelete') }}
            </CfButton>
          </div>
        </template>

        <template v-else>
          <button
            type="button"
            class="queue-body"
            :disabled="item.status === 'sending'"
            :title="item.status === 'sending' ? t('play.queueSending') : t('play.queueEdit')"
            @click="startEdit(item)"
          >
            <span class="queue-text">{{ item.content || t('play.queueImageOnly') }}</span>
            <span v-if="item.images?.length" class="queue-img-badge">
              {{ t('play.queueImages', { n: item.images.length }) }}
            </span>
          </button>
          <span class="queue-status">
            {{ item.status === 'sending' ? t('play.queueSending') : t('play.queueWaiting') }}
          </span>
          <span class="queue-actions" @click.stop>
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
import { nextTick, ref } from 'vue'
import type { ConversationQueueItem } from '@/composables/useConversations'

const props = defineProps<{
  items: ConversationQueueItem[]
}>()

const emit = defineEmits<{
  (e: 'update', items: ConversationQueueItem[]): void
  (e: 'move', id: string, delta: number): void
}>()

const { t } = useLocale()
const editingId = ref('')
const editDraft = ref('')

function startEdit(item: ConversationQueueItem) {
  if (item.status === 'sending') return
  editingId.value = item.id
  editDraft.value = item.content || ''
  void nextTick(() => {
    const el = document.querySelector('.queue-edit') as HTMLTextAreaElement | null
    el?.focus()
  })
}

function cancelEdit() {
  editingId.value = ''
  editDraft.value = ''
}

function saveEdit() {
  if (!editingId.value) return
  const next = props.items.map((item) => {
    if (item.id !== editingId.value) return item
    return { ...item, content: editDraft.value }
  })
  emit('update', next)
  cancelEdit()
}

function remove(id: string) {
  const target = props.items.find(i => i.id === id)
  if (!target || target.status === 'sending') return
  if (editingId.value === id) cancelEdit()
  emit('update', props.items.filter(i => i.id !== id))
}

function onEditKeydown(ev: KeyboardEvent) {
  if (ev.key === 'Escape') {
    ev.preventDefault()
    cancelEdit()
    return
  }
  if (ev.key === 'Enter' && !ev.shiftKey) {
    ev.preventDefault()
    saveEdit()
  }
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
  flex-wrap: wrap;
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
  padding: 6px 8px;
  border: 1px solid transparent;
  border-radius: 8px;
  background: transparent;
  color: inherit;
  text-align: left;
  cursor: text;
}

.queue-body:hover:not(:disabled) {
  border-color: color-mix(in oklab, var(--cf-ink) 12%, transparent);
  background: color-mix(in oklab, var(--cf-ink) 4%, transparent);
}

.queue-body:disabled {
  cursor: default;
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

.queue-edit {
  flex: 1 1 100%;
  width: 100%;
  min-height: 56px;
  margin-left: 24px;
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid color-mix(in oklab, var(--cf-accent) 50%, transparent);
  background: var(--cf-bg, transparent);
  color: var(--cf-ink);
  font-size: 13px;
  resize: vertical;
  outline: none;
}

.queue-edit-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-left: 24px;
  width: 100%;
}
</style>
