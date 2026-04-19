<template>
  <div class="section-container">
    <div class="section-header">
      <h2 class="section-title">偏好设置</h2>
      <p class="section-desc">自定义您的使用偏好和界面显示</p>
    </div>

    <!-- 主题设置 -->
    <div class="content-card">
      <div class="setting-item">
        <div class="setting-info">
          <span class="setting-label">外观主题</span>
          <span class="setting-hint">选择您喜欢的界面配色</span>
        </div>
        <div class="theme-selector">
          <div
            v-for="option in themeOptions"
            :key="option.value"
            class="theme-option"
            :class="{ active: currentTheme === option.value }"
            @click="handleThemeChange(option.value)"
          >
            <div class="theme-preview" :class="option.value">
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
          </div>
        </div>
      </div>
    </div>

    <!-- 语言设置 -->
    <div class="content-card">
      <div class="setting-item">
        <div class="setting-info">
          <span class="setting-label">界面语言</span>
        </div>
        <n-select
          v-model:value="currentLanguage"
          :options="languageOptions"
          size="small"
          style="width: 160px"
        />
      </div>
    </div>

    <!-- 时区设置 -->
    <div class="content-card">
      <div class="setting-item">
        <div class="setting-info">
          <span class="setting-label">时区</span>
        </div>
        <n-select
          v-model:value="currentTimezone"
          :options="timezoneOptions"
          size="small"
          style="width: 200px"
          filterable
        />
      </div>
    </div>

    <!-- 通知设置 -->
    <div class="content-card">
      <div class="setting-item">
        <div class="setting-info">
          <span class="setting-label">邮件通知</span>
          <span class="setting-hint">接收重要更新邮件</span>
        </div>
        <n-switch v-model:value="emailNotifications" size="small" />
      </div>
      <div class="setting-item">
        <div class="setting-info">
          <span class="setting-label">浏览器通知</span>
          <span class="setting-hint">实时推送消息通知</span>
        </div>
        <n-switch v-model:value="browserNotifications" size="small" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { NSelect, NSwitch } from 'naive-ui'

const message = useMessage()

const currentTheme = ref('light')
const currentLanguage = ref('zh-CN')
const currentTimezone = ref('Asia/Shanghai')
const emailNotifications = ref(true)
const browserNotifications = ref(false)

const themeOptions = [
  { value: 'light', label: '浅色' },
  { value: 'dark', label: '深色' },
  { value: 'auto', label: '自动' },
]

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

const handleThemeChange = (theme: string) => {
  currentTheme.value = theme
  message.success('主题已切换')
}

onMounted(async () => {
  try {
    const data = await $fetch('/api/v1/settings')
    if (data) {
      currentTheme.value = (data as any).theme || 'light'
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
  color: #0f172a;
  margin: 0 0 4px 0;
}

.section-desc {
  font-size: 13px;
  color: #64748b;
  margin: 0;
}

.content-card {
  background: #ffffff;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
  margin-bottom: 12px;
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
}

.setting-item:not(:last-child) {
  border-bottom: 1px solid #f1f5f9;
}

.setting-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.setting-label {
  font-size: 14px;
  font-weight: 500;
  color: #0f172a;
}

.setting-hint {
  font-size: 12px;
  color: #64748b;
}

/* 主题选择器 */
.theme-selector {
  display: flex;
  gap: 12px;
}

.theme-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.theme-option:hover {
  opacity: 0.8;
}

.theme-option.active .theme-preview {
  box-shadow: 0 0 0 2px #4f46e5;
}

.theme-option.active .theme-label {
  color: #4f46e5;
  font-weight: 500;
}

.theme-preview {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  overflow: hidden;
  width: 52px;
  height: 40px;
  transition: all 0.2s ease;
}

.theme-preview.light {
  background: #ffffff;
}

.theme-preview.light .preview-header {
  background: #ffffff;
  border-bottom: 1px solid #e5e7eb;
}

.theme-preview.light .preview-sidebar {
  background: #f9fafb;
}

.theme-preview.dark {
  background: #1f2937;
}

.theme-preview.dark .preview-header {
  background: #1f2937;
  border-bottom: 1px solid #374151;
}

.theme-preview.dark .preview-sidebar {
  background: #111827;
}

.theme-preview.dark .preview-line {
  background: #4b5563;
}

.theme-preview.auto {
  background: linear-gradient(135deg, #ffffff 50%, #1f2937 50%);
}

.preview-header {
  height: 8px;
}

.preview-content {
  display: flex;
  height: calc(100% - 8px);
}

.preview-sidebar {
  width: 30%;
  border-right: 1px solid #e5e7eb;
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
  background: #e5e7eb;
  border-radius: 2px;
}

.preview-line.short {
  width: 60%;
}

.theme-label {
  font-size: 12px;
  color: #64748b;
}
</style>
