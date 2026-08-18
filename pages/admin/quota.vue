<template>
  <div class="cf-page">
    <div class="cf-page-header">
      <div class="cf-page-heading">
        <h1 class="cf-page-title">{{ t('adminQuota.title') }}</h1>
        <p class="cf-page-sub">{{ t('adminQuota.sub') }}</p>
      </div>
      <CfButton tone="primary" icon="i-lucide-save" :disabled="saving" @click="saveDefault">
        {{ t('common.save') }}
      </CfButton>
    </div>

    <section class="cf-panel form-grid">
      <UFormField :label="t('adminQuota.dailyReq')">
        <UInput v-model.number="form.daily_requests" type="number" min="0" />
      </UFormField>
      <UFormField :label="t('adminQuota.dailyTok')">
        <UInput v-model.number="form.daily_tokens" type="number" min="0" />
      </UFormField>
      <UFormField :label="t('adminQuota.monthTok')">
        <UInput v-model.number="form.monthly_tokens" type="number" min="0" />
      </UFormField>
      <UFormField :label="t('adminQuota.rpm')">
        <UInput v-model.number="form.rpm" type="number" min="0" />
      </UFormField>
      <UFormField :label="t('adminQuota.adminUnlimited')">
        <USwitch v-model="form.admin_unlimited" />
      </UFormField>
    </section>

    <section class="cf-panel override-panel">
      <h2 class="panel-title">{{ t('adminQuota.override') }}</h2>
      <div class="override-row">
        <UInput v-model="overrideId" :placeholder="t('adminQuota.userId')" class="id-input" />
        <CfButton tone="secondary" @click="saveOverride">{{ t('adminQuota.override') }}</CfButton>
        <CfButton tone="secondary" @click="clearOverride">{{ t('adminQuota.clear') }}</CfButton>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { QuotaPolicy } from '~/composables/useQuota'

definePageMeta({ layout: 'default', requiresAuth: true })

const { t } = useLocale()
const { user } = useAuth()
const toast = useToast()
const { getPolicy, putPolicy, putUserPolicy } = useQuota()

if (import.meta.client && user.value?.role !== 'admin') {
  await navigateTo('/')
}

const saving = ref(false)
const overrideId = ref('')
const form = reactive<QuotaPolicy>({
  daily_requests: 30,
  daily_tokens: 100000,
  monthly_tokens: 1000000,
  rpm: 8,
  admin_unlimited: true,
  enabled: true,
})

onMounted(async () => {
  const res = await getPolicy()
  if (res.data) Object.assign(form, res.data)
})

async function saveDefault() {
  saving.value = true
  try {
    const res = await putPolicy({
      daily_requests: Number(form.daily_requests),
      daily_tokens: Number(form.daily_tokens),
      monthly_tokens: Number(form.monthly_tokens),
      rpm: Number(form.rpm),
      admin_unlimited: form.admin_unlimited,
      enabled: true,
    })
    if (res.error) throw new Error(res.error)
    toast.add({ title: t('adminQuota.saved'), color: 'success' })
  } catch {
    toast.add({ title: t('common.saveFail'), color: 'error' })
  } finally {
    saving.value = false
  }
}

async function saveOverride() {
  if (!overrideId.value.trim()) return
  const res = await putUserPolicy(overrideId.value.trim(), {
    daily_requests: Number(form.daily_requests),
    daily_tokens: Number(form.daily_tokens),
    monthly_tokens: Number(form.monthly_tokens),
    rpm: Number(form.rpm),
    enabled: true,
  })
  toast.add({ title: res.error ? t('common.saveFail') : t('adminQuota.saved'), color: res.error ? 'error' : 'success' })
}

async function clearOverride() {
  if (!overrideId.value.trim()) return
  const res = await putUserPolicy(overrideId.value.trim(), { clear: true })
  toast.add({ title: res.error ? t('common.saveFail') : t('adminQuota.saved'), color: res.error ? 'error' : 'success' })
}
</script>

<style scoped>
.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  padding: 20px;
}
.override-panel { margin-top: 16px; padding: 20px; }
.panel-title { margin: 0 0 12px; font-size: 1rem; }
.override-row { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
.id-input { min-width: 16rem; }
@media (max-width: 700px) {
  .form-grid { grid-template-columns: 1fr; }
}
</style>
