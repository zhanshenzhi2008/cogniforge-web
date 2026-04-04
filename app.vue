<template>
  <!--
    SSR mode: @bg-dev/nuxt-naiveui provides <naive-config> which:
      - auto-imports all Naive UI components (no manual registration needed)
      - injects CSS-in-JS styles into <head> during SSR
      - provides theme/theme-overrides to all descendant components
      - includes spaLoadingTemplate while client hydrates

    Client-only mode: manual n-config-provider + providers,
      keeps the lightweight no-module setup for pure SPA.
  -->
  <template v-if="ssrNaive">
    <naive-config :theme="undefined" :theme-overrides="naiveAppThemeOverrides">
      <NuxtLayout>
        <NuxtPage />
      </NuxtLayout>
    </naive-config>
  </template>
  <template v-else>
    <n-config-provider :theme-overrides="naiveAppThemeOverrides">
      <n-message-provider>
        <n-dialog-provider>
          <NuxtLayout>
            <NuxtPage />
          </NuxtLayout>
        </n-dialog-provider>
      </n-message-provider>
    </n-config-provider>
  </template>
</template>

<script setup lang="ts">
import { useMessage, useDialog } from 'naive-ui'
import { naiveAppThemeOverrides } from '~/composables/naiveTheme'

// Build-time constant — mirrors ssrNaive from nuxt.config.ts.
// Changing ssrNaive in nuxt.config.ts automatically reflects here.
const ssrNaive = false

// Provide useMessage / useDialog to all components via app-level injection
const nuxtApp = useNuxtApp()
nuxtApp.vueApp.provide('message', useMessage(nuxtApp.vueApp))
nuxtApp.vueApp.provide('dialog', useDialog(nuxtApp.vueApp))
</script>
