/**
 * Generic POST /api/v1/chat/stream (model chat, not agent-bound).
 * Agent-bound streaming stays in useAgentChat.
 */

import { chatAuthHeaders, readChatApiBase } from '~/utils/chatApi'
import { mapChatHttpError } from '~/utils/chatHttpError'
import {
  fetchSse,
  isAbortError,
  parseOpenAISseData,
  SseStreamError,
} from '~/utils/sseStream'
import type { ChatMessage } from '@/composables/useAgentChat'

export interface ChatStreamExtras {
  model?: string
  temperature?: number
  max_tokens?: number
}

export const useChatStream = () => {
  const { t } = useLocale()
  const streaming = ref(false)
  const error = ref<string | null>(null)
  let abortController: AbortController | null = null

  const stopStream = () => {
    abortController?.abort()
    abortController = null
    streaming.value = false
  }

  const streamChat = async (
    messages: ChatMessage[],
    onChunk: (content: string, done: boolean) => void,
    extras?: ChatStreamExtras,
  ): Promise<void> => {
    stopStream()
    streaming.value = true
    error.value = null
    let fullContent = ''
    const controller = new AbortController()
    abortController = controller

    try {
      if (!useAuth().getToken()) {
        error.value = t('play.authExpired')
        onChunk(fullContent, true)
        return
      }
      await fetchSse(
        `${readChatApiBase()}/api/v1/chat/stream`,
        {
          method: 'POST',
          headers: chatAuthHeaders(),
          body: JSON.stringify({
            messages,
            stream: true,
            ...extras,
          }),
          signal: controller.signal,
          connectRetries: 1,
          retryDelayMs: 400,
        },
        {
          onEvent: (ev) => {
            const parsed = parseOpenAISseData(ev.data)
            if (!parsed) return false
            if (parsed.done) return false
            if (parsed.error) {
              error.value = parsed.error
              onChunk(fullContent || parsed.error, true)
              return true
            }
            if (parsed.delta) {
              fullContent += parsed.delta
              onChunk(fullContent, false)
              return false
            }
            if (parsed.full) {
              fullContent = parsed.full
              onChunk(fullContent, false)
            }
            return false
          },
          onRawLeftover: (raw) => {
            const parsed = parseOpenAISseData(raw)
            if (parsed?.full) {
              fullContent = parsed.full
              onChunk(fullContent, false)
            }
          },
        },
      )
      onChunk(fullContent, true)
    } catch (err: any) {
      if (isAbortError(err)) {
        onChunk(fullContent, true)
        return
      }
      if (err instanceof SseStreamError && err.kind === 'http') {
        error.value = mapChatHttpError(err.status || 0, err.bodyText || '', t)
      } else if (err instanceof SseStreamError && (err.kind === 'disconnect' || err.kind === 'network')) {
        error.value = fullContent
          ? t('play.streamInterrupted')
          : t('play.streamNetwork')
      } else {
        error.value = err?.message || t('play.sendFail')
      }
      onChunk(fullContent, true)
    } finally {
      streaming.value = false
      if (abortController === controller) abortController = null
    }
  }

  return {
    streaming: readonly(streaming),
    error: readonly(error),
    streamChat,
    stopStream,
  }
}
