<template>
  <div class="home-page">
    <header class="page-header">
      <h1 class="page-title">控制台</h1>
      <p class="page-subtitle">
        欢迎回来，{{ displayName }} · 今天也可以从这里开始工作
      </p>
    </header>

    <n-grid :cols="24" :x-gap="16" :y-gap="16" class="stat-grid">
      <n-gi v-for="card in statCards" :key="card.label" span="12 960:6">
        <n-card
          class="stat-card"
          hoverable
          :bordered="false"
          size="small"
          @click="card.to && go(card.to)"
        >
          <div class="stat-content">
            <div class="stat-icon" :style="{ background: card.tint }">
              <n-icon :size="22" :component="card.icon" color="#fff" />
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ card.value }}</div>
              <div class="stat-label">{{ card.label }}</div>
              <div class="stat-caption">{{ card.caption }}</div>
            </div>
          </div>
        </n-card>
      </n-gi>
    </n-grid>

    <n-grid :cols="24" :x-gap="16" :y-gap="16" class="section-grid">
      <n-gi span="24 900:10">
        <n-card :bordered="false" class="panel-card">
          <template #header>
            <div class="card-header">快速开始</div>
          </template>
          <div class="quick-list">
            <button
              v-for="item in quickActions"
              :key="item.to"
              type="button"
              class="quick-item"
              :class="{ 'quick-item--primary': item.primary }"
              @click="go(item.to)"
            >
              <span class="quick-icon" :style="{ background: item.tint }">
                <n-icon :size="18" :component="item.icon" color="#fff" />
              </span>
              <span class="quick-text">
                <span class="quick-title">{{ item.title }}</span>
                <span class="quick-desc">{{ item.desc }}</span>
              </span>
              <n-icon
                class="quick-chevron"
                :size="18"
                :component="ChevronForwardOutline"
              />
            </button>
          </div>
        </n-card>
      </n-gi>
      <n-gi span="24 900:14">
        <n-card :bordered="false" class="panel-card panel-card--activity">
          <template #header>
            <div class="card-header">最近活动</div>
          </template>
          <div class="activity-empty">
            <n-empty description="暂无活动">
              <template #extra>
                <p class="activity-hint">去 Playground 开始第一次对话</p>
                <n-button type="primary" @click="go('/playground')">
                  体验 Playground
                </n-button>
              </template>
            </n-empty>
          </div>
        </n-card>
      </n-gi>
    </n-grid>
  </div>
</template>

<script setup lang="ts">
import { ChevronForwardOutline } from '@vicons/ionicons5'
import {
  ChatbubbleOutline,
  KeyOutline,
  HardwareChipOutline,
  DocumentTextOutline,
} from '~/constants/icons'

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
    tint: 'linear-gradient(135deg, #6366f1, #4f46e5)',
    icon: ChatbubbleOutline,
    to: '/playground',
  },
  {
    label: 'API 密钥',
    value: '0',
    caption: '全部',
    tint: 'linear-gradient(135deg, #22c55e, #16a34a)',
    icon: KeyOutline,
    to: '/keys',
  },
  {
    label: 'Agents',
    value: '0',
    caption: '全部',
    tint: 'linear-gradient(135deg, #f59e0b, #d97706)',
    icon: HardwareChipOutline,
    to: '/agents',
  },
  {
    label: '工作流',
    value: '0',
    caption: '全部',
    tint: 'linear-gradient(135deg, #ef4444, #dc2626)',
    icon: DocumentTextOutline,
    to: '/workflows',
  },
]

const quickActions = [
  {
    title: '体验 Playground',
    desc: '马上试用模型对话',
    to: '/playground',
    primary: true,
    tint: 'linear-gradient(135deg, #3b82f6, #2563eb)',
    icon: ChatbubbleOutline,
  },
  {
    title: '创建 Agent',
    desc: '配置你的智能体',
    to: '/agents',
    primary: false,
    tint: 'linear-gradient(135deg, #f59e0b, #d97706)',
    icon: HardwareChipOutline,
  },
  {
    title: '创建工作流',
    desc: '编排自动化流程',
    to: '/workflows',
    primary: false,
    tint: 'linear-gradient(135deg, #ef4444, #dc2626)',
    icon: DocumentTextOutline,
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
  font-size: 22px;
  font-weight: 600;
  color: #0f172a;
  line-height: 1.3;
}

.page-subtitle {
  margin: 4px 0 0;
  font-size: 13px;
  color: #64748b;
  line-height: 1.5;
}

.stat-grid,
.section-grid {
  width: 100%;
}

.section-grid {
  margin-top: 16px;
}

.stat-card {
  cursor: pointer;
  height: 100%;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 14px;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.15);
}

.stat-info {
  flex: 1;
  min-width: 0;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.15;
  font-variant-numeric: tabular-nums;
}

.stat-label {
  font-size: 13px;
  color: #64748b;
  margin-top: 2px;
}

.stat-caption {
  font-size: 12px;
  color: #94a3b8;
  margin-top: 2px;
}

.panel-card {
  height: 100%;
  min-height: 268px;
}

.panel-card :deep(.n-card-header) {
  padding-bottom: 8px;
}

.panel-card :deep(.n-card__content) {
  display: flex;
  flex-direction: column;
  height: calc(100% - 52px);
}

.panel-card--activity :deep(.n-card__content) {
  align-items: center;
  justify-content: center;
  min-height: 196px;
}

.card-header {
  font-weight: 600;
  font-size: 15px;
  color: #1e293b;
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
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #fff;
  cursor: pointer;
  text-align: left;
  font: inherit;
  transition: background 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
}

.quick-item:hover {
  border-color: #cbd5e1;
  box-shadow: 0 2px 10px rgba(15, 23, 42, 0.06);
}

.quick-item--primary {
  background: #eff6ff;
  border-color: #bfdbfe;
}

.quick-item--primary:hover {
  background: #dbeafe;
  border-color: #93c5fd;
}

.quick-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.quick-text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.quick-title {
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
  line-height: 1.3;
}

.quick-desc {
  font-size: 12px;
  color: #64748b;
  line-height: 1.4;
}

.quick-chevron {
  color: #94a3b8;
  flex-shrink: 0;
}

.activity-empty {
  width: 100%;
  padding: 8px 0 12px;
}

.activity-hint {
  margin: 0 0 12px;
  font-size: 13px;
  color: #94a3b8;
}

.activity-empty :deep(.n-empty__description) {
  color: #64748b;
}
</style>
