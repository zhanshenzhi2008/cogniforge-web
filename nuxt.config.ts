// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },

  modules: [
    '@pinia/nuxt',
  ],

  // 禁用 SSR，Element Plus 与 Nuxt SSR 的水合存在兼容性问题
  ssr: false,

  css: [
    'element-plus/dist/index.css',
    '~/assets/css/main.css',
  ],

  app: {
    head: {
      title: 'CogniForge',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'AI Agent Platform' },
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
      ],
    },
  },

  runtimeConfig: {
    public: {
      apiBase: process.env.API_BASE || 'http://localhost:8080',
    },
  },

  typescript: {
    strict: true,
    typeCheck: false,
  },

  vite: {
    optimizeDeps: {
      include: ['element-plus'],
    },
  },
})
