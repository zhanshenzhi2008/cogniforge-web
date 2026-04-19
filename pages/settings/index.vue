<template>
  <div class="settings-layout">
    <!-- 左侧导航 -->
    <aside class="settings-sidebar">
      <div class="sidebar-header">
        <h3>设置</h3>
      </div>
      <nav class="sidebar-nav">
        <button
          v-for="item in navItems"
          :key="item.key"
          class="nav-item"
          :class="{ active: activeSection === item.key }"
          @click="activeSection = item.key"
        >
          <n-icon :component="item.icon" class="nav-icon" />
          <span class="nav-label">{{ item.label }}</span>
        </button>
      </nav>
      <div class="sidebar-footer">
        <div class="user-card">
          <n-avatar :size="32" round :src="user?.avatar_url">
            {{ user?.name?.charAt(0)?.toUpperCase() || 'U' }}
          </n-avatar>
          <div class="user-info">
            <div class="user-name">{{ user?.name || '用户' }}</div>
            <div class="user-role">{{ user?.role === 'admin' ? '管理员' : '普通用户' }}</div>
          </div>
        </div>
      </div>
    </aside>

    <!-- 右侧内容区 -->
    <main class="settings-content">
      <Transition name="fade" mode="out-in">
        <!-- 个人资料 -->
        <ProfileSection v-if="activeSection === 'profile'" :key="'profile'" />

        <!-- 安全设置 -->
        <SecuritySection v-else-if="activeSection === 'security'" :key="'security'" />

        <!-- 偏好设置 -->
        <PreferencesSection v-else-if="activeSection === 'preferences'" :key="'preferences'" />

        <!-- 登录会话 -->
        <SessionsSection v-else-if="activeSection === 'sessions'" :key="'sessions'" />
      </Transition>
    </main>
  </div>
</template>

<script setup lang="ts">
import {
  PersonOutline,
  ShieldOutline,
  OptionsOutline,
  TimeOutline,
} from '@vicons/ionicons5'
import { NIcon } from 'naive-ui'

definePageMeta({
  layout: 'default',
  requiresAuth: true,
})

const { user } = useAuth()
const activeSection = ref('profile')

const navItems = [
  { key: 'profile', label: '个人资料', icon: PersonOutline },
  { key: 'security', label: '安全设置', icon: ShieldOutline },
  { key: 'preferences', label: '偏好设置', icon: OptionsOutline },
  { key: 'sessions', label: '登录会话', icon: TimeOutline },
]

// 监听路由查询参数
const route = useRoute()
onMounted(() => {
  if (route.query.section) {
    activeSection.value = route.query.section as string
  }
})
</script>

<style scoped>
.settings-layout {
  display: flex;
  min-height: calc(100vh - 56px);
  background: #f8fafc;
}

.settings-sidebar {
  width: 240px;
  background: #ffffff;
  border-right: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.sidebar-header {
  padding: 20px 20px 12px;
  border-bottom: 1px solid #f1f5f9;
}

.sidebar-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
  letter-spacing: 0.02em;
}

.sidebar-nav {
  flex: 1;
  padding: 12px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: none;
  background: transparent;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
  width: 100%;
  text-align: left;
}

.nav-item:hover {
  background: #f1f5f9;
}

.nav-item.active {
  background: #eef2ff;
}

.nav-item.active .nav-icon {
  color: #4f46e5;
}

.nav-item.active .nav-label {
  color: #4f46e5;
  font-weight: 500;
}

.nav-icon {
  font-size: 18px;
  color: #64748b;
  transition: color 0.15s ease;
}

.nav-label {
  font-size: 14px;
  color: #475569;
  font-weight: 450;
}

.sidebar-footer {
  padding: 16px;
  border-top: 1px solid #f1f5f9;
}

.user-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: #f8fafc;
  border-radius: 10px;
}

.user-info {
  min-width: 0;
}

.user-name {
  font-size: 13px;
  font-weight: 500;
  color: #0f172a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-role {
  font-size: 12px;
  color: #64748b;
  margin-top: 2px;
}

.settings-content {
  flex: 1;
  overflow-y: auto;
  padding: 32px 40px;
  max-width: 800px;
}

/* 过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
