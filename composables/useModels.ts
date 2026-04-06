/**
 * Model types and API composable
 */

export interface Model {
  id: string
  object: string
  created: number
  owned_by: string
  name: string
  description: string
}

export const useModels = () => {
  const api = useApi()

  const list = async (): Promise<{ data?: Model[]; error?: string }> => {
    try {
      const res = await api.get<{ models: Model[] }>('/api/v1/models/')
      if (res.error) return { error: res.error }
      return { data: res.data?.models || [] }
    } catch (err: any) {
      return { error: err.message || '获取模型列表失败' }
    }
  }

  return {
    list,
  }
}
