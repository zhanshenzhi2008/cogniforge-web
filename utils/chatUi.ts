/** Shared helpers for UChat* message mapping across Playground / AgentStudio. */

export type CfChatStatus = 'submitted' | 'streaming' | 'ready' | 'error'

export interface CfChatMessageInput {
  id?: string
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface CfUiChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  parts: Array<{ type: string; text?: string }>
}

export function toUiChatMessage(msg: CfChatMessageInput, index = 0): CfUiChatMessage {
  return {
    id: msg.id || `msg-${index}-${msg.role}`,
    role: msg.role,
    parts: msg.content ? [{ type: 'text', text: msg.content }] : [],
  }
}

export function toUiChatMessages(messages: CfChatMessageInput[]): CfUiChatMessage[] {
  return messages.map((m, i) => toUiChatMessage(m, i))
}

export function partsToText(parts?: Array<{ type: string; text?: string }>): string {
  if (!parts?.length) return ''
  return parts
    .filter(p => p.type === 'text' && typeof p.text === 'string')
    .map(p => p.text as string)
    .join('')
}
