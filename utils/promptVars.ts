import type { PromptVarDef } from '@/composables/usePrompts'

/** 校验必填：返回缺失变量名列表（填写值或 default 有值即算填了） */
export function missingRequiredVars(
  defs: PromptVarDef[],
  values: Record<string, string>,
): string[] {
  const missing: string[] = []
  for (const d of defs) {
    if (!d.required || !d.name?.trim()) continue
    const raw = values[d.name]
    const filled = (raw ?? '').trim() || (d.default ?? '').trim()
    if (!filled) missing.push(d.name)
  }
  return missing
}

/** 合并填写值与默认值 */
export function buildVariableMap(
  defs: PromptVarDef[],
  values: Record<string, string>,
): Record<string, string> {
  const out: Record<string, string> = {}
  for (const d of defs) {
    const name = (d.name || '').trim()
    if (!name) continue
    const v = (values[name] ?? '').trim() || (d.default ?? '').trim()
    if (v) out[name] = v
  }
  for (const [k, v] of Object.entries(values)) {
    if (!(k in out) && v?.trim()) out[k] = v.trim()
  }
  return out
}

/** 从定义生成空表单初始值（预填 default） */
export function initVarFormValues(defs: PromptVarDef[]): Record<string, string> {
  const out: Record<string, string> = {}
  for (const d of defs) {
    const name = (d.name || '').trim()
    if (!name) continue
    out[name] = d.default || ''
  }
  return out
}
