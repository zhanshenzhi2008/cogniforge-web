<template>
  <div class="monitor-page">
    <div class="page-header">
      <h1 class="page-title font-display">监控中心</h1>
    </div>

    <div class="stat-grid">
      <div class="stat-card cf-surface">
        <div class="stat-value">{{ stats?.total_requests || 0 }}</div>
        <div class="stat-label">总请求数</div>
      </div>
      <div class="stat-card cf-surface">
        <div class="stat-value">{{ stats?.avg_duration || 0 }}ms</div>
        <div class="stat-label">平均耗时</div>
      </div>
      <div class="stat-card cf-surface">
        <div class="stat-value">{{ stats?.error_requests || 0 }}</div>
        <div class="stat-label">错误请求</div>
      </div>
      <div class="stat-card cf-surface">
        <div class="stat-value error-rate">{{ (stats?.error_rate || 0).toFixed(2) }}%</div>
        <div class="stat-label">错误率</div>
      </div>
    </div>

    <div class="panel cf-surface">
      <div class="panel-header">
        <h2 class="panel-title">请求日志</h2>
        <div class="filters">
          <USelect
            v-model="filterMethod"
            class="filter-method"
            :items="methodOptions"
            placeholder="请求方法"
          />
          <UInput
            v-model="filterPath"
            class="filter-path"
            placeholder="请求路径"
          />
          <UButton color="primary" @click="handleSearch">搜索</UButton>
        </div>
      </div>

      <div v-if="loading" class="state-box">
        <UIcon name="i-lucide-loader-circle" class="size-6 animate-spin" />
        <span>加载中…</span>
      </div>

      <div v-else-if="logs.length === 0" class="state-box">
        <UIcon name="i-lucide-activity" class="size-8 opacity-50" />
        <p>暂无请求日志</p>
      </div>

      <div v-else class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>时间</th>
              <th>方法</th>
              <th>路径</th>
              <th>状态</th>
              <th>耗时</th>
              <th>IP</th>
              <th class="col-actions">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in logs" :key="row.id">
              <td class="muted">{{ formatDate(row.created_at) }}</td>
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
              <td class="muted">{{ row.duration }}ms</td>
              <td class="muted">{{ row.ip }}</td>
              <td>
                <UButton color="primary" variant="ghost" size="sm" @click="openLogDetail(row)">
                  详情
                </UButton>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="total > 0" class="pager">
        <span class="pager-info">共 {{ total }} 条</span>
        <div class="pager-controls">
          <USelect
            v-model="pageSize"
            class="page-size"
            :items="pageSizeOptions"
            @update:model-value="handlePageSizeChange"
          />
          <UButton
            color="neutral"
            variant="outline"
            size="sm"
            :disabled="page <= 1"
            @click="goPage(page - 1)"
          >
            上一页
          </UButton>
          <span class="pager-page">{{ page }} / {{ totalPages || 1 }}</span>
          <UButton
            color="neutral"
            variant="outline"
            size="sm"
            :disabled="page >= totalPages"
            @click="goPage(page + 1)"
          >
            下一页
          </UButton>
        </div>
      </div>
    </div>

    <UModal
      v-model:open="showLogDetail"
      title="日志详情"
      :ui="{ content: 'sm:max-w-3xl' }"
    >
      <template #body>
        <div v-if="selectedLog" class="detail-grid">
          <div class="detail-item">
            <span class="detail-label">请求ID</span>
            <span class="detail-value">{{ selectedLog.id }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">TraceID</span>
            <span class="detail-value">{{ selectedLog.trace_id }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">方法</span>
            <span class="detail-value">
              <UBadge size="sm" variant="subtle" :color="methodColor(selectedLog.method)">
                {{ selectedLog.method }}
              </UBadge>
            </span>
          </div>
          <div class="detail-item">
            <span class="detail-label">路径</span>
            <span class="detail-value">{{ selectedLog.path }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">状态码</span>
            <span class="detail-value">
              <UBadge size="sm" variant="subtle" :color="statusColor(selectedLog.status_code)">
                {{ selectedLog.status_code }}
              </UBadge>
            </span>
          </div>
          <div class="detail-item">
            <span class="detail-label">耗时</span>
            <span class="detail-value">{{ selectedLog.duration }}ms</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">IP地址</span>
            <span class="detail-value">{{ selectedLog.ip }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">时间</span>
            <span class="detail-value">{{ formatDate(selectedLog.created_at) }}</span>
          </div>
          <div class="detail-item detail-item--full">
            <span class="detail-label">请求体</span>
            <pre class="code-block">{{ selectedLog.request_body || '无' }}</pre>
          </div>
          <div class="detail-item detail-item--full">
            <span class="detail-label">错误信息</span>
            <UAlert
              v-if="selectedLog.error"
              color="error"
              variant="subtle"
              :title="selectedLog.error"
            />
            <span v-else class="muted">无</span>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="modal-actions">
          <UButton color="neutral" variant="outline" @click="showLogDetail = false">关闭</UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import type { RequestLog, UsageStats } from '@/composables/useMonitor'

definePageMeta({
  layout: 'default',
})

const { listRequestLogs, getUsageStats } = useMonitor()

const logs = ref<RequestLog[]>([])
const stats = ref<UsageStats | null>(null)
const loading = ref(false)
const showLogDetail = ref(false)
const selectedLog = ref<RequestLog | null>(null)

/** USelect forbids empty-string item values. */
const METHOD_ALL = 'all'
const filterMethod = ref(METHOD_ALL)
const filterPath = ref('')
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const totalPages = ref(0)

const methodOptions = [
  { label: '全部方法', value: METHOD_ALL },
  { label: 'GET', value: 'GET' },
  { label: 'POST', value: 'POST' },
  { label: 'PUT', value: 'PUT' },
  { label: 'DELETE', value: 'DELETE' },
]

const pageSizeOptions = [
  { label: '10 条/页', value: 10 },
  { label: '20 条/页', value: 20 },
  { label: '50 条/页', value: 50 },
  { label: '100 条/页', value: 100 },
]

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

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
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

onMounted(() => {
  loadLogs()
  loadStats()
})
</script>

<style scoped>
.monitor-page {
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px 20px 40px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.page-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--cf-ink);
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 16px;
}

@media (min-width: 960px) {
  .stat-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

.stat-card {
  text-align: center;
  border-radius: 10px;
  padding: 20px 16px;
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--cf-ink);
  line-height: 1.2;
}

.stat-label {
  margin-top: 8px;
  font-size: 0.875rem;
  color: var(--cf-ink-soft);
}

.error-rate {
  color: var(--cf-danger);
}

.panel {
  border-radius: 10px;
  padding: 8px;
  min-height: 220px;
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

.state-box {
  min-height: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: var(--cf-ink-soft);
}

.table-wrap {
  width: 100%;
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.data-table th,
.data-table td {
  padding: 12px 14px;
  text-align: left;
  border-bottom: 1px solid var(--cf-line);
  vertical-align: middle;
}

.data-table th {
  color: var(--cf-ink-soft);
  font-weight: 500;
  white-space: nowrap;
}

.col-actions {
  width: 88px;
}

.path-cell {
  max-width: 280px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--cf-ink);
}

.muted {
  color: var(--cf-ink-soft);
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

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
