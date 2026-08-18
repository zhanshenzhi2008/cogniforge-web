<template>
  <div class="quota-bar" :class="tone">
    <template v-if="snap?.unlimited">
      <span>{{ t('quota.barUnlimited') }}</span>
    </template>
    <template v-else-if="snap">
      <span>{{ label }}</span>
      <span class="quota-bar__track" aria-hidden="true">
        <span class="quota-bar__fill" :style="{ width: `${reqPct}%` }" />
      </span>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { QuotaSnapshot } from '~/composables/useQuota'

const props = defineProps<{ snap: QuotaSnapshot | null }>()
const { t } = useLocale()

const reqPct = computed(() => {
  const limit = props.snap?.day.requests_limit || 0
  const used = props.snap?.day.requests_used || 0
  if (limit <= 0) return 0
  return Math.min(100, Math.round((used / limit) * 100))
})

const tokPct = computed(() => {
  const limit = props.snap?.day.tokens_limit || 0
  const used = props.snap?.day.tokens_used || 0
  if (limit <= 0) return 0
  return Math.min(100, Math.round((used / limit) * 100))
})

const label = computed(() => t('quota.bar', {
  used: String(props.snap?.day.requests_used || 0),
  limit: String(props.snap?.day.requests_limit || 0),
  pct: String(tokPct.value),
}))

const tone = computed(() => {
  if (!props.snap || props.snap.unlimited) return ''
  if (quotaExhausted(props.snap)) return 'is-empty'
  if (props.snap.warn) return 'is-warn'
  return ''
})
</script>

<style scoped>
.quota-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.78rem;
  color: var(--cf-ink-soft);
}
.quota-bar.is-warn { color: var(--cf-warn, #b45309); }
.quota-bar.is-empty { color: var(--cf-danger, #b91c1c); }
.quota-bar__track {
  flex: 1;
  height: 4px;
  max-width: 120px;
  border-radius: 99px;
  background: color-mix(in oklab, var(--cf-line) 80%, transparent);
  overflow: hidden;
}
.quota-bar__fill {
  display: block;
  height: 100%;
  background: var(--cf-accent);
  border-radius: inherit;
}
.is-warn .quota-bar__fill { background: #d97706; }
.is-empty .quota-bar__fill { background: #dc2626; }
</style>
