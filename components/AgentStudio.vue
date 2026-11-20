<template>
  <div class="studio">
    <header class="studio-top">
      <div class="studio-top__left">
        <CfButton tone="secondary" icon="i-lucide-arrow-left" @click="goBack">
          {{ t('common.back') }}
        </CfButton>
        <div class="studio-title-block">
          <input
            v-model="form.name"
            class="studio-name-input"
            :placeholder="t('agents.namePh')"
            @input="markDirty"
          >
          <p class="studio-sub">{{ form.description || t('agents.createDesc') }}</p>
        </div>
      </div>
      <div class="studio-tabs" role="tablist">
        <button type="button" class="studio-tab studio-tab--on" role="tab" aria-selected="true">
          {{ t('agents.studioConfig') }}
        </button>
      </div>
      <div class="studio-top__right">
        <span class="studio-save-state" :class="{ 'studio-save-state--ok': !dirty }">
          ● {{ dirty ? t('agents.studioUnsaved') : t('agents.studioSaved') }}
        </span>
        <CfButton
          tone="primary"
          icon="i-lucide-save"
          :loading="saving"
          @click="handleSave"
        >
          {{ t('common.save') }}
        </CfButton>
      </div>
    </header>

    <div class="studio-body">
      <!-- Left: configuration -->
      <aside class="studio-config">
        <section class="cfg-block">
          <label class="cfg-label">{{ t('common.description') }}</label>
          <UTextarea
            v-model="form.description"
            class="w-full"
            :rows="2"
            :placeholder="t('common.optionalDesc')"
            @update:model-value="markDirty"
          />
        </section>

        <section class="cfg-block">
          <label class="cfg-label">{{ t('common.model') }}</label>
          <USelect
            v-model="form.model"
            class="w-full"
            :items="modelOptions"
            :placeholder="t('agents.pickModel')"
            @update:model-value="markDirty"
          />
          <p v-if="errors.model" class="field__error">{{ errors.model }}</p>
        </section>

        <section class="cfg-block">
          <label class="cfg-label">{{ t('agents.boundPrompt') }}</label>
          <USelect
            v-model="form.prompt_id"
            class="w-full"
            :items="promptOptions"
            :placeholder="t('agents.boundPromptPh')"
            @update:model-value="markDirty"
          />
          <p class="cfg-hint">{{ t('agents.boundPromptHint') }}</p>
        </section>

        <section class="cfg-block">
          <label class="cfg-label">{{ t('agents.systemPrompt') }}</label>
          <UTextarea
            v-model="form.system_prompt"
            class="w-full cfg-prompt"
            :rows="8"
            :placeholder="t('agents.studioPromptPh')"
            :disabled="!!form.prompt_id"
            @update:model-value="markDirty"
          />
        </section>

        <section class="cfg-row">
          <div class="cfg-row__main">
            <UIcon name="i-lucide-sparkles" class="size-4" />
            <span>{{ t('agents.sourceSkill') }}</span>
          </div>
          <USelect
            v-model="form.skill_id"
            class="cfg-row__select"
            :items="skillOptions"
            :placeholder="t('agents.pickSkill')"
            @update:model-value="onSkillChange"
          />
        </section>

        <section class="cfg-row cfg-row--stack">
          <div class="cfg-row__main">
            <UIcon name="i-lucide-wrench" class="size-4" />
            <span>{{ t('agents.tools') }}</span>
          </div>
          <div class="tools">
            <UCheckbox
              v-for="tool in toolOptions"
              :key="tool.value"
              :model-value="form.tools.includes(tool.value)"
              :label="tool.label"
              @update:model-value="(checked: boolean) => toggleTool(tool.value, checked)"
            />
          </div>
        </section>

        <section class="cfg-row">
          <div class="cfg-row__main">
            <UIcon name="i-lucide-power" class="size-4" />
            <span>{{ t('common.status') }}</span>
          </div>
          <div class="status-row">
            <USwitch v-model="statusEnabled" @update:model-value="markDirty" />
            <span>{{ statusEnabled ? t('common.enabled') : t('common.disabled') }}</span>
          </div>
        </section>

        <p v-if="errors.name" class="field__error">{{ errors.name }}</p>
      </aside>

      <!-- Right: build / preview -->
      <section class="studio-stage">
        <div class="stage-tabs" role="tablist">
          <UTooltip :content="stageTipContent" :ui="stageTipUi">
            <button
              type="button"
              class="stage-tab"
              :class="{ 'stage-tab--on': stage === 'build' }"
              role="tab"
              :aria-selected="stage === 'build'"
              @click="stage = 'build'"
            >
              <UIcon name="i-lucide-hammer" class="size-3.5" />
              {{ t('agents.studioBuild') }}
              <UIcon name="i-lucide-circle-help" class="size-3.5 stage-tab__help" />
            </button>
            <template #content>
              <div class="flex flex-col gap-1.5 text-left">
                <strong class="text-sm">{{ t('agents.studioBuild') }}</strong>
                <p class="text-xs leading-relaxed opacity-90">{{ t('agents.studioBuildTip') }}</p>
                <span class="text-xs font-medium underline underline-offset-2 opacity-95">{{ t('agents.studioLearnMore') }}</span>
              </div>
            </template>
          </UTooltip>
          <UTooltip :content="stageTipContent" :ui="stageTipUi">
            <button
              type="button"
              class="stage-tab"
              :class="{ 'stage-tab--on': stage === 'preview' }"
              role="tab"
              :aria-selected="stage === 'preview'"
              @click="stage = 'preview'"
            >
              <UIcon name="i-lucide-play" class="size-3.5" />
              {{ t('agents.studioPreview') }}
              <UIcon name="i-lucide-circle-help" class="size-3.5 stage-tab__help" />
            </button>
            <template #content>
              <div class="flex flex-col gap-1.5 text-left">
                <strong class="text-sm">{{ t('agents.studioPreview') }}</strong>
                <p class="text-xs leading-relaxed opacity-90">{{ t('agents.studioPreviewTip') }}</p>
              </div>
            </template>
          </UTooltip>
        </div>

        <CfChatPanel
          v-model="composer"
          class="stage-chat"
          :messages="activeMessages"
          :status="chatStatus"
          :placeholder="t('agents.studioChatPh', { name: form.name || t('agents.title') })"
          :submit-disabled="chatBusy || !composer.trim()"
          :markdown="true"
          @submit="sendComposer"
          @stop="stopActiveStream"
        >
          <template #empty>
            <div v-if="stage === 'build'" class="stage-tip">
              <strong>{{ t('agents.studioBuild') }}</strong>
              <p>{{ t('agents.studioBuildTip') }}</p>
              <p class="stage-tip__muted">{{ t('agents.studioBuildEmpty') }}</p>
            </div>
            <div v-else class="stage-tip">
              <strong>{{ t('agents.studioPreview') }}</strong>
              <p>{{ t('agents.studioPreviewTip') }}</p>
              <p class="stage-tip__muted">
                {{ agentId ? t('agents.studioPreviewEmpty') : t('agents.studioPreviewNeedSave') }}
              </p>
            </div>
          </template>
          <template #content="{ message, text }">
            <div class="stage-msg-body">
              <div
                v-if="text"
                class="stage-msg-md"
                v-html="renderChatMarkdown(text)"
              />
              <CfButton
                v-if="canApplyBuild(message)"
                tone="secondary"
                icon="i-lucide-check"
                class="stage-msg__apply"
                @click="applyBuildToPrompt(text)"
              >
                {{ t('agents.studioApplyPrompt') }}
              </CfButton>
            </div>
          </template>
        </CfChatPanel>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Agent, CreateAgentInput, UpdateAgentInput } from '@/composables/useAgents'
import type { ChatMessage } from '@/composables/useAgentChat'
import type { McpServer } from '@/composables/useMcpServers'
import type { Skill } from '@/composables/useSkills'
import { renderChatMarkdown } from '~/utils/chatMarkdown'
import type { CfChatStatus } from '~/utils/chatUi'

const props = defineProps<{
  mode: 'create' | 'edit'
  agentId?: string
  initial?: Agent | null
}>()

const emit = defineEmits<{
  saved: [agent: Agent]
}>()

const toast = useToast()
const { t } = useLocale()
const { create, update } = useAgents()
const { streamChat: streamAgentChat, streaming: agentStreaming, stopStream: stopAgentStream, error: agentChatError } = useAgentChat()
const { streamChat: streamModelChat, streaming: buildStreaming, stopStream: stopBuildStream, error: buildChatError } = useChatStream()
const { list: listMcpServers } = useMcpServers()
const { list: listSkills } = useSkills()
const { list: listModels } = useModels()
const { list: listPrompts } = usePrompts()

const saving = ref(false)
const dirty = ref(false)
const stage = ref<'build' | 'preview'>('build')
const composer = ref('')
const stageTipContent = { side: 'bottom' as const, align: 'start' as const, collisionPadding: 8 }
const stageTipUi = { content: 'max-w-sm whitespace-normal text-left' }
const mcpServers = ref<McpServer[]>([])
const skills = ref<Skill[]>([])
const modelOptions = ref<{ label: string; value: string }[]>([])
const promptOptions = ref<{ label: string; value: string }[]>([{ label: '—', value: '' }])
const buildMessages = ref<ChatMessage[]>([])
const previewMessages = ref<ChatMessage[]>([])

const form = reactive({
  name: '',
  description: '',
  model: '',
  system_prompt: '',
  prompt_id: '',
  tools: [] as string[],
  skill_id: '',
})
const statusEnabled = ref(true)
const errors = reactive({ name: '', model: '' })

const agentId = computed(() => props.agentId || '')
const chatBusy = computed(() => buildStreaming.value || agentStreaming.value)
const chatStatus = computed<CfChatStatus>(() => (chatBusy.value ? 'streaming' : 'ready'))
const activeMessages = computed(() =>
  stage.value === 'build' ? buildMessages.value : previewMessages.value,
)

function canApplyBuild(message: { id?: string; role?: string }) {
  if (stage.value !== 'build' || form.prompt_id || message?.role !== 'assistant') return false
  const last = buildMessages.value[buildMessages.value.length - 1]
  if (!last || last.role !== 'assistant') return false
  const lastId = `msg-${buildMessages.value.length - 1}-assistant`
  return message.id === lastId && !!last.content && !chatBusy.value
}

function stopActiveStream() {
  if (stage.value === 'build') stopBuildStream()
  else stopAgentStream()
}

const toolOptions = computed(() =>
  mcpServers.value.map((srv) => ({
    label: `${srv.name}${srv.type === 'built-in' ? '' : ' (HTTP)'}`,
    value: srv.id,
  })),
)

const skillOptions = computed(() => [
  { label: t('agents.clearSkill'), value: '' },
  ...skills.value.map((s) => ({ label: `${s.icon || ''} ${s.name}`.trim(), value: s.id })),
])

function goBack() {
  navigateTo('/agents')
}

function markDirty() {
  dirty.value = true
}

function firstConfiguredModel() {
  return modelOptions.value[0]?.value || ''
}

function fillFromAgent(agent: Agent) {
  form.name = agent.name
  form.description = agent.description || ''
  form.model = agent.model
  form.system_prompt = agent.system_prompt || ''
  form.prompt_id = agent.prompt_id || ''
  form.tools = [...(agent.tools || [])]
  form.skill_id = agent.skill_id || ''
  statusEnabled.value = agent.status === 'active'
  dirty.value = false
  errors.name = ''
  errors.model = ''
}

function skillSystemPrompt(skill: Skill) {
  const parts: string[] = []
  if (skill.description) parts.push(skill.description)
  if (skill.instructions) parts.push(skill.instructions)
  return parts.join('\n\n')
}

function onSkillChange(id: string | undefined) {
  markDirty()
  const skillId = id || ''
  form.skill_id = skillId
  if (!skillId) return
  const skill = skills.value.find((s) => s.id === skillId)
  if (!skill) return
  if (!form.name.trim()) form.name = `${skill.name}`
  if (!form.description.trim()) form.description = skill.description || ''
  if (!form.prompt_id) form.system_prompt = skillSystemPrompt(skill)
  form.model = skill.model || form.model || firstConfiguredModel()
  form.tools = [...(skill.mcp_servers || [])]
  toast.add({ title: t('agents.skillApplied', { name: skill.name }), color: 'success' })
}

function toggleTool(value: string, checked: boolean | string) {
  markDirty()
  const on = Boolean(checked)
  if (on) {
    if (!form.tools.includes(value)) form.tools.push(value)
  } else {
    form.tools = form.tools.filter((t) => t !== value)
  }
}

function validate() {
  errors.name = form.name.trim() ? '' : t('common.nameRequired')
  if (form.name.trim().length > 100) errors.name = t('common.nameTooLong')
  errors.model = form.model ? '' : t('agents.needModel')
  return !errors.name && !errors.model
}

async function handleSave() {
  if (!validate()) return
  saving.value = true
  try {
    if (props.mode === 'edit' && agentId.value) {
      const input: UpdateAgentInput = {
        name: form.name,
        description: form.description,
        model: form.model,
        system_prompt: form.system_prompt,
        prompt_id: form.prompt_id || '',
        tools: form.tools,
        skill_id: form.skill_id || undefined,
        status: statusEnabled.value ? 'active' : 'disabled',
      }
      const res = await update(agentId.value, input)
      if (res.error) {
        toast.add({ title: res.error, color: 'error' })
        return
      }
      if (res.data) {
        dirty.value = false
        emit('saved', res.data)
        toast.add({ title: t('common.saveOk'), color: 'success' })
      }
      return
    }

    const input: CreateAgentInput = {
      name: form.name,
      description: form.description,
      model: form.model,
      system_prompt: form.system_prompt,
      prompt_id: form.prompt_id || undefined,
      tools: form.tools,
      skill_id: form.skill_id || undefined,
    }
    const res = await create(input)
    if (res.error) {
      toast.add({ title: res.error, color: 'error' })
      return
    }
    if (res.data) {
      dirty.value = false
      toast.add({ title: t('common.createOk'), color: 'success' })
      emit('saved', res.data)
      await navigateTo(`/agents/${encodeURIComponent(res.data.id)}`)
    }
  } catch {
    toast.add({ title: props.mode === 'edit' ? t('common.saveFail') : t('common.createFail'), color: 'error' })
  } finally {
    saving.value = false
  }
}

function applyBuildToPrompt(content: string) {
  if (!content.trim()) return
  form.system_prompt = content
  markDirty()
  toast.add({ title: t('agents.studioApplyPrompt'), color: 'success' })
}

async function sendComposer() {
  const text = composer.value.trim()
  if (!text || chatBusy.value) return
  composer.value = ''
  if (stage.value === 'preview') {
    await sendPreview(text)
  } else {
    await sendBuild(text)
  }
}

async function sendPreview(text: string) {
  if (!agentId.value) {
    toast.add({ title: t('agents.studioPreviewNeedSave'), color: 'warning' })
    return
  }
  previewMessages.value.push({ role: 'user', content: text })
  previewMessages.value.push({ role: 'assistant', content: '' })
  const idx = previewMessages.value.length - 1
  const history = previewMessages.value.slice(0, -1)
  await streamAgentChat(agentId.value, history, (content) => {
    previewMessages.value[idx] = { role: 'assistant', content }
  })
  if (agentChatError.value) {
    toast.add({ title: agentChatError.value, color: 'error' })
  }
}

async function sendBuild(text: string) {
  buildMessages.value.push({ role: 'user', content: text })
  buildMessages.value.push({ role: 'assistant', content: '' })
  const idx = buildMessages.value.length - 1
  const builderSystem = [
    '你是智能体配置助手。根据用户目标，输出可直接用作 Agent 系统提示词的中文文案。',
    '只输出提示词正文，不要解释。可包含角色、边界、工具使用约定。',
    form.name ? `智能体名称：${form.name}` : '',
    form.description ? `简介：${form.description}` : '',
  ].filter(Boolean).join('\n')

  await streamModelChat(
    [
      { role: 'system', content: builderSystem },
      ...buildMessages.value.slice(0, -1),
    ],
    (content) => {
      buildMessages.value[idx] = { role: 'assistant', content }
    },
    { model: form.model || undefined },
  )
  if (buildChatError.value) {
    toast.add({ title: buildChatError.value, color: 'error' })
  }
}

watch(
  () => props.initial,
  (agent) => {
    if (agent) fillFromAgent(agent)
  },
  { immediate: true },
)

onMounted(async () => {
  const [modelsRes, mcpRes, skillsRes, promptsRes] = await Promise.all([
    listModels(),
    listMcpServers(),
    listSkills(),
    listPrompts(),
  ])
  modelOptions.value = (modelsRes.data || [])
    .filter((m) => m.id)
    .map((m) => ({ label: m.name || m.id, value: m.id }))
  if (!form.model && firstConfiguredModel()) form.model = firstConfiguredModel()
  if (mcpRes.data) mcpServers.value = mcpRes.data
  if (skillsRes.data) skills.value = skillsRes.data
  const items = (promptsRes.data || []).map((p) => ({ label: p.name, value: p.id }))
  promptOptions.value = [{ label: t('agents.boundPromptNone'), value: '' }, ...items]
  if (props.initial) fillFromAgent(props.initial)
})
</script>

<style scoped>
.studio {
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - var(--ui-header-height, 64px) - 24px);
  gap: 0;
}

.studio-top {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 12px;
  padding: 8px 0 14px;
  border-bottom: 1px solid var(--cf-line);
}

.studio-top__left,
.studio-top__right {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.studio-top__right {
  justify-content: flex-end;
}

.studio-title-block {
  min-width: 0;
}

.studio-name-input {
  width: 100%;
  max-width: 280px;
  border: 0;
  background: transparent;
  font-family: var(--font-display, inherit);
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--cf-ink);
  outline: none;
}

.studio-sub {
  margin: 2px 0 0;
  font-size: 0.75rem;
  color: var(--cf-ink-soft);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 280px;
}

.studio-tabs {
  display: inline-flex;
  gap: 4px;
}

.studio-tab {
  padding: 6px 12px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--cf-ink-soft);
  font-size: 0.875rem;
  cursor: default;
}

.studio-tab--on {
  background: color-mix(in oklab, var(--cf-accent) 12%, transparent);
  color: var(--cf-ink);
  font-weight: 600;
}

.studio-save-state {
  font-size: 0.8rem;
  color: var(--cf-muted, #64748b);
}

.studio-save-state--ok {
  color: #16a34a;
}

.studio-body {
  flex: 1;
  display: grid;
  grid-template-columns: minmax(300px, 380px) 1fr;
  gap: 14px;
  min-height: 0;
  padding-top: 14px;
}

.studio-config {
  min-height: 0;
  overflow: auto;
  padding: 4px 4px 24px 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
  border-right: 1px solid var(--cf-line);
  padding-right: 14px;
}

.cfg-block {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.cfg-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--cf-ink);
}

.cfg-hint {
  margin: 0;
  font-size: 0.72rem;
  color: var(--cf-ink-soft);
  line-height: 1.4;
}

.cfg-prompt :deep(textarea) {
  min-height: 160px;
}

.cfg-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid var(--cf-line);
  border-radius: 10px;
  background: color-mix(in srgb, var(--cf-ink) 2%, transparent);
}

.cfg-row--stack {
  flex-direction: column;
  align-items: stretch;
}

.cfg-row__main {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 0.875rem;
  color: var(--cf-ink);
  font-weight: 500;
}

.cfg-row__select {
  width: min(180px, 55%);
}

.tools {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 14px;
}

.status-row {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8125rem;
  color: var(--cf-ink-soft);
}

.field__error {
  margin: 0;
  font-size: 0.75rem;
  color: var(--cf-danger);
}

.studio-stage {
  min-height: 0;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--cf-line);
  border-radius: 14px;
  background: var(--cf-bg-elevated, #fff);
  overflow: hidden;
}

.stage-tabs {
  display: flex;
  gap: 4px;
  padding: 10px 12px;
  border-bottom: 1px solid var(--cf-line);
}

.stage-tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: var(--cf-ink-soft);
  font-size: 0.85rem;
  cursor: pointer;
}

.stage-tab--on {
  background: color-mix(in oklab, var(--cf-accent) 14%, transparent);
  color: var(--cf-ink);
  font-weight: 600;
}

.stage-tab__help {
  opacity: 0.55;
}

.stage-chat {
  flex: 1;
  min-height: 280px;
}

.stage-chat :deep(.cf-chat-panel__body) {
  padding: 16px;
}

.stage-tip {
  padding: 14px 16px;
  border-radius: 12px;
  background: color-mix(in oklab, var(--cf-accent) 6%, transparent);
  border: 1px solid color-mix(in oklab, var(--cf-accent) 18%, var(--cf-line));
}

.stage-tip strong {
  display: block;
  margin-bottom: 6px;
  color: var(--cf-ink);
}

.stage-tip p {
  margin: 0;
  font-size: 0.85rem;
  line-height: 1.55;
  color: var(--cf-ink-soft);
}

.stage-tip__muted {
  margin-top: 8px !important;
  font-size: 0.78rem !important;
}

.stage-msg-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stage-msg-md :deep(p) {
  margin: 0 0 0.5em;
}

.stage-msg-md :deep(p:last-child) {
  margin-bottom: 0;
}

.stage-msg__apply {
  align-self: flex-start;
}

@media (max-width: 900px) {
  .studio-top {
    grid-template-columns: 1fr;
  }

  .studio-tabs {
    justify-content: center;
  }

  .studio-body {
    grid-template-columns: 1fr;
  }

  .studio-config {
    border-right: 0;
    padding-right: 0;
    max-height: none;
  }
}
</style>
