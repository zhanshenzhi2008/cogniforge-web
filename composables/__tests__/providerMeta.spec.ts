import { describe, expect, it, vi } from 'vitest'

vi.mock('../useApi', () => ({
  useApi: () => ({}),
}))

import { matchProviderByBaseURL, providerLabel } from '../useProviders'

describe('provider label and URL match', () => {
  it('maps the vendor key to the card subtitle', () => {
    expect(providerLabel('zhipu')).toBe('智谱 BigModel')
    expect(providerLabel('openai')).toBe('OpenAI')
    expect(providerLabel('custom')).toBe('自定义兼容')
    expect(providerLabel('')).toBe('')
  })

  it('recognizes a BigModel URL as zhipu, not openai', () => {
    expect(matchProviderByBaseURL('https://open.bigmodel.cn/api/paas/v4')).toBe('zhipu')
    expect(matchProviderByBaseURL('https://api.openai.com/v1')).toBe('openai')
    expect(matchProviderByBaseURL('https://api.groq.com/openai/v1')).toBe('groq')
    expect(matchProviderByBaseURL('https://my-proxy.example/v1')).toBe('')
  })
})
