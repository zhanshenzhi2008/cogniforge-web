<template>
  <div class="app-shell min-h-screen" :data-nav-style="navStyle">
    <UHeader
      :toggle="false"
      class="cf-header"
    >
      <template #left>
        <LayoutBrandMark />
      </template>

      <nav class="cf-nav" aria-label="Primary">
        <NuxtLink
          v-for="item in desktopNavItems"
          :key="item.key"
          :to="item.to"
          class="cf-nav__link"
          :class="{ 'is-active': item.active }"
        >
          {{ item.label }}
        </NuxtLink>
      </nav>

      <template #right>
        <UDropdownMenu :items="chromeMenuItems">
          <UButton
            color="neutral"
            variant="ghost"
            icon="i-lucide-palette"
            size="sm"
            aria-label="主题与导航样式"
            class="cf-icon-btn"
          />
        </UDropdownMenu>

        <UDropdownMenu :items="userMenuItems">
          <button type="button" class="cf-user-chip">
            <UAvatar
              :src="user?.avatar_url || undefined"
              :alt="displayName"
              :text="userInitials"
              size="sm"
              class="cf-user-avatar"
            />
            <span class="cf-user-name">{{ displayName }}</span>
            <UIcon name="i-lucide-chevron-down" class="cf-user-chevron size-3.5" />
          </button>
        </UDropdownMenu>

        <UButton
          class="lg:hidden cf-icon-btn"
          color="neutral"
          variant="ghost"
          icon="i-lucide-menu"
          size="sm"
          aria-label="打开导航菜单"
          @click="mobileOpen = true"
        />
      </template>
    </UHeader>

    <USlideover v-model:open="mobileOpen" title="导航" side="right">
      <template #body>
        <div class="mobile-nav">
          <nav class="mobile-nav__list" aria-label="Mobile primary">
            <NuxtLink
              v-for="item in mobileNavItems"
              :key="item.key"
              :to="item.to"
              class="mobile-nav__link"
              :class="{ 'is-active': item.active }"
              @click="mobileOpen = false"
            >
              {{ item.label }}
            </NuxtLink>
          </nav>
          <div class="mobile-nav__divider" />
          <nav class="mobile-nav__list" aria-label="Account">
            <NuxtLink
              v-for="item in mobileAccountLinks"
              :key="item.to"
              :to="item.to"
              class="mobile-nav__link"
              @click="mobileOpen = false"
            >
              {{ item.label }}
            </NuxtLink>
          </nav>
        </div>
      </template>
    </USlideover>

    <UMain class="app-shell__main">
      <slot />
    </UMain>
  </div>
</template>

<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'
import { filterNavItems, resolveActiveNavKey } from '~/constants/nav'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const { user, clearAuth } = useAuth()
const { theme, themes, setTheme } = useTheme()
const { navStyle, navStyles, setNavStyle, init: initNavStyle } = useNavStyle()

onMounted(() => {
  initNavStyle()
})

const mobileOpen = ref(false)

const visibleNav = computed(() => filterNavItems(user.value?.role))
const activeKey = computed(() => resolveActiveNavKey(route.path))

const displayName = computed(() => user.value?.name || '用户')
const userInitials = computed(() => {
  const name = displayName.value.trim()
  if (!name) return '?'
  const parts = name.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
})

const desktopNavItems = computed(() =>
  visibleNav.value.map((item) => ({
    key: item.key,
    label: item.label,
    to: item.to,
    active: activeKey.value === item.key,
  })),
)

const mobileNavItems = desktopNavItems

const mobileAccountLinks = computed(() => {
  const items = [{ label: '个人设置', to: '/settings' }]
  if (user.value?.role === 'admin') {
    items.push(
      { label: '用户管理', to: '/admin/users' },
      { label: '角色权限', to: '/admin/roles' },
    )
  }
  return items
})

const chromeMenuItems = computed<DropdownMenuItem[][]>(() => [
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
  navStyles.map((item) => ({
    label: item.label,
    description: item.description,
    type: 'checkbox' as const,
    checked: navStyle.value === item.id,
    onSelect: (e: Event) => {
      e.preventDefault()
      setNavStyle(item.id)
      toast.add({
        title: item.id === 'island' ? '已切换：悬浮岛' : '已切换：安静编辑室',
        color: 'success',
      })
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
/* -------------------------------------------------------------------------- */
/* Shared                                                                     */
/* -------------------------------------------------------------------------- */
.cf-header {
  position: sticky;
  top: 0;
  z-index: 40;
}

.cf-header :deep([data-slot='left']) {
  flex: 0 0 auto;
}

.cf-header :deep([data-slot='center']) {
  flex: 1 1 auto;
  justify-content: center;
  min-width: 0;
}

.cf-header :deep([data-slot='right']) {
  flex: 0 0 auto;
  gap: 0.35rem;
}

.cf-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.15rem;
  flex-wrap: nowrap;
}

.cf-nav__link {
  position: relative;
  display: inline-flex;
  align-items: center;
  padding: 0.55rem 0.7rem;
  font-size: 0.875rem;
  font-weight: 500;
  letter-spacing: 0.01em;
  color: var(--cf-ink-soft);
  text-decoration: none;
  transition: color 0.15s ease, background 0.15s ease;
  white-space: nowrap;
}

.cf-nav__link:hover {
  color: var(--cf-ink);
}

.cf-icon-btn {
  color: var(--cf-ink-soft);
}

.cf-user-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.2rem 0.45rem 0.2rem 0.2rem;
  border: 0;
  border-radius: 999px;
  background: transparent;
  cursor: pointer;
  font: inherit;
  color: var(--cf-ink);
  transition: background 0.15s ease;
}

.cf-user-chip:hover {
  background: color-mix(in oklab, var(--cf-accent) 8%, transparent);
}

.cf-user-avatar {
  --ui-avatar-bg: color-mix(in oklab, var(--cf-accent) 18%, transparent);
  --ui-avatar-color: var(--cf-accent-ink);
}

.cf-user-name {
  font-size: 0.875rem;
  font-weight: 500;
  max-width: 9rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cf-user-chevron {
  color: var(--cf-ink-soft);
  margin-right: 0.15rem;
}

.app-shell__main {
  min-height: calc(100vh - 4rem);
}

.mobile-nav {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 4px;
}

.mobile-nav__list {
  display: flex;
  flex-direction: column;
}

.mobile-nav__link {
  position: relative;
  display: flex;
  align-items: center;
  padding: 0.85rem 0.25rem;
  font-size: 1rem;
  font-weight: 500;
  color: var(--cf-ink-soft);
  text-decoration: none;
  border-bottom: 1px solid var(--cf-line);
}

.mobile-nav__link:last-child {
  border-bottom: 0;
}

.mobile-nav__link.is-active {
  color: var(--cf-accent-ink);
  font-weight: 650;
}

.mobile-nav__link.is-active::before {
  content: '';
  position: absolute;
  left: -0.35rem;
  top: 50%;
  width: 3px;
  height: 1.1rem;
  border-radius: 999px;
  background: var(--cf-accent);
  transform: translateY(-50%);
}

.mobile-nav__divider {
  height: 1px;
  margin: 10px 0;
  background: var(--cf-line);
}

@media (max-width: 640px) {
  .cf-user-name,
  .cf-user-chevron {
    display: none;
  }

  .cf-user-chip {
    padding: 0.15rem;
  }
}

/* -------------------------------------------------------------------------- */
/* A — 安静编辑室（默认）                                                      */
/* -------------------------------------------------------------------------- */
.app-shell[data-nav-style='editorial'] .cf-header :deep(header[data-slot='root']) {
  height: 4rem;
  background: color-mix(in oklab, var(--cf-bg-elevated) 88%, transparent);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--cf-line);
  box-shadow: none;
}

.app-shell[data-nav-style='editorial'] .cf-header :deep([data-slot='container']) {
  max-width: 1200px;
  gap: 1.25rem;
}

.app-shell[data-nav-style='editorial'] .cf-nav__link::after {
  content: '';
  position: absolute;
  left: 50%;
  bottom: 0.22rem;
  width: 0.72rem;
  height: 2px;
  border-radius: 999px;
  background: var(--cf-accent);
  transform: translateX(-50%) scaleX(0);
  transform-origin: center;
  transition: transform 0.18s ease;
}

.app-shell[data-nav-style='editorial'] .cf-nav__link.is-active {
  color: var(--cf-accent-ink);
  font-weight: 600;
}

.app-shell[data-nav-style='editorial'] .cf-nav__link.is-active::after {
  transform: translateX(-50%) scaleX(1);
}

/* -------------------------------------------------------------------------- */
/* B — 悬浮岛                                                                  */
/* -------------------------------------------------------------------------- */
.app-shell[data-nav-style='island'] .cf-header :deep(header[data-slot='root']) {
  height: auto;
  min-height: 4.5rem;
  padding: 0.75rem 1rem 0.35rem;
  background: transparent;
  border-bottom: 0;
  box-shadow: none;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
}

.app-shell[data-nav-style='island'] .cf-header :deep([data-slot='container']) {
  max-width: 1120px;
  height: 3.35rem;
  padding-inline: 0.85rem;
  gap: 0.75rem;
  border-radius: 999px;
  border: 1px solid var(--cf-line);
  background: color-mix(in oklab, var(--cf-bg-elevated) 94%, white);
  box-shadow:
    0 1px 2px color-mix(in oklab, var(--cf-ink) 4%, transparent),
    0 10px 28px color-mix(in oklab, var(--cf-ink) 6%, transparent);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}

.app-shell[data-nav-style='island'] .cf-header :deep([data-slot='container']:hover) {
  box-shadow:
    0 1px 2px color-mix(in oklab, var(--cf-ink) 5%, transparent),
    0 14px 34px color-mix(in oklab, var(--cf-ink) 8%, transparent);
}

.app-shell[data-nav-style='island'] .cf-nav {
  gap: 0.2rem;
}

.app-shell[data-nav-style='island'] .cf-nav__link {
  padding: 0.4rem 0.75rem;
  border-radius: 999px;
}

.app-shell[data-nav-style='island'] .cf-nav__link::after {
  display: none;
}

.app-shell[data-nav-style='island'] .cf-nav__link:hover {
  background: color-mix(in oklab, var(--cf-accent) 8%, transparent);
  color: var(--cf-ink);
}

.app-shell[data-nav-style='island'] .cf-nav__link.is-active {
  background: color-mix(in oklab, var(--cf-accent) 16%, transparent);
  color: var(--cf-accent-ink);
  font-weight: 600;
}

.app-shell[data-nav-style='island'] .cf-user-chip:hover {
  background: color-mix(in oklab, var(--cf-accent) 10%, transparent);
}

@media (max-width: 1023px) {
  .app-shell[data-nav-style='island'] .cf-header :deep([data-slot='container']) {
    border-radius: 1.1rem;
    height: 3.15rem;
  }
}
</style>
