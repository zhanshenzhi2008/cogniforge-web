<template>
  <div class="section-container">
    <div class="section-header">
      <h2 class="section-title">登录会话</h2>
      <p class="section-desc">查看和管理您的活跃登录会话</p>
    </div>

    <!-- 当前会话 -->
    <div class="content-card">
      <div class="card-header">
        <div class="card-icon current-icon">
          <n-icon :component="LaptopOutline" />
        </div>
        <div class="card-title-area">
          <h3>当前设备</h3>
          <p>您正在使用的设备</p>
        </div>
        <n-tag type="success" size="small" round>
          <template #icon>
            <n-icon :component="CheckmarkCircle" />
          </template>
          当前会话
        </n-tag>
      </div>
    </div>

    <!-- 会话列表 -->
    <div class="content-card">
      <div class="card-header no-border">
        <div class="card-title-area">
          <h3>其他活跃会话</h3>
          <p>在其他设备上的登录状态，点击可撤销</p>
        </div>
      </div>

      <div class="sessions-list">
        <n-spin :show="loading">
          <div v-if="sessions.length === 0 && !loading" class="empty-state">
            <n-icon :component="CheckmarkCircleOutline" class="empty-icon" />
            <p>没有其他活跃会话</p>
          </div>

          <TransitionGroup name="session-list" tag="div">
            <div
              v-for="(session, index) in sessions"
              :key="session.id || `session-${index}`"
              class="session-item"
            >
              <div class="session-icon">
                <n-icon :component="getDeviceIcon(session.device)" />
              </div>
              <div class="session-info">
                <div class="session-device">
                  <span class="device-name">{{ session.device || '未知设备' }}</span>
                  <n-tag v-if="session.is_current" type="success" size="tiny">当前</n-tag>
                </div>
                <div class="session-meta">
                  <span class="meta-item">
                    <n-icon :component="LocationOutline" />
                    {{ session.location || '未知位置' }}
                  </span>
                  <span class="meta-item">
                    <n-icon :component="TimeOutline" />
                    {{ formatTime(session.last_used) }}
                  </span>
                  <span class="meta-item">
                    IP: {{ session.ip_address || '未知' }}
                  </span>
                </div>
              </div>
              <div class="session-actions">
                <n-popconfirm
                  @positive-click="handleRevoke(session.id)"
                  positive-text="撤销"
                  negative-text="取消"
                >
                  <template #trigger>
                    <n-button size="small" type="error" ghost :loading="revokingId === session.id">
                      撤销
                    </n-button>
                  </template>
                  确定要撤销此会话吗？
                </n-popconfirm>
              </div>
            </div>
          </TransitionGroup>
        </n-spin>
      </div>
    </div>

    <!-- 安全提示 -->
    <div class="content-card security-tips">
      <div class="tips-header">
        <n-icon :component="ShieldOutline" class="tips-icon" />
        <h4>安全建议</h4>
      </div>
      <ul class="tips-list">
        <li>定期检查活跃会话，及时撤销不认识的设备</li>
        <li>不要在公共设备上保持登录状态</li>
        <li>发现异常登录请立即修改密码并撤销所有会话</li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  LaptopOutline,
  TabletLandscapeOutline,
  PhonePortraitOutline,
  CheckmarkCircle,
  CheckmarkCircleOutline,
  LocationOutline,
  TimeOutline,
  ShieldOutline,
} from '@vicons/ionicons5'
import { NIcon } from 'naive-ui'

const message = useMessage()

const loading = ref(false)
const sessions = ref<any[]>([])
const revokingId = ref<string | null>(null)

const getDeviceIcon = (device: string) => {
  if (!device) return LaptopOutline
  const d = device.toLowerCase()
  if (d.includes('mobile') || d.includes('iphone') || d.includes('android')) {
    return PhonePortraitOutline
  }
  if (d.includes('tablet') || d.includes('ipad')) {
    return TabletLandscapeOutline
  }
  return LaptopOutline
}

const formatTime = (time: string) => {
  if (!time) return '未知'
  const date = new Date(time)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes} 分钟前`
  if (hours < 24) return `${hours} 小时前`
  if (days < 7) return `${days} 天前`
  return date.toLocaleDateString('zh-CN')
}

const loadSessions = async () => {
  loading.value = true
  try {
    const data = await $fetch('/api/v1/settings/sessions')
    sessions.value = data || []
  } catch {
    message.error('获取会话列表失败')
  } finally {
    loading.value = false
  }
}

const handleRevoke = async (sessionId: string) => {
  revokingId.value = sessionId
  try {
    await $fetch(`/api/v1/settings/sessions/${sessionId}`, {
      method: 'DELETE',
    })
    message.success('会话已撤销')
    await loadSessions()
  } catch (error: any) {
    message.error(error.data?.message || '撤销失败')
  } finally {
    revokingId.value = null
  }
}

onMounted(() => {
  loadSessions()
})
</script>

<style scoped>
.section-container {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.section-header {
  margin-bottom: 16px;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #0f172a;
  margin: 0 0 4px 0;
}

.section-desc {
  font-size: 13px;
  color: #64748b;
  margin: 0;
}

.content-card {
  background: #ffffff;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
  margin-bottom: 12px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-bottom: 1px solid #f1f5f9;
}

.card-header.no-border {
  border-bottom: none;
  padding-bottom: 8px;
}

.card-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.card-icon :deep(.n-icon) {
  font-size: 18px;
  color: #ffffff;
}

.current-icon {
  background: linear-gradient(135deg, #10b981, #059669);
}

.card-title-area {
  flex: 1;
}

.card-title-area h3 {
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
  margin: 0;
}

.card-title-area p {
  font-size: 12px;
  color: #64748b;
  margin: 2px 0 0 0;
}

.sessions-list {
  padding: 0 16px 16px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32px 16px;
  color: #94a3b8;
}

.empty-icon {
  font-size: 36px;
  margin-bottom: 8px;
  color: #10b981;
}

.session-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #f1f5f9;
}

.session-item:last-child {
  border-bottom: none;
}

.session-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.session-icon :deep(.n-icon) {
  font-size: 18px;
  color: #64748b;
}

.session-info {
  flex: 1;
  min-width: 0;
}

.session-device {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.device-name {
  font-size: 13px;
  font-weight: 500;
  color: #0f172a;
}

.session-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #64748b;
}

.meta-item :deep(.n-icon) {
  font-size: 12px;
}

.session-actions {
  flex-shrink: 0;
}

.security-tips {
  background: #f0fdf4;
  border-color: #bbf7d0;
}

.tips-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 16px;
  border-bottom: 1px solid #dcfce7;
}

.tips-icon {
  font-size: 16px;
  color: #16a34a;
}

.tips-header h4 {
  font-size: 13px;
  font-weight: 600;
  color: #166534;
  margin: 0;
}

.tips-list {
  margin: 0;
  padding: 12px 16px 14px 40px;
  color: #15803d;
}

.tips-list li {
  font-size: 12px;
  margin-bottom: 6px;
}

.tips-list li:last-child {
  margin-bottom: 0;
}

.session-list-enter-active,
.session-list-leave-active {
  transition: all 0.3s ease;
}

.session-list-enter-from,
.session-list-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

.session-list-move {
  transition: transform 0.3s ease;
}
</style>
