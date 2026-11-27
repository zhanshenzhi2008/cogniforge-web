/** 浏览器 SpeechRecognition 语音输入（无云 ASR）。 */

export type SpeechRecognitionLike = {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult: ((ev: SpeechRecognitionEventLike) => void) | null
  onerror: ((ev: { error?: string }) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}

export type SpeechRecognitionEventLike = {
  resultIndex: number
  results: ArrayLike<{
    isFinal: boolean
    0: { transcript: string }
  }>
}

type SpeechWindow = Window & {
  SpeechRecognition?: new () => SpeechRecognitionLike
  webkitSpeechRecognition?: new () => SpeechRecognitionLike
}

export function speechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false
  const w = window as SpeechWindow
  return !!(w.SpeechRecognition || w.webkitSpeechRecognition)
}

export function createSpeechRecognition(): SpeechRecognitionLike | null {
  if (!speechRecognitionSupported()) return null
  const w = window as SpeechWindow
  const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition
  if (!Ctor) return null
  return new Ctor()
}

export type SttHandlers = {
  onFinal?: (text: string) => void
  onInterim?: (text: string) => void
  onEnd?: () => void
  onError?: (code: string) => void
}

/** 启动一次连续听写；调用返回的 stop() 结束。 */
export function startSpeechDictation(
  opts: { lang?: string } & SttHandlers,
): { stop: () => void } | null {
  const rec = createSpeechRecognition()
  if (!rec) return null

  let stopped = false
  rec.lang = opts.lang || 'zh-CN'
  rec.continuous = true
  rec.interimResults = true

  rec.onresult = (ev) => {
    let interim = ''
    let finals = ''
    for (let i = ev.resultIndex; i < ev.results.length; i++) {
      const row = ev.results[i]
      const t = row?.[0]?.transcript || ''
      if (row.isFinal) finals += t
      else interim += t
    }
    if (finals) opts.onFinal?.(finals)
    if (interim) opts.onInterim?.(interim)
  }

  rec.onerror = (ev) => {
    opts.onError?.(ev.error || 'unknown')
  }

  rec.onend = () => {
    if (!stopped) {
      // some browsers end unexpectedly; surface as end
      opts.onEnd?.()
    } else {
      opts.onEnd?.()
    }
  }

  try {
    rec.start()
  } catch {
    opts.onError?.('start_failed')
    return null
  }

  return {
    stop: () => {
      stopped = true
      try {
        rec.onresult = null
        rec.onerror = null
        rec.stop()
      } catch {
        try {
          rec.abort()
        } catch {
          /* ignore */
        }
      }
    },
  }
}
