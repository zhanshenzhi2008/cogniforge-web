export type CfThemeId = 'aurora' | 'inknight' | 'citrus' | 'glass'

export const CF_THEMES: {
  id: CfThemeId
  label: string
  description: string
}[] = [
  { id: 'aurora', label: '极光薄雾', description: '亮色通透，默认推荐' },
  { id: 'inknight', label: '墨夜信号', description: '深色科技' },
  { id: 'citrus', label: '青柠锻场', description: '明快活泼' },
  { id: 'glass', label: '玻璃工坊', description: '玻璃层次' },
]

const STORAGE_KEY = 'cf-theme'
const DEFAULT_THEME: CfThemeId = 'aurora'

function isThemeId(value: string | null | undefined): value is CfThemeId {
  return CF_THEMES.some((t) => t.id === value)
}

export function useTheme() {
  const theme = useState<CfThemeId>('cf-theme', () => DEFAULT_THEME)

  const apply = (id: CfThemeId) => {
    theme.value = id
    if (import.meta.client) {
      document.documentElement.setAttribute('data-theme', id)
      localStorage.setItem(STORAGE_KEY, id)
    }
  }

  const init = () => {
    if (!import.meta.client) {
      return
    }
    const saved = localStorage.getItem(STORAGE_KEY)
    apply(isThemeId(saved) ? saved : DEFAULT_THEME)
  }

  const setTheme = (id: CfThemeId) => {
    apply(id)
  }

  return {
    theme: readonly(theme),
    themes: CF_THEMES,
    init,
    setTheme,
  }
}
