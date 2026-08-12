<template>
  <div class="app-shell min-h-screen">
    <UHeader class="cf-surface! border-b border-[color:var(--cf-line)]">
      <template #left>
        <LayoutBrandMark />
      </template>

      <template #center>
        <UNavigationMenu
          :items="desktopNavItems"
          class="hidden lg:flex"
          highlight
          color="primary"
        />
      </template>

      <template #right>
        <UDropdownMenu :items="themeMenuItems">
          <UButton
            color="neutral"
            variant="ghost"
            icon="i-lucide-palette"
            aria-label="切换主题"
          />
        </UDropdownMenu>

        <UDropdownMenu :items="userMenuItems">
          <UButton
            color="neutral"
            variant="ghost"
            trailing-icon="i-lucide-chevron-down"
            :label="user?.name || '用户'"
            icon="i-lucide-user-round"
          />
        </UDropdownMenu>

        <UButton
          class="lg:hidden"
          color="neutral"
          variant="ghost"
          icon="i-lucide-menu"
          aria-label="打开导航菜单"
          @click="mobileOpen = true"
        />
      </template>
    </UHeader>

    <USlideover v-model:open="mobileOpen" title="导航" side="right">
      <template #body>
        <UNavigationMenu
          :items="mobileNavItems"
          orientation="vertical"
          class="w-full"
          @click="mobileOpen = false"
        />
      </template>
    </USlideover>

    <UMain class="app-shell__main">
      <slot />
    </UMain>
  </div>
</template>

<script setup lang="ts">
import type { DropdownMenuItem, NavigationMenuItem } from '@nuxt/ui'
import { filterNavItems, resolveActiveNavKey } from '~/constants/nav'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const { user, clearAuth } = useAuth()
const { theme, themes, setTheme } = useTheme()

const mobileOpen = ref(false)

const visibleNav = computed(() => filterNavItems(user.value?.role))
const activeKey = computed(() => resolveActiveNavKey(route.path))

const desktopNavItems = computed<NavigationMenuItem[]>(() =>
  visibleNav.value.map((item) => ({
    label: item.label,
    to: item.to,
    active: activeKey.value === item.key,
  })),
)

const mobileNavItems = computed<NavigationMenuItem[]>(() =>
  visibleNav.value.map((item) => ({
    label: item.label,
    to: item.to,
    active: activeKey.value === item.key,
    onSelect: () => {
      mobileOpen.value = false
    },
  })),
)

const themeMenuItems = computed<DropdownMenuItem[][]>(() => [
  themes.map((item) => ({
    label: item.label,
    description: item.description,
    type: 'checkbox' as const,
    checked: theme.value === item.id,
    onSelect: (e: Event) => {
      e.preventDefault()
      setTheme(item.id)
    },
  })),
])

const userMenuItems = computed<DropdownMenuItem[][]>(() => {
  const isAdmin = user.value?.role === 'admin'
  const primary: DropdownMenuItem[] = [
    {
      label: '个人设置',
      icon: 'i-lucide-settings',
      to: '/settings',
    },
  ]

  const admin: DropdownMenuItem[] = isAdmin
    ? [
        {
          label: '用户管理',
          icon: 'i-lucide-users',
          to: '/admin/users',
        },
        {
          label: '角色权限',
          icon: 'i-lucide-shield-check',
          to: '/admin/roles',
        },
      ]
    : []

  const logout: DropdownMenuItem[] = [
    {
      label: '退出登录',
      icon: 'i-lucide-log-out',
      onSelect: async () => {
        try {
          const { post } = useApi()
          await post('/api/v1/auth/logout')
        } catch {
          // 即使 API 失败也清除本地状态
        } finally {
          clearAuth()
          toast.add({ title: '已退出登录', color: 'success' })
          await router.push('/login')
        }
      },
    },
  ]

  return isAdmin ? [primary, admin, logout] : [primary, logout]
})
</script>

<style scoped>
.app-shell__main {
  min-height: calc(100vh - 4rem);
}
</style>
