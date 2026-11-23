<template>
  <div class="cf-page">
    <div class="cf-page-header">
      <div>
        <h1 class="cf-page-title">{{ t('teams.title') }}</h1>
        <p class="cf-page-sub">{{ t('teams.sub') }}</p>
      </div>
      <UButton color="primary" @click="showCreate = true">
        {{ t('teams.new') }}
      </UButton>
    </div>

    <div v-if="loading" class="cf-panel p-6 text-sm opacity-70">
      {{ t('common.loading') }}
    </div>
    <div v-else-if="teams.length === 0" class="cf-panel p-8 text-center">
      <p class="mb-4">{{ t('teams.empty') }}</p>
      <UButton color="primary" @click="showCreate = true">
        {{ t('teams.new') }}
      </UButton>
    </div>
    <div v-else class="team-grid">
      <div v-for="team in teams" :key="team.id" class="cf-panel team-card">
        <div class="team-card__head">
          <strong>{{ team.name }}</strong>
          <UBadge variant="subtle" color="neutral">{{ modeLabel(team.mode) }}</UBadge>
        </div>
        <p class="team-card__desc">{{ team.description || t('teams.noDesc') }}</p>
        <p class="team-card__meta">
          {{ t('teams.members', { n: (team.member_agent_ids || []).length }) }}
          <span v-if="team.supervisor_agent_id"> · {{ t('teams.hasSupervisor') }}</span>
        </p>
        <div class="team-card__actions">
          <UButton size="sm" variant="soft" @click="openPreview(team)">
            {{ t('teams.preview') }}
          </UButton>
          <UButton size="sm" color="error" variant="ghost" @click="askDelete(team)">
            {{ t('common.delete') }}
          </UButton>
        </div>
      </div>
    </div>

    <UModal v-model:open="showCreate">
      <template #content>
        <div class="p-4 space-y-3 min-w-[320px]">
          <h2 class="text-base font-semibold">{{ t('teams.new') }}</h2>
          <UFormField :label="t('common.name')">
            <UInput v-model="form.name" class="w-full" />
          </UFormField>
          <UFormField :label="t('teams.mode')">
            <USelect v-model="form.mode" :items="modeItems" class="w-full" />
          </UFormField>
          <UFormField :label="t('teams.supervisor')">
            <USelect v-model="form.supervisor_agent_id" :items="agentItems" class="w-full" />
          </UFormField>
          <UFormField :label="t('teams.workerAgents')">
            <USelect
              v-model="form.member_agent_ids"
              :items="agentItems"
              multiple
              class="w-full"
            />
          </UFormField>
          <UFormField :label="t('common.description')">
            <UTextarea v-model="form.description" :rows="2" class="w-full" />
          </UFormField>
          <div class="flex justify-end gap-2 pt-2">
            <UButton variant="ghost" @click="showCreate = false">{{ t('common.cancel') }}</UButton>
            <UButton color="primary" :loading="creating" @click="submitCreate">{{ t('common.create') }}</UButton>
          </div>
        </div>
      </template>
    </UModal>

    <UModal v-model:open="showPreview">
      <template #content>
        <div class="p-4 space-y-3 min-w-[360px] max-w-lg">
          <h2 class="text-base font-semibold">{{ t('teams.preview') }} · {{ previewing?.name }}</h2>
          <p v-if="lastRunState?.active_agent_id" class="text-xs opacity-80">
            {{ t('teams.activeAgent', { id: lastRunState.active_agent_id }) }}
          </p>
          <div class="preview-log">
            <div v-for="(m, i) in previewMsgs" :key="i" class="preview-log__row" :class="`is-${m.role}`">
              <span class="preview-log__role">{{ m.role }}</span>
              <span>{{ m.content }}</span>
            </div>
          </div>
          <div class="flex gap-2">
            <UInput
              v-model="previewInput"
              class="flex-1"
              :placeholder="t('teams.previewPh')"
              @keydown.enter.prevent="sendPreview"
            />
            <UButton color="primary" :loading="previewBusy" @click="sendPreview">
              {{ t('teams.send') }}
            </UButton>
          </div>
        </div>
      </template>
    </UModal>

    <CfModal v-model:open="deleteVisible" :title="t('common.deleteConfirm')" :ui="{ content: 'sm:max-w-md' }">
      <template #body>
        <p>{{ t('teams.deleteText', { name: deleting?.name ?? '' }) }}</p>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <CfButton tone="secondary" @click="deleteVisible = false">{{ t('common.cancel') }}</CfButton>
          <CfButton tone="danger" strong :loading="deletingLoading" @click="confirmDelete">
            {{ t('common.delete') }}
          </CfButton>
        </div>
      </template>
    </CfModal>
  </div>
</template>

<script setup lang="ts">
import type { Agent } from '@/composables/useAgents'
import type { AgentTeam, TeamMode, TeamRunState } from '@/composables/useTeams'

definePageMeta({ layout: 'default' })

const toast = useToast()
const { t } = useLocale()
const { list, create, remove, chat } = useTeams()
const { list: listAgents } = useAgents()

const loading = ref(false)
const creating = ref(false)
const teams = ref<AgentTeam[]>([])
const agents = ref<Agent[]>([])
const showCreate = ref(false)
const showPreview = ref(false)
const previewing = ref<AgentTeam | null>(null)
const previewInput = ref('')
const previewBusy = ref(false)
const previewMsgs = ref<Array<{ role: string, content: string }>>([])
const lastRunState = ref<TeamRunState | null>(null)
const deleteVisible = ref(false)
const deletingLoading = ref(false)
const deleting = ref<AgentTeam | null>(null)

const form = reactive({
  name: '',
  description: '',
  mode: 'supervisor' as TeamMode,
  supervisor_agent_id: '',
  member_agent_ids: [] as string[],
})

const modeItems = computed(() => [
  { label: t('teams.modeSupervisor'), value: 'supervisor' },
  { label: t('teams.modePipeline'), value: 'pipeline' },
  { label: t('teams.modeHandoff'), value: 'handoff' },
])

const agentItems = computed(() =>
  agents.value.map(a => ({ label: a.name, value: a.id })),
)

function modeLabel(mode: string) {
  if (mode === 'pipeline') return t('teams.modePipeline')
  if (mode === 'handoff') return t('teams.modeHandoff')
  return t('teams.modeSupervisor')
}

async function fetchAll() {
  loading.value = true
  try {
    const [tr, ar] = await Promise.all([list(), listAgents()])
    if (tr.error) toast.add({ title: tr.error, color: 'error' })
    else teams.value = tr.data || []
    if (!ar.error) agents.value = ar.data || []
  }
  finally {
    loading.value = false
  }
}

async function submitCreate() {
  if (!form.name.trim()) {
    toast.add({ title: t('common.nameRequired'), color: 'warning' })
    return
  }
  creating.value = true
  try {
    const res = await create({
      name: form.name.trim(),
      description: form.description,
      mode: form.mode,
      supervisor_agent_id: form.supervisor_agent_id || undefined,
      member_agent_ids: form.member_agent_ids,
    })
    if (res.error) {
      toast.add({ title: res.error, color: 'error' })
      return
    }
    toast.add({ title: t('common.createOk'), color: 'success' })
    showCreate.value = false
    form.name = ''
    form.description = ''
    form.member_agent_ids = []
    await fetchAll()
  }
  finally {
    creating.value = false
  }
}

function openPreview(team: AgentTeam) {
  previewing.value = team
  previewMsgs.value = []
  lastRunState.value = null
  previewInput.value = ''
  showPreview.value = true
}

async function sendPreview() {
  if (!previewing.value || !previewInput.value.trim() || previewBusy.value) return
  const text = previewInput.value.trim()
  previewMsgs.value.push({ role: 'user', content: text })
  previewInput.value = ''
  previewBusy.value = true
  try {
    const res = await chat(previewing.value.id, {
      messages: previewMsgs.value.map(m => ({ role: m.role, content: m.content })),
      stream: false,
      run_state: lastRunState.value || undefined,
    })
    if (res.error) {
      toast.add({ title: res.error, color: 'error' })
      return
    }
    lastRunState.value = res.data?.run_state || null
    const content = res.data?.response?.choices?.[0]?.message?.content
    const reply = typeof content === 'string' ? content : JSON.stringify(content ?? '')
    previewMsgs.value.push({ role: 'assistant', content: reply || '—' })
  }
  finally {
    previewBusy.value = false
  }
}

function askDelete(team: AgentTeam) {
  deleting.value = team
  deleteVisible.value = true
}

async function confirmDelete() {
  if (!deleting.value) return
  deletingLoading.value = true
  try {
    const res = await remove(deleting.value.id)
    if (res.error) {
      toast.add({ title: res.error, color: 'error' })
      return
    }
    toast.add({ title: t('common.deleteOk'), color: 'success' })
    deleteVisible.value = false
    await fetchAll()
  }
  finally {
    deletingLoading.value = false
  }
}

onMounted(() => {
  fetchAll()
})
</script>

<style scoped>
.team-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 12px;
}
.team-card {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.team-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.team-card__desc {
  font-size: 13px;
  opacity: 0.75;
  min-height: 2.5em;
}
.team-card__meta {
  font-size: 12px;
  opacity: 0.65;
}
.team-card__actions {
  display: flex;
  gap: 8px;
  margin-top: 4px;
}
.preview-log {
  max-height: 280px;
  overflow: auto;
  border: 1px solid color-mix(in oklab, var(--ui-border) 80%, transparent);
  border-radius: 8px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 13px;
}
.preview-log__row {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.preview-log__role {
  font-size: 11px;
  opacity: 0.55;
  text-transform: uppercase;
}
</style>
