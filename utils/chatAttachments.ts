/**
 * Playground non-image file attachments → knowledge-base upload (stage 13.3).
 */

export const CHAT_DOC_MAX_COUNT = 5
export const CHAT_DOC_MAX_BYTES = 50 * 1024 * 1024
export const CHAT_DOC_ACCEPT =
  '.pdf,.txt,.md,.docx,.html,application/pdf,text/plain,text/markdown,text/html,application/vnd.openxmlformats-officedocument.wordprocessingml.document'

const EXT_TO_TYPE: Record<string, string> = {
  '.pdf': 'pdf',
  '.txt': 'txt',
  '.md': 'md',
  '.docx': 'docx',
  '.html': 'html',
  '.htm': 'html',
}

const MIME_TO_TYPE: Record<string, string> = {
  'application/pdf': 'pdf',
  'text/plain': 'txt',
  'text/markdown': 'md',
  'text/html': 'html',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
}

export type ChatDocErrorCode = 'tooMany' | 'tooBig' | 'badType' | 'uploadFail'

export class ChatDocError extends Error {
  code: ChatDocErrorCode
  constructor(code: ChatDocErrorCode, message: string) {
    super(message)
    this.code = code
  }
}

export interface MessageAttachment {
  id: string
  name: string
  file_type: string
  status?: string
  chunk_count?: number
}

export interface PendingAttachment {
  localId: string
  id?: string
  name: string
  file_type: string
  status: 'uploading' | 'pending' | 'processing' | 'completed' | 'failed'
  chunk_count?: number
  error?: string
}

export function guessChatDocType(file: File): string {
  const mime = (file.type || '').toLowerCase()
  if (MIME_TO_TYPE[mime]) return MIME_TO_TYPE[mime]
  const name = (file.name || '').toLowerCase()
  const dot = name.lastIndexOf('.')
  if (dot >= 0) {
    const ext = name.slice(dot)
    if (EXT_TO_TYPE[ext]) return EXT_TO_TYPE[ext]
  }
  return ''
}

export function isAllowedChatDoc(file: File): boolean {
  return guessChatDocType(file) !== ''
}

/** After images are pulled out, classify remaining files as docs vs rejected. */
export function partitionChatDocs(files: File[]): { docs: File[]; rejected: File[] } {
  const docs: File[] = []
  const rejected: File[] = []
  for (const file of files) {
    if (isAllowedChatDoc(file)) docs.push(file)
    else rejected.push(file)
  }
  return { docs, rejected }
}

export function assertDocBatch(files: File[], already: number): void {
  if (already + files.length > CHAT_DOC_MAX_COUNT) {
    throw new ChatDocError('tooMany', 'too many documents')
  }
  for (const file of files) {
    if (!isAllowedChatDoc(file)) {
      throw new ChatDocError('badType', 'unsupported document type')
    }
    if (file.size > CHAT_DOC_MAX_BYTES) {
      throw new ChatDocError('tooBig', 'document too large')
    }
  }
}

export function toSendAttachments(pending: PendingAttachment[]): MessageAttachment[] {
  return pending
    .filter(a => a.id && a.status !== 'failed' && a.status !== 'uploading')
    .map(a => ({
      id: a.id as string,
      name: a.name,
      file_type: a.file_type,
      status: a.status,
      chunk_count: a.chunk_count,
    }))
}
