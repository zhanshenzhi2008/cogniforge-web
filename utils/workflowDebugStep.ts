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

/** 画布选中节点时，取时间线里该节点最近一步（跳过人工审批行） */
export function findLatestTimelineKeyForNode(
  steps: { key: string, nodeId?: string, nodeType?: string }[],
  nodeId: string,
): string | null {
  if (!nodeId) return null
  for (let i = steps.length - 1; i >= 0; i--) {
    const s = steps[i]
    if (!s) continue
    if (s.nodeType === 'human_action') continue
    if (s.nodeId === nodeId) return s.key
  }
  return null
}

type EdgeRunLike = {
  target?: string
  class?: string
  animated?: boolean
  style?: Record<string, any>
  [k: string]: any
}

/** 指向 skipped 目标的边淡显、虚线、停动画 */
export function decorateEdgesForSkippedTargets<T extends EdgeRunLike>(
  edges: T[],
  statusByNodeId: Map<string, string>,
): T[] {
  return edges.map((edge) => {
    const skipped = statusByNodeId.get(String(edge.target || '')) === 'skipped'
    const classes = String(edge.class || '')
      .split(/\s+/)
      .filter(c => c && c !== 'run-edge-skipped')
    if (skipped) classes.push('run-edge-skipped')
    const style = { ...(edge.style || {}) }
    if (skipped) {
      style.opacity = 0.35
      style.strokeDasharray = '5 4'
    } else {
      delete style.opacity
      delete style.strokeDasharray
    }
    return {
      ...edge,
      class: classes.join(' '),
      animated: skipped ? false : true,
      style,
    }
  })
}

/** 新开调试/取消后清掉节点与边上的运行态样式 */
export function clearCanvasRunDecorations<
  N extends { class?: string, data?: Record<string, any> },
  E extends EdgeRunLike,
>(nodes: N[], edges: E[]): { nodes: N[], edges: E[] } {
  const nextNodes = nodes.map((n) => {
    const base = String(n.class || '').split(/\s+/).filter(c => c && !c.startsWith('run-'))
    const data = { ...(n.data || {}) }
    delete data.streamProgress
    return { ...n, class: base.join(' '), data }
  })
  const nextEdges = decorateEdgesForSkippedTargets(edges, new Map())
  return { nodes: nextNodes, edges: nextEdges }
}
