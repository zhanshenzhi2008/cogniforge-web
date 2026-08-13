/** 导航 IA 冻结：与现网 layouts/default.vue 一致，只换皮不换模块 */

export type NavRole = 'admin' | 'user'

export interface AppNavItem {
  label: string
  key: string
  to: string
  roles: NavRole[]
}

export const APP_NAV_ITEMS: AppNavItem[] = [
  { label: 'Dashboard', key: 'dashboard', to: '/', roles: ['admin', 'user'] },
  { label: 'Playground', key: 'playground', to: '/playground', roles: ['admin', 'user'] },
  { label: 'Agent 管理', key: 'agents', to: '/agents', roles: ['admin', 'user'] },
  { label: '模型配置', key: 'models', to: '/models', roles: ['admin', 'user'] },
  { label: '工作流', key: 'workflows', to: '/workflows', roles: ['admin', 'user'] },
  { label: '知识库', key: 'knowledge', to: '/knowledge', roles: ['admin', 'user'] },
  { label: 'API 密钥', key: 'keys', to: '/keys', roles: ['admin', 'user'] },
  { label: '监控中心', key: 'monitor', to: '/monitor', roles: ['admin'] },
]

export function filterNavItems(role: string | undefined | null): AppNavItem[] {
  const userRole: NavRole = role === 'admin' ? 'admin' : 'user'
  return APP_NAV_ITEMS.filter((item) => item.roles.includes(userRole))
}

export function resolveActiveNavKey(path: string): string {
  const match = APP_NAV_ITEMS.find((item) =>
    item.to === '/' ? path === '/' : path === item.to || path.startsWith(`${item.to}/`),
  )
  return match?.key ?? 'dashboard'
}
