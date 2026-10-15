export interface EvalSuite {
  id: string
  user_id: string
  name: string
  description?: string
  created_at: string
  updated_at: string
}

export interface EvalCase {
  id: string
  suite_id: string
  name?: string
  input: string
  expected?: string
  judge_type: string
  judge_config?: Record<string, unknown>
  weight: number
  sort_order: number
}

export interface EvalRun {
  id: string
  suite_id: string
  target_type: string
  target_id: string
  status: string
  pass_count: number
  fail_count: number
  skip_count: number
  score: number
  error_message?: string
  started_at?: string
  finished_at?: string
  created_at: string
}

export interface EvalResult {
  id: string
  run_id: string
  case_id: string
  status: string
  score: number
  actual_output: string
  latency_ms: number
  detail?: Record<string, unknown>
}

export function useEvals() {
  const { get, post, put, del } = useApi()

  const listSuites = () => get<EvalSuite[]>('/api/v1/evals/suites')
  const createSuite = (body: { name: string; description?: string }) =>
    post<EvalSuite>('/api/v1/evals/suites', body)
  const getSuite = (id: string) => get<EvalSuite>(`/api/v1/evals/suites/${id}`)
  const updateSuite = (id: string, body: { name?: string; description?: string }) =>
    put<EvalSuite>(`/api/v1/evals/suites/${id}`, body)
  const deleteSuite = (id: string) => del(`/api/v1/evals/suites/${id}`)

  const listCases = (suiteId: string) => get<EvalCase[]>(`/api/v1/evals/suites/${suiteId}/cases`)
  const createCase = (suiteId: string, body: Partial<EvalCase> & { input: string }) =>
    post<EvalCase>(`/api/v1/evals/suites/${suiteId}/cases`, body)
  const updateCase = (id: string, body: Partial<EvalCase>) =>
    put<EvalCase>(`/api/v1/evals/cases/${id}`, body)
  const deleteCase = (id: string) => del(`/api/v1/evals/cases/${id}`)

  const createRun = (suiteId: string, body: { target_type: string; target_id: string }) =>
    post<{ run: EvalRun; results: EvalResult[] }>(`/api/v1/evals/suites/${suiteId}/runs`, body)
  const listRuns = (suiteId?: string) => {
    const q = suiteId ? `?suite_id=${encodeURIComponent(suiteId)}` : ''
    return get<EvalRun[]>(`/api/v1/evals/runs${q}`)
  }
  const getRun = (id: string) =>
    get<{ run: EvalRun; results: EvalResult[] }>(`/api/v1/evals/runs/${id}`)

  return {
    listSuites,
    createSuite,
    getSuite,
    updateSuite,
    deleteSuite,
    listCases,
    createCase,
    updateCase,
    deleteCase,
    createRun,
    listRuns,
    getRun,
  }
}
