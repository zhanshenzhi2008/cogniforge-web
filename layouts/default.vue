<template>
  <div class="default-layout">
    <n-layout class="root-layout" :native-scrollbar="false">
      <n-layout-header bordered class="header">
        <div class="header-inner">
          <div class="header-left">
            <span class="logo">CogniForge</span>
          </div>
          <div class="header-right">
            <n-menu
              v-model:value="menuKey"
              mode="horizontal"
              :options="menuOptions"
              class="nav-menu"
              @update:value="onMenuSelect"
            />
            <n-dropdown
              trigger="click"
              :options="userMenuOptions"
              @select="onUserMenuSelect"
            >
              <button type="button" class="user-trigger">
                <n-icon :size="18" :component="PeopleOutline" />
                <span>用户</span>
              </button>
            </n-dropdown>
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
import type { MenuOption } from 'naive-ui'
import { useMessage } from 'naive-ui'
import { PeopleOutline } from '@vicons/ionicons5'

const route = useRoute()
const message = useMessage()
const { clearAuth } = useAuth()

const menuKey = ref(route.path)

watch(
  () => route.path,
  (p) => {
    menuKey.value = p
  }
)

const menuOptions: MenuOption[] = [
  { label: '控制台', key: '/' },
  { label: 'Playground', key: '/playground' },
  { label: 'Agent 管理', key: '/agents' },
  { label: '工作流', key: '/workflows' },
  { label: '知识库', key: '/knowledge' },
  { label: 'API 密钥', key: '/keys' },
]

function onMenuSelect(key: string) {
  navigateTo(key)
}

const userMenuOptions: MenuOption[] = [
  { label: '个人设置', key: 'settings' },
  { type: 'divider', key: 'd1' },
  { label: '退出登录', key: 'logout' },
]

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

function onUserMenuSelect(key: string) {
  if (key === 'logout') {
    void handleLogout()
  }
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

.nav-menu {
  flex: 1;
  min-width: 0;
  justify-content: flex-end;
  --n-item-height: 40px;
}

.nav-menu :deep(.n-menu-item-content) {
  padding: 0 12px;
}

.user-trigger {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-left: 12px;
  padding: 6px 12px;
  border: none;
  border-radius: 10px;
  background: #f1f5f9;
  color: #475569;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}

.user-trigger:hover {
  background: rgba(99, 102, 241, 0.1);
  color: #4f46e5;
}

.main-content {
  min-height: calc(100vh - 56px);
  background: #f8fafc;
}
</style>
