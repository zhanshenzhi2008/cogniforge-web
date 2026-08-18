/**
 * Agent chat API composable with SSE streaming support
 */

import { resolveApiBase } from '~/utils/apiBase'

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface AgentChatRequest {
  messages: ChatMessage[]
  stream?: boolean
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
  const { t } = useI18n()
  const streaming = ref(false)
  const error = ref<string | null>(null)

  const getBaseUrl = () => resolveApiBase(String(config.public.apiBase ?? ''))

  /**
   * Non-streaming chat with an agent
   */
  const chat = async (
    agentId: string,
    messages: ChatMessage[],
  ): Promise<{ data?: AgentChatResponse; error?: string }> => {
    try {
      const res = await api.post<AgentChatResponse>(
        `/api/v1/agents/${agentId}/chat`,
        { messages, stream: false },
      )
      return { data: res.data }
    } catch (err: any) {
      return { error: err.message || '对话请求失败' }
    }
  }

  /**
   * Streaming chat with an agent using SSE
   */
  const streamChat = async (
    agentId: string,
    messages: ChatMessage[],
    onChunk: (content: string, done: boolean) => void,
  ): Promise<void> => {
    streaming.value = true
    error.value = null
    let fullContent = ''

    try {
      const token = useAuth().getToken()
      const response = await fetch(
        `${getBaseUrl()}/api/v1/agents/${agentId}/chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: token ? `Bearer ${token}` : '',
          },
          body: JSON.stringify({ messages, stream: true }),
        },
      )

      if (!response.ok) {
        const text = await response.text().catch(() => '')
        let msg = `HTTP ${response.status}`
        try {
          const parsed = JSON.parse(text)
          if (parsed?.code === 4010) {
            msg = t('play.noProvider')
          } else if (parsed?.code === 5016) {
            msg = t('quota.exhausted')
          } else if (parsed?.code === 5014) {
            msg = t('quota.rate')
          } else if (parsed?.message) {
            msg = parsed.message
          }
        } catch {
          // 不是 JSON
        }
        throw new Error(msg)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) return

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })

        // Parse SSE data
        const lines = chunk.split('\n')
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') {
              onChunk(fullContent, true)
              return
            }

            try {
              const parsed = JSON.parse(data)
              const content = parsed.choices?.[0]?.delta?.content || ''
              fullContent += content
              onChunk(fullContent, false)
            } catch {
              // Ignore parse errors
            }
          }
        }
      }

      onChunk(fullContent, true)
    } catch (err: any) {
      error.value = err.message || '流式对话失败'
      onChunk('', true)
    } finally {
      streaming.value = false
    }
  }

  return {
    streaming: readonly(streaming),
    error: readonly(error),
    chat,
    streamChat,
  }
}
