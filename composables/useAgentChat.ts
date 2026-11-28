/**
 * Agent chat API composable with SSE streaming support
 */

import { chatAuthHeaders, readChatApiBase } from '~/utils/chatApi'
import { mapChatHttpError } from '~/utils/chatHttpError'
import {
  fetchSse,
  isAbortError,
  parseOpenAISseData,
  SseStreamError,
} from '~/utils/sseStream'

export type ChatContent = string | Array<Record<string, unknown>>

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: ChatContent
}

export interface AgentChatRequest {
  messages: ChatMessage[]
  stream?: boolean
  /** 覆盖绑定 Prompt 的 {{var}}（17.14） */
  variables?: Record<string, string>
  model?: string
  temperature?: number
  max_tokens?: number
  top_p?: number
  memory_turns?: number
  rag_top_k?: number
  rag_min_score?: number
  conversation_id?: string
  attachments?: unknown[]
  rag_kb_ids?: string[]
}

export interface AgentChatResponse {
  id: string
  agent_id: string
  message: {
    role: 'assistant'
    content: string
  }
  usage: {
    total_tokens: number
  }
}

export type AgentChatStreamExtras = Omit<AgentChatRequest, 'messages' | 'stream'>

export const useAgentChat = () => {
  const api = useApi()
  const { t } = useLocale()
  const streaming = ref(false)
  const error = ref<string | null>(null)
  let abortController: AbortController | null = null

  const stopStream = () => {
    abortController?.abort()
    abortController = null
    streaming.value = false
  }

  /**
   * Non-streaming chat with an agent
   */
  const chat = async (
    agentId: string,
    messages: ChatMessage[],
    extras?: AgentChatStreamExtras,
  ): Promise<{ data?: AgentChatResponse; error?: string }> => {
    try {
      const res = await api.post<AgentChatResponse>(
        `/api/v1/agents/${agentId}/chat`,
        { messages, stream: false, ...extras },
      )
      return { data: res.data }
    } catch (err: any) {
      return { error: err.message || '对话请求失败' }
    }
  }

  /**
   * Streaming chat with an agent using shared SSE reader.
   * Connect failures retry once; mid-stream disconnect keeps partial text via onChunk.
   */
  const streamChat = async (
    agentId: string,
    messages: ChatMessage[],
    onChunk: (content: string, done: boolean) => void,
    extras?: AgentChatStreamExtras,
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
        `${readChatApiBase()}/api/v1/agents/${agentId}/chat`,
        {
          method: 'POST',
          headers: chatAuthHeaders(),
          body: JSON.stringify({ messages, stream: true, ...extras }),
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
      } else if (err instanceof SseStreamError && err.kind === 'empty') {
        error.value = t('play.sendFailBody')
      } else {
        error.value = err.message || t('play.sendFail')
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
    chat,
    streamChat,
    stopStream,
  }
}
