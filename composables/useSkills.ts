/**
 * SKILL types and API composable
 * SKILL 结构参照 Claude Skills / GPTs：meta + instructions + references
 */

import { useApi } from './useApi'

export interface SkillReference {
  type: 'url' | 'file' | 'text'
  title: string
  content?: string
  url?: string
  path?: string
}

export interface Skill {
  id: string
  user_id?: string
  name: string
  description: string
  icon: string
  // 指令部分
  instructions: string
  examples: string[]        // Few-shot 示例
  references: SkillReference[]  // 参考数据
  constraints: string[]     // 约束规则
  // 配置
  model: string
  mcp_servers: string[]
  memory_type: string
  memory_turns: number
  // 分类
  category: string
  tags: string[]
  version: string
  author: string
  // 元数据
  is_built_in: boolean
  sort_order: number
  usage_count: number
  created_at: string
  updated_at: string
}

export interface CreateSkillInput {
  name: string
  description?: string
  icon?: string
  instructions?: string
  examples?: string[]
  references?: SkillReference[]
  constraints?: string[]
  model?: string
  mcp_servers?: string[]
  memory_type?: string
  memory_turns?: number
  category?: string
  tags?: string[]
  version?: string
  author?: string
  sort_order?: number
}

export const useSkills = () => {
  const api = useApi()

  const list = async (): Promise<{ data?: Skill[]; error?: string }> => {
    try {
      const res = await api.get<Skill[]>('/api/v1/skills')
      if (res.error) return { error: res.error }
      return { data: res.data || [] }
    } catch (err: any) {
      return { error: err.message || '获取 SKILL 列表失败' }
    }
  }

  const create = async (input: CreateSkillInput): Promise<{ data?: Skill; error?: string }> => {
    try {
      const res = await api.post<Skill>('/api/v1/skills', input)
      if (res.error) return { error: res.error }
      return { data: res.data }
    } catch (err: any) {
      return { error: err.message || '创建 SKILL 失败' }
    }
  }

  const update = async (id: string, input: Partial<CreateSkillInput>): Promise<{ data?: Skill; error?: string }> => {
    try {
      const res = await api.put<Skill>(`/api/v1/skills/${id}`, input)
      if (res.error) return { error: res.error }
      return { data: res.data }
    } catch (err: any) {
      return { error: err.message || '更新 SKILL 失败' }
    }
  }

  const remove = async (id: string): Promise<{ error?: string }> => {
    try {
      const res = await api.del(`/api/v1/skills/${id}`)
      if (res.error) return { error: res.error }
      return {}
    } catch (err: any) {
      return { error: err.message || '删除 SKILL 失败' }
    }
  }

  return {
    list,
    create,
    update,
    remove,
  }
}
