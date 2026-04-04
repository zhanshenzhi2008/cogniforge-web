<template>
  <div class="register-page">
    <div class="register-card">
      <div class="card-header">
        <div class="logo-mark">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="8" fill="url(#logoGrad)"/>
            <path d="M10 16L14 20L22 12" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
            <defs>
              <linearGradient id="logoGrad" x1="0" y1="0" x2="32" y2="32">
                <stop stop-color="#6366f1"/>
                <stop offset="1" stop-color="#8b5cf6"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
        <h1 class="title">创建账号</h1>
        <p class="subtitle">开始使用 CogniForge</p>
      </div>

      <n-form
        ref="formRef"
        :model="form"
        :rules="rules"
        size="large"
      >
        <n-form-item path="name" :show-feedback="false">
          <n-input
            v-model:value="form.name"
            placeholder="用户名"
          >
            <template #prefix>
              <n-icon :component="PersonOutline" />
            </template>
          </n-input>
        </n-form-item>

        <n-form-item path="email" :show-feedback="false">
          <n-input
            v-model:value="form.email"
            placeholder="邮箱"
          >
            <template #prefix>
              <n-icon :component="MailOutline" />
            </template>
          </n-input>
        </n-form-item>

        <n-form-item path="password" :show-feedback="false">
          <n-input
            v-model:value="form.password"
            type="password"
            placeholder="密码"
            show-password-on="mousedown"
          >
            <template #prefix>
              <n-icon :component="LockClosedOutline" />
            </template>
          </n-input>
        </n-form-item>

        <n-form-item path="confirmPassword" :show-feedback="false">
          <n-input
            v-model:value="form.confirmPassword"
            type="password"
            placeholder="确认密码"
            show-password-on="mousedown"
            @keyup.enter="handleRegister"
          >
            <template #prefix>
              <n-icon :component="ShieldCheckmarkOutline" />
            </template>
          </n-input>
        </n-form-item>

        <n-button
          type="primary"
          block
          secondary
          :loading="loading"
          :disabled="loading"
          @click="handleRegister"
        >
          注册
        </n-button>
      </n-form>

      <div class="card-footer">
        <n-text depth="3">已有账号？</n-text>
        <n-button text type="primary" @click="navigateTo('/login')">
          立即登录
        </n-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PersonOutline, MailOutline, LockClosedOutline, ShieldCheckmarkOutline } from '@vicons/ionicons5'
import { useMessage } from 'naive-ui'

definePageMeta({
  layout: 'auth',
})

const message = useMessage()
const { setAuth } = useAuth()

const formRef = ref()
const loading = ref(false)

const form = reactive({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
})

const validateConfirmPassword = (_rule: unknown, value: string) => {
  if (value !== form.password) {
    return new Error('两次输入的密码不一致')
  }
  return true
}

const rules: Record<string, Record<string, unknown>[]> = {
  name: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 20, message: '用户名长度在 2 到 20 个字符', trigger: 'blur' },
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少 6 位', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' },
  ],
}

const handleRegister = async () => {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch {
    return
  }

  loading.value = true
  try {
    const { post } = useApi()
    const res = await post<{ token: string; user: any }>('/api/v1/auth/register', {
      email: form.email,
      password: form.password,
      name: form.name,
    })

    if (res.error) {
      message.error(res.error)
      return
    }

    if (res.data) {
      setAuth(res.data.token, res.data.user)
      message.success('注册成功')
      navigateTo('/')
    }
  } catch (error: any) {
    message.error(error.data?.error || error.data?.message || '注册失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.register-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 24px;
}

.register-card {
  width: 100%;
  max-width: 400px;
  padding: 40px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
}

.card-header {
  text-align: center;
  margin-bottom: 32px;
}

.logo-mark {
  display: inline-flex;
  margin-bottom: 12px;
}

.title {
  font-size: 26px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 4px;
  letter-spacing: -0.01em;
}

.subtitle {
  font-size: 13px;
  color: #64748b;
  margin: 0;
}

.card-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-top: 24px;
}
</style>
