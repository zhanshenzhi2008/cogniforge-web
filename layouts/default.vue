<template>
  <div class="default-layout">
    <el-container>
      <el-header class="header">
        <div class="header-left">
          <h1 class="logo">CogniForge</h1>
        </div>
        <div class="header-right">
          <el-menu
            mode="horizontal"
            :ellipsis="false"
            router
          >
            <el-menu-item index="/">控制台</el-menu-item>
            <el-menu-item index="/playground">Playground</el-menu-item>
            <el-menu-item index="/agents">Agents</el-menu-item>
            <el-menu-item index="/workflows">工作流</el-menu-item>
            <el-menu-item index="/knowledge">知识库</el-menu-item>
            <el-menu-item index="/keys">API 密钥</el-menu-item>
          </el-menu>
          <div class="user-info">
          <el-dropdown @command="handleLogout">
            <span class="user-dropdown">
              <el-icon><User /></el-icon>
              <span>用户</span>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item>个人设置</el-dropdown-item>
                <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          </div>
        </div>
      </el-header>
      <el-main>
        <slot />
      </el-main>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus'

const { clearAuth } = useAuth()

const handleLogout = async () => {
  try {
    const { post } = useApi()
    await post('/api/v1/auth/logout')
  } catch (error) {
    // 即使 API 失败也清除本地状态
  } finally {
    clearAuth()
    ElMessage.success('已退出登录')
    navigateTo('/login')
  }
}
</script>

<style scoped>
.default-layout {
  min-height: 100vh;
}
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border-bottom: 1px solid var(--border-color);
  padding: 0 20px;
}
.header-left {
  display: flex;
  align-items: center;
}
.logo {
  font-size: 20px;
  font-weight: 600;
  color: var(--primary-color);
}
.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}
.user-info {
  margin-left: 20px;
}
.user-dropdown {
  display: flex;
  align-items: center;
 gap: 8px;
  cursor: pointer;
}
</style>
