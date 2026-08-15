<template>
  <div class="section-container">
    <div class="section-header">
      <h2 class="cf-section-title">{{ t('pref.title') }}</h2>
      <p class="cf-section-desc">{{ t('pref.sub') }}</p>
    </div>

    <div class="content-card cf-surface">
      <div class="setting-item setting-item--column">
        <div class="setting-info">
          <span class="setting-label">{{ t('pref.theme') }}</span>
          <span class="setting-hint">{{ t('pref.themeHint') }}</span>
        </div>
        <div class="theme-selector">
          <button
            v-for="option in themedThemes"
            :key="option.id"
            type="button"
            class="theme-option"
            :class="{ active: theme === option.id }"
            @click="handleThemeChange(option.id)"
          >
            <div class="theme-preview" :class="option.id">
              <div class="preview-header" />
              <div class="preview-content">
                <div class="preview-sidebar" />
                <div class="preview-main">
                  <div class="preview-line" />
                  <div class="preview-line short" />
                </div>
              </div>
            </div>
            <span class="theme-label">{{ option.label }}</span>
            <span class="theme-desc">{{ option.description }}</span>
          </button>
        </div>
      </div>
    </div>

    <div class="content-card cf-surface">
      <div class="setting-item">
        <div class="setting-info">
          <span class="setting-label">{{ t('pref.language') }}</span>
        </div>
          <USelect
            :model-value="locale"
            class="w-40"
            size="sm"
            :items="languageOptions"
            @update:model-value="onLanguageChange"
          />
      </div>
    </div>

    <div class="content-card cf-surface">
      <div class="setting-item">
        <div class="setting-info">
          <span class="setting-label">{{ t('pref.timezone') }}</span>
        </div>
        <USelect
          v-model="currentTimezone"
          class="w-52"
          size="sm"
          :items="timezoneOptions"
        />
      </div>
    </div>

    <div class="content-card cf-surface">
      <div class="setting-item">
        <div class="setting-info">
          <span class="setting-label">{{ t('pref.emailNotify') }}</span>
          <span class="setting-hint">{{ t('pref.emailHint') }}</span>
        </div>
        <USwitch v-model="emailNotifications" size="sm" />
      </div>
      <div class="setting-item">
        <div class="setting-info">
          <span class="setting-label">{{ t('pref.browserNotify') }}</span>
          <span class="setting-hint">{{ t('pref.browserHint') }}</span>
        </div>
        <USwitch v-model="browserNotifications" size="sm" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CfThemeId } from '~/composables/useTheme'
import type { LocaleCode } from '~/composables/useLocale'

const toast = useToast()
const { theme, themes, setTheme } = useTheme()
const { locale, locales, t, setLocale, applyFromSettings } = useLocale()

const currentTimezone = ref('Asia/Shanghai')
const emailNotifications = ref(true)
const browserNotifications = ref(false)

const themedThemes = computed(() =>
  themes.map((item) => ({
    ...item,
    label: t(`theme.${item.id}.label`),
    description: t(`theme.${item.id}.desc`),
  })),
)

const languageOptions = computed(() =>
  locales.map((item) => ({ label: item.nativeLabel, value: item.code })),
)

const timezoneOptions = [
  { label: 'Asia/Shanghai (UTC+8)', value: 'Asia/Shanghai' },
  { label: 'Asia/Tokyo (UTC+9)', value: 'Asia/Tokyo' },
  { label: 'America/New_York (UTC-5)', value: 'America/New_York' },
  { label: 'Europe/London (UTC+0)', value: 'Europe/London' },
]

const handleThemeChange = (id: CfThemeId) => {
  setTheme(id)
  toast.add({ title: t('theme.switched'), color: 'success' })
}

function onLanguageChange(value: string | number | boolean | undefined | null) {
  const code = String(value)
  if (code === 'zh-CN' || code === 'en-US') {
    setLocale(code as LocaleCode)
    toast.add({ title: t('locale.changed'), color: 'success' })
  }
}

onMounted(async () => {
  try {
    const { get } = useApi()
    const res = await get<{ language?: string; timezone?: string }>('/api/v1/settings')
    if (res.data?.language) applyFromSettings(res.data.language)
    if (res.data?.timezone) currentTimezone.value = res.data.timezone
  } catch {
    // keep local defaults
  }
})
</script>

<style scoped>
.section-container {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.section-header {
  margin-bottom: 16px;
}

.content-card {
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 12px;
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 20px;
}

.setting-item--column {
  flex-direction: column;
  align-items: stretch;
}

.setting-item:not(:last-child) {
  border-bottom: 1px solid var(--cf-line);
}

.setting-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.setting-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--cf-ink);
}

.setting-hint {
  font-size: 12px;
  color: var(--cf-ink-soft);
}

.theme-selector {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-top: 12px;
}

.theme-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  transition: opacity 0.2s ease;
  background: transparent;
  border: none;
  padding: 0;
}

.theme-option:hover {
  opacity: 0.85;
}

.theme-option.active .theme-preview {
  box-shadow: 0 0 0 2px var(--cf-accent);
}

.theme-option.active .theme-label {
  color: var(--cf-accent-ink);
  font-weight: 500;
}

.theme-preview {
  border: 1px solid var(--cf-line);
  border-radius: 6px;
  overflow: hidden;
  width: 100%;
  max-width: 72px;
  height: 48px;
  transition: box-shadow 0.2s ease;
}

.theme-preview.aurora {
  background: #eef7f8;
}

.theme-preview.aurora .preview-header {
  background: rgb(255 255 255 / 0.78);
  border-bottom: 1px solid rgb(18 21 26 / 0.1);
}

.theme-preview.aurora .preview-sidebar {
  background: #e4f1f2;
}

.theme-preview.aurora .preview-line {
  background: #0f9f8a;
}

.theme-preview.inknight {
  background: #0e1116;
}

.theme-preview.inknight .preview-header {
  background: rgb(22 27 34 / 0.92);
  border-bottom: 1px solid rgb(232 238 245 / 0.12);
}

.theme-preview.inknight .preview-sidebar {
  background: #1a222c;
}

.theme-preview.inknight .preview-line {
  background: #2ee6c7;
}

.theme-preview.citrus {
  background: #f3faf3;
}

.theme-preview.citrus .preview-header {
  background: rgb(255 255 255 / 0.88);
  border-bottom: 1px solid rgb(20 32 26 / 0.1);
}

.theme-preview.citrus .preview-sidebar {
  background: #e5f5e6;
}

.theme-preview.citrus .preview-line {
  background: #0d9f6e;
}

.theme-preview.glass {
  background: #f4f7fb;
}

.theme-preview.glass .preview-header {
  background: rgb(255 255 255 / 0.55);
  border-bottom: 1px solid rgb(18 21 26 / 0.1);
}

.theme-preview.glass .preview-sidebar {
  background: #e8eef6;
}

.theme-preview.glass .preview-line {
  background: #0f9f8a;
}

.preview-header {
  height: 10px;
}

.preview-content {
  display: flex;
  height: calc(100% - 10px);
}

.preview-sidebar {
  width: 30%;
  border-right: 1px solid rgb(18 21 26 / 0.08);
}

.preview-main {
  flex: 1;
  padding: 4px;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.preview-line {
  height: 4px;
  border-radius: 2px;
  opacity: 0.85;
}

.preview-line.short {
  width: 60%;
}

.theme-label {
  font-size: 12px;
  color: var(--cf-ink-soft);
}

.theme-desc {
  font-size: 10px;
  color: var(--cf-ink-soft);
  opacity: 0.8;
  text-align: center;
  line-height: 1.3;
}

@media (max-width: 720px) {
  .theme-selector {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
