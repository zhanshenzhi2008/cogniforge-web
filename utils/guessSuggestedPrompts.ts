/** 无手动预设时，用名称/描述拼「猜你想问」芯片（不调模型）。 */

export type GuessSuggestedInput = {
  name?: string
  description?: string
  /** zh-CN | en-US … */
  locale?: string
  max?: number
}

function isZh(locale?: string): boolean {
  return !locale || locale.toLowerCase().startsWith('zh')
}

function cleanLabel(raw?: string): string {
  return String(raw || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 40)
}

/**
 * 生成最多 max 条推荐问句。
 * 有描述时偏业务；否则用通用能力问法。
 */
export function guessSuggestedPrompts(input: GuessSuggestedInput): string[] {
  const max = Math.min(Math.max(input.max ?? 3, 1), 6)
  const zh = isZh(input.locale)
  const name = cleanLabel(input.name)
  const desc = cleanLabel(input.description)
  const subject = name || (zh ? '你' : 'you')

  const out: string[] = []
  const push = (s: string) => {
    const t = s.trim()
    if (!t || out.includes(t)) return
    out.push(t)
  }

  if (desc) {
    if (zh) {
      push(`请用一两句话介绍：${desc}`)
      push(`围绕「${desc}」，我可以从哪几步开始？`)
      push(`帮我列 3 个和「${desc}」相关的常见问题`)
    } else {
      push(`In one or two sentences, introduce: ${desc}`)
      push(`About "${desc}", what are the first steps I should take?`)
      push(`List 3 common questions related to "${desc}"`)
    }
  }

  if (zh) {
    push(`你能帮我做什么？`)
    push(`请用「${subject}」的视角，举一个实际例子`)
    push(`有哪些限制或做不到的事？`)
  } else {
    push(`What can you help me with?`)
    push(`Give a concrete example as "${subject}"`)
    push(`What are your limits or things you cannot do?`)
  }

  return out.slice(0, max)
}
