import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'happy-dom',
    globals: true,
    include: [
      'utils/**/*.spec.ts',
      'utils/**/*.test.ts',
      'composables/__tests__/**/*.spec.ts',
      'composables/__tests__/**/*.test.ts',
      'components/**/*.spec.ts',
      'components/**/*.test.ts',
      'pages/**/*.spec.ts',
      'pages/**/*.test.ts',
    ],
    exclude: [
      'node_modules/**',
      'dist/**',
      '.nuxt/**',
      '.output/**',
      'coverage/**',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        'dist/**',
        '.nuxt/**',
        '.output/**',
        'coverage/**',
        '**/*.d.ts',
        '**/*.config.*',
      ],
    },
  },
})
