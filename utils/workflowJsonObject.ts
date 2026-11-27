/** 解析抽屉里的 JSON 对象文本；非法或空返回 null（保留非字符串值） */
export function parseJsonObject(raw: unknown): Record<string, unknown> | null {
  if (raw == null) return null
  if (typeof raw === 'object' && !Array.isArray(raw)) {
    const obj = raw as Record<string, unknown>
    return Object.keys(obj).length ? { ...obj } : null
  }
  const text = String(raw).trim()
  if (!text) return null
  try {
    const obj = JSON.parse(text)
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return null
    return obj as Record<string, unknown>
  } catch {
    return null
  }
}

/** 存回抽屉的展示文本 */
export function formatJsonObject(raw: unknown): string {
  const obj = parseJsonObject(raw)
  if (!obj) return ''
  return JSON.stringify(obj, null, 2)
}
