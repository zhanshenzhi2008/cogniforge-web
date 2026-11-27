/** Match {{var}} placeholders (same grammar as prompts.vue / Go render). */
export const PROMPT_VAR_RE = /\{\{\s*([a-zA-Z_][\w]*)\s*\}\}/g

export function extractVarNames(content: string): string[] {
  const names = new Set<string>()
  for (const m of content.matchAll(PROMPT_VAR_RE)) {
    if (m[1]) names.add(m[1])
  }
  return [...names]
}

export function formatVarInsert(name: string): string {
  const cleaned = name.trim().replace(/[^\w]/g, '_').replace(/^(\d)/, '_$1')
  return `{{${cleaned || 'var'}}}`
}

export type MentionTrigger = {
  kind: '/' | '@'
  /** Full match including trigger, e.g. `/user` or `@kb` */
  match: string
  /** Query after trigger */
  query: string
  start: number
  end: number
}

/**
 * Detect `/query` or `@query` immediately before caret.
 * Query is [A-Za-z0-9_\u4e00-\u9fff-]* (no spaces).
 */
export function detectMentionTrigger(text: string, caret: number): MentionTrigger | null {
  if (caret < 0 || caret > text.length) return null
  const before = text.slice(0, caret)
  const m = before.match(/(^|[\s\n])([/@])([\w\u4e00-\u9fff-]*)$/)
  if (!m || m.index == null) return null
  const lead = m[1] || ''
  const kind = m[2] as '/' | '@'
  const query = m[3] || ''
  const start = m.index + lead.length
  return { kind, match: `${kind}${query}`, query, start, end: caret }
}

/** Replace [start, end) with insert; return new value + caret after insert. */
export function replaceRange(
  text: string,
  start: number,
  end: number,
  insert: string,
): { value: string; caret: number } {
  const value = `${text.slice(0, start)}${insert}${text.slice(end)}`
  return { value, caret: start + insert.length }
}

export function insertAtCaret(
  el: HTMLTextAreaElement,
  insert: string,
  replaceFrom?: number,
): { value: string; caret: number } {
  const start = replaceFrom ?? el.selectionStart
  const end = el.selectionEnd
  return replaceRange(el.value, start, end, insert)
}

export const DEFAULT_PROMPT_VAR_SUGGESTIONS = [
  'user',
  'query',
  'context',
  'date',
  'brand',
  'tone',
]
