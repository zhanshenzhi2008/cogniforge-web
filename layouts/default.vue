<template>
  <div class="default-layout">
    <n-layout class="root-layout" :native-scrollbar="false">
      <n-layout-header bordered class="header">
        <div class="header-inner">
          <div class="header-left">
            <span class="logo">CogniForge</span>
          </div>
          <div class="header-right">
            <nav class="nav-links" aria-label="主导航">
              <NuxtLink
                v-for="item in navItems"
                :key="item.to"
                :to="item.to"
                class="nav-link"
                :class="{ 'nav-link--active': isNavActive(item.to) }"
              >
                {{ item.label }}
              </NuxtLink>
            </nav>
            <div ref="userMenuRef" class="user-menu-root">
              <button
                type="button"
                class="user-trigger"
                :aria-expanded="userMenuOpen"
                aria-haspopup="menu"
                @click.stop="userMenuOpen = !userMenuOpen"
              >
                <n-icon :size="18" :component="PeopleOutline" />
                <span>用户</span>
              </button>
              <Transition name="dropdown-fade">
                <div
                  v-show="userMenuOpen"
                  class="user-dropdown"
                  role="menu"
                  @click.stop
                >
                  <button
                    type="button"
                    class="dropdown-item"
                    role="menuitem"
                    @click="onUserSettings"
                  >
                    个人设置
                  </button>
                  <div class="dropdown-divider" />
                  <button
                    type="button"
                    class="dropdown-item dropdown-item--danger"
                    role="menuitem"
                    @click="onUserLogout"
                  >
                    退出登录
                  </button>
                </div>
              </Transition>
            </div>
          </div>
        </div>
      </n-layout-header>
      <n-layout-content class="main-content" content-style="padding: 0;">
        <slot />
      </n-layout-content>
    </n-layout>
  </div>
</template>

<script setup lang="ts">
import { useMessage } from 'naive-ui'
import { PeopleOutline } from '@vicons/ionicons5'

const route = useRoute()
const message = useMessage()
const { clearAuth } = useAuth()

const navItems = [
  { label: '控制台', to: '/' },
  { label: 'Playground', to: '/playground' },
  { label: 'Agent 管理', to: '/agents' },
  { label: '工作流', to: '/workflows' },
  { label: '知识库', to: '/knowledge' },
  { label: 'API 密钥', to: '/keys' },
] as const

function isNavActive(to: string) {
  if (to === '/') return route.path === '/'
  return route.path === to || route.path.startsWith(`${to}/`)
}

const userMenuOpen = ref(false)
const userMenuRef = ref<HTMLElement | null>(null)

function onDocumentClick(ev: MouseEvent) {
  const el = userMenuRef.value
  if (!el || !userMenuOpen.value) return
  const t = ev.target
  if (t instanceof Node && !el.contains(t)) {
    userMenuOpen.value = false
  }
}

onMounted(() => {
  if (import.meta.client) {
    document.addEventListener('click', onDocumentClick)
  }
})
onUnmounted(() => {
  if (import.meta.client) {
    document.removeEventListener('click', onDocumentClick)
  }
})

function onUserSettings() {
  userMenuOpen.value = false
  message.info('个人设置即将开放')
}

async function handleLogout() {
  try {
    const { post } = useApi()
    await post('/api/v1/auth/logout')
  } catch {
    // 即使 API 失败也清除本地状态
  } finally {
    clearAuth()
    message.success('已退出登录')
    navigateTo('/login')
  }
}

function onUserLogout() {
  userMenuOpen.value = false
  void handleLogout()
}
</script>

<style scoped>
.default-layout {
  min-height: 100vh;
  background: #f8fafc;
}

.root-layout {
  min-height: 100vh;
  background: transparent;
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
  justify-content: space-between;
  padding: 0 20px;
}

.logo {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: #4f46e5;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  justify-content: flex-end;
  min-width: 0;
}

.nav-links {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 4px;
  flex: 1;
  min-width: 0;
}

.nav-link {
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 14px;
  color: #64748b;
  text-decoration: none;
  white-space: nowrap;
  transition:
    background 0.15s,
    color 0.15s;
}

.nav-link:hover {
  color: #4f46e5;
  background: rgba(99, 102, 241, 0.08);
}

.nav-link--active {
  color: #4f46e5;
  font-weight: 600;
  background: rgba(99, 102, 241, 0.1);
}

.user-menu-root {
  position: relative;
  margin-left: 12px;
  flex-shrink: 0;
}

.user-trigger {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border: none;
  border-radius: 10px;
  background: #f1f5f9;
  color: #475569;
  font-size: 14px;
  cursor: pointer;
  transition:
    background 0.2s,
    color 0.2s;
}

.user-trigger:hover {
  background: rgba(99, 102, 241, 0.1);
  color: #4f46e5;
}

.user-dropdown {
  position: absolute;
  right: 0;
  top: calc(100% + 6px);
  min-width: 160px;
  padding: 6px;
  background: #fff;
  border-radius: 10px;
  box-shadow:
    0 4px 16px rgba(15, 23, 42, 0.12),
    0 0 0 1px rgba(15, 23, 42, 0.06);
  z-index: 2000;
}

.dropdown-item {
  display: block;
  width: 100%;
  padding: 8px 12px;
  border: none;
  border-radius: 8px;
  background: transparent;
  font-size: 14px;
  text-align: left;
  color: #334155;
  cursor: pointer;
  transition: background 0.15s;
}

.dropdown-item:hover {
  background: #f1f5f9;
}

.dropdown-item--danger {
  color: #dc2626;
}

.dropdown-item--danger:hover {
  background: #fef2f2;
}

.dropdown-divider {
  height: 1px;
  margin: 6px 4px;
  background: #e2e8f0;
}

.dropdown-fade-enter-active,
.dropdown-fade-leave-active {
  transition:
    opacity 0.12s ease,
    transform 0.12s ease;
}

.dropdown-fade-enter-from,
.dropdown-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

.main-content {
  min-height: calc(100vh - 56px);
  background: #f8fafc;
}
</style>
