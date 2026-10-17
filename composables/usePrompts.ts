export interface PromptVarDef {
  name: string
  description?: string
  default?: string
  required?: boolean
}

export interface Prompt {
  id: string
  name: string
  description?: string
  /** manual | agent | skill */
  source_type?: string
  source_id?: string
  /** 来源展示名快照，如 Agent 名 */
  source_name?: string
  current_version_id?: string
  variables?: PromptVarDef[]
  tags?: string[]
  created_at: string
  updated_at: string
}

export interface PromptVersion {
  id: string
  prompt_id: string
  version: number
  status: 'draft' | 'published' | string
  content: string
  changelog?: string
  published_at?: string
  created_at: string
}

export interface PromptUsage {
  agent_id: string
  agent_name: string
}

export interface RenderResult {
  content: string
  var_names: string[]
  version_id: string
  version: number
}

export function usePrompts() {
  const { get, post, put, del } = useApi()

  const list = () => get<Prompt[]>('/api/v1/prompts')
  const create = (body: {
    name: string
    description?: string
    content?: string
    changelog?: string
    variables?: PromptVarDef[]
    tags?: string[]
  }) => post<{ prompt: Prompt; current_version: PromptVersion }>('/api/v1/prompts', body)
  const getOne = (id: string) =>
    get<{ prompt: Prompt; current_version?: PromptVersion }>(`/api/v1/prompts/${id}`)
  const update = (
    id: string,
    body: { name?: string; description?: string; variables?: PromptVarDef[]; tags?: string[] },
  ) => put<Prompt>(`/api/v1/prompts/${id}`, body)
  const remove = (id: string) => del(`/api/v1/prompts/${id}`)
  const listVersions = (id: string) => get<PromptVersion[]>(`/api/v1/prompts/${id}/versions`)
  const createVersion = (
    id: string,
    body: { content: string; changelog?: string; publish?: boolean },
  ) => post<PromptVersion>(`/api/v1/prompts/${id}/versions`, body)
  const removeVersion = (versionId: string) => del(`/api/v1/prompts/versions/${versionId}`)
  const publishVersion = (versionId: string) =>
    post<{ prompt: Prompt; current_version: PromptVersion }>(
      `/api/v1/prompts/versions/${versionId}/publish`,
      {},
    )
  const setCurrentVersion = (promptId: string, versionId: string) =>
    put<Prompt>(`/api/v1/prompts/${promptId}/current-version`, { version_id: versionId })
  const render = (promptId: string, body: { version_id?: string; variables?: Record<string, string> }) =>
    post<RenderResult>(`/api/v1/prompts/${promptId}/render`, body)
  const importFromAgent = (body: { agent_id: string; name?: string }) =>
    post<{ prompt: Prompt; current_version: PromptVersion }>('/api/v1/prompts/import', body)
  const listUsages = (promptId: string) => get<PromptUsage[]>(`/api/v1/prompts/${promptId}/usages`)

  return {
    list,
    create,
    getOne,
    update,
    remove,
    listVersions,
    createVersion,
    removeVersion,
    publishVersion,
    setCurrentVersion,
    render,
    importFromAgent,
    listUsages,
  }
}
