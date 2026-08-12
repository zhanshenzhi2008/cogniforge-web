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
      // 生产：空字符串 = 浏览器请求当前域名 /api/v1/*（由 Nginx 转发）。
      // 本地 pnpm dev：默认打本机 Go 后端。可用 API_BASE 覆盖。
      // 不要默认写成 /api：接口路径已含 /api/v1，再拼会变成 /api/api/v1。
      apiBase: process.env.API_BASE ?? (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:8080'),
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
