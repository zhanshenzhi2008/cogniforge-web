<template>
  <div class="app-shell min-h-screen">
    <UHeader
      :toggle="false"
      class="cf-header cf-surface! border-b border-[color:var(--cf-line)]"
    >
      <template #left>
        <LayoutBrandMark />
      </template>

      <!-- UHeader center uses the default slot (not #center) -->
      <UNavigationMenu
        :items="desktopNavItems"
        highlight
        color="primary"
        class="cf-header-nav"
      />

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
            class="user-menu-btn"
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
        <div class="mobile-nav">
          <UNavigationMenu
            :items="mobileNavItems"
            orientation="vertical"
            class="w-full"
          />
          <div class="mobile-nav__divider" />
          <UNavigationMenu
            :items="mobileAccountItems"
            orientation="vertical"
            class="w-full"
          />
        </div>
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

const mobileAccountItems = computed<NavigationMenuItem[]>(() => {
  const items: NavigationMenuItem[] = [
    {
      label: '个人设置',
      icon: 'i-lucide-settings',
      to: '/settings',
      onSelect: () => {
        mobileOpen.value = false
      },
    },
  ]
  if (user.value?.role === 'admin') {
    items.push(
      {
        label: '用户管理',
        icon: 'i-lucide-users',
        to: '/admin/users',
        onSelect: () => {
          mobileOpen.value = false
        },
      },
      {
        label: '角色权限',
        icon: 'i-lucide-shield-check',
        to: '/admin/roles',
        onSelect: () => {
          mobileOpen.value = false
        },
      },
    )
  }
  return items
})

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
.cf-header {
  position: sticky;
  top: 0;
  z-index: 40;
}

.app-shell__main {
  min-height: calc(100vh - 4rem);
}

.mobile-nav {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.mobile-nav__divider {
  height: 1px;
  margin: 8px 0;
  background: var(--cf-line);
}

@media (max-width: 640px) {
  .user-menu-btn :deep(span) {
    display: none;
  }
}
</style>
