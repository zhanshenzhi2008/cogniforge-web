/** 把抽屉里的 headers JSON 文本解析成对象；非法或空返回 null */
export function parseHttpHeadersJson(raw: unknown): Record<string, string> | null {
  if (raw == null) return null
  if (typeof raw === 'object' && !Array.isArray(raw)) {
    const out: Record<string, string> = {}
    for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
      const key = String(k || '').trim()
      if (!key) continue
      if (v == null) continue
      out[key] = String(v)
    }
    return Object.keys(out).length ? out : null
  }
  const text = String(raw).trim()
  if (!text) return null
  try {
    const obj = JSON.parse(text)
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return null
    return parseHttpHeadersJson(obj)
  } catch {
    return null
  }
}

/** 存回抽屉的展示文本 */
export function formatHttpHeadersJson(headers: unknown): string {
  const parsed = parseHttpHeadersJson(headers)
  if (!parsed) return ''
  return JSON.stringify(parsed, null, 2)
}
