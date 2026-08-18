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
  { label: 'Play', key: 'playground', to: '/playground', roles: ['admin', 'user'] },
  { label: 'Agents', key: 'agents', to: '/agents', roles: ['admin', 'user'] },
  { label: 'Models', key: 'models', to: '/models', roles: ['admin', 'user'] },
  { label: 'Flows', key: 'workflows', to: '/workflows', roles: ['admin', 'user'] },
  { label: 'Knowledge', key: 'knowledge', to: '/knowledge', roles: ['admin', 'user'] },
  { label: 'Keys', key: 'keys', to: '/keys', roles: ['admin', 'user'] },
  { label: 'Usage', key: 'usage', to: '/usage', roles: ['admin', 'user'] },
  { label: 'Monitor', key: 'monitor', to: '/monitor', roles: ['admin'] },
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
