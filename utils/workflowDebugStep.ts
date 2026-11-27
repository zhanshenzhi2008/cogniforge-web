/** 节点运行输出压成侧栏摘要用的短文案 */
export function formatNodeRunOutputPreview(output: unknown, maxLen = 400): string {
  if (output == null || output === '') return ''
  let text = ''
  if (typeof output === 'string') {
    text = output
  } else if (typeof output === 'object') {
    const m = output as Record<string, unknown>
    if (typeof m.text === 'string' && m.text.trim()) text = m.text
    else if (typeof m.content === 'string' && m.content.trim()) text = m.content
    else if (typeof m.message === 'string' && m.message.trim()) text = m.message
    else if (typeof m.reason === 'string' && Object.keys(m).length <= 2) text = m.reason
    else {
      try {
        text = JSON.stringify(output)
      } catch {
        text = String(output)
      }
    }
  } else {
    text = String(output)
  }
  text = text.replace(/\s+/g, ' ').trim()
  if (!text) return ''
  if (text.length <= maxLen) return text
  return `${text.slice(0, Math.max(0, maxLen - 1))}…`
}

export function isUntakenConditionSkip(output: unknown): boolean {
  if (!output || typeof output !== 'object') return false
  return (output as Record<string, unknown>).reason === 'untaken_condition_branch'
}
