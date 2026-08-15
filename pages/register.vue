<template>
  <div class="auth-page">
    <div class="auth-brand">
      <img
        class="auth-brand__logo"
        src="/favicon.svg?v=hd1"
        width="80"
        height="80"
        alt="lonely √3"
        decoding="async"
      >
      <h1 class="auth-brand__title font-display">CogniForge</h1>
      <p class="auth-brand__tagline">{{ t('auth.tagline') }}</p>
    </div>

    <div class="auth-panel cf-surface">
      <form class="auth-form" @submit.prevent="handleRegister">
        <div class="field">
          <label class="field__label" for="reg-name">{{ t('auth.username') }}</label>
          <UInput
            id="reg-name"
            v-model="form.name"
            class="w-full"
            size="lg"
            :placeholder="t('auth.placeholderName')"
            leading-icon="i-lucide-user"
            autocomplete="nickname"
            :color="errors.name ? 'error' : 'neutral'"
            :highlight="!!errors.name"
            @update:model-value="errors.name = ''"
          />
          <p v-if="errors.name" class="field__error">{{ errors.name }}</p>
        </div>

        <div class="field">
          <label class="field__label" for="reg-email">{{ t('auth.email') }}</label>
          <UInput
            id="reg-email"
            v-model="form.email"
            class="w-full"
            size="lg"
            type="email"
            :placeholder="t('auth.placeholderEmail')"
            leading-icon="i-lucide-mail"
            autocomplete="email"
            :color="errors.email ? 'error' : 'neutral'"
            :highlight="!!errors.email"
            @update:model-value="errors.email = ''"
          />
          <p v-if="errors.email" class="field__error">{{ errors.email }}</p>
        </div>

        <div class="field">
          <label class="field__label" for="reg-password">{{ t('auth.password') }}</label>
          <UInput
            id="reg-password"
            v-model="form.password"
            class="w-full"
            size="lg"
            type="password"
            placeholder="••••••••"
            leading-icon="i-lucide-lock"
            autocomplete="new-password"
            :color="errors.password ? 'error' : 'neutral'"
            :highlight="!!errors.password"
            @update:model-value="errors.password = ''"
          />
          <p v-if="errors.password" class="field__error">{{ errors.password }}</p>
        </div>

        <div class="field">
          <label class="field__label" for="reg-confirm">{{ t('auth.confirmPassword') }}</label>
          <UInput
            id="reg-confirm"
            v-model="form.confirmPassword"
            class="w-full"
            size="lg"
            type="password"
            placeholder="••••••••"
            leading-icon="i-lucide-shield-check"
            autocomplete="new-password"
            :color="errors.confirmPassword ? 'error' : 'neutral'"
            :highlight="!!errors.confirmPassword"
            @update:model-value="errors.confirmPassword = ''"
          />
          <p v-if="errors.confirmPassword" class="field__error">{{ errors.confirmPassword }}</p>
        </div>

        <CfButton
          type="submit"
          tone="primary"
          icon="i-lucide-user-plus"
          block
          class="auth-submit"
          :loading="loading"
          :disabled="loading"
        >
          {{ t('auth.createAccount') }}
        </CfButton>
      </form>

      <div class="auth-footer">
        <span class="auth-footer__muted">{{ t('auth.hasAccount') }}</span>
        <UButton variant="link" color="primary" to="/login">{{ t('auth.signIn') }}</UButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'auth',
})

const toast = useToast()
const { setAuth } = useAuth()
const { t, syncToRemote } = useLocale()

const loading = ref(false)
const form = reactive({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
})
const errors = reactive({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
})

function validate(): boolean {
  const name = form.name.trim()
  if (!name) {
    errors.name = t('auth.enterUsername')
  } else if (name.length < 2 || name.length > 20) {
    errors.name = t('auth.usernameLen')
  } else {
    errors.name = ''
  }

  const email = form.email.trim()
  if (!email) {
    errors.email = t('auth.enterEmail')
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = t('auth.invalidEmail')
  } else {
    errors.email = ''
  }

  if (!form.password) {
    errors.password = t('auth.enterPassword')
  } else if (form.password.length < 6) {
    errors.password = t('auth.passwordMin')
  } else {
    errors.password = ''
  }

  if (!form.confirmPassword) {
    errors.confirmPassword = t('auth.confirmRequired')
  } else if (form.confirmPassword !== form.password) {
    errors.confirmPassword = t('auth.passwordMismatch')
  } else {
    errors.confirmPassword = ''
  }

  return !errors.name && !errors.email && !errors.password && !errors.confirmPassword
}

const handleRegister = async () => {
  if (!validate()) return

  loading.value = true
  try {
    const { post } = useApi()
    const res = await post<{ token: string; user: any }>('/api/v1/auth/register', {
      email: form.email,
      password: form.password,
      name: form.name,
    })

    if (res.error) {
      toast.add({ title: res.error, color: 'error' })
      return
    }

    if (res.data) {
      setAuth(res.data.token, res.data.user)
      syncToRemote()
      toast.add({ title: t('auth.created'), color: 'success' })
      await navigateTo('/')
    }
  } catch (error: any) {
    toast.add({
      title: error.data?.error || error.data?.message || t('auth.createFail'),
      color: 'error',
    })
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-page {
  width: 100%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.auth-brand {
  text-align: center;
}

.auth-brand__logo {
  display: block;
  width: 80px;
  height: 80px;
  margin: 0 auto 14px;
  border-radius: 18px;
}

.auth-brand__title {
  margin: 0;
  font-size: clamp(2.4rem, 6vw, 3.2rem);
  font-weight: 700;
  letter-spacing: -0.03em;
  color: var(--cf-ink);
  line-height: 1.05;
}

.auth-brand__tagline {
  margin: 10px 0 0;
  font-size: 0.95rem;
  color: var(--cf-ink-soft);
}

.auth-panel {
  border-radius: 10px;
  padding: 28px 24px;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
  width: 100%;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.field__label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--cf-ink);
}

.field__error {
  margin: 0;
  font-size: 0.75rem;
  color: var(--cf-danger);
}

.auth-form :deep(input) {
  width: 100%;
}

.auth-submit {
  margin-top: 4px;
}

.auth-footer {
  margin-top: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.auth-footer__muted {
  font-size: 0.875rem;
  color: var(--cf-ink-soft);
}
</style>
