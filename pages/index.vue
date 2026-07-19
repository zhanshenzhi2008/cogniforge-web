<template>
  <div class="home-page">
    <n-grid cols="1 600:2 960:4" :x-gap="16" :y-gap="16">
      <n-gi v-for="card in statCards" :key="card.label">
        <n-card
          class="stat-card"
          hoverable
          :bordered="false"
          @click="card.to && go(card.to)"
        >
          <div class="stat-content">
            <div class="stat-icon" :style="{ background: card.tint }">
              <n-icon :size="22" :component="card.icon" color="#fff" />
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ card.value }}</div>
              <div class="stat-label">{{ card.label }}</div>
            </div>
          </div>
        </n-card>
      </n-gi>
    </n-grid>

    <n-grid cols="1 900:2" :x-gap="16" :y-gap="16" class="section-grid">
      <n-gi>
        <n-card :bordered="false" class="panel-card">
          <template #header>
            <div class="card-header">快速开始</div>
          </template>
          <n-space vertical :size="12" style="width: 100%">
            <n-button type="primary" block strong @click="go('/playground')">
              <template #icon>
                <n-icon :component="ChatbubbleOutline" />
              </template>
              体验 Playground
            </n-button>
            <n-button block strong secondary @click="go('/agents')">
              <template #icon>
                <n-icon :component="HardwareChipOutline" />
              </template>
              创建 Agent
            </n-button>
            <n-button block strong secondary @click="go('/workflows')">
              <template #icon>
                <n-icon :component="DocumentTextOutline" />
              </template>
              创建工作流
            </n-button>
          </n-space>
        </n-card>
      </n-gi>
      <n-gi>
        <n-card :bordered="false" class="panel-card">
          <template #header>
            <div class="card-header">最近活动</div>
          </template>
          <n-empty description="暂无活动" class="activity-empty" />
        </n-card>
      </n-gi>
    </n-grid>
  </div>
</template>

<script setup lang="ts">
import {
  ChatbubbleOutline,
  KeyOutline,
  HardwareChipOutline,
  DocumentTextOutline,
} from '~/constants/icons'

definePageMeta({
  layout: 'default',
})

function go(path: string) {
  void navigateTo(path)
}

const statCards = [
  {
    label: '对话次数',
    value: '0',
    tint: 'linear-gradient(135deg, #6366f1, #4f46e5)',
    icon: ChatbubbleOutline,
    to: '/playground',
  },
  {
    label: 'API 密钥',
    value: '0',
    tint: 'linear-gradient(135deg, #22c55e, #16a34a)',
    icon: KeyOutline,
    to: '/keys',
  },
  {
    label: 'Agents',
    value: '0',
    tint: 'linear-gradient(135deg, #f59e0b, #d97706)',
    icon: HardwareChipOutline,
    to: '/agents',
  },
  {
    label: '工作流',
    value: '0',
    tint: 'linear-gradient(135deg, #ef4444, #dc2626)',
    icon: DocumentTextOutline,
    to: '/workflows',
  },
]
</script>

<style scoped>
.home-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 20px 40px;
}

.section-grid {
  margin-top: 8px;
}

.stat-card {
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 16px;
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
  font-size: 22px;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.2;
}

.stat-label {
  font-size: 13px;
  color: #64748b;
  margin-top: 4px;
}

.panel-card {
  min-height: 220px;
}

.card-header {
  font-weight: 600;
  font-size: 15px;
  color: #1e293b;
}

.activity-empty {
  padding: 24px 0;
}

.activity-empty :deep(.n-empty__description) {
  color: #94a3b8;
}
</style>
