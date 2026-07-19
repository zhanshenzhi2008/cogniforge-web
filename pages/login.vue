<template>
  <div class="login-page">
    <div class="login-card">
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
        <h1 class="title">CogniForge</h1>
        <p class="subtitle">AI Agent Platform</p>
      </div>

      <n-form
        ref="formRef"
        :model="form"
        :rules="rules"
        size="large"
      >
        <n-form-item path="account" :show-feedback="false">
          <n-input
            v-model:value="form.account"
            placeholder="邮箱 / 用户名"
            @keyup.enter="handleLogin"
          >
            <template #prefix>
              <n-icon :component="PersonOutline" />
            </template>
          </n-input>
        </n-form-item>

        <n-form-item path="password" :show-feedback="false">
          <n-input
            v-model:value="form.password"
            type="password"
            placeholder="密码"
            show-password-on="mousedown"
            @keyup.enter="handleLogin"
          >
            <template #prefix>
              <n-icon :component="LockClosedOutline" />
            </template>
          </n-input>
        </n-form-item>

        <n-button
          type="primary"
          block
          secondary
          :loading="loading"
          :disabled="loading"
          @click="handleLogin"
        >
          登录
        </n-button>
      </n-form>

      <div class="card-footer">
        <n-text depth="3">还没有账号？</n-text>
        <n-button text type="primary" @click="navigateTo('/register')">
          立即注册
        </n-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useMessage } from 'naive-ui'
import { PersonOutline, LockClosedOutline } from '@vicons/ionicons5'

definePageMeta({
  layout: 'auth',
})

const message = useMessage()
const router = useRouter()
const { setAuth } = useAuth()

const formRef = ref()
const loading = ref(false)

const form = reactive({
  account: '',
  password: '',
})

const rules: Record<string, Record<string, unknown>[]> = {
  account: [{ required: true, message: '请输入邮箱或用户名', trigger: 'blur' }],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少 6 位', trigger: 'blur' },
  ],
}

const handleLogin = async () => {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch {
    return
  }

  loading.value = true
  try {
    const { post } = useApi()
    const isEmail = form.account.includes('@')
    const payload = isEmail
      ? { email: form.account, password: form.password }
      : { username: form.account, password: form.password }
    const res = await post<{ token: string; user: any }>('/api/v1/auth/login', payload)

    if (res.error) {
      message.error(res.error)
      return
    }

    if (res.data) {
      setAuth(res.data.token, res.data.user)
      message.success('登录成功')
      router.push('/')
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 24px;
}

.login-card {
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
