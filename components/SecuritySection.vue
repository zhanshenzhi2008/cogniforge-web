<template>
  <div class="section-container">
    <div class="section-header">
      <h2 class="cf-section-title">{{ t('security.title') }}</h2>
      <p class="cf-section-desc">{{ t('security.sub') }}</p>
    </div>

    <div class="content-card cf-surface">
      <div class="card-header">
        <div class="card-icon password-icon">
          <UIcon name="i-lucide-key" class="size-[18px] text-white" />
        </div>
        <div class="card-title-area">
          <h3>{{ t('security.changePassword') }}</h3>
          <p>{{ t('security.changeHint') }}</p>
        </div>
      </div>

      <div class="card-body">
        <div class="form-row">
          <label class="form-label">{{ t('security.current') }}</label>
          <UInput
            v-model="form.old_password"
            class="w-full"
            type="password"
            :placeholder="t('security.currentPh')"
            size="sm"
            @keyup.enter="handleSubmit"
          />
        </div>

        <div class="form-row">
          <label class="form-label">{{ t('security.new') }}</label>
          <UInput
            v-model="form.new_password"
            class="w-full"
            type="password"
            :placeholder="t('security.newPh')"
            size="sm"
          />
          <div v-if="form.new_password" class="password-strength-wrapper">
            <PasswordStrength :password="form.new_password" />
          </div>
        </div>

        <div class="form-row">
          <label class="form-label">{{ t('security.confirm') }}</label>
          <UInput
            v-model="form.confirm_password"
            class="w-full"
            type="password"
            :placeholder="t('security.confirmPh')"
            size="sm"
            @keyup.enter="handleSubmit"
          />
        </div>

        <div v-if="!isFormValid && form.new_password" class="password-requirements">
          <div class="requirement" :class="{ met: meetsLength }">
            <UIcon :name="meetsLength ? 'i-lucide-check-circle' : 'i-lucide-x-circle'" class="size-3.5" />
            <span>{{ t('security.reqLen') }}</span>
          </div>
          <div class="requirement" :class="{ met: meetsUpper }">
            <UIcon :name="meetsUpper ? 'i-lucide-check-circle' : 'i-lucide-x-circle'" class="size-3.5" />
            <span>{{ t('security.reqUpper') }}</span>
          </div>
          <div class="requirement" :class="{ met: meetsLower }">
            <UIcon :name="meetsLower ? 'i-lucide-check-circle' : 'i-lucide-x-circle'" class="size-3.5" />
            <span>{{ t('security.reqLower') }}</span>
          </div>
          <div class="requirement" :class="{ met: meetsNumber }">
            <UIcon :name="meetsNumber ? 'i-lucide-check-circle' : 'i-lucide-x-circle'" class="size-3.5" />
            <span>{{ t('security.reqDigit') }}</span>
          </div>
          <div class="requirement" :class="{ met: meetsSpecial }">
            <UIcon :name="meetsSpecial ? 'i-lucide-check-circle' : 'i-lucide-x-circle'" class="size-3.5" />
            <span>{{ t('security.reqSpecial') }}</span>
          </div>
        </div>
      </div>

      <div class="card-footer">
        <CfButton
          tone="primary"
          icon="i-lucide-key-round"
          :loading="loading"
          :disabled="!canSubmit"
          @click="handleSubmit"
        >
          {{ t('security.update') }}
        </CfButton>
      </div>
    </div>

    <div class="content-card disabled-card cf-surface">
      <div class="card-header">
        <div class="card-icon tfa-icon">
          <UIcon name="i-lucide-shield-check" class="size-[18px] text-white" />
        </div>
        <div class="card-title-area">
          <h3>{{ t('security.2fa') }}</h3>
          <p>{{ t('security.2faHint') }}</p>
        </div>
        <UBadge color="warning" variant="subtle" size="sm">{{ t('profile.unavailable') }}</UBadge>
      </div>
    </div>

    <div class="content-card cf-surface">
      <div class="card-header clickable" @click="goToSessions">
        <div class="card-icon sessions-icon">
          <UIcon name="i-lucide-laptop" class="size-[18px] text-white" />
        </div>
        <div class="card-title-area">
          <h3>{{ t('security.sessions') }}</h3>
          <p>{{ t('security.sessionsHint') }}</p>
        </div>
        <CfButton tone="secondary" icon="i-lucide-chevron-right" @click.stop="goToSessions">
          {{ t('security.viewAll') }}
        </CfButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const router = useRouter()
const toast = useToast()
const { t } = useLocale()

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
  meetsLength.value
  && meetsUpper.value
  && meetsLower.value
  && meetsNumber.value
  && meetsSpecial.value,
)

const canSubmit = computed(() =>
  Boolean(
    form.old_password
    && form.new_password
    && form.confirm_password
    && form.new_password === form.confirm_password
    && isFormValid.value,
  ),
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

    toast.add({ title: t('security.passwordOk'), color: 'success' })

    form.old_password = ''
    form.new_password = ''
    form.confirm_password = ''

    setTimeout(() => {
      const { clearAuth } = useAuth()
      clearAuth()
      router.push('/login')
    }, 1500)
  } catch (error: any) {
    toast.add({ title: error.data?.message || t('security.passwordFail'), color: 'error' })
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

.content-card {
  border-radius: 10px;
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
  border-bottom: 1px solid var(--cf-line);
}

.card-header.clickable {
  cursor: pointer;
  transition: background 0.15s ease;
}

.card-header.clickable:hover {
  background: color-mix(in oklab, var(--cf-ink) 4%, transparent);
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

.password-icon {
  background: linear-gradient(135deg, var(--cf-accent), var(--cf-accent-ink));
}

.tfa-icon {
  background: linear-gradient(135deg, var(--cf-warn), color-mix(in oklab, var(--cf-warn) 70%, #000));
}

.sessions-icon {
  background: linear-gradient(135deg, var(--cf-ok), color-mix(in oklab, var(--cf-ok) 70%, #000));
}

.card-title-area {
  flex: 1;
}

.card-title-area h3 {
  font-size: 14px;
  font-weight: 600;
  color: var(--cf-ink);
  margin: 0;
}

.card-title-area p {
  font-size: 12px;
  color: var(--cf-ink-soft);
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
  color: var(--cf-ink);
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
  background: color-mix(in oklab, var(--cf-bg-muted) 70%, transparent);
  border-radius: 6px;
  margin-top: 12px;
}

.requirement {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--cf-ink-soft);
}

.requirement.met {
  color: var(--cf-ok);
}

.card-footer {
  padding: 12px 16px;
  background: color-mix(in oklab, var(--cf-bg-muted) 60%, transparent);
  border-top: 1px solid var(--cf-line);
  display: flex;
  justify-content: flex-end;
}
</style>
