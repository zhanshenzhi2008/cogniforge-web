/**
 * 解析前端 API 基址。
 *
 * 接口路径本身已带 `/api/v1/...`。
 * - 生产（同源 Nginx 反代）：应为空字符串，请求当前域名 `/api/v1/...`
 * - 本地开发：`http://localhost:8080`
 * - 历史配置曾把基址写成 `/api` 或 `.../api/v1`，这里去掉以免拼成 `/api/api/v1`
 */
export function resolveApiBase(raw?: string | null): string {
  let value = String(raw ?? '').trim().replace(/\/+$/, '')
  if (!value || value === '/api' || value === '/api/v1') {
    return ''
  }
  if (value.endsWith('/api/v1')) {
    value = value.slice(0, -7)
  } else if (value.endsWith('/api')) {
    value = value.slice(0, -4)
  }
  return value.replace(/\/+$/, '')
}

export function apiUrl(path: string, rawBase?: string | null): string {
  const origin = resolveApiBase(rawBase)
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${origin}${normalized}`
}
