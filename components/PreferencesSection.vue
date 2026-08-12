<template>
  <div class="section-container">
    <div class="section-header">
      <h2 class="section-title font-display">偏好设置</h2>
      <p class="section-desc">自定义您的使用偏好和界面显示</p>
    </div>

    <div class="content-card cf-surface">
      <div class="setting-item setting-item--column">
        <div class="setting-info">
          <span class="setting-label">外观主题</span>
          <span class="setting-hint">选择极光 / 墨夜 / 青柠 / 玻璃四种配色</span>
        </div>
        <div class="theme-selector">
          <button
            v-for="option in themes"
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
          <span class="setting-label">界面语言</span>
        </div>
        <USelect
          v-model="currentLanguage"
          class="w-40"
          size="sm"
          :items="languageOptions"
        />
      </div>
    </div>

    <div class="content-card cf-surface">
      <div class="setting-item">
        <div class="setting-info">
          <span class="setting-label">时区</span>
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
          <span class="setting-label">邮件通知</span>
          <span class="setting-hint">接收重要更新邮件</span>
        </div>
        <USwitch v-model="emailNotifications" size="sm" />
      </div>
      <div class="setting-item">
        <div class="setting-info">
          <span class="setting-label">浏览器通知</span>
          <span class="setting-hint">实时推送消息通知</span>
        </div>
        <USwitch v-model="browserNotifications" size="sm" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CfThemeId } from '~/composables/useTheme'

const toast = useToast()
const { theme, themes, setTheme } = useTheme()

const currentLanguage = ref('zh-CN')
const currentTimezone = ref('Asia/Shanghai')
const emailNotifications = ref(true)
const browserNotifications = ref(false)

const languageOptions = [
  { label: '简体中文', value: 'zh-CN' },
  { label: 'English', value: 'en-US' },
]

const timezoneOptions = [
  { label: 'Asia/Shanghai (UTC+8)', value: 'Asia/Shanghai' },
  { label: 'Asia/Tokyo (UTC+9)', value: 'Asia/Tokyo' },
  { label: 'America/New_York (UTC-5)', value: 'America/New_York' },
  { label: 'Europe/London (UTC+0)', value: 'Europe/London' },
]

const handleThemeChange = (id: CfThemeId) => {
  setTheme(id)
  toast.add({ title: '主题已切换', color: 'success' })
}

onMounted(async () => {
  try {
    const data = await $fetch('/api/v1/settings')
    if (data) {
      currentLanguage.value = (data as any).language || 'zh-CN'
      currentTimezone.value = (data as any).timezone || 'Asia/Shanghai'
    }
  } catch {
    // 使用默认值
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

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--cf-ink);
  margin: 0 0 4px 0;
}

.section-desc {
  font-size: 13px;
  color: var(--cf-ink-soft);
  margin: 0;
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
