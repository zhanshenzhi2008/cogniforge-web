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
          <UButton
            size="sm"
            variant="outline"
            :loading="expandingId === team.id"
            @click="expandPipeline(team)"
          >
            {{ team.workflow_id ? t('teams.openPipeline') : t('teams.genPipeline') }}
          </UButton>
          <UButton
            size="sm"
            variant="outline"
            :loading="expandingParallelId === team.id"
            :disabled="!(team.member_agent_ids || []).length"
            :title="t('teams.genParallelHint')"
            @click="expandParallel(team)"
          >
            {{ t('teams.genParallel') }}
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
          <div class="flex items-start justify-between gap-2">
            <h2 class="text-base font-semibold">{{ t('teams.preview') }} · {{ previewing?.name }}</h2>
            <UButton size="xs" variant="ghost" :disabled="previewBusy" @click="startFreshPreview">
              {{ t('teams.newChat') }}
            </UButton>
          </div>
          <p v-if="lastRunState?.active_agent_id" class="text-xs opacity-80">
            {{ t('teams.activeAgent', { id: lastRunState.active_agent_id }) }}
          </p>
          <p v-if="lastFailHint" class="text-xs text-amber-600 dark:text-amber-400">
            {{ lastFailHint }}
          </p>
          <div class="preview-log">
            <div
              v-for="(m, i) in previewMsgs"
              :key="i"
              class="preview-log__row"
              :class="[`is-${m.role}`, { 'is-fail': m.failed }]"
            >
              <span class="preview-log__role">
                {{ m.role }}
                <template v-if="m.agentId"> · {{ m.agentId }}</template>
              </span>
              <span>{{ m.content }}</span>
            </div>
            <p v-if="previewMsgs.length === 0 && !previewLoadingHist" class="text-xs opacity-50">
              {{ t('teams.previewEmpty') }}
            </p>
            <p v-if="previewLoadingHist" class="text-xs opacity-50">{{ t('common.loading') }}</p>
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

    <CfConfirmModal
      v-model:open="deleteVisible"
      :message="t('teams.deleteText', { name: deleting?.name ?? '' })"
      :loading="deletingLoading"
      @confirm="confirmDelete"
    />
  </div>
</template>

<script setup lang="ts">
import type { Agent } from '@/composables/useAgents'
import type { AgentTeam, TeamMode, TeamRunState } from '@/composables/useTeams'

definePageMeta({ layout: 'default' })

const toast = useToast()
const { t } = useLocale()
const router = useRouter()
const { list, create, remove, chat, expandPipeline: apiExpandPipeline } = useTeams()
const { list: listAgents } = useAgents()
const { list: listConversations, get: getConversation } = useConversations()
const expandingId = ref('')
const expandingParallelId = ref('')

type PreviewMsg = { role: string, content: string, agentId?: string, failed?: boolean }

const loading = ref(false)
const creating = ref(false)
const teams = ref<AgentTeam[]>([])
const agents = ref<Agent[]>([])
const showCreate = ref(false)
const showPreview = ref(false)
const previewing = ref<AgentTeam | null>(null)
const previewInput = ref('')
const previewBusy = ref(false)
const previewLoadingHist = ref(false)
const previewMsgs = ref<PreviewMsg[]>([])
const previewConversationId = ref('')
const lastRunState = ref<TeamRunState | null>(null)
const lastFailHint = ref('')
const deleteVisible = ref(false)
const deletingLoading = ref(false)
const deleting = ref<AgentTeam | null>(null)

function failHintFromRunState(rs: TeamRunState | null | undefined): string {
  if (!rs) return ''
  const hist = rs.delegate_history || []
  for (let i = hist.length - 1; i >= 0; i--) {
    const s = hist[i]?.result_summary || ''
    if (s.includes('工人执行失败')) return s
  }
  const pad = rs.scratchpad || {}
  for (const [k, v] of Object.entries(pad)) {
    if (k.startsWith('last_delegate_error_') && typeof v === 'string' && v) return v
  }
  return ''
}

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

function resetPreviewLocal() {
  previewMsgs.value = []
  lastRunState.value = null
  lastFailHint.value = ''
  previewConversationId.value = ''
  previewInput.value = ''
}

function startFreshPreview() {
  resetPreviewLocal()
}

async function openPreview(team: AgentTeam) {
  previewing.value = team
  resetPreviewLocal()
  showPreview.value = true
  previewLoadingHist.value = true
  try {
    const listed = await listConversations({ team_id: team.id })
    const latest = listed.data?.[0]
    if (!latest?.id) return
    const detail = await getConversation(latest.id)
    if (detail.error || !detail.data) return
    previewConversationId.value = detail.data.id
    previewMsgs.value = (detail.data.messages || [])
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .map(m => ({
        role: m.role,
        content: m.content || '',
        agentId: m.active_agent_id || undefined,
        failed: (m.content || '').includes('工人执行失败'),
      }))
  }
  finally {
    previewLoadingHist.value = false
  }
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
      conversation_id: previewConversationId.value || undefined,
    })
    if (res.error) {
      toast.add({ title: res.error, color: 'error' })
      previewMsgs.value.pop()
      return
    }
    lastRunState.value = res.data?.run_state || null
    lastFailHint.value = failHintFromRunState(lastRunState.value)
    if (res.data?.conversation_id) {
      previewConversationId.value = res.data.conversation_id
    }
    const content = res.data?.response?.choices?.[0]?.message?.content
    const reply = typeof content === 'string' ? content : JSON.stringify(content ?? '')
    const active = lastRunState.value?.active_agent_id
    previewMsgs.value.push({
      role: 'assistant',
      content: reply || '—',
      agentId: active,
      failed: !!lastFailHint.value && (reply || '').includes('工人执行失败'),
    })
    if (lastFailHint.value) {
      toast.add({ title: t('teams.workerFailToast'), description: lastFailHint.value, color: 'warning' })
    }
  }
  finally {
    previewBusy.value = false
  }
}

async function expandPipeline(team: AgentTeam) {
  if (expandingId.value || expandingParallelId.value) return
  // 已绑定且用户点「打开」：直接进画布；若要重生成仍走 API（同按钮 regenerates then open）
  expandingId.value = team.id
  try {
    const res = await apiExpandPipeline(team.id)
    if (res.error) {
      toast.add({ title: res.error, color: 'error' })
      return
    }
    const wfId = res.data?.workflow?.id || res.data?.team?.workflow_id
    if (!wfId) {
      toast.add({ title: t('teams.genPipelineFail'), color: 'error' })
      return
    }
    toast.add({ title: t('teams.genPipelineOk'), color: 'success' })
    await fetchAll()
    await router.push(`/workflows/${wfId}`)
  }
  finally {
    expandingId.value = ''
  }
}

async function expandParallel(team: AgentTeam) {
  if (expandingId.value || expandingParallelId.value) return
  expandingParallelId.value = team.id
  try {
    const res = await apiExpandPipeline(team.id, { layout: 'parallel' })
    if (res.error) {
      toast.add({ title: res.error, color: 'error' })
      return
    }
    const wfId = res.data?.workflow?.id || res.data?.team?.workflow_id
    if (!wfId) {
      toast.add({ title: t('teams.genParallelFail'), color: 'error' })
      return
    }
    toast.add({ title: t('teams.genParallelOk'), color: 'success' })
    await fetchAll()
    await router.push(`/workflows/${wfId}`)
  }
  finally {
    expandingParallelId.value = ''
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
.preview-log__row.is-fail span:last-child {
  color: color-mix(in oklab, var(--ui-warning) 80%, var(--ui-text));
}
</style>
