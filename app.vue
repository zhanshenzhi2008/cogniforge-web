<template>
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

<script setup lang="ts">
import { naiveAppThemeOverrides } from '~/composables/naiveTheme'
</script>
