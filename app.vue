<template>
  <UApp>
    <!-- 过渡期：业务页仍大量使用 Naive；壳层已切 Nuxt UI。P5 移除 Naive。 -->
    <n-config-provider :theme-overrides="naiveAppThemeOverrides">
      <n-message-provider>
        <n-dialog-provider>
          <NuxtLayout>
            <NuxtPage />
          </NuxtLayout>
        </n-dialog-provider>
      </n-message-provider>
    </n-config-provider>
  </UApp>
</template>

<script setup lang="ts">
import { naiveAppThemeOverrides } from '~/composables/naiveTheme'
</script>
