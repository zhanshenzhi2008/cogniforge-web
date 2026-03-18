import { defineConfig } from 'vite'

export default defineConfig({
  ssr: false,
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: '@use "@/assets/css/variables.scss" as *;',
      },
    },
  },
})
