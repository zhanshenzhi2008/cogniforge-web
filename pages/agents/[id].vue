<template>
  <div class="cf-page cf-page--flush">
    <div v-if="loading" class="cf-state">
      <UIcon name="i-lucide-loader-circle" class="size-6 animate-spin" />
      <span>{{ t('common.loading') }}</span>
    </div>
    <div v-else-if="!agent" class="cf-state">
      <UIcon name="i-lucide-bot-off" class="size-8 opacity-50" />
      <p>{{ t('agents.empty') }}</p>
      <CfButton tone="secondary" icon="i-lucide-arrow-left" @click="navigateTo('/agents')">
        {{ t('common.back') }}
      </CfButton>
    </div>
    <AgentStudio
      v-else
      mode="edit"
      :agent-id="agent.id"
      :initial="agent"
      @saved="onSaved"
    />
  </div>
</template>

<script setup lang="ts">
import type { Agent } from '@/composables/useAgents'

definePageMeta({
  layout: 'default',
})

const route = useRoute()
const toast = useToast()
const { t } = useLocale()
const { get } = useAgents()

const loading = ref(true)
const agent = ref<Agent | null>(null)

function onSaved(next: Agent) {
  agent.value = next
}

async function load() {
  loading.value = true
  try {
    const id = String(route.params.id || '')
    if (!id) {
      agent.value = null
      return
    }
    const res = await get(id)
    if (res.error || !res.data) {
      agent.value = null
      if (res.error) toast.add({ title: res.error, color: 'error' })
      return
    }
    agent.value = res.data
  } finally {
    loading.value = false
  }
}

watch(
  () => String(route.params.id || ''),
  () => {
    void load()
  },
  { immediate: true },
)
</script>

<style scoped>
.cf-page--flush {
  padding-bottom: 12px;
}
</style>
