/**
 * 简易行级 diff（LCS），用于提示词版本对比。
 * 不追求 Myers 最优；中等长度正文足够用。
 */

export type DiffOp = 'equal' | 'add' | 'del'

export interface DiffLine {
  op: DiffOp
  text: string
  /** 左侧（旧）行号；删除/相等时有 */
  leftNo?: number
  /** 右侧（新）行号；新增/相等时有 */
  rightNo?: number
}

function splitLines(text: string): string[] {
  if (!text) return []
  // 保留末行空行语义：按 \n 切；去掉因 split 产生的尾部空串若原文不以换行结尾
  const parts = text.split('\n')
  if (parts.length && parts[parts.length - 1] === '' && !text.endsWith('\n')) {
    parts.pop()
  }
  return parts
}

export function lineDiff(oldText: string, newText: string): DiffLine[] {
  const a = splitLines(oldText)
  const b = splitLines(newText)
  const n = a.length
  const m = b.length

  // dp[i][j] = LCS length of a[0..i) and b[0..j)
  const dp: number[][] = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0))
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (a[i - 1] === b[j - 1]) dp[i]![j] = (dp[i - 1]![j - 1] || 0) + 1
      else dp[i]![j] = Math.max(dp[i - 1]![j] || 0, dp[i]![j - 1] || 0)
    }
  }

  const rev: DiffLine[] = []
  let i = n
  let j = m
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) {
      rev.push({ op: 'equal', text: a[i - 1]!, leftNo: i, rightNo: j })
      i--
      j--
    } else if (j > 0 && (i === 0 || (dp[i]![j - 1] || 0) >= (dp[i - 1]![j] || 0))) {
      rev.push({ op: 'add', text: b[j - 1]!, rightNo: j })
      j--
    } else {
      rev.push({ op: 'del', text: a[i - 1]!, leftNo: i })
      i--
    }
  }
  rev.reverse()
  return rev
}
