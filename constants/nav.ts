/** 顶栏主模块 + 头像里的用量/监控 */

export type NavRole = 'admin' | 'user'

export interface AppNavItem {
  key: string
  to?: string
  roles: NavRole[]
  children?: AppNavItem[]
}

/** 顶栏：控制台 对话 智能体 工作流 知识库 配置▾ */
export const APP_PRIMARY_NAV: AppNavItem[] = [
  { key: 'dashboard', to: '/', roles: ['admin', 'user'] },
  { key: 'playground', to: '/playground', roles: ['admin', 'user'] },
  { key: 'agents', to: '/agents', roles: ['admin', 'user'] },
  { key: 'workflows', to: '/workflows', roles: ['admin', 'user'] },
  { key: 'knowledge', to: '/knowledge', roles: ['admin', 'user'] },
  {
    key: 'config',
    roles: ['admin', 'user'],
    children: [
      { key: 'models', to: '/models', roles: ['admin', 'user'] },
      { key: 'keys', to: '/keys', roles: ['admin', 'user'] },
    ],
  },
]

/** 头像菜单：用量；监控仅 admin */
export const APP_ACCOUNT_NAV: AppNavItem[] = [
  { key: 'usage', to: '/usage', roles: ['admin', 'user'] },
  { key: 'monitor', to: '/monitor', roles: ['admin'] },
]

function flattenNav(items: AppNavItem[]): AppNavItem[] {
  const out: AppNavItem[] = []
  for (const item of items) {
    if (item.to) out.push(item)
    if (item.children?.length) out.push(...flattenNav(item.children))
  }
  return out
}

function allowedForRole(item: AppNavItem, role: NavRole): boolean {
  return item.roles.includes(role)
}

export function filterNavItems(items: AppNavItem[], role: string | undefined | null): AppNavItem[] {
  const userRole: NavRole = role === 'admin' ? 'admin' : 'user'
  return items
    .filter(item => allowedForRole(item, userRole))
    .map((item) => {
      if (!item.children?.length) return item
      const children = item.children.filter(child => allowedForRole(child, userRole))
      return { ...item, children }
    })
    .filter(item => item.to || (item.children && item.children.length > 0))
}

export function resolveActiveNavKey(path: string): string {
  const all = [...flattenNav(APP_PRIMARY_NAV), ...flattenNav(APP_ACCOUNT_NAV)]
  const match = all.find(item =>
    item.to === '/' ? path === '/' : !!item.to && (path === item.to || path.startsWith(`${item.to}/`)),
  )
  return match?.key ?? ''
}

export function isNavGroupActive(item: AppNavItem, activeKey: string): boolean {
  if (item.key === activeKey) return true
  return !!item.children?.some(child => isNavGroupActive(child, activeKey))
}
