<template>
  <div class="cf-chat-panel">
    <div class="cf-chat-panel__body">
      <slot v-if="!messages.length" name="empty" />
      <UChatMessages
        v-else
        :messages="uiMessages"
        :status="status"
        :should-auto-scroll="true"
        :user="userBubble"
        :assistant="assistantBubble"
        :spacing-offset="spacingOffset"
        class="cf-chat-panel__messages"
      >
        <template #content="{ message }">
          <slot
            name="content"
            :message="message"
            :text="partsToText(message?.parts)"
          >
            <div
              v-if="markdown && partsToText(message?.parts)"
              class="cf-chat-panel__md"
              v-html="renderChatMarkdown(partsToText(message?.parts))"
            />
            <div
              v-else-if="partsToText(message?.parts)"
              class="cf-chat-panel__plain"
            >
              {{ partsToText(message?.parts) }}
            </div>
          </slot>
        </template>
        <template #indicator>
          <slot name="indicator">
            <UChatShimmer :text="thinkingText || t('play.thinking')" />
          </slot>
        </template>
      </UChatMessages>
    </div>

    <div class="cf-chat-panel__composer-wrap">
      <slot name="before-composer" />
      <UChatPrompt
        :model-value="modelValue"
        :disabled="disabled"
        :submit-on-enter="submitOnEnter"
        :placeholder="placeholder"
        variant="subtle"
        :rows="rows"
        :maxrows="maxrows"
        class="cf-chat-panel__prompt"
        @update:model-value="onInput"
        @submit="onSubmit"
      >
        <template #footer>
          <div class="cf-chat-panel__footer">
            <div class="cf-chat-panel__footer-left">
              <slot name="composer-actions" />
              <span v-if="hint" class="cf-chat-panel__hint">{{ hint }}</span>
            </div>
            <UChatPromptSubmit
              class="cf-btn cf-btn--primary"
              :status="submitStatus || status"
              color="primary"
              variant="solid"
              :disabled="submitDisabled"
              @stop="emit('stop')"
            />
          </div>
        </template>
      </UChatPrompt>
    </div>
  </div>
</template>

<script setup lang="ts">
import { renderChatMarkdown } from '~/utils/chatMarkdown'
import {
  partsToText,
  toUiChatMessages,
  type CfChatMessageInput,
  type CfChatStatus,
} from '~/utils/chatUi'

const props = withDefaults(
  defineProps<{
    messages: CfChatMessageInput[]
    modelValue?: string
    status?: CfChatStatus
    placeholder?: string
    hint?: string
    thinkingText?: string
    disabled?: boolean
    submitDisabled?: boolean
    submitStatus?: CfChatStatus
    submitOnEnter?: boolean
    markdown?: boolean
    rows?: number
    maxrows?: number
    spacingOffset?: number
  }>(),
  {
    modelValue: '',
    status: 'ready',
    submitOnEnter: true,
    markdown: true,
    rows: 2,
    maxrows: 6,
    spacingOffset: 24,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
  submit: []
  stop: []
}>()

const { t } = useLocale()

const userBubble = { side: 'right' as const, variant: 'soft' as const, icon: 'i-lucide-user' }
const assistantBubble = { side: 'left' as const, variant: 'naked' as const, icon: 'i-lucide-sparkles' }

const uiMessages = computed(() => toUiChatMessages(props.messages))

function onInput(value: string) {
  emit('update:modelValue', value)
}

function onSubmit() {
  emit('submit')
}
</script>

<style scoped>
.cf-chat-panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
  flex: 1;
  height: 100%;
}

.cf-chat-panel__body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  display: flex;
  flex-direction: column;
}

.cf-chat-panel__messages {
  flex: 1;
  min-height: 0;
}

.cf-chat-panel__md :deep(p) {
  margin: 0 0 0.5em;
}

.cf-chat-panel__md :deep(p:last-child) {
  margin-bottom: 0;
}

.cf-chat-panel__plain {
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.55;
  font-size: 0.9rem;
}

.cf-chat-panel__composer-wrap {
  flex-shrink: 0;
  border-top: 1px solid var(--cf-line);
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.cf-chat-panel__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
}

.cf-chat-panel__footer-left {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.cf-chat-panel__hint {
  font-size: 0.75rem;
  color: var(--cf-ink-soft);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
