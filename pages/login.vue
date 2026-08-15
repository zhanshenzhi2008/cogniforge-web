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
      <form class="auth-form" @submit.prevent="handleLogin">
        <div class="field">
          <label class="field__label" for="login-account">{{ t('auth.account') }}</label>
          <UInput
            id="login-account"
            v-model="form.account"
            class="w-full"
            size="lg"
            :placeholder="t('auth.placeholderEmail')"
            autocomplete="username"
            :color="errors.account ? 'error' : 'neutral'"
            :highlight="!!errors.account"
            @update:model-value="errors.account = ''"
          />
          <p v-if="errors.account" class="field__error">{{ errors.account }}</p>
        </div>

        <div class="field">
          <label class="field__label" for="login-password">{{ t('auth.password') }}</label>
          <UInput
            id="login-password"
            v-model="form.password"
            class="w-full"
            size="lg"
            type="password"
            placeholder="••••••••"
            autocomplete="current-password"
            :color="errors.password ? 'error' : 'neutral'"
            :highlight="!!errors.password"
            @update:model-value="errors.password = ''"
          />
          <p v-if="errors.password" class="field__error">{{ errors.password }}</p>
        </div>

        <CfButton
          type="submit"
          tone="primary"
          icon="i-lucide-log-in"
          block
          class="auth-submit"
          :loading="loading"
          :disabled="loading"
        >
          {{ t('auth.signIn') }}
        </CfButton>
      </form>

      <div class="auth-footer">
        <span class="auth-footer__muted">{{ t('auth.noAccount') }}</span>
        <UButton variant="link" color="primary" to="/register">{{ t('auth.createOne') }}</UButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'auth',
})

const toast = useToast()
const router = useRouter()
const { setAuth } = useAuth()
const { t, syncToRemote } = useLocale()

const loading = ref(false)
const form = reactive({
  account: '',
  password: '',
})
const errors = reactive({
  account: '',
  password: '',
})

function validate(): boolean {
  errors.account = form.account.trim() ? '' : t('auth.enterEmailOrUser')
  if (!form.password) {
    errors.password = t('auth.enterPassword')
  } else if (form.password.length < 6) {
    errors.password = t('auth.passwordMin')
  } else {
    errors.password = ''
  }
  return !errors.account && !errors.password
}

const handleLogin = async () => {
  if (!validate()) return

  loading.value = true
  try {
    const { post } = useApi()
    const isEmail = form.account.includes('@')
    const payload = isEmail
      ? { email: form.account, password: form.password }
      : { username: form.account, password: form.password }
    const res = await post<{ token: string; user: any }>('/api/v1/auth/login', payload)

    if (res.error) {
      toast.add({ title: res.error, color: 'error' })
      return
    }

    if (res.data) {
      setAuth(res.data.token, res.data.user)
      syncToRemote()
      toast.add({ title: t('auth.signedIn'), color: 'success' })
      await router.push('/')
    }
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
  gap: 32px;
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
  font-size: clamp(2.6rem, 7vw, 3.4rem);
  font-weight: 700;
  letter-spacing: -0.04em;
  color: var(--cf-ink);
  line-height: 1.02;
}

.auth-brand__tagline {
  margin: 12px 0 0;
  font-size: 1rem;
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
  margin-top: 6px;
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
