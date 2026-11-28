<template>
  <div class="cf-page help-page">
    <div class="cf-page-header">
      <div class="cf-page-heading">
        <h1 class="cf-page-title">{{ t('help.studioTitle') }}</h1>
        <p class="cf-page-sub">{{ t('help.studioSub') }}</p>
      </div>
      <CfButton tone="secondary" icon="i-lucide-arrow-left" @click="goBack">
        {{ t('common.back') }}
      </CfButton>
    </div>

    <div class="help-grid">
      <section class="help-card cf-surface">
        <div class="help-card__head">
          <UIcon name="i-lucide-hammer" class="size-4" />
          <h2>{{ t('agents.studioBuild') }}</h2>
        </div>
        <p>{{ t('agents.studioBuildTip') }}</p>
        <ul class="help-list">
          <li>{{ t('help.studioBuildStep1') }}</li>
          <li>{{ t('help.studioBuildStep2') }}</li>
          <li>{{ t('help.studioBuildStep3') }}</li>
        </ul>
      </section>

      <section class="help-card cf-surface">
        <div class="help-card__head">
          <UIcon name="i-lucide-message-circle" class="size-4" />
          <h2>{{ t('agents.studioPreview') }}</h2>
        </div>
        <p>{{ t('agents.studioPreviewTip') }}</p>
        <ul class="help-list">
          <li>{{ t('help.studioPreviewStep1') }}</li>
          <li>{{ t('help.studioPreviewStep2') }}</li>
          <li>{{ t('help.studioPreviewStep3') }}</li>
        </ul>
      </section>

      <section class="help-card cf-surface help-card--wide">
        <div class="help-card__head">
          <UIcon name="i-lucide-sliders-horizontal" class="size-4" />
          <h2>{{ t('help.studioConfigTitle') }}</h2>
        </div>
        <ul class="help-list">
          <li>{{ t('help.studioConfigModel') }}</li>
          <li>{{ t('help.studioConfigPrompt') }}</li>
          <li>{{ t('help.studioConfigKb') }}</li>
          <li>{{ t('help.studioConfigOpening') }}</li>
          <li>{{ t('help.studioConfigAttach') }}</li>
          <li>{{ t('help.studioConfigSoon') }}</li>
        </ul>
      </section>
    </div>

    <div class="help-actions">
      <CfButton tone="primary" icon="i-lucide-plus" @click="navigateTo('/agents/new')">
        {{ t('agents.new') }}
      </CfButton>
      <CfButton tone="secondary" icon="i-lucide-bot" @click="navigateTo('/agents')">
        {{ t('agents.title') }}
      </CfButton>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'default',
  requiresAuth: true,
})

const { t } = useLocale()
const router = useRouter()

function goBack() {
  if (import.meta.client && window.history.length > 1) {
    router.back()
    return
  }
  navigateTo('/agents')
}
</script>

<style scoped>
.help-page {
  max-width: 880px;
}

.help-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.help-card {
  padding: 1.25rem 1.35rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.help-card--wide {
  grid-column: 1 / -1;
}

.help-card__head {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.help-card__head h2 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
}

.help-card p {
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.55;
  color: var(--ui-text-muted);
}

.help-list {
  margin: 0;
  padding-left: 1.1rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  font-size: 0.875rem;
  line-height: 1.5;
  color: var(--ui-text-toned);
}

.help-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 1.25rem;
}

@media (max-width: 720px) {
  .help-grid {
    grid-template-columns: 1fr;
  }

  .help-card--wide {
    grid-column: auto;
  }
}
</style>
