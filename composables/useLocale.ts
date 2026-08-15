import { LOCALES, M, type LocaleCode, type MessageKey } from '~/i18n/messages'

export type { LocaleCode, MessageKey }

const STORAGE_KEY = 'cf-locale'
const DEFAULT_LOCALE: LocaleCode = 'zh-CN'

export function isLocaleCode(value: string | null | undefined): value is LocaleCode {
  return value === 'zh-CN' || value === 'en-US'
}

function detectBrowserLocale(): LocaleCode {
  if (!import.meta.client) return DEFAULT_LOCALE
  const lang = (navigator.language || '').toLowerCase()
  return lang.startsWith('zh') ? 'zh-CN' : 'en-US'
}

function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    vars[key] != null ? String(vars[key]) : `{${key}}`,
  )
}

export function useLocale() {
  const locale = useState<LocaleCode>('cf-locale', () => DEFAULT_LOCALE)

  const apply = (code: LocaleCode) => {
    locale.value = code
    if (!import.meta.client) return
    document.documentElement.lang = code === 'zh-CN' ? 'zh-CN' : 'en'
    localStorage.setItem(STORAGE_KEY, code)
  }

  const t = (key: MessageKey | string, vars?: Record<string, string | number>): string => {
    const table = M[key as MessageKey]
    const raw = table?.[locale.value] ?? table?.[DEFAULT_LOCALE] ?? key
    return interpolate(raw, vars)
  }

  const d = (value?: string | Date | null): string => {
    if (!value) return '—'
    const date = value instanceof Date ? value : new Date(value)
    if (Number.isNaN(date.getTime())) return '—'
    return date.toLocaleString(locale.value)
  }

  const init = () => {
    if (!import.meta.client) return
    const saved = localStorage.getItem(STORAGE_KEY)
    apply(isLocaleCode(saved) ? saved : detectBrowserLocale())
  }

  const persistRemote = async (code: LocaleCode) => {
    try {
      const { put } = useApi()
      await put('/api/v1/settings', { language: code })
    } catch {
      // UI already switched; remote sync is best-effort
    }
  }

  const setLocale = (code: LocaleCode) => {
    if (code === locale.value) return
    apply(code)
    if (!import.meta.client) return
    try {
      if (useAuth().getToken()) void persistRemote(code)
    } catch {
      // not in a setup context with auth
    }
  }

  const syncToRemote = () => {
    if (!import.meta.client) return
    try {
      if (useAuth().getToken()) void persistRemote(locale.value)
    } catch {
      // ignore
    }
  }

  const applyFromSettings = (code?: string) => {
    if (!isLocaleCode(code) || code === locale.value) return
    if (import.meta.client && localStorage.getItem(STORAGE_KEY)) return
    apply(code)
  }

  return {
    locale: readonly(locale),
    locales: LOCALES,
    t,
    d,
    init,
    setLocale,
    syncToRemote,
    applyFromSettings,
  }
}
