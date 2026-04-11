<template>
  <div class="monitor-container">
    <n-space vertical :size="24">
      <!-- 页面标题 -->
      <n-h2>监控中心</n-h2>

      <!-- 统计卡片 -->
      <n-grid :cols="4" :x-gap="16" :y-gap="16">
        <n-gi>
          <n-card class="stat-card">
            <div class="stat-content">
              <div class="stat-value">{{ stats?.total_requests || 0 }}</div>
              <div class="stat-label">总请求数</div>
            </div>
          </n-card>
        </n-gi>
        <n-gi>
          <n-card class="stat-card">
            <div class="stat-content">
              <div class="stat-value">{{ stats?.avg_duration || 0 }}ms</div>
              <div class="stat-label">平均耗时</div>
            </div>
          </n-card>
        </n-gi>
        <n-gi>
          <n-card class="stat-card">
            <div class="stat-content">
              <div class="stat-value">{{ stats?.error_requests || 0 }}</div>
              <div class="stat-label">错误请求</div>
            </div>
          </n-card>
        </n-gi>
        <n-gi>
          <n-card class="stat-card">
            <div class="stat-content">
              <div class="stat-value error-rate">
                {{ (stats?.error_rate || 0).toFixed(2) }}%
              </div>
              <div class="stat-label">错误率</div>
            </div>
          </n-card>
        </n-gi>
      </n-grid>

      <!-- 日志列表 -->
      <n-card title="请求日志">
        <template #header-extra>
          <n-space>
            <n-select
              v-model:value="filterMethod"
              :options="methodOptions"
              placeholder="请求方法"
              clearable
              style="width: 120px"
            />
            <n-input
              v-model:value="filterPath"
              placeholder="请求路径"
              clearable
              style="width: 200px"
            />
            <n-button type="primary" @click="loadLogs">搜索</n-button>
          </n-space>
        </template>

        <n-data-table
          :columns="columns"
          :data="logs"
          :loading="loading"
          :pagination="pagination"
          :row-key="(row: RequestLog) => row.id"
        />

        <!-- 日志详情弹窗 -->
        <n-modal v-model:show="showLogDetail" preset="card" title="日志详情" style="width: 800px">
          <n-descriptions v-if="selectedLog" :column="2" bordered>
            <n-descriptions-item label="请求ID">{{ selectedLog.id }}</n-descriptions-item>
            <n-descriptions-item label="TraceID">{{ selectedLog.trace_id }}</n-descriptions-item>
            <n-descriptions-item label="方法">{{ selectedLog.method }}</n-descriptions-item>
            <n-descriptions-item label="路径">{{ selectedLog.path }}</n-descriptions-item>
            <n-descriptions-item label="状态码">
              <n-tag :type="getStatusType(selectedLog.status_code)">
                {{ selectedLog.status_code }}
              </n-tag>
            </n-descriptions-item>
            <n-descriptions-item label="耗时">{{ selectedLog.duration }}ms</n-descriptions-item>
            <n-descriptions-item label="IP地址">{{ selectedLog.ip }}</n-descriptions-item>
            <n-descriptions-item label="时间">
              {{ formatDate(selectedLog.created_at) }}
            </n-descriptions-item>
            <n-descriptions-item label="请求体" :span="2">
              <pre class="code-block">{{ selectedLog.request_body || '无' }}</pre>
            </n-descriptions-item>
            <n-descriptions-item label="错误信息" :span="2">
              <n-alert v-if="selectedLog.error" type="error">
                {{ selectedLog.error }}
              </n-alert>
              <span v-else>无</span>
            </n-descriptions-item>
          </n-descriptions>
        </n-modal>
      </n-card>
    </n-space>
  </div>
</template>

<script setup lang="ts">
import { h, ref, onMounted } from 'vue'
import type { Component } from 'vue'
import {
  NButton,
  NDataTable,
  NCard,
  NSpace,
  NGrid,
  NGi,
  NH2,
  NInput,
  NSelect,
  NTag,
  NDescriptions,
  NDescriptionsItem,
  NModal,
  NAlert,
} from 'naive-ui'

const { listRequestLogs, getUsageStats } = useMonitor()

// 状态
const logs = ref<RequestLog[]>([])
const stats = ref<UsageStats | null>(null)
const loading = ref(false)
const showLogDetail = ref(false)
const selectedLog = ref<RequestLog | null>(null)

// 筛选
const filterMethod = ref<string | null>(null)
const filterPath = ref('')
const page = ref(1)
const pageSize = ref(20)

// 方法选项
const methodOptions = [
  { label: 'GET', value: 'GET' },
  { label: 'POST', value: 'POST' },
  { label: 'PUT', value: 'PUT' },
  { label: 'DELETE', value: 'DELETE' },
]

// 分页
const pagination = {
  page,
  pageSize,
  showSizePicker: true,
  pageSizes: [10, 20, 50, 100],
  onUpdate: (p: number, ps: number) => {
    page.value = p
    pageSize.value = ps
    loadLogs()
  },
}

// 表格列
const columns = [
  {
    title: '时间',
    key: 'created_at',
    width: 180,
    render: (row: RequestLog) => formatDate(row.created_at),
  },
  {
    title: '方法',
    key: 'method',
    width: 80,
    render: (row: RequestLog) => {
      const typeMap: Record<string, Component> = {
        GET: () => h(NTag, { type: 'success' }, () => row.method),
        POST: () => h(NTag, { type: 'info' }, () => row.method),
        PUT: () => h(NTag, { type: 'warning' }, () => row.method),
        DELETE: () => h(NTag, { type: 'error' }, () => row.method),
      }
      return (typeMap[row.method] || (() => h(NTag, {}, () => row.method)))()
    },
  },
  {
    title: '路径',
    key: 'path',
    ellipsis: { tooltip: true },
  },
  {
    title: '状态',
    key: 'status_code',
    width: 100,
    render: (row: RequestLog) => {
      return h(
        NTag,
        { type: getStatusType(row.status_code) },
        () => row.status_code
      )
    },
  },
  {
    title: '耗时',
    key: 'duration',
    width: 100,
    render: (row: RequestLog) => `${row.duration}ms`,
  },
  {
    title: 'IP',
    key: 'ip',
    width: 120,
  },
  {
    title: '操作',
    key: 'actions',
    width: 100,
    render: (row: RequestLog) => {
      return h(
        NButton,
        { size: 'small', text: true, type: 'primary' },
        {
          default: () => '详情',
          onClick: () => {
            selectedLog.value = row
            showLogDetail.value = true
          },
        }
      )
    },
  },
]

// 获取状态类型
function getStatusType(code: number): 'success' | 'warning' | 'error' | 'info' {
  if (code >= 200 && code < 300) return 'success'
  if (code >= 400 && code < 500) return 'warning'
  if (code >= 500) return 'error'
  return 'info'
}

// 格式化日期
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

// 加载日志
async function loadLogs() {
  loading.value = true
  try {
    const res = await listRequestLogs({
      page: page.value,
      page_size: pageSize.value,
      method: filterMethod.value || undefined,
      path: filterPath.value || undefined,
    })
    if (res.error) {
      console.error(res.error)
      return
    }
    if (res.data) {
      logs.value = res.data.logs
    }
  } finally {
    loading.value = false
  }
}

// 加载统计
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

// 初始化
onMounted(() => {
  loadLogs()
  loadStats()
})
</script>

<style scoped>
.monitor-container {
  padding: 24px;
}

.stat-card {
  text-align: center;
}

.stat-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: var(--n-text-color);
}

.stat-label {
  font-size: 14px;
  color: var(--n-text-color-3);
}

.error-rate {
  color: var(--n-error-color);
}

.code-block {
  background: #f5f5f5;
  padding: 12px;
  border-radius: 4px;
  font-size: 12px;
  max-height: 200px;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
