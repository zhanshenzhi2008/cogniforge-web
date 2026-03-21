<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-header">
        <h1>CogniForge</h1>
        <p>AI Agent Platform</p>
      </div>
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        class="login-form"
      >
        <el-form-item prop="email">
          <el-input
            v-model="form.email"
            placeholder="邮箱"
            size="large"
            :prefix-icon="Message"
          />
        </el-form-item>
        <el-form-item prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="密码"
            size="large"
            :prefix-icon="Lock"
            show-password
            @keyup.enter="handleLogin"
          />
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            size="large"
            :loading="loading"
            style="width: 100%"
            @click="handleLogin"
          >
            登录
          </el-button>
        </el-form-item>
        <div class="login-footer">
          <el-link type="primary" @click="$router.push('/register')">
            还没有账号？立即注册
          </el-link>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Message, Lock } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'

definePageMeta({
  layout: 'false'
})

const router = useRouter()
const formRef = ref<FormInstance>()
const loading = ref(false)

const form = reactive({
  email: '',
  password: ''
})

const rules: FormRules = {
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少6位', trigger: 'blur' }
  ]
}

const handleLogin = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        const { post } = useApi()
        const res = await post<AuthResponse>('/api/v1/auth/login', form)

        if (res.data) {
          const token = useCookie('token')
          token.value = res.data.token

          const user = useCookie('user')
          user.value = res.data.user

          ElMessage.success('登录成功')
          router.push('/')
        } else if (res.error) {
          ElMessage.error(res.error)
        }
      } catch (error: any) {
        ElMessage.error(error.data?.error || error.data?.message || '登录失败')
      } finally {
        loading.value = false
      }
    }
  })
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
.login-box {
  width: 400px;
  padding: 40px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}
.login-header {
  text-align: center;
  margin-bottom: 32px;
}
.login-header h1 {
  font-size: 28px;
  font-weight: 600;
  color: #409eff;
}
.login-header p {
  font-size: 14px;
  color: #909399;
  margin-top: 8px;
}
.login-form {
  margin-top: 20px;
}
.login-footer {
  text-align: center;
  margin-top: 16px;
}
</style>
