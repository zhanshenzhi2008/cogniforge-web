<template>
  <div class="cf-page">
    <div class="cf-page-header">
      <div class="cf-page-heading">
        <h1 class="cf-page-title">{{ t('usage.title') }}</h1>
        <p class="cf-page-sub">{{ t('usage.sub') }}</p>
      </div>
      <div class="usage-toolbar">
        <USelect
          v-model="range"
          class="range-select"
          :items="rangeItems"
          @update:model-value="reload"
        />
        <USelect
          v-if="isAdmin"
          v-model="scope"
          class="range-select"
          :items="scopeItems"
          @update:model-value="reload"
        />
      </div>
    </div>

    <div class="stat-grid">
      <div class="stat-card cf-surface">
        <div class="stat-value font-display">{{ reqLabel }}</div>
        <div class="stat-label">{{ t('usage.dayReq') }}</div>
        <UProgress :value="reqPct" size="xs" class="mt-2" />
      </div>
      <div class="stat-card cf-surface">
        <div class="stat-value font-display">{{ formatNum(snap?.day.tokens_used) }}</div>
        <div class="stat-label">{{ t('usage.dayTok') }}</div>
        <UProgress :value="dayTokPct" size="xs" class="mt-2" />
      </div>
      <div class="stat-card cf-surface">
        <div class="stat-value font-display">{{ formatNum(snap?.month.tokens_used) }}</div>
        <div class="stat-label">{{ t('usage.monthTok') }}</div>
        <UProgress :value="monthTokPct" size="xs" class="mt-2" />
      </div>
    </div>

    <div class="charts">
      <section class="cf-panel">
        <div class="panel-head">
          <h2 class="panel-title">{{ t('usage.chart') }}</h2>
          <USelect v-model="metric" class="range-select" :items="metricItems" />
        </div>
        <p v-if="!report?.points?.length" class="cf-state">{{ t('usage.empty') }}</p>
        <div v-else class="bars" role="img" :aria-label="t('usage.chart')">
          <div v-for="p in report.points" :key="p.date" class="bar-col">
            <div class="bar-track">
              <div class="bar-fill" :style="{ height: barHeight(p) }" :title="barTitle(p)" />
            </div>
            <span class="bar-label">{{ shortDate(p.date) }}</span>
          </div>
        </div>
      </section>

      <section class="cf-panel">
        <h2 class="panel-title">{{ t('usage.byModel') }}</h2>
        <p v-if="!models.length" class="cf-state">{{ t('usage.empty') }}</p>
        <ul v-else class="model-list">
          <li v-for="m in models" :key="m.model">
            <span>{{ m.model || '—' }}</span>
            <span class="cf-muted">{{ formatNum(m.tokens) }}</span>
          </li>
        </ul>
      </section>
    </div>

    <section v-if="isAdmin && report?.top_users?.length" class="cf-panel top-panel">
      <h2 class="panel-title">{{ t('usage.topUsers') }}</h2>
      <table class="cf-data-table">
        <tbody>
          <tr v-for="u in report.top_users" :key="u.user_id">
            <td>{{ u.name || u.user_id }}</td>
            <td class="cf-muted">{{ formatNum(u.tokens) }}</td>
          </tr>
        </tbody>
      </table>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { QuotaSnapshot, UsageReport } from '~/composables/useQuota'

definePageMeta({ layout: 'default', requiresAuth: true })

const { t } = useLocale()
const { user } = useAuth()
const { me, usage } = useQuota()
const toast = useToast()

const isAdmin = computed(() => user.value?.role === 'admin')
const range = ref<'7d' | '30d'>('7d')
const scope = ref<'self' | 'all'>('self')
const metric = ref<'tokens' | 'requests'>('tokens')
const snap = ref<QuotaSnapshot | null>(null)
const report = ref<UsageReport | null>(null)

const rangeItems = computed(() => [
  { label: t('usage.range7'), value: '7d' },
  { label: t('usage.range30'), value: '30d' },
])
const scopeItems = computed(() => [
  { label: t('usage.scopeSelf'), value: 'self' },
  { label: t('usage.scopeAll'), value: 'all' },
])
const metricItems = computed(() => [
  { label: t('usage.metricTok'), value: 'tokens' },
  { label: t('usage.metricReq'), value: 'requests' },
])

const reqLabel = computed(() => {
  if (snap.value?.unlimited) return t('dash.quota.unlimited')
  return `${snap.value?.day.requests_used || 0} / ${snap.value?.day.requests_limit || 0}`
})

function pct(used?: number, limit?: number) {
  if (!limit) return 0
  return Math.min(100, Math.round(((used || 0) / limit) * 100))
}
const reqPct = computed(() => pct(snap.value?.day.requests_used, snap.value?.day.requests_limit))
const dayTokPct = computed(() => pct(snap.value?.day.tokens_used, snap.value?.day.tokens_limit))
const monthTokPct = computed(() => pct(snap.value?.month.tokens_used, snap.value?.month.tokens_limit))

const models = computed(() => [...(report.value?.by_model || [])].sort((a, b) => b.tokens - a.tokens))

const maxVal = computed(() => {
  const pts = report.value?.points || []
  const vals = pts.map(p => (metric.value === 'tokens' ? p.tokens : p.requests))
  return Math.max(1, ...vals)
})

function barHeight(p: { requests: number; tokens: number }) {
  const v = metric.value === 'tokens' ? p.tokens : p.requests
  return `${Math.max(4, Math.round((v / maxVal.value) * 100))}%`
}
function barTitle(p: { date: string; requests: number; tokens: number }) {
  return `${p.date} · ${metric.value === 'tokens' ? p.tokens : p.requests}`
}
function shortDate(d: string) {
  return d.slice(5)
}
function formatNum(n?: number) {
  const v = n || 0
  if (v >= 10000) return `${(v / 10000).toFixed(1)}万`
  return String(v)
}

async function reload() {
  try {
    const [meRes, usageRes] = await Promise.all([
      me(),
      usage(range.value, isAdmin.value ? scope.value : 'self'),
    ])
    if (meRes.data) snap.value = meRes.data
    if (usageRes.data) report.value = usageRes.data
    if (meRes.error || usageRes.error) {
      toast.add({ title: t('usage.loadFail'), color: 'error' })
    }
  } catch {
    toast.add({ title: t('usage.loadFail'), color: 'error' })
  }
}

onMounted(() => { void reload() })
</script>

<style scoped>
.usage-toolbar { display: flex; gap: 8px; }
.range-select { width: 8.5rem; }
.stat-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 20px;
}
.stat-card { padding: 18px 16px; }
.stat-value { font-size: 1.6rem; font-weight: 700; color: var(--cf-ink); }
.stat-label { font-size: 0.85rem; color: var(--cf-ink-soft); margin-top: 4px; }
.charts { display: grid; grid-template-columns: 1.4fr 0.8fr; gap: 16px; }
.panel-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.panel-title { margin: 0 0 12px; font-size: 1rem; }
.bars { display: flex; align-items: flex-end; gap: 8px; height: 180px; padding: 8px 0 0; }
.bar-col { flex: 1; display: flex; flex-direction: column; align-items: center; height: 100%; gap: 6px; }
.bar-track { flex: 1; width: 100%; display: flex; align-items: flex-end; }
.bar-fill {
  width: 100%;
  background: var(--cf-accent);
  border-radius: 4px 4px 0 0;
  min-height: 4px;
}
.bar-label { font-size: 0.7rem; color: var(--cf-ink-soft); }
.model-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 10px; }
.model-list li { display: flex; justify-content: space-between; gap: 12px; font-size: 0.9rem; }
.top-panel { margin-top: 16px; }
@media (max-width: 800px) {
  .stat-grid, .charts { grid-template-columns: 1fr; }
}
</style>
