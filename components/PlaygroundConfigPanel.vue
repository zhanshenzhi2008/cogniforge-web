<template>
  <div class="config-panel">
    <div v-if="showBrand" class="sidebar-header">
      <div class="header-logo">
        <UIcon name="i-lucide-cpu" class="size-5" />
      </div>
      <div class="sidebar-title">
        <span class="app-name font-display">CogniForge</span>
        <span class="app-sub">{{ t('play.subtitle') }}</span>
      </div>
    </div>

    <section class="config-block">
      <div class="card-header">
        <UIcon name="i-lucide-bot" class="size-4" />
        <span>{{ t('agents.title') }}</span>
      </div>
      <USelect
        :model-value="selectedAgent"
        :items="agentOptions"
        :placeholder="t('play.pickAgent')"
        value-key="value"
        class="w-full"
        @update:model-value="onAgentChange"
      />
      <div v-if="selectedAgentInfo" class="agent-meta">
        <div class="meta-item">
          <span class="meta-label">{{ t('common.model') }}</span>
          <UBadge size="sm" variant="subtle" color="primary">
            {{ selectedAgentInfo.model }}
          </UBadge>
        </div>
        <div class="meta-item">
          <span class="meta-label">{{ t('common.description') }}</span>
          <p class="meta-desc">{{ selectedAgentInfo.description || t('common.noDesc') }}</p>
        </div>
      </div>
    </section>

    <section class="config-block">
      <div class="card-header">
        <UIcon name="i-lucide-settings-2" class="size-4" />
        <span>{{ t('common.model') }}</span>
      </div>
      <USelect
        :model-value="selectedModel"
        :items="modelOptions"
        :placeholder="t('play.pickModel')"
        value-key="value"
        class="w-full"
        @update:model-value="$emit('update:selectedModel', $event)"
      />
    </section>

    <section class="config-block params-block">
      <div class="card-header">
        <UIcon name="i-lucide-sliders-horizontal" class="size-4" />
        <span>{{ t('play.params') }}</span>
      </div>
      <div class="param-row">
        <div class="param-label">
          <span>Temperature</span>
          <UBadge size="sm" variant="subtle" color="warning">{{ params.temperature }}</UBadge>
        </div>
        <USlider
          :model-value="params.temperature"
          :min="0"
          :max="2"
          :step="0.1"
          color="primary"
          @update:model-value="params.temperature = $event"
        />
      </div>
      <div class="param-row">
        <div class="param-label">
          <span>Max Tokens</span>
          <UBadge size="sm" variant="subtle" color="warning">{{ params.max_tokens }}</UBadge>
        </div>
        <UInput
          v-model.number="params.max_tokens"
          type="number"
          :min="1"
          :max="8192"
          size="sm"
        />
      </div>
      <div class="param-row">
        <div class="param-label">
          <span>Top P</span>
          <UBadge size="sm" variant="subtle" color="warning">{{ params.top_p }}</UBadge>
        </div>
        <USlider
          :model-value="params.top_p"
          :min="0"
          :max="1"
          :step="0.05"
          color="primary"
          @update:model-value="params.top_p = $event"
        />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { Agent } from '@/composables/useAgents'

defineProps<{
  showBrand?: boolean
  selectedAgent: string
  selectedModel: string
  selectedAgentInfo: Agent | null
  agentOptions: Array<{ label: string; value: string }>
  modelOptions: Array<{ label: string; value: string }>
  params: {
    temperature: number
    max_tokens: number
    top_p: number
  }
}>()

const { t } = useLocale()

const emit = defineEmits<{
  (e: 'update:selectedAgent', value: string): void
  (e: 'update:selectedModel', value: string): void
  (e: 'agent-change', value: string): void
}>()

function onAgentChange(value: string) {
  emit('update:selectedAgent', value)
  emit('agent-change', value)
}
</script>

<style scoped>
.config-panel {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.sidebar-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--cf-line);
}

.header-logo {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: var(--cf-accent);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.sidebar-title {
  display: flex;
  flex-direction: column;
}

.app-name {
  font-size: 16px;
  font-weight: 700;
  color: var(--cf-ink);
  letter-spacing: 0.2px;
}

.app-sub {
  font-size: 10px;
  color: var(--cf-ink-soft);
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.config-block {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--cf-ink-soft);
}

.agent-meta {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px;
  border-radius: 8px;
  background: color-mix(in oklab, var(--cf-ink) 4%, transparent);
}

.meta-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.meta-label {
  font-size: 11px;
  color: var(--cf-ink-soft);
}

.meta-desc {
  margin: 0;
  font-size: 12px;
  color: var(--cf-ink);
  line-height: 1.4;
}

.param-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.param-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: var(--cf-ink);
}
</style>
