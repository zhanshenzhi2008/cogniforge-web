/** 执行仍可能占用资源 / 可取消 */
export function isActiveExecutionStatus(status?: string | null): boolean {
  return ['running', 'waiting', 'debugging', 'pending'].includes(String(status || ''))
}

/** 活跃状态超过阈值则视为可能卡住（默认 10 分钟） */
export function isStaleActiveExecution(
  item: {
    status?: string | null
    started_at?: string | null
    created_at?: string | null
  },
  nowMs = Date.now(),
  staleAfterMs = 10 * 60 * 1000,
): boolean {
  if (!isActiveExecutionStatus(item.status)) return false
  const raw = item.started_at || item.created_at
  if (!raw) return false
  const ageMs = nowMs - new Date(raw).getTime()
  return Number.isFinite(ageMs) && ageMs > staleAfterMs
}

/** 收集可能卡住的活跃执行 id（去重保序） */
export function listStaleActiveExecutionIds(
  items: {
    id?: string | null
    status?: string | null
    started_at?: string | null
    created_at?: string | null
  }[],
  nowMs = Date.now(),
  staleAfterMs = 10 * 60 * 1000,
): string[] {
  const seen = new Set<string>()
  const ids: string[] = []
  for (const item of items || []) {
    const id = String(item?.id || '').trim()
    if (!id || seen.has(id)) continue
    if (!isStaleActiveExecution(item, nowMs, staleAfterMs)) continue
    seen.add(id)
    ids.push(id)
  }
  return ids
}
