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
      <h1 class="auth-brand__title font-display">{{ t('auth.forgotTitle') }}</h1>
      <p class="auth-brand__tagline">
        {{ emailEnabled ? t('auth.forgotSubEmail') : t('auth.forgotSub') }}
      </p>
    </div>

    <div class="auth-panel cf-surface">
      <template v-if="sent">
        <p class="forgot-note">{{ t('auth.forgotSent') }}</p>
        <UButton color="primary" icon="i-lucide-arrow-left" block to="/login">
          {{ t('auth.backToSignIn') }}
        </UButton>
      </template>

      <template v-else-if="emailEnabled">
        <form class="auth-form" @submit.prevent="submitForgot">
          <div class="field">
            <label class="field__label" for="forgot-email">{{ t('auth.email') }}</label>
            <UInput
              id="forgot-email"
              v-model="email"
              class="w-full"
              size="lg"
              type="email"
              :placeholder="t('auth.placeholderEmail')"
              autocomplete="email"
              :color="error ? 'error' : 'neutral'"
              :highlight="!!error"
              @update:model-value="error = ''"
            />
            <p v-if="error" class="field__error">{{ error }}</p>
          </div>
          <CfButton
            type="submit"
            tone="primary"
            icon="i-lucide-mail"
            block
            :loading="loading"
            :disabled="loading"
          >
            {{ t('auth.sendResetLink') }}
          </CfButton>
        </form>
        <p class="forgot-note">{{ t('auth.forgotSpamHint') }}</p>
        <div class="auth-footer">
          <UButton variant="link" color="primary" to="/login">{{ t('auth.backToSignIn') }}</UButton>
        </div>
      </template>

      <template v-else>
        <ol class="forgot-steps">
          <li>{{ t('auth.forgotStep1') }}</li>
          <li>{{ t('auth.forgotStep2') }}</li>
          <li>{{ t('auth.forgotStep3') }}</li>
        </ol>
        <p class="forgot-note">{{ t('auth.forgotNote') }}</p>
        <UButton color="primary" icon="i-lucide-arrow-left" block to="/login">
          {{ t('auth.backToSignIn') }}
        </UButton>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'auth',
})

const toast = useToast()
const { t } = useLocale()
const { get, post } = useApi()

const emailEnabled = ref(false)
const email = ref('')
const error = ref('')
const loading = ref(false)
const sent = ref(false)

onMounted(async () => {
  try {
    const res = await get<{ email_enabled?: boolean }>('/api/v1/auth/password-reset-options')
    emailEnabled.value = !!res.data?.email_enabled
  } catch {
    emailEnabled.value = false
  }
})

async function submitForgot() {
  const value = email.value.trim()
  if (!value || !value.includes('@')) {
    error.value = t('auth.invalidEmail')
    return
  }
  loading.value = true
  error.value = ''
  try {
    const res = await post('/api/v1/auth/forgot-password', { email: value })
    if (res.error) {
      toast.add({ title: res.error, color: 'error' })
      return
    }
    sent.value = true
    toast.add({ title: t('auth.forgotSentToast'), color: 'success' })
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
  font-size: clamp(2rem, 5vw, 2.4rem);
  font-weight: 700;
  letter-spacing: -0.04em;
  color: var(--cf-ink);
  line-height: 1.1;
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
}

.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
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

.forgot-steps {
  margin: 0 0 16px;
  padding-left: 1.25rem;
  color: var(--cf-ink);
  font-size: 0.95rem;
  line-height: 1.65;
}

.forgot-note {
  margin: 16px 0 0;
  font-size: 0.85rem;
  color: var(--cf-ink-soft);
  line-height: 1.5;
}

.auth-footer {
  margin-top: 16px;
  display: flex;
  justify-content: center;
}
</style>
