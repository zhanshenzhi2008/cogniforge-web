<template>
  <n-layout class="root-layout" :native-scrollbar="false">
    <n-layout-header bordered class="header">
      <div class="header-inner">
        <span class="logo">CogniForge</span>

        <n-menu
          v-model:value="activeKey"
          mode="horizontal"
          :options="menuOptions"
          class="nav-menu"
          @update:value="(key) => navigateTo(navItems.find(i => i.key === key)?.to ?? '/')"
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
            用户
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
} from 'naive-ui'
import { PeopleOutline, ChevronDownOutline, ExitOutline } from '@vicons/ionicons5'

const route = useRoute()
const message = useMessage()
const { clearAuth } = useAuth()

const navItems: Array<{ label: string; key: string; to: string }> = [
  { label: '控制台', key: 'dashboard', to: '/' },
  { label: 'Playground', key: 'playground', to: '/playground' },
  { label: 'Agent 管理', key: 'agents', to: '/agents' },
  { label: '工作流', key: 'workflows', to: '/workflows' },
  { label: '知识库', key: 'knowledge', to: '/knowledge' },
  { label: 'API 密钥', key: 'keys', to: '/keys' },
]

const activeKey = computed(() => {
  const path = route.path
  const match = navItems.find((item) =>
    item.to === '/' ? path === '/' : path === item.to || path.startsWith(`${item.to}/`)
  )
  return match?.key ?? 'dashboard'
})

const menuOptions: MenuOption[] = navItems.map((item) => ({
  label: item.label,
  key: item.key,
  to: item.to,
}))

const userMenuOptions = [
  { label: '个人设置', key: 'settings', icon: () => h(NIcon, null, { default: () => h(PeopleOutline) }) },
  { type: 'divider', key: 'd1' },
  { label: '退出登录', key: 'logout', icon: () => h(NIcon, null, { default: () => h(ExitOutline) }) },
]

async function handleUserMenuSelect(key: string) {
  if (key === 'settings') {
    message.info('个人设置即将开放')
    return
  }
  if (key === 'logout') {
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
