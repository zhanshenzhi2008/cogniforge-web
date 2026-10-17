/** 用户名：2–20 字；字母/数字/下划线/连字符/中文；禁止空格。 */
const USERNAME_RE = /^[\p{L}\p{N}_-]{2,20}$/u

export function normalizeUsername(s: string): string {
  return s.trim()
}

export function validateUsername(name: string): 'empty' | 'len' | 'space' | 'format' | null {
  if (!name) return 'empty'
  if (/\s/.test(name)) return 'space'
  const len = [...name].length
  if (len < 2 || len > 20) return 'len'
  if (!USERNAME_RE.test(name)) return 'format'
  return null
}
