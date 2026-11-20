import { describe, expect, it } from 'vitest'
import { partsToText, toUiChatMessages } from '../chatUi'
import { mapChatHttpError } from '../chatHttpError'

describe('chatUi', () => {
  it('maps messages to UChat parts', () => {
    const ui = toUiChatMessages([
      { id: 'u1', role: 'user', content: 'hi' },
      { role: 'assistant', content: '' },
    ])
    expect(ui[0]).toEqual({
      id: 'u1',
      role: 'user',
      parts: [{ type: 'text', text: 'hi' }],
    })
    expect(ui[1].id).toBe('msg-1-assistant')
    expect(ui[1].parts).toEqual([])
  })

  it('joins text parts', () => {
    expect(partsToText([{ type: 'text', text: 'a' }, { type: 'text', text: 'b' }])).toBe('ab')
    expect(partsToText()).toBe('')
  })
})

describe('mapChatHttpError', () => {
  const t = (key: string) => key

  it('maps known business codes', () => {
    expect(mapChatHttpError(400, JSON.stringify({ code: 4010 }), t)).toBe('play.noProvider')
    expect(mapChatHttpError(429, JSON.stringify({ code: 5016 }), t)).toBe('quota.exhausted')
    expect(mapChatHttpError(429, JSON.stringify({ code: 5014 }), t)).toBe('quota.rate')
  })
})
