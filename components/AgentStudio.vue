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

        <section class="cfg-block">
          <label class="cfg-label">{{ t('agents.openingMessage') }}</label>
          <UTextarea
            v-model="form.opening_message"
            class="w-full"
            :rows="2"
            :placeholder="t('agents.openingMessagePh')"
            @update:model-value="markDirty"
          />
          <p class="cfg-hint">{{ t('agents.openingMessageHint') }}</p>
        </section>

        <section class="cfg-block">
          <label class="cfg-label">{{ t('agents.suggestedPrompts') }}</label>
          <div class="suggested-list">
            <div
              v-for="(_item, idx) in form.suggested_prompts"
              :key="idx"
              class="suggested-row"
            >
              <UInput
                v-model="form.suggested_prompts[idx]"
                class="w-full"
                :placeholder="t('agents.suggestedPromptPh', { n: idx + 1 })"
                @update:model-value="markDirty"
              />
              <CfButton
                tone="secondary"
                icon="i-lucide-x"
                :aria-label="t('common.delete')"
                @click="removeSuggested(idx)"
              />
            </div>
            <CfButton
              v-if="form.suggested_prompts.length < 6"
              tone="secondary"
              icon="i-lucide-plus"
              @click="addSuggested"
            >
              {{ t('agents.addSuggestedPrompt') }}
            </CfButton>
          </div>
          <p class="cfg-hint">{{ t('agents.suggestedPromptsHint') }}</p>
        </section>

        <section class="cfg-row">
          <div class="cfg-row__main">
            <UIcon :name="CF_ICONS.ai" class="size-4" />
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
              :ui="toolCheckboxUi"
              @update:model-value="(checked: boolean) => toggleTool(tool.value, checked)"
            />
          </div>
        </section>

        <section class="cfg-row cfg-row--stack">
          <div class="cfg-row__main">
            <UIcon :name="CF_ICONS.knowledge" class="size-4" />
            <span>{{ t('agents.boundKnowledge') }}</span>
          </div>
          <div class="tools">
            <p v-if="!kbOptions.length" class="cfg-hint">{{ t('agents.boundKnowledgeEmpty') }}</p>
            <UCheckbox
              v-for="kb in kbOptions"
              :key="kb.value"
              :model-value="form.rag_kb_ids.includes(kb.value)"
              :label="kb.label"
              :ui="toolCheckboxUi"
              @update:model-value="(checked: boolean) => toggleKnowledge(kb.value, checked)"
            />
          </div>
          <p class="cfg-hint">{{ t('agents.boundKnowledgeHint') }}</p>
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
          <div class="stage-tab-group">
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
            </button>
            <UTooltip :content="stageTipContent" :ui="stageTipUi">
              <button
                type="button"
                class="stage-tab__help-btn"
                :aria-label="t('agents.studioBuildTip')"
                @click.stop
              >
                <UIcon name="i-lucide-circle-help" class="size-3.5" />
              </button>
              <template #content>
                <div class="flex flex-col gap-1.5 text-left">
                  <strong class="text-sm">{{ t('agents.studioBuild') }}</strong>
                  <p class="text-xs leading-relaxed opacity-90">{{ t('agents.studioBuildTip') }}</p>
                  <span class="text-xs font-medium underline underline-offset-2 opacity-95">{{ t('agents.studioLearnMore') }}</span>
                </div>
              </template>
            </UTooltip>
          </div>
          <div class="stage-tab-group">
            <button
              type="button"
              class="stage-tab"
              :class="{ 'stage-tab--on': stage === 'preview' }"
              role="tab"
              :aria-selected="stage === 'preview'"
              @click="stage = 'preview'"
            >
              <UIcon name="i-lucide-message-circle" class="size-3.5" />
              {{ t('agents.studioPreview') }}
            </button>
            <UTooltip :content="stageTipContent" :ui="stageTipUi">
              <button
                type="button"
                class="stage-tab__help-btn"
                :aria-label="t('agents.studioPreviewTip')"
                @click.stop
              >
                <UIcon name="i-lucide-circle-help" class="size-3.5" />
              </button>
              <template #content>
                <div class="flex flex-col gap-1.5 text-left">
                  <strong class="text-sm">{{ t('agents.studioPreview') }}</strong>
                  <p class="text-xs leading-relaxed opacity-90">{{ t('agents.studioPreviewTip') }}</p>
                </div>
              </template>
            </UTooltip>
          </div>
        </div>

        <CfChatPanel
          v-model="composer"
          class="stage-chat"
          :messages="activeMessages"
          :status="chatStatus"
          :placeholder="stagePlaceholder"
          :submit-label="stageSubmitLabel"
          :submit-disabled="chatBusy || !composer.trim() || (stage === 'preview' && !agentId)"
          :markdown="true"
          composer-wrap-class="stage-composer-wrap"
          prompt-class="stage-prompt"
          @submit="sendComposer"
          @stop="stopActiveStream"
        >
          <template #empty>
            <div class="stage-hero">
              <div class="stage-hero__mark" aria-hidden="true">
                <img src="/favicon.svg" alt="" class="stage-hero__logo">
              </div>
              <h2 class="stage-hero__title">
                {{ stage === 'build' ? t('agents.studioBuildHeroTitle') : t('agents.studioPreviewHeroTitle') }}
              </h2>
              <p class="stage-hero__sub">
                {{
                  stage === 'build'
                    ? t('agents.studioBuildHeroSub')
                    : (form.opening_message.trim() || t('agents.studioPreviewHeroSub'))
                }}
              </p>
              <div
                v-if="stage === 'preview' && previewSuggested.length"
                class="stage-suggested"
              >
                <CfButton
                  v-for="chip in previewSuggested"
                  :key="chip"
                  tone="secondary"
                  icon="i-lucide-sparkles"
                  @click="sendSuggestion(chip)"
                >
                  {{ chip }}
                </CfButton>
              </div>
              <p
                v-if="stage === 'build' && !agentId"
                class="stage-hero__warn"
              >
                <UIcon name="i-lucide-triangle-alert" class="size-3.5 shrink-0" />
                <span>{{ t('agents.studioBuildWarnUnsaved') }}</span>
              </p>
              <p
                v-else-if="stage === 'preview' && !agentId"
                class="stage-hero__warn"
              >
                <UIcon name="i-lucide-triangle-alert" class="size-3.5 shrink-0" />
                <span>{{ t('agents.studioPreviewNeedSave') }}</span>
              </p>
            </div>
          </template>
          <template #content="{ message, text }">
            <div class="stage-msg-body">
              <div
                v-if="text"
                class="stage-msg-md"
                v-html="renderChatMarkdown(displayBuildText(text))"
              />
              <CfButton
                v-if="canApplyBuild(message)"
                tone="secondary"
                icon="i-lucide-check"
                class="stage-msg__apply"
                @click="applyBuildFromContent(text)"
              >
                {{ t('agents.studioApplyConfig') }}
              </CfButton>
            </div>
          </template>
          <template #after-composer>
            <div class="stage-composer-foot">
              {{ stage === 'build' ? t('agents.studioBuildFoot') : t('agents.studioPreviewFoot') }}
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
import type { KnowledgeBase } from '@/composables/useKnowledgeBases'
import type { McpServer } from '@/composables/useMcpServers'
import type { Skill } from '@/composables/useSkills'
import { CF_ICONS } from '~/constants/icons'
import {
  detectUnsupportedBuildIntents,
  extractAgentBuildConfig,
  listUnresolvedBuildTools,
  resolveBuildToolIds,
  stripAgentBuildFence,
  type UnsupportedBuildKind,
} from '~/utils/agentBuildConfig'
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
const { listKBs } = useKnowledgeBases()

const saving = ref(false)
const dirty = ref(false)
const stage = ref<'build' | 'preview'>('build')
const composer = ref('')
const stageTipContent = {
  side: 'bottom' as const,
  align: 'start' as const,
  sideOffset: 10,
  collisionPadding: 12,
}
const stageTipUi = { content: 'max-w-sm whitespace-normal text-left z-50' }
/** 未勾选时 Nuxt UI 默认 ring-accented 几乎看不见，加实线框 */
const toolCheckboxUi = {
  base: 'rounded-sm ring-1 ring-inset ring-[color-mix(in_oklab,var(--cf-ink)_45%,transparent)] bg-[var(--cf-bg-elevated,#fff)]',
}
const mcpServers = ref<McpServer[]>([])
const knowledgeBases = ref<KnowledgeBase[]>([])
const skills = ref<Skill[]>([])
const modelOptions = ref<{ label: string; value: string }[]>([])
const promptOptions = ref<{ label: string; value: string }[]>([{ label: '—', value: '' }])
const buildMessages = ref<ChatMessage[]>([])
const previewMessages = ref<ChatMessage[]>([])
/** Last build reply already applied into the left form (avoid double-apply). */
const buildAppliedKey = ref('')

const form = reactive({
  name: '',
  description: '',
  model: '',
  system_prompt: '',
  prompt_id: '',
  opening_message: '',
  suggested_prompts: [] as string[],
  rag_kb_ids: [] as string[],
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
const previewSuggested = computed(() =>
  form.suggested_prompts.map(s => s.trim()).filter(Boolean).slice(0, 6),
)

function addSuggested() {
  if (form.suggested_prompts.length >= 6) return
  form.suggested_prompts.push('')
  markDirty()
}

function removeSuggested(idx: number) {
  form.suggested_prompts.splice(idx, 1)
  markDirty()
}

function sendSuggestion(text: string) {
  if (!text.trim() || chatBusy.value) return
  composer.value = text
  void sendComposer()
}

const stagePlaceholder = computed(() =>
  stage.value === 'build'
    ? t('agents.studioBuildPh')
    : t('agents.studioPreviewPh'),
)

const stageSubmitLabel = computed(() =>
  stage.value === 'build'
    ? t('agents.studioBuildStart')
    : t('agents.studioPreviewStart'),
)

function lastBuildAssistant(): ChatMessage | null {
  for (let i = buildMessages.value.length - 1; i >= 0; i--) {
    const msg = buildMessages.value[i]
    if (msg?.role === 'assistant' && msg.content.trim()) return msg
  }
  return null
}

function canApplyBuild(message: { id?: string; role?: string }) {
  if (stage.value !== 'build' || message?.role !== 'assistant') return false
  const last = lastBuildAssistant()
  if (!last) return false
  const lastIdx = buildMessages.value.lastIndexOf(last)
  const lastId = `msg-${lastIdx}-assistant`
  if (message.id !== lastId || chatBusy.value) return false
  return buildAppliedKey.value !== last.content
}

function displayBuildText(text: string) {
  return stage.value === 'build' ? stripAgentBuildFence(text) : text
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

const kbOptions = computed(() =>
  knowledgeBases.value
    .filter(kb => kb.status === 'active')
    .map(kb => ({ label: kb.name, value: kb.id })),
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
  form.opening_message = agent.opening_message || ''
  form.suggested_prompts = [...(agent.suggested_prompts || [])]
  form.rag_kb_ids = [...(agent.rag_kb_ids || [])]
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

function toggleKnowledge(value: string, checked: boolean | string) {
  markDirty()
  const on = Boolean(checked)
  if (on) {
    if (form.rag_kb_ids.length >= 8) {
      toast.add({ title: t('agents.boundKnowledgeMax'), color: 'warning' })
      return
    }
    if (!form.rag_kb_ids.includes(value)) form.rag_kb_ids.push(value)
  } else {
    form.rag_kb_ids = form.rag_kb_ids.filter((id) => id !== value)
  }
}

function validate() {
  errors.name = form.name.trim() ? '' : t('common.nameRequired')
  if (form.name.trim().length > 100) errors.name = t('common.nameTooLong')
  errors.model = form.model ? '' : t('agents.needModel')
  return !errors.name && !errors.model
}

function toolCatalog() {
  return mcpServers.value.map(s => ({ id: s.id, name: s.name }))
}

function unsupportedBuildReply(kinds: UnsupportedBuildKind[]): string {
  const lines = kinds.map((k) => {
    if (k === 'vm') return t('agents.studioUnsupportedVm')
    if (k === 'voice') return t('agents.studioUnsupportedVoice')
    if (k === 'publish') return t('agents.studioUnsupportedPublish')
    return t('agents.studioUnsupportedToolInstall')
  })
  return [t('agents.studioUnsupportedLead'), ...lines.map(l => `- ${l}`), t('agents.studioUnsupportedTail')].join('\n')
}

function warnUnresolvedTools(unresolved: string[]) {
  if (!unresolved.length) return
  toast.add({
    title: t('agents.studioToolsMissing', { names: unresolved.join('、') }),
    color: 'warning',
  })
}

function applyBuildFromContent(content: string, opts?: { silent?: boolean }): boolean {
  const { config } = extractAgentBuildConfig(content)
  if (!config) {
    if (!opts?.silent) toast.add({ title: t('agents.studioApplyEmpty'), color: 'warning' })
    return false
  }

  const catalog = toolCatalog()
  const unresolved = listUnresolvedBuildTools(config.tools, catalog)
  let changed = false
  if (config.name && !form.name.trim()) {
    form.name = config.name
    changed = true
  }
  if (config.description) {
    form.description = config.description
    changed = true
  }
  if (config.system_prompt && !form.prompt_id) {
    form.system_prompt = config.system_prompt
    changed = true
  }
  if (config.tools?.length) {
    const ids = resolveBuildToolIds(config.tools, catalog)
    if (ids.length) {
      form.tools = [...new Set([...form.tools, ...ids])]
      changed = true
    }
  }

  if (!changed) {
    if (!opts?.silent) {
      if (unresolved.length) warnUnresolvedTools(unresolved)
      else toast.add({ title: t('agents.studioApplyEmpty'), color: 'warning' })
    }
    return false
  }

  buildAppliedKey.value = content
  markDirty()
  if (!opts?.silent) {
    toast.add({ title: t('agents.studioApplyConfigOk'), color: 'success' })
    warnUnresolvedTools(unresolved)
  }
  return true
}

/** Before save: solidify latest build reply into the left form if not applied yet. */
function solidifyPendingBuild() {
  const last = lastBuildAssistant()
  if (!last || buildAppliedKey.value === last.content) return
  applyBuildFromContent(last.content, { silent: true })
}

async function handleSave() {
  solidifyPendingBuild()
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
        opening_message: form.opening_message,
        suggested_prompts: form.suggested_prompts.map(s => s.trim()).filter(Boolean),
        rag_kb_ids: [...form.rag_kb_ids],
        tools: form.tools,
        skill_id: form.skill_id || '',
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
      opening_message: form.opening_message || undefined,
      suggested_prompts: form.suggested_prompts.map(s => s.trim()).filter(Boolean),
      rag_kb_ids: [...form.rag_kb_ids],
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

function buildAssistantSystemPrompt() {
  const toolLines = mcpServers.value.length
    ? mcpServers.value.map(s => `- id: ${s.id} | name: ${s.name}`).join('\n')
    : '- （当前无可用工具）'
  return [
    '你是智能体「构建」助手。通过对话帮用户定目标、选工具、带跑示例，并输出可固化到 Agent 的配置。',
    '规则：',
    '1. 先用简短中文说明你做了什么、如何试用（可给 1～2 轮示例对话）。',
    '2. 文末必须附带一个 ```agent-config 代码块，JSON 字段：',
    '   - system_prompt（必填，完整系统提示词）',
    '   - tools（可选，工具 id 或 name 数组，只能从下方清单选）',
    '   - name / description（可选，名称与简介）',
    '3. 严禁编造清单外的工具名；用户要的工具不在清单时，必须明确说「当前不支持，请先到 MCP 页接入」，tools 只填清单内项或留空。',
    '4. 当前构建不支持：虚拟机、语音播放/输入、发布渠道、在对话里安装新 MCP。被问及时直接说明不支持并给出替代（用已有工具 / 去对应页面配置）。',
    '5. 需要鉴权的工具，提醒用户去 MCP/模型页配置密钥，不要假装已经装好。',
    '6. 不要省略 agent-config 代码块（即使部分能力不支持，仍可输出能落地的 system_prompt）。',
    '',
    `当前名称：${form.name || '（未填）'}`,
    `当前简介：${form.description || '（未填）'}`,
    `当前模型：${form.model || '（未选）'}`,
    `已选工具：${form.tools.length ? form.tools.join(', ') : '（无）'}`,
    '可用工具清单：',
    toolLines,
  ].join('\n')
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
    if (agentChatError.value === t('play.authExpired')) {
      useAuth().redirectToLogin()
    }
  }
}

async function sendBuild(text: string) {
  buildMessages.value.push({ role: 'user', content: text })
  buildMessages.value.push({ role: 'assistant', content: '' })
  const idx = buildMessages.value.length - 1
  buildAppliedKey.value = ''

  // Hard gate: clearly unsupported asks get a fixed reply (no model call).
  const unsupported = detectUnsupportedBuildIntents(text)
  if (unsupported.length) {
    buildMessages.value[idx] = { role: 'assistant', content: unsupportedBuildReply(unsupported) }
    toast.add({ title: t('agents.studioUnsupportedToast'), color: 'warning' })
    return
  }

  await streamModelChat(
    [
      { role: 'system', content: buildAssistantSystemPrompt() },
      ...buildMessages.value.slice(0, -1),
    ],
    (content) => {
      buildMessages.value[idx] = { role: 'assistant', content }
    },
    { model: form.model || undefined },
  )
  if (buildChatError.value) {
    toast.add({ title: buildChatError.value, color: 'error' })
    if (buildChatError.value === t('play.authExpired')) {
      useAuth().redirectToLogin()
    }
    return
  }

  const last = buildMessages.value[idx]?.content || ''
  const { config } = extractAgentBuildConfig(last)
  const unresolved = listUnresolvedBuildTools(config?.tools, toolCatalog())
  if (unresolved.length) {
    warnUnresolvedTools(unresolved)
    const note = `\n\n${t('agents.studioToolsMissingNote', { names: unresolved.join('、') })}`
    buildMessages.value[idx] = {
      role: 'assistant',
      content: `${last}${note}`,
    }
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
  const [modelsRes, mcpRes, skillsRes, promptsRes, kbRes] = await Promise.all([
    listModels(),
    listMcpServers(),
    listSkills(),
    listPrompts(),
    listKBs(),
  ])
  modelOptions.value = (modelsRes.data || [])
    .filter((m) => m.id)
    .map((m) => ({ label: m.name || m.id, value: m.id }))
  if (!form.model && firstConfiguredModel()) form.model = firstConfiguredModel()
  if (mcpRes.data) mcpServers.value = mcpRes.data
  if (skillsRes.data) skills.value = skillsRes.data
  if (kbRes.data) knowledgeBases.value = kbRes.data
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

.suggested-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.suggested-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.stage-suggested {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  margin-top: 4px;
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

.tools :deep(button[role='checkbox'][data-state='unchecked']) {
  box-shadow: inset 0 0 0 1.5px color-mix(in oklab, var(--cf-ink) 42%, transparent);
  background: var(--cf-bg-elevated, #fff);
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
  border: 1px solid color-mix(in oklab, var(--cf-line) 80%, transparent);
  border-radius: 16px;
  background: color-mix(in oklab, var(--cf-bg, #f8fafc) 88%, #fff);
  overflow: hidden;
  box-shadow: 0 1px 2px color-mix(in oklab, var(--cf-ink) 4%, transparent);
}

.stage-tabs {
  display: flex;
  gap: 4px;
  padding: 12px 16px 8px;
  background: transparent;
}

.stage-tab-group {
  display: inline-flex;
  align-items: center;
  gap: 2px;
}

.stage-tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--cf-ink-soft);
  font-size: 0.875rem;
  cursor: pointer;
}

.stage-tab--on {
  background: transparent;
  color: color-mix(in oklab, var(--cf-accent) 85%, var(--cf-ink));
  font-weight: 600;
}

.stage-tab__help-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: var(--cf-ink-soft);
  opacity: 0.5;
  cursor: help;
}

.stage-tab__help-btn:hover {
  opacity: 0.9;
  background: color-mix(in oklab, var(--cf-ink) 6%, transparent);
}

.stage-chat {
  flex: 1;
  min-height: 280px;
}

.stage-chat :deep(.cf-chat-panel__body) {
  padding: 8px 24px 16px;
}

.stage-chat :deep(.cf-chat-panel__messages) {
  width: 100%;
  max-width: 720px;
  margin: 0 auto;
}

.stage-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 10px;
  width: 100%;
  max-width: 420px;
  min-height: 100%;
  margin: 0 auto;
  padding: 48px 16px 32px;
  flex: 1;
}

.stage-hero__mark {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  display: grid;
  place-items: center;
  background: color-mix(in oklab, var(--cf-accent) 14%, #fff);
  box-shadow: 0 8px 24px color-mix(in oklab, var(--cf-accent) 18%, transparent);
  margin-bottom: 6px;
}

.stage-hero__logo {
  width: 34px;
  height: 34px;
  object-fit: contain;
}

.stage-hero__title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--cf-ink);
  letter-spacing: -0.02em;
}

.stage-hero__sub {
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.55;
  color: var(--cf-ink-soft);
}

.stage-hero__warn {
  margin: 8px 0 0;
  display: inline-flex;
  align-items: flex-start;
  gap: 6px;
  max-width: 360px;
  font-size: 0.78rem;
  line-height: 1.45;
  color: #b45309;
  text-align: left;
}

.stage-chat :deep(.stage-composer-wrap) {
  border-top: 0;
  padding: 0 20px 16px;
  max-width: 760px;
  width: 100%;
  margin: 0 auto;
  gap: 0;
}

.stage-chat :deep(.stage-prompt) {
  --tw-ring-shadow: 0 0 #0000;
  background: #fff;
  border-radius: 18px 18px 0 0;
  box-shadow: 0 8px 28px color-mix(in oklab, var(--cf-ink) 8%, transparent);
}

.stage-composer-foot {
  padding: 10px 16px;
  border-radius: 0 0 18px 18px;
  background: color-mix(in oklab, var(--cf-accent) 12%, #eff6ff);
  color: color-mix(in oklab, var(--cf-accent) 55%, #1e3a5f);
  font-size: 0.78rem;
  line-height: 1.4;
  text-align: center;
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
