<template>
  <div class="settings-layout">
    <aside class="settings-sidebar">
      <div class="sidebar-header">
        <h3 class="sidebar-brand">Settings</h3>
      </div>
      <nav class="sidebar-nav">
        <button
          v-for="item in navItems"
          :key="item.key"
          class="nav-item"
          :class="{ active: activeSection === item.key }"
          @click="activeSection = item.key"
        >
          <UIcon :name="item.icon" class="nav-icon size-[18px]" />
          <span class="nav-label">{{ item.label }}</span>
        </button>
      </nav>
      <div class="sidebar-footer">
        <div class="user-card">
          <UAvatar
            :src="user?.avatar_url || undefined"
            :alt="user?.name || 'User'"
            size="sm"
            :text="user?.name?.charAt(0)?.toUpperCase() || 'U'"
          />
          <div class="user-info">
            <div class="user-name">{{ user?.name || 'User' }}</div>
            <div class="user-role">{{ user?.role === 'admin' ? 'Admin' : 'Member' }}</div>
          </div>
        </div>
      </div>
    </aside>

    <main class="settings-content">
      <Transition name="fade" mode="out-in">
        <ProfileSection v-if="activeSection === 'profile'" :key="'profile'" />
        <SecuritySection v-else-if="activeSection === 'security'" :key="'security'" />
        <PreferencesSection v-else-if="activeSection === 'preferences'" :key="'preferences'" />
        <SessionsSection v-else-if="activeSection === 'sessions'" :key="'sessions'" />
      </Transition>
    </main>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'default',
  requiresAuth: true,
})

const { user } = useAuth()
const activeSection = ref('profile')

const navItems = [
  { key: 'profile', label: 'Profile', icon: 'i-lucide-user' },
  { key: 'security', label: 'Security', icon: 'i-lucide-shield' },
  { key: 'preferences', label: 'Preferences', icon: 'i-lucide-sliders-horizontal' },
  { key: 'sessions', label: 'Sessions', icon: 'i-lucide-clock' },
]

const route = useRoute()
watch(
  () => route.query.section,
  (section) => {
    if (typeof section === 'string' && section) {
      activeSection.value = section
    }
  },
  { immediate: true },
)
</script>

<style scoped>
.settings-layout {
  display: flex;
  min-height: calc(100vh - 4rem);
  background: transparent;
}

.settings-sidebar {
  width: 240px;
  border-radius: 0;
  border-top: none;
  border-bottom: none;
  border-left: none;
  border-right: 1px solid var(--cf-line);
  background: var(--cf-nav-surface, var(--cf-bg-elevated));
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.sidebar-header {
  padding: 20px 20px 12px;
  border-bottom: 1px solid var(--cf-line);
}

.sidebar-brand {
  margin: 0;
  font-family: var(--font-display);
  font-size: 1.35rem;
  font-weight: 700;
  letter-spacing: -0.03em;
  color: var(--cf-ink);
  line-height: 1.2;
}

.sidebar-nav {
  flex: 1;
  padding: 12px;
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
  transition: background 0.15s ease, color 0.15s ease;
  width: 100%;
  text-align: left;
}

.nav-item:hover {
  background: color-mix(in oklab, var(--cf-ink) 5%, transparent);
}

.nav-item.active {
  background: color-mix(in oklab, var(--cf-accent-soft) 80%, transparent);
}

.nav-item.active .nav-icon,
.nav-item.active .nav-label {
  color: var(--cf-accent-ink);
}

.nav-item.active .nav-label {
  font-weight: 500;
}

.nav-icon {
  color: var(--cf-ink-soft);
  transition: color 0.15s ease;
}

.nav-label {
  font-size: 14px;
  color: var(--cf-ink-soft);
  font-weight: 450;
}

.sidebar-footer {
  padding: 16px;
  border-top: 1px solid var(--cf-line);
}

.user-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: color-mix(in oklab, var(--cf-bg-muted) 70%, transparent);
  border-radius: 10px;
}

.user-info {
  min-width: 0;
}

.user-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--cf-ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-role {
  font-size: 12px;
  color: var(--cf-ink-soft);
  margin-top: 2px;
}

.settings-content {
  flex: 1;
  overflow-y: auto;
  padding: 32px 40px;
  max-width: 800px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
