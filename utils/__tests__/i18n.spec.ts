import { describe, expect, it } from 'vitest'
import { LOCALES, M } from '../../i18n/messages'

describe('i18n messages', () => {
  it('every key has non-empty zh-CN and en-US', () => {
    for (const [key, entry] of Object.entries(M)) {
      for (const loc of LOCALES) {
        expect(entry[loc.code].trim(), `${key} ${loc.code}`).not.toBe('')
      }
    }
  })

  it('interpolates {n} placeholders in both locales', () => {
    const sample = M['agents.count']
    expect(sample['zh-CN']).toContain('{n}')
    expect(sample['en-US']).toContain('{n}')
  })
})
