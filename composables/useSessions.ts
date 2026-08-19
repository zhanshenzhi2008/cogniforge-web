import { useApi } from './useApi'

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
  is_current?: boolean
  created_at: string
  updated_at: string
}

const SESSIONS_PATH = '/api/v1/settings/sessions'

function asSessionList(raw: unknown): Session[] {
  return Array.isArray(raw) ? raw : []
}

export const useSessions = () => {
  const api = useApi()

  const getSessions = async (): Promise<{ data: Session[]; error?: string }> => {
    const response = await api.get<Session[]>(SESSIONS_PATH)
    if (response.error) {
      return { data: [], error: response.error }
    }
    return { data: asSessionList(response.data) }
  }

  const revokeSession = async (sessionId: string): Promise<{ error?: string }> => {
    const response = await api.del(`${SESSIONS_PATH}/${sessionId}`)
    if (response.error) {
      return { error: response.error }
    }
    return {}
  }

  return {
    getSessions,
    revokeSession,
  }
}
