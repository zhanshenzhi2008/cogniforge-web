/**
 * 监控中心 API composable
 */

export interface RequestLog {
  id: string
  trace_id: string
  user_id: string
  method: string
  path: string
  query: string
  request_body: string
  status_code: number
  response_body: string
  duration: number
  user_agent: string
  ip: string
  error: string
  created_at: string
}

export interface RequestLogQuery {
  page?: number
  page_size?: number
  method?: string
  path?: string
  status_code?: number
  start_time?: string
  end_time?: string
  trace_id?: string
}

export interface RequestLogListResponse {
  logs: RequestLog[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export interface DailyStat {
  date: string
  request_count: number
  avg_duration: number
  error_count: number
}

export interface StatusStat {
  status_code: number
  count: number
  percentage: number
}

export interface MethodStat {
  method: string
  count: number
  avg_duration: number
}

export interface PathStat {
  path: string
  count: number
  avg_duration: number
}

export interface UsageStats {
  period: number
  total_requests: number
  total_duration: number
  avg_duration: number
  error_requests: number
  error_rate: number
  daily_stats: DailyStat[]
  status_stats: StatusStat[]
  method_stats: MethodStat[]
  path_stats: PathStat[]
}

export interface RealtimeStats {
  req_count: number
  avg_duration: number
  error_count: number
  minute_stats: { minute: string; request_count: number }[]
  timestamp: number
}

export const useMonitor = () => {
  const api = useApi()

  // ==================== Request Logs ====================

  const listRequestLogs = async (
    query: RequestLogQuery = {}
  ): Promise<{ data?: RequestLogListResponse; error?: string }> => {
    try {
      const params = new URLSearchParams()
      if (query.page) params.set('page', String(query.page))
      if (query.page_size) params.set('page_size', String(query.page_size))
      if (query.method) params.set('method', query.method)
      if (query.path) params.set('path', query.path)
      if (query.status_code) params.set('status_code', String(query.status_code))
      if (query.start_time) params.set('start_time', query.start_time)
      if (query.end_time) params.set('end_time', query.end_time)
      if (query.trace_id) params.set('trace_id', query.trace_id)

      const res = await api.get<RequestLogListResponse>(
        `/api/v1/monitor/logs?${params.toString()}`
      )
      if (res.error) return { error: res.error }
      return { data: res.data }
    } catch (err: any) {
      return { error: err.message || '获取请求日志列表失败' }
    }
  }

  const getRequestLog = async (
    id: string
  ): Promise<{ data?: RequestLog; error?: string }> => {
    try {
      const res = await api.get<RequestLog>(`/api/v1/monitor/logs/${id}`)
      if (res.error) return { error: res.error }
      return { data: res.data }
    } catch (err: any) {
      return { error: err.message || '获取请求日志详情失败' }
    }
  }

  // ==================== Usage Stats ====================

  const getUsageStats = async (): Promise<{ data?: UsageStats; error?: string }> => {
    try {
      const res = await api.get<UsageStats>('/api/v1/monitor/stats')
      if (res.error) return { error: res.error }
      return { data: res.data }
    } catch (err: any) {
      return { error: err.message || '获取用量统计失败' }
    }
  }

  const getRealtimeStats = async (): Promise<{
    data?: RealtimeStats
    error?: string
  }> => {
    try {
      const res = await api.get<RealtimeStats>('/api/v1/monitor/stats/realtime')
      if (res.error) return { error: res.error }
      return { data: res.data }
    } catch (err: any) {
      return { error: err.message || '获取实时统计失败' }
    }
  }

  return {
    listRequestLogs,
    getRequestLog,
    getUsageStats,
    getRealtimeStats,
  }
}
