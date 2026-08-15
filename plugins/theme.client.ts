export default defineNuxtPlugin(() => {
  const { init: initTheme } = useTheme()
  const { init: initNavStyle } = useNavStyle()
  initTheme()
  initNavStyle()
})
