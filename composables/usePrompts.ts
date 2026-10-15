export interface Prompt {
  id: string
  name: string
  description?: string
  current_version_id?: string
  created_at: string
  updated_at: string
}

export interface PromptVersion {
  id: string
  prompt_id: string
  version: number
  content: string
  changelog?: string
  created_at: string
}

export function usePrompts() {
  const { get, post, put, del } = useApi()

  const list = () => get<Prompt[]>('/api/v1/prompts')
  const create = (body: { name: string; description?: string; content?: string; changelog?: string }) =>
    post<{ prompt: Prompt; current_version: PromptVersion }>('/api/v1/prompts', body)
  const getOne = (id: string) =>
    get<{ prompt: Prompt; current_version?: PromptVersion }>(`/api/v1/prompts/${id}`)
  const update = (id: string, body: { name?: string; description?: string }) =>
    put<Prompt>(`/api/v1/prompts/${id}`, body)
  const remove = (id: string) => del(`/api/v1/prompts/${id}`)
  const listVersions = (id: string) => get<PromptVersion[]>(`/api/v1/prompts/${id}/versions`)
  const createVersion = (id: string, body: { content: string; changelog?: string }) =>
    post<PromptVersion>(`/api/v1/prompts/${id}/versions`, body)

  return { list, create, getOne, update, remove, listVersions, createVersion }
}
