import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { speechRecognitionSupported, startSpeechDictation } from '../speechStt'

describe('speechStt', () => {
  const original = globalThis.window

  beforeEach(() => {
    vi.stubGlobal('window', {
      ...original,
      SpeechRecognition: undefined,
      webkitSpeechRecognition: undefined,
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('reports unsupported without API', () => {
    expect(speechRecognitionSupported()).toBe(false)
    expect(startSpeechDictation({})).toBeNull()
  })

  it('starts when constructor exists', () => {
    const start = vi.fn()
    const stop = vi.fn()
    class FakeRec {
      lang = ''
      continuous = false
      interimResults = false
      onresult = null
      onerror = null
      onend = null
      start = start
      stop = stop
      abort = vi.fn()
    }
    vi.stubGlobal('window', {
      SpeechRecognition: FakeRec,
    })
    const handle = startSpeechDictation({ lang: 'en-US' })
    expect(handle).not.toBeNull()
    expect(start).toHaveBeenCalled()
    handle?.stop()
    expect(stop).toHaveBeenCalled()
  })
})
