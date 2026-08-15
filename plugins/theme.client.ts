export default defineNuxtPlugin(() => {
  const { init: initTheme } = useTheme()
  const { init: initNavStyle } = useNavStyle()
  const { init: initLocale } = useLocale()
  initTheme()
  initNavStyle()
  initLocale()
})
