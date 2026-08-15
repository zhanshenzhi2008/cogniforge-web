export type CfNavStyleId = 'editorial' | 'island'

export const CF_NAV_STYLES: {
  id: CfNavStyleId
  label: string
  description: string
}[] = [
  { id: 'editorial', label: '安静编辑室', description: '通栏 + 青色短下划线' },
  { id: 'island', label: '悬浮岛', description: '圆角导航岛 + 浅青胶囊' },
]

const STORAGE_KEY = 'cf-nav-style'
const DEFAULT_STYLE: CfNavStyleId = 'editorial'

function isNavStyleId(value: string | null | undefined): value is CfNavStyleId {
  return CF_NAV_STYLES.some((s) => s.id === value)
}

export function useNavStyle() {
  const navStyle = useState<CfNavStyleId>('cf-nav-style', () => DEFAULT_STYLE)

  const apply = (id: CfNavStyleId) => {
    navStyle.value = id
    if (import.meta.client) {
      localStorage.setItem(STORAGE_KEY, id)
    }
  }

  const init = () => {
    if (!import.meta.client) return
    const saved = localStorage.getItem(STORAGE_KEY)
    apply(isNavStyleId(saved) ? saved : DEFAULT_STYLE)
  }

  const setNavStyle = (id: CfNavStyleId) => {
    apply(id)
  }

  return {
    navStyle: readonly(navStyle),
    navStyles: CF_NAV_STYLES,
    init,
    setNavStyle,
  }
}
