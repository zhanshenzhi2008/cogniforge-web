/**
 * 产品域图标唯一入口：页面 / 工作流节点 / 控制台入口共用，禁止各处硬编码分叉。
 * 自定义 SVG 放 assets/icons/，Nuxt Icon 前缀 cf → i-cf-{name}
 */

export const CF_ICONS = {
  /** 知识库 / 工作流检索节点 */
  knowledge: 'i-cf-knowledge',
  /** 知识库缺失 / 找不到 */
  knowledgeMissing: 'i-lucide-book-x',

  /** 智能体 */
  agent: 'i-lucide-bot',
  agentMissing: 'i-lucide-bot-off',

  /** 小队 */
  team: 'i-lucide-users',

  /** LLM / AI 生成 / 助手气泡 */
  llm: 'i-lucide-sparkles',
  ai: 'i-lucide-sparkles',

  /** 工作流 */
  workflow: 'i-lucide-git-branch',

  /** 对话 / Playground */
  chat: 'i-lucide-messages-square',
  chatQuick: 'i-lucide-zap',

  /** API Key */
  key: 'i-lucide-key-round',

  /** 通用 */
  user: 'i-lucide-user',
  fallback: 'i-lucide-box',
} as const

export type CfIconName = (typeof CF_ICONS)[keyof typeof CF_ICONS]
