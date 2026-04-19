<template>
  <div class="section-container">
    <div class="section-header">
      <h2 class="section-title">安全设置</h2>
      <p class="section-desc">管理您的账户密码和安全选项</p>
    </div>

    <!-- 密码修改卡片 -->
    <div class="content-card">
      <div class="card-header">
        <div class="card-icon password-icon">
          <n-icon :component="KeyOutline" />
        </div>
        <div class="card-title-area">
          <h3>修改密码</h3>
          <p>定期更换密码可以提高账户安全性</p>
        </div>
      </div>

      <div class="card-body">
        <div class="form-row">
          <label class="form-label">当前密码</label>
          <n-input
            v-model:value="form.old_password"
            type="password"
            placeholder="请输入当前密码"
            show-password-on="click"
            size="small"
            @keyup.enter="handleSubmit"
          />
        </div>

        <div class="form-row">
          <label class="form-label">新密码</label>
          <n-input
            v-model:value="form.new_password"
            type="password"
            placeholder="请输入新密码"
            show-password-on="click"
            size="small"
          />
          <div class="password-strength-wrapper" v-if="form.new_password">
            <PasswordStrength :password="form.new_password" />
          </div>
        </div>

        <div class="form-row">
          <label class="form-label">确认密码</label>
          <n-input
            v-model:value="form.confirm_password"
            type="password"
            placeholder="请再次输入新密码"
            show-password-on="click"
            size="small"
            @keyup.enter="handleSubmit"
          />
        </div>

        <div class="password-requirements" v-if="!isFormValid && form.new_password">
          <div class="requirement" :class="{ met: meetsLength }">
            <n-icon :component="meetsLength ? CheckmarkCircle : CloseCircleOutline" />
            <span>8+字符</span>
          </div>
          <div class="requirement" :class="{ met: meetsUpper }">
            <n-icon :component="meetsUpper ? CheckmarkCircle : CloseCircleOutline" />
            <span>大写</span>
          </div>
          <div class="requirement" :class="{ met: meetsLower }">
            <n-icon :component="meetsLower ? CheckmarkCircle : CloseCircleOutline" />
            <span>小写</span>
          </div>
          <div class="requirement" :class="{ met: meetsNumber }">
            <n-icon :component="meetsNumber ? CheckmarkCircle : CloseCircleOutline" />
            <span>数字</span>
          </div>
          <div class="requirement" :class="{ met: meetsSpecial }">
            <n-icon :component="meetsSpecial ? CheckmarkCircle : CloseCircleOutline" />
            <span>特殊字符</span>
          </div>
        </div>
      </div>

      <div class="card-footer">
        <n-button
          type="primary"
          size="small"
          :loading="loading"
          :disabled="!canSubmit"
          @click="handleSubmit"
        >
          更新密码
        </n-button>
      </div>
    </div>

    <!-- 双因素认证卡片 -->
    <div class="content-card disabled-card">
      <div class="card-header">
        <div class="card-icon tfa-icon">
          <n-icon :component="ShieldCheckmarkOutline" />
        </div>
        <div class="card-title-area">
          <h3>双因素认证</h3>
          <p>启用后登录需要额外的验证码，增强账户安全</p>
        </div>
        <n-tag type="warning" size="small">暂未开放</n-tag>
      </div>
    </div>

    <!-- 活跃会话卡片 -->
    <div class="content-card">
      <div class="card-header clickable" @click="goToSessions">
        <div class="card-icon sessions-icon">
          <n-icon :component="LaptopOutline" />
        </div>
        <div class="card-title-area">
          <h3>活跃会话</h3>
          <p>查看和管理您登录的设备</p>
        </div>
        <n-button quaternary type="primary" size="tiny">
          查看全部
          <template #icon>
            <n-icon :component="ChevronForwardOutline" />
          </template>
        </n-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  KeyOutline,
  ShieldCheckmarkOutline,
  LaptopOutline,
  ChevronForwardOutline,
  CheckmarkCircle,
  CloseCircleOutline,
} from '@vicons/ionicons5'
import { NIcon } from 'naive-ui'

const router = useRouter()
const message = useMessage()

const loading = ref(false)

const form = reactive({
  old_password: '',
  new_password: '',
  confirm_password: '',
})

const meetsLength = computed(() => form.new_password.length >= 8)
const meetsUpper = computed(() => /[A-Z]/.test(form.new_password))
const meetsLower = computed(() => /[a-z]/.test(form.new_password))
const meetsNumber = computed(() => /[0-9]/.test(form.new_password))
const meetsSpecial = computed(() => /[^A-Za-z0-9]/.test(form.new_password))

const isFormValid = computed(() =>
  meetsLength.value &&
  meetsUpper.value &&
  meetsLower.value &&
  meetsNumber.value &&
  meetsSpecial.value
)

const canSubmit = computed(() =>
  form.old_password &&
  form.new_password &&
  form.confirm_password &&
  form.new_password === form.confirm_password &&
  isFormValid.value
)

const handleSubmit = async () => {
  if (!canSubmit.value) return

  loading.value = true
  try {
    await $fetch('/api/v1/settings/password', {
      method: 'POST',
      body: {
        old_password: form.old_password,
        new_password: form.new_password,
      },
    })

    message.success('密码修改成功，请使用新密码重新登录')

    form.old_password = ''
    form.new_password = ''
    form.confirm_password = ''

    setTimeout(() => {
      const { clearAuth } = useAuth()
      clearAuth()
      router.push('/login')
    }, 1500)
  } catch (error: any) {
    message.error(error.data?.message || '密码修改失败')
  } finally {
    loading.value = false
  }
}

const goToSessions = () => {
  router.push('/settings?section=sessions')
}
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

.disabled-card {
  opacity: 0.75;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border-bottom: 1px solid #f1f5f9;
}

.card-header.clickable {
  cursor: pointer;
  transition: background 0.15s ease;
}

.card-header.clickable:hover {
  background: #f8fafc;
}

.card-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.card-icon :deep(.n-icon) {
  font-size: 18px;
  color: #ffffff;
}

.password-icon {
  background: linear-gradient(135deg, #6366f1, #4f46e5);
}

.tfa-icon {
  background: linear-gradient(135deg, #f59e0b, #d97706);
}

.sessions-icon {
  background: linear-gradient(135deg, #10b981, #059669);
}

.card-title-area {
  flex: 1;
}

.card-title-area h3 {
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
  margin: 0;
}

.card-title-area p {
  font-size: 12px;
  color: #64748b;
  margin: 2px 0 0 0;
}

.card-body {
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

.password-strength-wrapper {
  margin-top: 8px;
}

.password-requirements {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding: 12px;
  background: #f8fafc;
  border-radius: 6px;
  margin-top: 12px;
}

.requirement {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #94a3b8;
}

.requirement.met {
  color: #10b981;
}

.requirement :deep(.n-icon) {
  font-size: 14px;
}

.card-footer {
  padding: 12px 16px;
  background: #f8fafc;
  border-top: 1px solid #f1f5f9;
  display: flex;
  justify-content: flex-end;
}
</style>
