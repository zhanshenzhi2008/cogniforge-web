import { createApiClient } from '../utils/apiClient'
import { useAuth } from './useAuth'

export interface Session {
  id: string
  user_id: string
  token_id: string
  user_agent: string
  ip_address: string
  device: string
  location: string
  expires_at: string
  last_used: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export const useSessions = () => {
  const auth = useAuth()

  const api = createApiClient({
    baseUrl: 'http://localhost:8080',
    getToken: () => auth.getToken(),
    onUnauthorized: () => auth.redirectToLogin(),
  })

  /**
   * 获取当前用户的会话列表
   */
  const getSessions = async (): Promise<Session[]> => {
    const response = await api.get<Session[]>('/api/sessions')
    if (response.error) {
      throw new Error(response.error)
    }
    return response.data || []
  }

  /**
   * 撤销指定会话（远程登出）
   */
  const revokeSession = async (sessionId: string): Promise<void> => {
    const response = await api.del(`/api/sessions/${sessionId}`)
    if (response.error) {
      throw new Error(response.error)
    }
  }

  /**
   * 撤销所有其他会话（保留当前）
   */
  const revokeAllOtherSessions = async (): Promise<void> => {
    const sessions = await getSessions()
    const revokePromises = sessions
      .filter((s) => !s.is_active || !s.is_current)
      .map((s) => revokeSession(s.id))

    await Promise.all(revokePromises)
  }

  return {
    getSessions,
    revokeSession,
    revokeAllOtherSessions,
  }
}
