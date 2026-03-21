import ElementPlus from 'element-plus'
import { ElMessage } from 'element-plus'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(ElementPlus)

  // 全局注册 ElMessage 服务，这样所有组件可以直接使用 ElMessage
  nuxtApp.vueApp.config.globalProperties.$message = ElMessage

  // Register all icons globally
  for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    nuxtApp.vueApp.component(key, component)
  }
})
