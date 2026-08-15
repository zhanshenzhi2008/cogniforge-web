<template>
  <div class="section-container">
    <div class="section-header">
      <h2 class="cf-section-title">{{ t('sessions.title') }}</h2>
      <p class="cf-section-desc">{{ t('sessions.sub') }}</p>
    </div>

    <div class="content-card cf-surface">
      <div class="card-header">
        <div class="card-icon current-icon">
          <UIcon name="i-lucide-laptop" class="size-[18px] text-white" />
        </div>
        <div class="card-title-area">
          <h3>{{ t('sessions.thisDevice') }}</h3>
          <p>{{ t('sessions.thisHint') }}</p>
        </div>
        <UBadge color="success" variant="subtle" size="sm" icon="i-lucide-check-circle">
          {{ t('sessions.current') }}
        </UBadge>
      </div>
    </div>

    <div class="content-card cf-surface">
      <div class="card-header no-border">
        <div class="card-title-area">
          <h3>{{ t('sessions.others') }}</h3>
          <p>{{ t('sessions.othersHint') }}</p>
        </div>
      </div>

      <div class="sessions-list">
        <div v-if="loading" class="state-box">
          <UIcon name="i-lucide-loader-circle" class="size-6 animate-spin" />
          <span>{{ t('common.loading') }}</span>
        </div>

        <div v-else-if="sessions.length === 0" class="empty-state">
          <UIcon name="i-lucide-circle-check" class="empty-icon size-9" />
          <p>{{ t('sessions.empty') }}</p>
        </div>

        <TransitionGroup v-else name="session-list" tag="div">
          <div
            v-for="(session, index) in sessions"
            :key="session.id || `session-${index}`"
            class="session-item"
          >
            <div class="session-icon">
              <UIcon :name="getDeviceIcon(session.device)" class="size-[18px]" />
            </div>
            <div class="session-info">
              <div class="session-device">
                <span class="device-name">{{ session.device || t('sessions.unknownDevice') }}</span>
                <UBadge v-if="session.is_current" color="success" variant="subtle" size="sm">
                  {{ t('sessions.currentShort') }}
                </UBadge>
              </div>
              <div class="session-meta">
                <span class="meta-item">
                  <UIcon name="i-lucide-map-pin" class="size-3" />
                  {{ session.location || t('sessions.unknownLocation') }}
                </span>
                <span class="meta-item">
                  <UIcon name="i-lucide-clock" class="size-3" />
                  {{ formatTime(session.last_used) }}
                </span>
                <span class="meta-item">
                  IP: {{ session.ip_address || t('common.unknown') }}
                </span>
              </div>
            </div>
            <div class="session-actions">
              <CfButton
                tone="icon-danger"
                icon="i-lucide-ban"
                :tip="t('sessions.revoke')"
                :loading="revokingId === session.id"
                @click="askRevoke(session.id)"
              />
            </div>
          </div>
        </TransitionGroup>
      </div>
    </div>

    <div class="content-card security-tips cf-surface">
      <div class="tips-header">
        <UIcon name="i-lucide-shield" class="tips-icon size-4" />
        <h4>{{ t('sessions.tips') }}</h4>
      </div>
      <ul class="tips-list">
        <li>{{ t('sessions.tip1') }}</li>
        <li>{{ t('sessions.tip2') }}</li>
        <li>{{ t('sessions.tip3') }}</li>
      </ul>
    </div>

    <UModal v-model:open="revokeVisible" :title="t('sessions.revokeTitle')" :ui="{ content: 'sm:max-w-md' }">
      <template #body>
        <p class="confirm-text">{{ t('sessions.revokeText') }}</p>
      </template>
      <template #footer>
        <div class="modal-actions">
          <div class="modal-actions__right">
            <CfButton tone="secondary" icon="i-lucide-x" @click="revokeVisible = false">{{ t('common.cancel') }}</CfButton>
            <CfButton
              tone="danger"
              strong
              icon="i-lucide-ban"
              :loading="!!revokingId"
              @click="confirmRevoke"
            >
              {{ t('sessions.revoke') }}
            </CfButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
const toast = useToast()
const { t, d } = useLocale()

const loading = ref(false)
const sessions = ref<any[]>([])
const revokingId = ref<string | null>(null)
const revokeVisible = ref(false)
const pendingRevokeId = ref<string | null>(null)

const getDeviceIcon = (device: string) => {
  if (!device) return 'i-lucide-laptop'
  const name = device.toLowerCase()
  if (name.includes('mobile') || name.includes('iphone') || name.includes('android')) {
    return 'i-lucide-smartphone'
  }
  if (name.includes('tablet') || name.includes('ipad')) {
    return 'i-lucide-tablet'
  }
  return 'i-lucide-laptop'
}

const formatTime = (time: string) => {
  if (!time) return t('common.unknown')
  const date = new Date(time)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return t('common.justNow')
  if (minutes < 60) return t('common.minutesAgo', { n: minutes })
  if (hours < 24) return t('common.hoursAgo', { n: hours })
  if (days < 7) return t('common.daysAgo', { n: days })
  return d(date)
}

const loadSessions = async () => {
  loading.value = true
  try {
    const data = await $fetch('/api/v1/settings/sessions')
    sessions.value = data || []
  } catch {
    toast.add({ title: t('sessions.listFail'), color: 'error' })
  } finally {
    loading.value = false
  }
}

const askRevoke = (sessionId: string) => {
  pendingRevokeId.value = sessionId
  revokeVisible.value = true
}

const confirmRevoke = async () => {
  if (!pendingRevokeId.value) return
  await handleRevoke(pendingRevokeId.value)
  revokeVisible.value = false
  pendingRevokeId.value = null
}

const handleRevoke = async (sessionId: string) => {
  revokingId.value = sessionId
  try {
    await $fetch(`/api/v1/settings/sessions/${sessionId}`, {
      method: 'DELETE',
    })
    toast.add({ title: t('sessions.revoked'), color: 'success' })
    await loadSessions()
  } catch (error: any) {
    toast.add({ title: error.data?.message || t('sessions.revokeFail'), color: 'error' })
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

.content-card {
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 12px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--cf-line);
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

.current-icon {
  background: linear-gradient(135deg, var(--cf-ok), color-mix(in oklab, var(--cf-ok) 70%, #000));
}

.card-title-area {
  flex: 1;
}

.card-title-area h3 {
  font-size: 14px;
  font-weight: 600;
  color: var(--cf-ink);
  margin: 0;
}

.card-title-area p {
  font-size: 12px;
  color: var(--cf-ink-soft);
  margin: 2px 0 0 0;
}

.sessions-list {
  padding: 0 16px 16px;
}

.state-box,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 32px 16px;
  color: var(--cf-ink-soft);
}

.empty-icon {
  color: var(--cf-ok);
}

.session-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid var(--cf-line);
}

.session-item:last-child {
  border-bottom: none;
}

.session-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: color-mix(in oklab, var(--cf-bg-muted) 80%, transparent);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: var(--cf-ink-soft);
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
  color: var(--cf-ink);
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
  color: var(--cf-ink-soft);
}

.session-actions {
  flex-shrink: 0;
}

.security-tips {
  background: color-mix(in oklab, var(--cf-ok) 8%, var(--cf-bg-elevated));
  border-color: color-mix(in oklab, var(--cf-ok) 30%, var(--cf-line));
}

.tips-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 16px;
  border-bottom: 1px solid color-mix(in oklab, var(--cf-ok) 20%, var(--cf-line));
}

.tips-icon {
  color: var(--cf-ok);
}

.tips-header h4 {
  font-size: 13px;
  font-weight: 600;
  color: var(--cf-ok);
  margin: 0;
}

.tips-list {
  margin: 0;
  padding: 12px 16px 14px 40px;
  color: color-mix(in oklab, var(--cf-ok) 85%, var(--cf-ink));
}

.tips-list li {
  font-size: 12px;
  margin-bottom: 6px;
}

.tips-list li:last-child {
  margin-bottom: 0;
}

.confirm-text {
  margin: 0;
  color: var(--cf-ink-soft);
  font-size: 14px;
}

.modal-actions__right {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
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
