<template>
  <UDropdownMenu :items="menuItems">
    <UButton
      color="neutral"
      variant="ghost"
      icon="i-lucide-languages"
      size="sm"
      class="cf-icon-btn"
      :aria-label="t('locale.switch')"
    />
  </UDropdownMenu>
</template>

<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

const { locale, locales, t, setLocale } = useLocale()
const toast = useToast()

const menuItems = computed<DropdownMenuItem[]>(() =>
  locales.map((item) => ({
    label: item.nativeLabel,
    type: 'checkbox' as const,
    checked: locale.value === item.code,
    onSelect: (e: Event) => {
      e.preventDefault()
      setLocale(item.code)
      toast.add({ title: t('locale.changed'), color: 'success' })
    },
  })),
)
</script>
