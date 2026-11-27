/**
 * 金融扩展密级 UI 开关。
 * 通用版默认隐藏；设 NUXT_PUBLIC_SHOW_SECURITY_LEVEL=1|true 后展示。
 */
export function useSecurityFeatures() {
  const config = useRuntimeConfig()
  const showSecurityLevel = computed(() => {
    const raw = String(config.public?.showSecurityLevel ?? '').trim().toLowerCase()
    return raw === '1' || raw === 'true' || raw === 'yes' || raw === 'on'
  })
  return { showSecurityLevel }
}
