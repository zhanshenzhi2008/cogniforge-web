import type { MaybeRefOrFn } from 'vue'
import { useMessage as useNaiveMessage, type MessageReactive, type MessageType } from 'naive-ui'

type MessageApi = {
  info: (content: string, options?: { duration?: number }) => MessageReactive
  success: (content: string, options?: { duration?: number }) => MessageReactive
  warning: (content: string, options?: { duration?: number }) => MessageReactive
  error: (content: string, options?: { duration?: number }) => MessageReactive
  loading: (content: string, options?: { duration?: number }) => MessageReactive
}

let messageInstance: MessageApi | null = null

export function useMessage(): MessageApi {
  if (!messageInstance) {
    const naive = useNaiveMessage()
    messageInstance = {
      info: (content, options) => naive.info(content, options as any),
      success: (content, options) => naive.success(content, options as any),
      warning: (content, options) => naive.warning(content, options as any),
      error: (content, options) => naive.error(content, options as any),
      loading: (content, options) => naive.loading(content, options as any),
    }
  }
  return messageInstance
}
