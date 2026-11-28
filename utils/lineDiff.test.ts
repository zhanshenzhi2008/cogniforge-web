import { describe, expect, it } from 'vitest'
import { lineDiff } from './lineDiff'

describe('lineDiff', () => {
  it('marks added and deleted lines', () => {
    const rows = lineDiff('a\nb\nc', 'a\nx\nc')
    expect(rows.map(r => [r.op, r.text])).toEqual([
      ['equal', 'a'],
      ['del', 'b'],
      ['add', 'x'],
      ['equal', 'c'],
    ])
  })

  it('returns equals when identical', () => {
    const rows = lineDiff('hello\nworld', 'hello\nworld')
    expect(rows.every(r => r.op === 'equal')).toBe(true)
    expect(rows).toHaveLength(2)
  })

  it('handles empty vs content', () => {
    const rows = lineDiff('', 'only')
    expect(rows).toEqual([{ op: 'add', text: 'only', rightNo: 1 }])
  })
})
