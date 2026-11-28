import { describe, expect, it } from 'vitest'
import { plainTextForSpeech } from '../speechTts'

describe('plainTextForSpeech', () => {
  it('strips code fences and markdown noise', () => {
    const raw = '# Hello\n\n**bold** and `code`\n\n```js\nconsole.log(1)\n```\n[link](https://x.test)'
    expect(plainTextForSpeech(raw)).toBe('Hello bold and code link')
  })

  it('returns empty for blank', () => {
    expect(plainTextForSpeech('   ')).toBe('')
  })
})
