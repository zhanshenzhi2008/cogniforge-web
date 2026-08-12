// https://nuxt.com/docs/api/configuration/nuxt-config

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: [
    '@pinia/nuxt',
    '@nuxt/ui',
  ],

  // Keep SPA mode (previous default when SSR_NAIVE was unset).
  ssr: false,

  css: ['~/assets/css/main.css'],

  ui: {
    colorMode: false,
    // 构建环境若无法访问 Google Fonts，关闭自动拉取，改用系统/本地回退
    fonts: false,
  },

  vite: {
    server: {
      strictPort: true,
    },
  },

  devServer: {
    port: 3000,
  },

  app: {
    head: {
      title: 'CogniForge',
      htmlAttrs: {
        'data-theme': 'aurora',
      },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'AI Agent Platform' },
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.bunny.net/css?family=ibm-plex-sans:400,500,600|jetbrains-mono:400,500|syne:600,700&display=swap',
        },
      ],
    },
  },

  runtimeConfig: {
    public: {
      // 生产：空字符串 = 浏览器请求当前域名 /api/v1/*（由 Nginx 转发）。
      // 本地 pnpm dev：默认打本机 Go 后端。可用 API_BASE 覆盖。
      apiBase: process.env.API_BASE ?? (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:8080'),
    },
  },

  typescript: {
    strict: true,
    typeCheck: false,
  },

  nitro: {
    prerender: {
      routes: ['/'],
    },
  },
})
