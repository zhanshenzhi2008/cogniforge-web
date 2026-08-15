<template>
  <div class="section-container">
    <div class="section-header">
      <h2 class="cf-section-title">Profile</h2>
      <p class="cf-section-desc">Your name, avatar, and public details.</p>
    </div>

    <div class="content-card cf-surface">
      <div class="avatar-section">
        <div class="avatar-wrapper">
          <UAvatar
            :src="form.avatar_url || undefined"
            :alt="form.name || '用户'"
            size="3xl"
            :text="form.name?.charAt(0)?.toUpperCase() || 'U'"
            class="user-avatar"
          />
          <div class="avatar-overlay" @click="triggerUpload">
            <UIcon name="i-lucide-camera" class="size-5 text-white" />
          </div>
        </div>
        <div class="avatar-info">
          <h4>您的头像</h4>
          <p>点击头像上传新照片</p>
        </div>
      </div>

      <input
        ref="fileInputRef"
        type="file"
        accept="image/*"
        class="hidden-input"
        @change="handleAvatarChange"
      >

      <div class="form-section">
        <div class="form-row">
          <label class="form-label">姓名 <span class="required">*</span></label>
          <UInput
            v-model="form.name"
            class="w-full"
            placeholder="请输入您的姓名"
            size="sm"
            :color="nameError ? 'error' : 'neutral'"
            @blur="validateName"
          />
          <span v-if="nameError" class="error-text">{{ nameError }}</span>
        </div>

        <div class="form-row">
          <label class="form-label">邮箱</label>
          <UInput
            v-model="form.email"
            class="w-full"
            disabled
            size="sm"
          />
          <span class="hint-text">邮箱地址不可修改</span>
        </div>

        <div class="form-row">
          <label class="form-label">账户类型</label>
          <div class="role-display">
            <UBadge
              size="sm"
              variant="subtle"
              :color="form.role === 'admin' ? 'error' : 'info'"
              :icon="form.role === 'admin' ? 'i-lucide-shield-check' : 'i-lucide-user'"
            >
              {{ form.role === 'admin' ? '管理员' : '普通用户' }}
            </UBadge>
          </div>
        </div>
      </div>

      <div class="form-actions">
        <UButton color="neutral" variant="outline" size="sm" :disabled="loading" @click="resetForm">
          重置
        </UButton>
        <UButton color="primary" size="sm" :loading="loading" @click="handleSubmit">
          保存更改
        </UButton>
      </div>
    </div>

    <div class="content-card danger-zone cf-surface">
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
          <UButton color="error" variant="outline" size="sm" disabled>
            暂未开放
          </UButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const toast = useToast()
const { user, fetchUser } = useAuth()

const loading = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)
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
  fileInputRef.value?.click()
}

const handleAvatarChange = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  if (file.size > 2 * 1024 * 1024) {
    toast.add({ title: '图片大小不能超过 2MB', color: 'error' })
    input.value = ''
    return
  }

  loading.value = true
  try {
    const formData = new FormData()
    formData.append('avatar', file)

    const response = await $fetch<{ avatar_url?: string }>('/api/v1/settings/avatar', {
      method: 'POST',
      body: formData,
    })

    if (response?.avatar_url) {
      form.avatar_url = response.avatar_url
      toast.add({ title: '头像上传成功', color: 'success' })
      await fetchUser()
    }
  } catch (error: any) {
    toast.add({ title: error.data?.message || '头像上传失败', color: 'error' })
  } finally {
    loading.value = false
    input.value = ''
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

    toast.add({ title: '个人资料已更新', color: 'success' })
    await fetchUser()
  } catch (error: any) {
    toast.add({ title: error.data?.message || '更新失败', color: 'error' })
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

.content-card {
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 12px;
}

.avatar-section {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border-bottom: 1px solid var(--cf-line);
}

.avatar-wrapper {
  position: relative;
  flex-shrink: 0;
}

.user-avatar {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.avatar-wrapper:hover .user-avatar {
  transform: scale(1.02);
  box-shadow: 0 4px 12px color-mix(in oklab, var(--cf-ink) 12%, transparent);
}

.avatar-overlay {
  position: absolute;
  inset: 0;
  background: rgb(0 0 0 / 0.5);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s ease;
  cursor: pointer;
}

.avatar-wrapper:hover .avatar-overlay {
  opacity: 1;
}

.avatar-info h4 {
  font-size: 13px;
  font-weight: 600;
  color: var(--cf-ink);
  margin: 0 0 2px 0;
}

.avatar-info p {
  font-size: 12px;
  color: var(--cf-ink-soft);
  margin: 0;
}

.hidden-input {
  display: none;
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
  color: var(--cf-ink);
  margin-bottom: 6px;
}

.required {
  color: var(--cf-danger);
}

.hint-text {
  font-size: 11px;
  color: var(--cf-ink-soft);
  margin-top: 4px;
  display: block;
}

.error-text {
  font-size: 11px;
  color: var(--cf-danger);
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
  background: color-mix(in oklab, var(--cf-bg-muted) 60%, transparent);
  border-top: 1px solid var(--cf-line);
}

.danger-zone {
  border-color: color-mix(in oklab, var(--cf-danger) 35%, var(--cf-line));
  background: color-mix(in oklab, var(--cf-danger) 8%, var(--cf-bg-elevated));
}

.danger-header {
  padding: 14px 16px;
  border-bottom: 1px solid color-mix(in oklab, var(--cf-danger) 25%, var(--cf-line));
}

.danger-header h4 {
  font-size: 13px;
  font-weight: 600;
  color: var(--cf-danger);
  margin: 0 0 2px 0;
}

.danger-header p {
  font-size: 12px;
  color: color-mix(in oklab, var(--cf-danger) 80%, var(--cf-ink-soft));
  margin: 0;
}

.danger-actions {
  padding: 14px 16px;
}

.danger-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.danger-item-info h5 {
  font-size: 13px;
  font-weight: 500;
  color: var(--cf-danger);
  margin: 0 0 2px 0;
}

.danger-item-info p {
  font-size: 12px;
  color: color-mix(in oklab, var(--cf-danger) 75%, var(--cf-ink-soft));
  margin: 0;
}
</style>
