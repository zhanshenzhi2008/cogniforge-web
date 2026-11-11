/**
 * Agent chat API composable with SSE streaming support
 */

import { resolveApiBase } from '~/utils/apiBase'
import {
  fetchSse,
  isAbortError,
  parseOpenAISseData,
  SseStreamError,
} from '~/utils/sseStream'

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface AgentChatRequest {
  messages: ChatMessage[]
  stream?: boolean
  /** 覆盖绑定 Prompt 的 {{var}}（17.14） */
  variables?: Record<string, string>
  model?: string
  temperature?: number
  max_tokens?: number
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

export const useAgentChat = () => {
  const api = useApi()
  const config = useRuntimeConfig()
  const { t } = useLocale()
  const streaming = ref(false)
  const error = ref<string | null>(null)
  let abortController: AbortController | null = null

  const getBaseUrl = () => resolveApiBase(String(config.public.apiBase ?? ''))

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
    extras?: Pick<AgentChatRequest, 'variables' | 'model' | 'temperature' | 'max_tokens'>,
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

  const mapHttpError = (status: number, text: string): string => {
    try {
      const parsed = JSON.parse(text)
      if (parsed?.code === 4010) return t('play.noProvider')
      if (parsed?.code === 5016) return t('quota.exhausted')
      if (parsed?.code === 5014) return t('quota.rate')
      if (parsed?.message) return parsed.message
    } catch {
      // 不是 JSON
    }
    return `HTTP ${status}`
  }

  /**
   * Streaming chat with an agent using shared SSE reader.
   * Connect failures retry once; mid-stream disconnect keeps partial text via onChunk.
   */
  const streamChat = async (
    agentId: string,
    messages: ChatMessage[],
    onChunk: (content: string, done: boolean) => void,
    extras?: Pick<AgentChatRequest, 'variables' | 'model' | 'temperature' | 'max_tokens'>,
  ): Promise<void> => {
    stopStream()
    streaming.value = true
    error.value = null
    let fullContent = ''
    const controller = new AbortController()
    abortController = controller

    try {
      const token = useAuth().getToken()
      await fetchSse(
        `${getBaseUrl()}/api/v1/agents/${agentId}/chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: token ? `Bearer ${token}` : '',
          },
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
        error.value = mapHttpError(err.status || 0, err.bodyText || '')
      } else if (err instanceof SseStreamError && (err.kind === 'disconnect' || err.kind === 'network')) {
        error.value = fullContent
          ? t('play.streamInterrupted')
          : t('play.streamNetwork')
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
