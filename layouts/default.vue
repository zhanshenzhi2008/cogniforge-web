<template>
  <n-layout class="root-layout" :native-scrollbar="false">
    <n-layout-header bordered class="header">
      <div class="header-inner">
        <span class="logo">CogniForge</span>

        <n-menu
          v-model:value="activeKey"
          mode="horizontal"
          :options="filteredMenuOptions"
          class="nav-menu"
          @update:value="handleMenuSelect"
        />

        <n-dropdown
          :options="userMenuOptions"
          placement="bottom-end"
          @select="handleUserMenuSelect"
        >
          <n-button quaternary class="user-trigger">
            <template #icon>
              <n-icon :component="PeopleOutline" />
            </template>
            {{ user?.name || '用户' }}
            <n-icon :component="ChevronDownOutline" class="chevron-icon" />
          </n-button>
        </n-dropdown>
      </div>
    </n-layout-header>

    <n-layout-content class="main-content" content-style="padding: 0;">
      <slot />
    </n-layout-content>
  </n-layout>
</template>

<script setup lang="ts">
import {
  NLayout,
  NLayoutHeader,
  NLayoutContent,
  NMenu,
  NDropdown,
  NButton,
  NIcon,
  useMessage,
  type MenuOption,
  type DropdownOption,
} from 'naive-ui'
import {
  PeopleOutline,
  ChevronDownOutline,
  ExitOutline,
  SettingsOutline,
  PeopleCircleOutline,
  ShieldCheckmarkOutline,
} from '@vicons/ionicons5'

const route = useRoute()
const router = useRouter()
const message = useMessage()
const { user, clearAuth } = useAuth()

// 导航菜单项定义
const navItems = [
  { label: '控制台', key: 'dashboard', to: '/', roles: ['admin', 'user'] },
  { label: 'Playground', key: 'playground', to: '/playground', roles: ['admin', 'user'] },
  { label: 'Agent 管理', key: 'agents', to: '/agents', roles: ['admin', 'user'] },
  { label: '工作流', key: 'workflows', to: '/workflows', roles: ['admin', 'user'] },
  { label: '知识库', key: 'knowledge', to: '/knowledge', roles: ['admin', 'user'] },
  { label: 'API 密钥', key: 'keys', to: '/keys', roles: ['admin', 'user'] },
  { label: '监控中心', key: 'monitor', to: '/monitor', roles: ['admin'] },
]

// 计算当前用户的可见菜单项
const filteredMenuOptions = computed<MenuOption[]>(() => {
  const userRole = user.value?.role || 'user'

  return navItems
    .filter(item => !item.roles || item.roles.includes(userRole))
    .map(item => ({
      label: item.label,
      key: item.key,
      to: item.to,
    }))
})

// 当前激活的菜单项
const activeKey = ref('dashboard')

watch(() => route.path, () => {
  const path = route.path
  const match = navItems.find((item) =>
    item.to === '/' ? path === '/' : path === item.to || path.startsWith(`${item.to}/`)
  )
  activeKey.value = match?.key ?? 'dashboard'
}, { immediate: true })

// 用户菜单选项
const userMenuOptions = computed<DropdownOption[]>(() => {
  const isAdmin = user.value?.role === 'admin'
  const options: DropdownOption[] = [
    {
      label: '个人设置',
      key: 'settings',
      icon: () => h(NIcon, null, { default: () => h(SettingsOutline) }),
    },
  ]

  // 管理员额外菜单
  if (isAdmin) {
    options.push(
      { type: 'divider', key: 'd1' },
      {
        label: '用户管理',
        key: 'admin-users',
        icon: () => h(NIcon, null, { default: () => h(PeopleCircleOutline) }),
      },
      {
        label: '角色权限',
        key: 'admin-roles',
        icon: () => h(NIcon, null, { default: () => h(ShieldCheckmarkOutline) }),
      }
    )
  }

  options.push(
    { type: 'divider', key: 'd2' },
    {
      label: '退出登录',
      key: 'logout',
      icon: () => h(NIcon, null, { default: () => h(ExitOutline) }),
    }
  )

  return options
})

// 菜单选择处理
function handleMenuSelect(key: string) {
  const item = navItems.find(i => i.key === key)
  if (item?.to) {
    router.push(item.to)
  }
}

// 用户菜单选择处理
async function handleUserMenuSelect(key: string) {
  if (key === 'settings') {
    await router.push('/settings/profile')
  } else if (key === 'admin-users') {
    await router.push('/admin/users')
  } else if (key === 'admin-roles') {
    await router.push('/admin/roles')
  } else if (key === 'logout') {
    try {
      const { post } = useApi()
      await post('/api/v1/auth/logout')
    } catch {
      // 即使 API 失败也清除本地状态
    } finally {
      clearAuth()
      message.success('已退出登录')
      router.push('/login')
    }
  }
}
</script>

<style scoped>
.root-layout {
  min-height: 100vh;
  background: #f8fafc;
}

.header {
  height: 56px;
  padding: 0;
  background: #ffffff !important;
  border-bottom: 1px solid #e2e8f0 !important;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}

.header-inner {
  max-width: 1400px;
  margin: 0 auto;
  height: 100%;
  display: flex;
  align-items: center;
  gap: 0;
  padding: 0 20px;
}

.logo {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: #4f46e5;
  margin-right: 32px;
  flex-shrink: 0;
}

.nav-menu {
  flex: 1;
}

:deep(.nav-nuxtlink) {
  color: inherit;
  text-decoration: none;
  display: block;
}

.user-trigger {
  flex-shrink: 0;
  margin-left: 8px;
  gap: 4px;
}

.chevron-icon {
  font-size: 12px;
  opacity: 0.6;
}

.main-content {
  min-height: calc(100vh - 56px);
  background: #f8fafc;
}
</style>
