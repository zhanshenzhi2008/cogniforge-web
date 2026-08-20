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
      <h1 class="auth-brand__title font-display">{{ t('auth.resetTitle') }}</h1>
      <p class="auth-brand__tagline">{{ t('auth.resetSub') }}</p>
    </div>

    <div class="auth-panel cf-surface">
      <p v-if="!token" class="forgot-note">{{ t('auth.resetMissingToken') }}</p>

      <form v-else class="auth-form" @submit.prevent="submitReset">
        <div class="field">
          <label class="field__label" for="reset-password">{{ t('auth.newPassword') }}</label>
          <UInput
            id="reset-password"
            v-model="password"
            class="w-full"
            size="lg"
            type="password"
            placeholder="••••••••"
            autocomplete="new-password"
            :color="errors.password ? 'error' : 'neutral'"
            :highlight="!!errors.password"
            @update:model-value="errors.password = ''"
          />
          <p v-if="errors.password" class="field__error">{{ errors.password }}</p>
        </div>
        <div class="field">
          <label class="field__label" for="reset-confirm">{{ t('auth.confirmPassword') }}</label>
          <UInput
            id="reset-confirm"
            v-model="confirm"
            class="w-full"
            size="lg"
            type="password"
            placeholder="••••••••"
            autocomplete="new-password"
            :color="errors.confirm ? 'error' : 'neutral'"
            :highlight="!!errors.confirm"
            @update:model-value="errors.confirm = ''"
          />
          <p v-if="errors.confirm" class="field__error">{{ errors.confirm }}</p>
        </div>
        <p class="hint">{{ t('auth.passwordRules') }}</p>
        <CfButton
          type="submit"
          tone="primary"
          icon="i-lucide-key-round"
          block
          :loading="loading"
          :disabled="loading"
        >
          {{ t('auth.resetSubmit') }}
        </CfButton>
      </form>

      <div class="auth-footer">
        <UButton variant="link" color="primary" to="/login">{{ t('auth.backToSignIn') }}</UButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'auth',
})

const route = useRoute()
const router = useRouter()
const toast = useToast()
const { t } = useLocale()
const { post } = useApi()

const token = computed(() => String(route.query.token || '').trim())
const password = ref('')
const confirm = ref('')
const loading = ref(false)
const errors = reactive({ password: '', confirm: '' })

function validate(): boolean {
  errors.password = ''
  errors.confirm = ''
  if (!password.value) {
    errors.password = t('auth.enterPassword')
  } else if (password.value.length < 8) {
    errors.password = t('auth.passwordRules')
  }
  if (!confirm.value) {
    errors.confirm = t('auth.confirmRequired')
  } else if (confirm.value !== password.value) {
    errors.confirm = t('auth.passwordMismatch')
  }
  return !errors.password && !errors.confirm
}

async function submitReset() {
  if (!token.value || !validate()) return
  loading.value = true
  try {
    const res = await post('/api/v1/auth/reset-password', {
      token: token.value,
      new_password: password.value,
    })
    if (res.error) {
      toast.add({ title: res.error, color: 'error' })
      return
    }
    toast.add({ title: t('auth.resetDone'), color: 'success' })
    await router.push('/login')
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

.hint {
  margin: 0;
  font-size: 0.8rem;
  color: var(--cf-ink-soft);
  line-height: 1.45;
}

.forgot-note {
  margin: 0;
  font-size: 0.9rem;
  color: var(--cf-ink-soft);
  line-height: 1.5;
}

.auth-footer {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}
</style>
