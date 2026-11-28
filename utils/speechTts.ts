/** 浏览器 speechSynthesis 朗读（无云 TTS）。 */

export function speechSupported(): boolean {
  return typeof window !== 'undefined' && typeof window.speechSynthesis !== 'undefined'
}

/** 去掉常见 markdown，便于朗读 */
export function plainTextForSpeech(raw: string): string {
  return String(raw || '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[[^\]]*]\([^)]+\)/g, ' ')
    .replace(/\[([^\]]*)]\([^)]+\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/[*_~>|-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function stopSpeech() {
  if (!speechSupported()) return
  window.speechSynthesis.cancel()
}

export function isSpeaking(): boolean {
  return speechSupported() && window.speechSynthesis.speaking
}

export function speakText(
  text: string,
  opts?: { lang?: string; rate?: number; onEnd?: () => void; onError?: () => void },
): boolean {
  if (!speechSupported()) return false
  const plain = plainTextForSpeech(text)
  if (!plain) return false
  stopSpeech()
  const u = new SpeechSynthesisUtterance(plain)
  u.lang = opts?.lang || 'zh-CN'
  u.rate = opts?.rate ?? 1
  u.onend = () => opts?.onEnd?.()
  u.onerror = () => opts?.onError?.()
  window.speechSynthesis.speak(u)
  return true
}
