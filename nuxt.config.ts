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

  // SPA 下自定义 SVG 必须打进 client bundle，否则线上拿不到
  icon: {
    customCollections: [
      {
        prefix: 'cf',
        dir: './assets/icons',
      },
    ],
    clientBundle: {
      includeCustomCollections: true,
      scan: true,
    },
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
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg?v=hd1' },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32.png?v=hd1' },
        { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16.png?v=hd1' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png?v=hd1' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.bunny.net/css?family=ibm-plex-sans:400,500,600|jetbrains-mono:400,500|source-serif-4:600,700|syne:600,700&display=swap',
        },
      ],
    },
  },

  runtimeConfig: {
    public: {
      // 生产：空字符串 = 浏览器请求当前域名 /api/v1/*（由 Nginx 转发）。
      // 本地 pnpm dev：默认打本机 Go 后端。可用 API_BASE 覆盖。
      apiBase: process.env.API_BASE ?? (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:8080'),
      // 金融扩展：密级 UI（文档密级 / 角色·用户 clearance / 审计 Tab）。通用版默认关。
      showSecurityLevel: process.env.NUXT_PUBLIC_SHOW_SECURITY_LEVEL
        ?? process.env.SHOW_SECURITY_LEVEL
        ?? '',
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
