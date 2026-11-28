import { describe, expect, it } from 'vitest'
import { guessSuggestedPrompts } from '../guessSuggestedPrompts'

describe('guessSuggestedPrompts', () => {
  it('uses description when present', () => {
    const chips = guessSuggestedPrompts({
      name: '客服助手',
      description: '解答售后政策',
      locale: 'zh-CN',
      max: 3,
    })
    expect(chips).toHaveLength(3)
    expect(chips[0]).toContain('解答售后政策')
  })

  it('falls back without description', () => {
    const chips = guessSuggestedPrompts({ name: 'Demo', locale: 'en-US', max: 3 })
    expect(chips).toHaveLength(3)
    expect(chips[0]?.toLowerCase()).toContain('help')
  })

  it('respects max and dedupes', () => {
    const chips = guessSuggestedPrompts({ locale: 'zh-CN', max: 2 })
    expect(chips).toHaveLength(2)
  })
})
