<template>
  <div class="home-page">
    <header class="page-header">
      <h1 class="page-title font-display">控制台</h1>
      <p class="page-subtitle">
        欢迎回来，{{ displayName }} · 今天也可以从这里开始工作
      </p>
    </header>

    <div class="stat-grid">
      <button
        v-for="card in statCards"
        :key="card.label"
        type="button"
        class="stat-card cf-surface"
        @click="go(card.to)"
      >
        <div class="stat-icon" :class="card.tone">
          <UIcon :name="card.icon" class="size-5" />
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ card.value }}</div>
          <div class="stat-label">{{ card.label }}</div>
          <div class="stat-caption">{{ card.caption }}</div>
        </div>
      </button>
    </div>

    <div class="section-grid">
      <section class="panel cf-surface">
        <h2 class="panel-title">快速开始</h2>
        <div class="quick-list">
          <button
            v-for="item in quickActions"
            :key="item.to"
            type="button"
            class="quick-item"
            :class="{ 'quick-item--primary': item.primary }"
            @click="go(item.to)"
          >
            <span class="quick-icon" :class="item.tone">
              <UIcon :name="item.icon" class="size-4" />
            </span>
            <span class="quick-text">
              <span class="quick-title">{{ item.title }}</span>
              <span class="quick-desc">{{ item.desc }}</span>
            </span>
            <UIcon name="i-lucide-chevron-right" class="quick-chevron size-4" />
          </button>
        </div>
      </section>

      <section class="panel panel--activity cf-surface">
        <h2 class="panel-title">最近活动</h2>
        <div class="activity-empty">
          <UIcon name="i-lucide-sparkles" class="activity-icon size-8" />
          <p class="activity-title">暂无活动</p>
          <p class="activity-hint">去 Playground 开始第一次对话</p>
          <UButton color="primary" @click="go('/playground')">
            体验 Playground
          </UButton>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'default',
})

const { user } = useAuth()
const displayName = computed(() => user.value?.name || '用户')

function go(path: string) {
  void navigateTo(path)
}

const statCards = [
  {
    label: '对话次数',
    value: '0',
    caption: '全部',
    tone: 'tone-teal',
    icon: 'i-lucide-messages-square',
    to: '/playground',
  },
  {
    label: 'API 密钥',
    value: '0',
    caption: '全部',
    tone: 'tone-green',
    icon: 'i-lucide-key-round',
    to: '/keys',
  },
  {
    label: 'Agents',
    value: '0',
    caption: '全部',
    tone: 'tone-amber',
    icon: 'i-lucide-bot',
    to: '/agents',
  },
  {
    label: '工作流',
    value: '0',
    caption: '全部',
    tone: 'tone-rose',
    icon: 'i-lucide-workflow',
    to: '/workflows',
  },
]

const quickActions = [
  {
    title: '体验 Playground',
    desc: '马上试用模型对话',
    to: '/playground',
    primary: true,
    tone: 'tone-teal',
    icon: 'i-lucide-messages-square',
  },
  {
    title: '创建 Agent',
    desc: '配置你的智能体',
    to: '/agents',
    primary: false,
    tone: 'tone-amber',
    icon: 'i-lucide-bot',
  },
  {
    title: '创建工作流',
    desc: '编排自动化流程',
    to: '/workflows',
    primary: false,
    tone: 'tone-rose',
    icon: 'i-lucide-workflow',
  },
]
</script>

<style scoped>
.home-page {
  max-width: 1400px;
  width: 100%;
  margin: 0 auto;
  padding: 24px 20px 40px;
  box-sizing: border-box;
}

.page-header {
  margin-bottom: 20px;
}

.page-title {
  margin: 0;
  font-size: 1.75rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--cf-ink);
  line-height: 1.2;
}

.page-subtitle {
  margin: 6px 0 0;
  font-size: 0.875rem;
  color: var(--cf-ink-soft);
  line-height: 1.5;
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

@media (min-width: 960px) {
  .stat-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  padding: 16px;
  border-radius: 10px;
  cursor: pointer;
  text-align: left;
  font: inherit;
  color: inherit;
  transition: transform 0.15s ease, border-color 0.15s ease;
}

.stat-card:hover {
  transform: translateY(-1px);
  border-color: color-mix(in oklab, var(--cf-accent) 35%, var(--cf-line));
}

.stat-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #fff;
}

.tone-teal {
  background: var(--cf-accent);
}

.tone-green {
  background: var(--cf-ok);
}

.tone-amber {
  background: var(--cf-warn);
}

.tone-rose {
  background: var(--cf-danger);
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--cf-ink);
  line-height: 1.15;
  font-variant-numeric: tabular-nums;
}

.stat-label {
  font-size: 0.8125rem;
  color: var(--cf-ink-soft);
  margin-top: 2px;
}

.stat-caption {
  font-size: 0.75rem;
  color: var(--cf-ink-soft);
  opacity: 0.8;
  margin-top: 2px;
}

.section-grid {
  margin-top: 16px;
  display: grid;
  grid-template-columns: 1fr;
  gap: 14px;
}

@media (min-width: 900px) {
  .section-grid {
    grid-template-columns: 5fr 7fr;
  }
}

.panel {
  border-radius: 10px;
  padding: 18px 16px;
  min-height: 268px;
  display: flex;
  flex-direction: column;
}

.panel-title {
  margin: 0 0 14px;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--cf-ink);
}

.quick-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1;
}

.quick-item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  flex: 1;
  padding: 12px 14px;
  border: 1px solid var(--cf-line);
  border-radius: 10px;
  background: color-mix(in oklab, var(--cf-bg-elevated) 80%, transparent);
  cursor: pointer;
  text-align: left;
  font: inherit;
  transition: background 0.15s ease, border-color 0.15s ease;
}

.quick-item:hover {
  border-color: color-mix(in oklab, var(--cf-accent) 40%, var(--cf-line));
}

.quick-item--primary {
  border-color: color-mix(in oklab, var(--cf-accent) 35%, var(--cf-line));
  background: color-mix(in oklab, var(--cf-accent-soft) 70%, transparent);
}

.quick-icon {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #fff;
}

.quick-text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.quick-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--cf-ink);
}

.quick-desc {
  font-size: 0.75rem;
  color: var(--cf-ink-soft);
}

.quick-chevron {
  color: var(--cf-ink-soft);
  flex-shrink: 0;
}

.panel--activity {
  align-items: stretch;
}

.activity-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 8px;
  padding: 12px 0;
}

.activity-icon {
  color: var(--cf-accent);
  margin-bottom: 4px;
}

.activity-title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--cf-ink);
}

.activity-hint {
  margin: 0 0 8px;
  font-size: 0.8125rem;
  color: var(--cf-ink-soft);
}
</style>
