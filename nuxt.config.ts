// https://nuxt.com/docs/api/configuration/nuxt-config
// @ts-ignore

// Feature flag: when true, enables SSR-compatible Naive UI setup via @bg-dev/nuxt-naiveui.
// When false (default), uses the lightweight client-only manual setup — no extra module overhead.
// Change SSR_NAIVE in .env to toggle between modes.
const ssrNaive = process.env.SSR_NAIVE === 'true'

export default defineNuxtConfig({
  devtools: { enabled: true },

  modules: [
    '@pinia/nuxt',
    ssrNaive ? '@bg-dev/nuxt-naiveui' : null,
  ].filter(Boolean),

  ssr: ssrNaive === true,

  css: [
    '~/assets/css/main.css',
  ],

  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: '@use "@/assets/css/variables.scss" as *;',
        },
      },
    },
    optimizeDeps: {
      include: ['naive-ui', 'vueuc', 'date-fns', 'icons', '@vicons/ionicons5'],
      exclude: [],
    },
    ssr: {
      noExternal: ssrNaive ? ['naive-ui'] : [],
    },
  },

  devServer: {
    port: 3000,
    strictPort: true,
  },

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
      // 生产镜像由 Nginx 将同源 /api/* 转发到 Go 后端；本地可用 API_BASE 覆盖。
      apiBase: process.env.API_BASE || '/api',
      ssrNaive,
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
