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
      include: ssrNaive ? [] : ['naive-ui'],
    },
    ssr: {
      noExternal: ssrNaive ? ['naive-ui'] : [],
    },
    server: {
      port: 3000,
      strictPort: true,
    },
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
      apiBase: process.env.API_BASE || 'http://localhost:8080',
      ssrNaive,
    },
  },

  typescript: {
    strict: true,
    typeCheck: false,
  },

})
