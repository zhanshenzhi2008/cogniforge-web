<template>
  <div class="cf-page">
    <div class="cf-page-header">
      <div class="cf-page-heading">
        <h1 class="cf-page-title">{{ t('monitor.title') }}</h1>
        <p class="cf-page-sub">{{ t('monitor.sub') }}</p>
      </div>
    </div>

    <div class="stat-grid">
      <div class="stat-card cf-surface">
        <div class="stat-value font-display">{{ stats?.total_requests || 0 }}</div>
        <div class="stat-label">{{ t('monitor.total') }}</div>
      </div>
      <div class="stat-card cf-surface">
        <div class="stat-value font-display">{{ stats?.avg_duration || 0 }}ms</div>
        <div class="stat-label">{{ t('monitor.avg') }}</div>
      </div>
      <div class="stat-card cf-surface">
        <div class="stat-value font-display">{{ stats?.error_requests || 0 }}</div>
        <div class="stat-label">{{ t('monitor.errors') }}</div>
      </div>
      <div class="stat-card cf-surface">
        <div class="stat-value font-display error-rate">{{ (stats?.error_rate || 0).toFixed(2) }}%</div>
        <div class="stat-label">{{ t('monitor.errorRate') }}</div>
      </div>
    </div>

    <div v-if="showSecurityLevel" class="tab-row">
      <button
        type="button"
        class="tab-btn"
        :class="{ 'is-active': activeTab === 'requests' }"
        @click="activeTab = 'requests'"
      >
        {{ t('monitor.logs') }}
      </button>
      <button
        type="button"
        class="tab-btn"
        :class="{ 'is-active': activeTab === 'security' }"
        @click="switchToSecurity"
      >
        {{ t('monitor.securityAudits') }}
      </button>
    </div>

    <div v-if="activeTab === 'requests' || !showSecurityLevel" class="cf-panel">
      <div class="panel-header">
        <div>
          <h2 class="panel-title">{{ t('monitor.logs') }}</h2>
          <p class="list-hint">{{ t('common.hintDblclickDetail') }}</p>
        </div>
        <div class="filters">
          <USelect
            v-model="filterMethod"
            class="filter-method"
            :items="methodOptions"
            :placeholder="t('monitor.methodPh')"
          />
          <UInput
            v-model="filterPath"
            class="filter-path"
            :placeholder="t('monitor.pathPh')"
          />
          <CfButton tone="primary" icon="i-lucide-search" @click="handleSearch">{{ t('common.search') }}</CfButton>
        </div>
      </div>

      <div v-if="loading" class="cf-state">
        <UIcon name="i-lucide-loader-circle" class="size-6 animate-spin" />
        <span>{{ t('common.loading') }}</span>
      </div>

      <div v-else-if="logs.length === 0" class="cf-state">
        <UIcon name="i-lucide-activity" class="size-8 opacity-50" />
        <p>{{ t('monitor.empty') }}</p>
      </div>

      <div v-else class="cf-table-wrap">
        <table class="cf-data-table">
          <thead>
            <tr>
              <th>{{ t('monitor.time') }}</th>
              <th>{{ t('monitor.method') }}</th>
              <th>{{ t('monitor.path') }}</th>
              <th>{{ t('common.status') }}</th>
              <th>{{ t('monitor.duration') }}</th>
              <th>{{ t('monitor.ip') }}</th>
              <th class="cf-col-actions">{{ t('common.actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in logs"
              :key="row.id"
              class="list-row"
              @dblclick="openLogDetail(row)"
            >
              <td class="cf-muted">{{ d(row.created_at) }}</td>
              <td>
                <UBadge size="sm" variant="subtle" :color="methodColor(row.method)">
                  {{ row.method }}
                </UBadge>
              </td>
              <td class="path-cell" :title="row.path">{{ row.path }}</td>
              <td>
                <UBadge size="sm" variant="subtle" :color="statusColor(row.status_code)">
                  {{ row.status_code }}
                </UBadge>
              </td>
              <td class="cf-muted">{{ row.duration }}ms</td>
              <td class="cf-muted">{{ row.ip }}</td>
              <td @dblclick.stop>
                <CfButton
                  tone="icon"
                  icon="i-lucide-file-text"
                  :tip="t('common.detail')"
                  @click="openLogDetail(row)"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="total > 0" class="pager">
        <span class="pager-info">{{ t('common.pagerTotal', { n: total }) }}</span>
        <div class="pager-controls">
          <USelect
            v-model="pageSize"
            class="page-size"
            :items="pageSizeOptions"
            @update:model-value="handlePageSizeChange"
          />
          <CfButton
            tone="secondary"
            icon="i-lucide-chevron-left"
            :disabled="page <= 1"
            @click="goPage(page - 1)"
          >
            {{ t('common.prev') }}
          </CfButton>
          <span class="pager-page">{{ page }} / {{ totalPages || 1 }}</span>
          <CfButton
            tone="secondary"
            icon="i-lucide-chevron-right"
            :disabled="page >= totalPages"
            @click="goPage(page + 1)"
          >
            {{ t('common.next') }}
          </CfButton>
        </div>
      </div>
    </div>

    <div v-else-if="showSecurityLevel" class="cf-panel">
      <div class="panel-header">
        <div>
          <h2 class="panel-title">{{ t('monitor.securityAudits') }}</h2>
          <p class="list-hint">{{ t('monitor.securityAuditsHint') }}</p>
        </div>
        <CfButton
          tone="secondary"
          icon="i-lucide-refresh-cw"
          :loading="auditLoading"
          @click="loadSecurityAudits"
        >
          {{ t('common.refresh') }}
        </CfButton>
      </div>

      <div v-if="auditLoading" class="cf-state">
        <UIcon name="i-lucide-loader-circle" class="size-6 animate-spin" />
        <span>{{ t('common.loading') }}</span>
      </div>

      <div v-else-if="securityAudits.length === 0" class="cf-state">
        <UIcon name="i-lucide-shield" class="size-8 opacity-50" />
        <p>{{ t('monitor.securityAuditsEmpty') }}</p>
      </div>

      <div v-else class="cf-table-wrap">
        <table class="cf-data-table">
          <thead>
            <tr>
              <th>{{ t('monitor.time') }}</th>
              <th>{{ t('monitor.auditActor') }}</th>
              <th>{{ t('monitor.auditResource') }}</th>
              <th>{{ t('monitor.auditChange') }}</th>
              <th>{{ t('common.status') }}</th>
              <th>{{ t('monitor.auditDetail') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in securityAudits" :key="row.id" class="list-row">
              <td class="cf-muted">{{ d(row.created_at) }}</td>
              <td class="cf-muted" :title="row.actor_user_id">{{ shortId(row.actor_user_id) }}</td>
              <td class="path-cell" :title="row.resource_id">{{ shortId(row.resource_id) }}</td>
              <td>
                {{ securityLabel(row.old_value) }}
                <span class="cf-muted">→</span>
                {{ securityLabel(row.new_value) }}
              </td>
              <td>
                <UBadge
                  size="sm"
                  variant="subtle"
                  :color="row.result === 'success' ? 'success' : 'error'"
                >
                  {{ row.result === 'success' ? t('monitor.auditOk') : t('monitor.auditDenied') }}
                </UBadge>
              </td>
              <td class="cf-muted path-cell" :title="row.detail || ''">{{ row.detail || '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <CfModal
      v-model:open="showLogDetail"
      :title="t('monitor.logDetail')"
      :ui="{ content: 'sm:max-w-3xl' }"
    >
      <template #body>
        <div v-if="selectedLog" class="detail-grid">
          <div class="detail-item">
            <span class="detail-label">{{ t('monitor.requestId') }}</span>
            <span class="detail-value">{{ selectedLog.id }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">TraceID</span>
            <span class="detail-value">{{ selectedLog.trace_id }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">{{ t('monitor.method') }}</span>
            <span class="detail-value">
              <UBadge size="sm" variant="subtle" :color="methodColor(selectedLog.method)">
                {{ selectedLog.method }}
              </UBadge>
            </span>
          </div>
          <div class="detail-item">
            <span class="detail-label">{{ t('monitor.path') }}</span>
            <span class="detail-value">{{ selectedLog.path }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">{{ t('monitor.statusCode') }}</span>
            <span class="detail-value">
              <UBadge size="sm" variant="subtle" :color="statusColor(selectedLog.status_code)">
                {{ selectedLog.status_code }}
              </UBadge>
            </span>
          </div>
          <div class="detail-item">
            <span class="detail-label">{{ t('monitor.duration') }}</span>
            <span class="detail-value">{{ selectedLog.duration }}ms</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">{{ t('monitor.ip') }}</span>
            <span class="detail-value">{{ selectedLog.ip }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">{{ t('monitor.time') }}</span>
            <span class="detail-value">{{ d(selectedLog.created_at) }}</span>
          </div>
          <div class="detail-item detail-item--full">
            <span class="detail-label">{{ t('monitor.body') }}</span>
            <pre class="code-block">{{ selectedLog.request_body || t('common.none') }}</pre>
          </div>
          <div class="detail-item detail-item--full">
            <span class="detail-label">{{ t('monitor.error') }}</span>
            <UAlert
              v-if="selectedLog.error"
              color="error"
              variant="subtle"
              :title="selectedLog.error"
            />
            <span v-else class="cf-muted">{{ t('common.none') }}</span>
          </div>
        </div>
      </template>
    </CfModal>
  </div>
</template>

<script setup lang="ts">
import type { RequestLog, SecurityAuditLog, UsageStats } from '@/composables/useMonitor'

definePageMeta({
  layout: 'default',
})

const { listRequestLogs, getUsageStats, listSecurityAudits } = useMonitor()
const { t, d } = useLocale()
const { showSecurityLevel } = useSecurityFeatures()

const activeTab = ref<'requests' | 'security'>('requests')
const logs = ref<RequestLog[]>([])
const stats = ref<UsageStats | null>(null)
const loading = ref(false)
const showLogDetail = ref(false)
const selectedLog = ref<RequestLog | null>(null)
const securityAudits = ref<SecurityAuditLog[]>([])
const auditLoading = ref(false)
const auditsLoaded = ref(false)

/** USelect forbids empty-string item values. */
const METHOD_ALL = 'all'
const filterMethod = ref(METHOD_ALL)
const filterPath = ref('')
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const totalPages = ref(0)

const methodOptions = computed(() => [
  { label: t('monitor.allMethods'), value: METHOD_ALL },
  { label: 'GET', value: 'GET' },
  { label: 'POST', value: 'POST' },
  { label: 'PUT', value: 'PUT' },
  { label: 'DELETE', value: 'DELETE' },
])

const pageSizeOptions = computed(() =>
  [10, 20, 50, 100].map(n => ({ label: t('monitor.perPage', { n }), value: n })),
)

function methodColor(method: string): 'success' | 'info' | 'warning' | 'error' | 'neutral' {
  const map: Record<string, 'success' | 'info' | 'warning' | 'error'> = {
    GET: 'success',
    POST: 'info',
    PUT: 'warning',
    DELETE: 'error',
  }
  return map[method] || 'neutral'
}

function statusColor(code: number): 'success' | 'warning' | 'error' | 'info' {
  if (code >= 200 && code < 300) return 'success'
  if (code >= 400 && code < 500) return 'warning'
  if (code >= 500) return 'error'
  return 'info'
}

function openLogDetail(row: RequestLog) {
  selectedLog.value = row
  showLogDetail.value = true
}

function handleSearch() {
  page.value = 1
  loadLogs()
}

function goPage(p: number) {
  page.value = p
  loadLogs()
}

function handlePageSizeChange() {
  page.value = 1
  loadLogs()
}

async function loadLogs() {
  loading.value = true
  try {
    const res = await listRequestLogs({
      page: page.value,
      page_size: pageSize.value,
      method: filterMethod.value && filterMethod.value !== METHOD_ALL ? filterMethod.value : undefined,
      path: filterPath.value || undefined,
    })
    if (res.error) {
      console.error(res.error)
      return
    }
    if (res.data) {
      logs.value = res.data.logs
      total.value = res.data.total
      totalPages.value = res.data.total_pages
    }
  } finally {
    loading.value = false
  }
}

async function loadStats() {
  const res = await getUsageStats()
  if (res.error) {
    console.error(res.error)
    return
  }
  if (res.data) {
    stats.value = res.data
  }
}

function shortId(id?: string) {
  if (!id) return '—'
  return id.length > 10 ? `${id.slice(0, 8)}…` : id
}

function securityLabel(level?: string) {
  const lv = (level || '').toLowerCase()
  const key = `kb.security.${lv}`
  const label = t(key)
  return label === key ? (level || '—') : label
}

async function loadSecurityAudits() {
  auditLoading.value = true
  try {
    const res = await listSecurityAudits(100)
    if (res.error) {
      console.error(res.error)
      return
    }
    securityAudits.value = res.data || []
    auditsLoaded.value = true
  } finally {
    auditLoading.value = false
  }
}

function switchToSecurity() {
  activeTab.value = 'security'
  if (!auditsLoaded.value) void loadSecurityAudits()
}

onMounted(() => {
  loadLogs()
  loadStats()
})
</script>

<style scoped>
.tab-row {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}
.tab-btn {
  padding: 6px 12px;
  border-radius: 6px;
  border: 1px solid var(--cf-line, #e2e8f0);
  background: var(--cf-surface, #fff);
  font-size: 13px;
  color: var(--cf-ink-muted, #64748b);
  cursor: pointer;
}
.tab-btn.is-active {
  color: var(--cf-ink, #0f172a);
  border-color: color-mix(in oklab, #6366f1 45%, var(--cf-line, #e2e8f0));
  background: color-mix(in oklab, #6366f1 10%, transparent);
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 22px;
}

@media (min-width: 960px) {
  .stat-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 16px;
  }
}

.stat-card {
  text-align: left;
  border-radius: 8px;
  padding: 20px 18px 16px;
  box-shadow: none;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--cf-ink);
  line-height: 1;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.03em;
}

.stat-label {
  margin-top: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--cf-ink);
}

.error-rate {
  color: var(--cf-danger);
}

.panel-header {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 10px 14px 6px;
}

.panel-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--cf-ink);
}

.panel-header .list-hint {
  margin: 4px 0 0;
}

.filters {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.filter-method {
  width: 140px;
}

.filter-path {
  width: 200px;
}

.path-cell {
  max-width: 280px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--cf-ink);
}

.pager {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
}

.pager-info {
  font-size: 0.8125rem;
  color: var(--cf-ink-soft);
}

.pager-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.page-size {
  width: 120px;
}

.pager-page {
  font-size: 0.8125rem;
  color: var(--cf-ink-soft);
  min-width: 64px;
  text-align: center;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.detail-item--full {
  grid-column: 1 / -1;
}

.detail-label {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--cf-ink-soft);
}

.detail-value {
  font-size: 0.875rem;
  color: var(--cf-ink);
  word-break: break-all;
}

.code-block {
  margin: 0;
  background: color-mix(in oklab, var(--cf-ink) 4%, transparent);
  border: 1px solid var(--cf-line);
  padding: 12px;
  border-radius: 8px;
  font-size: 0.75rem;
  max-height: 200px;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-all;
  color: var(--cf-ink);
  font-family: var(--font-mono);
}

.modal-actions__right {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}
</style>
