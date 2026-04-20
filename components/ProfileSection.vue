<template>
  <div class="section-container">
    <div class="section-header">
      <h2 class="section-title">个人资料</h2>
      <p class="section-desc">管理您的个人信息和公开资料</p>
    </div>

    <div class="content-card">
      <!-- 头像区域 -->
      <div class="avatar-section">
        <div class="avatar-wrapper">
          <n-avatar
            :size="64"
            round
            :src="form.avatar_url || undefined"
            class="user-avatar"
          >
            <span class="avatar-fallback">{{ form.name?.charAt(0)?.toUpperCase() || 'U' }}</span>
          </n-avatar>
          <div class="avatar-overlay" @click="triggerUpload">
            <n-icon :component="CameraOutline" />
          </div>
        </div>
        <div class="avatar-info">
          <h4>您的头像</h4>
          <p>点击头像上传新照片</p>
        </div>
      </div>

      <!-- 隐藏的文件上传 -->
      <n-upload
        ref="uploadRef"
        :custom-request="handleAvatarUpload"
        :show-file-list="false"
        accept="image/*"
        :max-file-size="2 * 1024 * 1024"
      >
        <button ref="uploadTrigger" style="display: none;"></button>
      </n-upload>

      <!-- 基本信息表单 -->
      <div class="form-section">
        <div class="form-row">
          <label class="form-label">姓名 <span class="required">*</span></label>
          <n-input
            v-model:value="form.name"
            placeholder="请输入您的姓名"
            size="small"
            :status="nameError ? 'error' : undefined"
            @blur="validateName"
          />
          <span v-if="nameError" class="error-text">{{ nameError }}</span>
        </div>

        <div class="form-row">
          <label class="form-label">邮箱</label>
          <n-input
            v-model:value="form.email"
            disabled
            size="small"
          />
          <span class="hint-text">邮箱地址不可修改</span>
        </div>

        <div class="form-row">
          <label class="form-label">账户类型</label>
          <div class="role-display">
            <n-tag :type="form.role === 'admin' ? 'error' : 'info'" size="small" round>
              <template #icon>
                <n-icon :component="form.role === 'admin' ? ShieldCheckmarkOutline : PersonOutline" />
              </template>
              {{ form.role === 'admin' ? '管理员' : '普通用户' }}
            </n-tag>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="form-actions">
        <n-button size="small" @click="resetForm" :disabled="loading">
          重置
        </n-button>
        <n-button type="primary" size="small" @click="handleSubmit" :loading="loading">
          保存更改
        </n-button>
      </div>
    </div>

    <!-- 危险区域 -->
    <div class="content-card danger-zone">
      <div class="danger-header">
        <div class="danger-info">
          <h4>危险区域</h4>
          <p>以下操作不可逆，请谨慎操作</p>
        </div>
      </div>
      <div class="danger-actions">
        <div class="danger-item">
          <div class="danger-item-info">
            <h5>注销账户</h5>
            <p>永久删除您的账户和所有相关数据</p>
          </div>
          <n-button type="error" ghost disabled size="small">
            暂未开放
          </n-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { CameraOutline, ShieldCheckmarkOutline, PersonOutline } from '@vicons/ionicons5'
import { NIcon } from 'naive-ui'

const message = useMessage()
const { user, fetchUser } = useAuth()

const loading = ref(false)
const uploadRef = ref()
const uploadTrigger = ref()
const nameError = ref('')

const form = reactive({
  id: '',
  name: '',
  email: '',
  avatar_url: '',
  role: 'user',
})

const validateName = () => {
  if (!form.name?.trim()) {
    nameError.value = '请输入姓名'
    return false
  }
  if (form.name.length < 2) {
    nameError.value = '姓名长度不能少于2个字符'
    return false
  }
  nameError.value = ''
  return true
}

const triggerUpload = () => {
  uploadTrigger.value?.click()
}

const handleAvatarUpload = async (options: any) => {
  const { file, onFinish, onError } = options
  loading.value = true

  try {
    const formData = new FormData()
    formData.append('avatar', file.file)

    const response = await $fetch('/api/v1/settings/avatar', {
      method: 'POST',
      body: formData,
    })

    if (response?.avatar_url) {
      form.avatar_url = response.avatar_url
      message.success('头像上传成功')
      await fetchUser()
    }
    onFinish()
  } catch (error: any) {
    message.error(error.data?.message || '头像上传失败')
    onError()
  } finally {
    loading.value = false
  }
}

const handleSubmit = async () => {
  if (!validateName()) return

  loading.value = true
  try {
    await $fetch('/api/v1/auth/me', {
      method: 'PUT',
      body: {
        name: form.name,
        avatar_url: form.avatar_url,
      },
    })

    message.success('个人资料已更新')
    await fetchUser()
  } catch (error: any) {
    message.error(error.data?.message || '更新失败')
  } finally {
    loading.value = false
  }
}

const resetForm = () => {
  if (user.value) {
    form.name = user.value.name
    form.email = user.value.email
    form.avatar_url = user.value.avatar_url || ''
    form.role = user.value.role || 'user'
  }
  nameError.value = ''
}

onMounted(() => {
  if (user.value) {
    form.id = user.value.id
    form.name = user.value.name
    form.email = user.value.email
    form.avatar_url = user.value.avatar_url || ''
    form.role = user.value.role || 'user'
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

.avatar-section {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border-bottom: 1px solid #f1f5f9;
}

.avatar-wrapper {
  position: relative;
  flex-shrink: 0;
}

.user-avatar {
  border: 2px solid #f1f5f9;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.avatar-wrapper:hover .user-avatar {
  transform: scale(1.02);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.avatar-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s ease;
  cursor: pointer;
}

.avatar-overlay :deep(.n-icon) {
  font-size: 20px;
  color: #ffffff;
}

.avatar-wrapper:hover .avatar-overlay {
  opacity: 1;
}

.avatar-fallback {
  font-size: 24px;
  font-weight: 600;
  color: #64748b;
}

.avatar-info h4 {
  font-size: 13px;
  font-weight: 600;
  color: #0f172a;
  margin: 0 0 2px 0;
}

.avatar-info p {
  font-size: 12px;
  color: #64748b;
  margin: 0;
}

.form-section {
  padding: 16px;
}

.form-row {
  margin-bottom: 12px;
}

.form-row:last-child {
  margin-bottom: 0;
}

.form-label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 6px;
}

.required {
  color: #ef4444;
}

.hint-text {
  font-size: 11px;
  color: #94a3b8;
  margin-top: 4px;
  display: block;
}

.error-text {
  font-size: 11px;
  color: #ef4444;
  margin-top: 4px;
  display: block;
}

.role-display {
  padding-top: 4px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 16px;
  background: #f8fafc;
  border-top: 1px solid #f1f5f9;
}

.danger-zone {
  border-color: #fecaca;
  background: #fef2f2;
}

.danger-header {
  padding: 14px 16px;
  border-bottom: 1px solid #fecaca;
}

.danger-header h4 {
  font-size: 13px;
  font-weight: 600;
  color: #991b1b;
  margin: 0 0 2px 0;
}

.danger-header p {
  font-size: 12px;
  color: #b91c1c;
  margin: 0;
}

.danger-actions {
  padding: 14px 16px;
}

.danger-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.danger-item-info h5 {
  font-size: 13px;
  font-weight: 500;
  color: #7f1d1d;
  margin: 0 0 2px 0;
}

.danger-item-info p {
  font-size: 12px;
  color: #991b1b;
  margin: 0;
}
</style>
