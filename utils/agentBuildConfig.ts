/**
 * Parse structured Agent build output from the config-assistant chat.
 * Expect a fenced ```agent-config JSON block; the rest is human-readable display text.
 */

export interface AgentBuildConfig {
  system_prompt?: string
  tools?: string[]
  name?: string
  description?: string
}

const FENCE_RE = /```(?:agent-config|cfg|json)\s*([\s\S]*?)```/i

export function extractAgentBuildConfig(content: string): {
  display: string
  config: AgentBuildConfig | null
} {
  const raw = content || ''
  const match = raw.match(FENCE_RE)
  if (!match?.[1]) {
    // Fallback: whole reply as prompt if it looks like a prompt draft (no fence)
    const trimmed = raw.trim()
    if (!trimmed) return { display: '', config: null }
    return {
      display: trimmed,
      config: { system_prompt: trimmed },
    }
  }

  let config: AgentBuildConfig | null = null
  try {
    const parsed = JSON.parse(match[1].trim()) as AgentBuildConfig
    if (parsed && typeof parsed === 'object') {
      config = {
        system_prompt: typeof parsed.system_prompt === 'string' ? parsed.system_prompt.trim() : undefined,
        name: typeof parsed.name === 'string' ? parsed.name.trim() : undefined,
        description: typeof parsed.description === 'string' ? parsed.description.trim() : undefined,
        tools: Array.isArray(parsed.tools)
          ? parsed.tools.map(t => String(t).trim()).filter(Boolean)
          : undefined,
      }
      if (!config.system_prompt && !config.name && !config.description && !config.tools?.length) {
        config = null
      }
    }
  } catch {
    config = null
  }

  const display = raw.replace(FENCE_RE, '').trim()
  return { display: display || raw.trim(), config }
}

/** Map tool names/ids from the model onto known MCP server ids. */
export function resolveBuildToolIds(
  requested: string[] | undefined,
  catalog: Array<{ id: string; name: string }>,
): string[] {
  if (!requested?.length) return []
  const byId = new Map(catalog.map(c => [c.id.toLowerCase(), c.id]))
  const byName = new Map(catalog.map(c => [c.name.toLowerCase(), c.id]))
  const out: string[] = []
  for (const item of requested) {
    const key = item.toLowerCase()
    const id = byId.get(key) || byName.get(key)
    if (id && !out.includes(id)) out.push(id)
  }
  return out
}

/** Tools requested in config that are not in the MCP catalog. */
export function listUnresolvedBuildTools(
  requested: string[] | undefined,
  catalog: Array<{ id: string; name: string }>,
): string[] {
  if (!requested?.length) return []
  const resolved = new Set(resolveBuildToolIds(requested, catalog))
  const byId = new Map(catalog.map(c => [c.id.toLowerCase(), c.id]))
  const byName = new Map(catalog.map(c => [c.name.toLowerCase(), c.id]))
  const unresolved: string[] = []
  for (const item of requested) {
    const key = item.toLowerCase()
    const id = byId.get(key) || byName.get(key)
    if (!id || !resolved.has(id)) {
      if (!unresolved.includes(item)) unresolved.push(item)
    }
  }
  return unresolved
}

export type UnsupportedBuildKind = 'vm' | 'voice' | 'publish' | 'unknown_tool_install'

const UNSUPPORTED_PATTERNS: Array<{ kind: UnsupportedBuildKind; re: RegExp }> = [
  { kind: 'vm', re: /虚拟机|云电脑|sandbox\s*vm|code\s*interpreter\s*容器/i },
  { kind: 'voice', re: /语音播放|语音输入|语音识别|tts|stt|asr/i },
  { kind: 'publish', re: /发布渠道|嵌入网站|对接微信|对接飞书(?!工具)|第三方\s*im/i },
  {
    kind: 'unknown_tool_install',
    re: /安装.{0,16}(工具|插件|mcp)|接入.{0,16}(工具|插件|mcp)|帮我\s*装\s*(工具|插件|mcp)/i,
  },
]

/** Detect asks that Build cannot fulfill today (local gate before / instead of model). */
export function detectUnsupportedBuildIntents(text: string): UnsupportedBuildKind[] {
  const raw = text || ''
  const found: UnsupportedBuildKind[] = []
  for (const { kind, re } of UNSUPPORTED_PATTERNS) {
    if (re.test(raw) && !found.includes(kind)) found.push(kind)
  }
  return found
}

export function stripAgentBuildFence(content: string): string {
  return (content || '').replace(FENCE_RE, '').trim() || content
}
