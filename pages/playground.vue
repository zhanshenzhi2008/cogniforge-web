<template>
  <div class="playground-page">
    <div class="playground-container" :class="{ 'is-history-collapsed': sidebarCollapsed }">
      <aside class="sidebar">
        <PlaygroundHistoryPanel
          :items="conversations"
          :active-id="currentConversationId"
          @new="startNewChat"
          @select="loadConversation"
          @delete="deleteConversation"
        />
      </aside>

      <main class="chat-area">
        <div class="chat-topbar cf-surface">
          <div class="chat-title">
            <CfButton
              class="sidebar-fold"
              tone="icon"
              :icon="sidebarCollapsed ? 'i-lucide-panel-left-open' : 'i-lucide-panel-left-close'"
              :tip="sidebarCollapsed ? t('play.showHistory') : t('play.hideHistory')"
              @click="toggleDesktopHistory"
            />
            <div class="chat-title-text">
              <span class="chat-title-main">{{ t('play.title') }}</span>
              <span class="chat-title-sub">{{ currentTitle }}</span>
            </div>
          </div>
          <div class="chat-topbar-actions">
            <CfButton
              class="history-toggle"
              tone="secondary"
              icon="i-lucide-history"
              @click="historyOpen = true"
            >
              {{ t('play.history') }}
            </CfButton>
            <CfButton
              tone="secondary"
              icon="i-lucide-sliders-horizontal"
              @click="configOpen = true"
            >
              {{ t('play.params') }}
            </CfButton>
          </div>
        </div>

        <div class="messages-wrapper">
          <div v-if="messages.length === 0" class="empty-state">
            <div class="empty-glow" />
            <UIcon name="i-lucide-messages-square" class="size-14 empty-icon" />
            <p class="empty-title font-display">{{ t('play.emptyTitle') }}</p>
            <p class="empty-sub">{{ t('play.emptySub') }}</p>
            <div class="suggestion-chips">
              <CfButton
                v-for="chip in suggestionChips"
                :key="chip"
                tone="secondary"
                icon="i-lucide-sparkles"
                @click="sendSuggestion(chip)"
              >
                {{ chip }}
              </CfButton>
            </div>
          </div>

          <div v-else class="chat-column">
            <UChatMessages
              :messages="uiMessages"
              :status="chatStatus"
              :should-auto-scroll="true"
              :user="{ side: 'right', variant: 'soft', icon: 'i-lucide-user' }"
              :assistant="{ side: 'left', variant: 'naked', icon: 'i-lucide-sparkles' }"
              :spacing-offset="24"
              class="chat-messages"
            >
              <template #content="{ message }">
                <div
                  class="message-md"
                  v-html="renderMarkdown(partsToText(message?.parts))"
                />
              </template>
              <template #indicator>
                <UChatShimmer :text="t('play.thinking')" />
              </template>
            </UChatMessages>
          </div>
        </div>

        <div class="composer-area">
          <QuotaBar :snap="quotaSnap" />
          <div class="composer-meta">
            <span class="token-hint">{{ tokenCount }} tokens</span>
          </div>
          <UChatPrompt
            v-model="inputMessage"
            :disabled="streaming || quotaGone"
            :submit-on-enter="true"
            :placeholder="quotaGone ? t('quota.placeholderDone') : t('play.placeholder')"
            variant="subtle"
            :rows="2"
            :maxrows="6"
            class="composer-prompt"
            @submit="sendMessage"
          >
            <template #footer>
              <div class="composer-footer">
                <span class="composer-hint">{{ t('play.hint') }}</span>
                <UChatPromptSubmit
                  :status="chatStatus"
                  color="primary"
                  :disabled="quotaGone || (!inputMessage.trim() && chatStatus === 'ready')"
                  @stop="stopStreaming"
                />
              </div>
            </template>
          </UChatPrompt>
        </div>
      </main>
    </div>

    <USlideover v-model:open="historyOpen" :title="t('play.historyTitle')" :ui="{ content: 'max-w-sm w-full' }">
      <template #body>
        <PlaygroundHistoryPanel
          :items="conversations"
          :active-id="currentConversationId"
          @new="startNewChat(); historyOpen = false"
          @select="id => { loadConversation(id); historyOpen = false }"
          @delete="deleteConversation"
        />
      </template>
    </USlideover>

    <USlideover v-model:open="configOpen" :title="t('play.paramsTitle')" :ui="{ content: 'max-w-sm w-full' }">
      <template #body>
        <PlaygroundConfigPanel
          v-model:selected-agent="selectedAgent"
          v-model:selected-model="selectedModel"
          :selected-agent-info="selectedAgentInfo"
          :agent-options="agentOptions"
          :model-options="modelOptions"
          :params="params"
          @agent-change="handleAgentChange"
        />
      </template>
    </USlideover>
  </div>
</template>

<script setup lang="ts">
import { marked } from 'marked'
import { apiUrl } from '~/utils/apiBase'
import type { Agent } from '@/composables/useAgents'
import type { ConversationMessage, ConversationSummary } from '@/composables/useConversations'
import type { QuotaSnapshot } from '@/composables/useQuota'

definePageMeta({
  layout: 'default',
  requiresAuth: true,
})

/** Local playground message — API still uses role + content only. */
interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  time?: string
}

/** Thin AI-SDK-shaped message for Nuxt UI Chat (parts). */
interface UIChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  parts: Array<{ type: 'text'; text: string }>
}

interface Model {
  id: string
  name: string
}

type ChatStatus = 'submitted' | 'streaming' | 'ready' | 'error'

const route = useRoute()
const router = useRouter()
const config = useRuntimeConfig()
const toast = useToast()
const { t } = useLocale()
const { list: listAgents, get: getAgent } = useAgents()
const { list: listConversations, get: getConversation, create: createConversation, update: updateConversation, remove: removeConversation } = useConversations()
const { get } = useApi()
const { me: fetchQuota } = useQuota()
const quotaSnap = ref<QuotaSnapshot | null>(null)
const quotaGone = computed(() => quotaExhausted(quotaSnap.value))

const messages = ref<Message[]>([])
const inputMessage = ref('')
const streaming = ref(false)
const selectedModel = ref('')
const models = ref<Model[]>([])
const agents = ref<Agent[]>([])
/** USelect forbids empty-string item values; sentinel = “no agent”. */
const NONE_AGENT = '__none__'
const selectedAgent = ref(NONE_AGENT)
const selectedAgentInfo = ref<Agent | null>(null)
const abortController = ref<AbortController | null>(null)
const configOpen = ref(false)
const historyOpen = ref(false)
const SIDEBAR_KEY = 'cf-play-sidebar-collapsed'
const sidebarCollapsed = ref(false)
const conversations = ref<ConversationSummary[]>([])
const currentConversationId = ref('')
const conversationTitle = ref('')
let persistSeq = 0

const suggestionChips = computed(() => [
  t('play.chip1'),
  t('play.chip2'),
  t('play.chip3'),
])

const currentTitle = computed(() => {
  if (conversationTitle.value) return conversationTitle.value
  if (selectedAgentInfo.value) {
    return t('play.withAgent', { name: selectedAgentInfo.value.name })
  }
  return t('play.generic')
})

const agentOptions = computed(() =>
  [
    { label: t('play.noAgent'), value: NONE_AGENT },
    ...agents.value.map(a => ({ label: a.name, value: a.id })),
  ],
)

const modelOptions = computed(() =>
  models.value.map(m => ({ label: m.name, value: m.id })),
)

const params = reactive({
  temperature: 0.7,
  max_tokens: 2048,
  top_p: 0.9,
})

const tokenCount = computed(() => {
  return messages.value.reduce((acc, msg) => acc + msg.content.length / 4, 0) | 0
})

const chatStatus = computed<ChatStatus>(() => (streaming.value ? 'streaming' : 'ready'))

/** Map local messages → UIMessage-like `{ id, role, parts }` for UChat*. */
function mapToUIMessage(msg: Message): UIChatMessage {
  return {
    id: msg.id,
    role: msg.role,
    parts: msg.content ? [{ type: 'text', text: msg.content }] : [],
  }
}

const uiMessages = computed(() => messages.value.map(mapToUIMessage))

function partsToText(parts?: Array<{ type: string; text?: string }>): string {
  if (!parts?.length) return ''
  return parts
    .filter(p => p.type === 'text' && typeof p.text === 'string')
    .map(p => p.text as string)
    .join('')
}

const renderMarkdown = (content: string) => {
  return marked.parse(content || '', { async: false }) as string
}

const notifyError = (title: string) => {
  toast.add({ title, color: 'error' })
}

const NO_ACTIVE_PROVIDER = 4010
const USER_QUOTA = 5016
const RATE_LIMIT = 5014

const refreshQuota = async () => {
  const res = await fetchQuota()
  if (res.data) quotaSnap.value = res.data
}

const notifyChatHttpError = (status: number, text: string) => {
  try {
    const parsed = JSON.parse(text)
    if (parsed?.code === NO_ACTIVE_PROVIDER) {
      notifyError(t('play.noProvider'))
      return
    }
    if (parsed?.code === USER_QUOTA) {
      notifyError(t('quota.exhausted'))
      void refreshQuota()
      return
    }
    if (parsed?.code === RATE_LIMIT) {
      notifyError(t('quota.rate'))
      return
    }
    const msg = parsed?.message || parsed?.error
    if (typeof msg === 'string' && msg.length > 0) {
      notifyError(msg)
      return
    }
  } catch {
    // 不是 JSON
  }
  notifyError(t('play.sendFailHttp', {
    status,
    detail: text ? ` - ${text}` : '',
  }))
}

const fetchAgents = async () => {
  try {
    const res = await listAgents()
    if (res.error) {
      notifyError(res.error)
      return
    }
    agents.value = res.data || []
  } catch (error) {
    console.error('Failed to fetch agents:', error)
  }
}

const handleAgentChange = async (agentId: string | undefined | null) => {
  const id = !agentId || agentId === NONE_AGENT ? NONE_AGENT : agentId
  selectedAgent.value = id
  if (id === NONE_AGENT) {
    selectedAgentInfo.value = null
    selectedModel.value = models.value[0]?.id || ''
    return
  }
  const res = await getAgent(id)
  if (res.error) {
    notifyError(res.error)
    return
  }
  selectedAgentInfo.value = res.data || null
  if (res.data?.model) {
    selectedModel.value = res.data.model
  }
}

const fetchModels = async () => {
  try {
    const res = await get<{ models: Model[] }>('/api/v1/models')
    if (res.error) return
    models.value = res.data?.models || []
    if (models.value.length > 0 && !selectedModel.value) {
      selectedModel.value = models.value[0].id
    }
  } catch (error) {
    console.error('Failed to fetch models:', error)
  }
}

const fetchConversationList = async () => {
  const res = await listConversations()
  if (res.error) {
    notifyError(res.error)
    return
  }
  conversations.value = res.data || []
}

function conversationPayload() {
  return {
    agent_id: selectedAgent.value === NONE_AGENT ? '' : selectedAgent.value,
    model: selectedModel.value,
    messages: messages.value.map((m): ConversationMessage => ({
      id: m.id,
      role: m.role,
      content: m.content,
      time: m.time,
    })),
  }
}

async function setConversationQuery(id: string | null) {
  const query = { ...route.query }
  if (id) {
    await router.replace({ query: { ...query, c: id } })
    return
  }
  const { c: _omit, ...rest } = query
  await router.replace({ query: rest })
}

async function persistConversation() {
  if (messages.value.length === 0) return
  const seq = ++persistSeq
  const snapshotId = currentConversationId.value
  const payload = conversationPayload()
  const res = snapshotId
    ? await updateConversation(snapshotId, payload)
    : await createConversation(payload)
  if (seq !== persistSeq) return
  if (res.error) {
    notifyError(res.error || t('play.saveFail'))
    return
  }
  if (!snapshotId && res.data?.id) {
    currentConversationId.value = res.data.id
    conversationTitle.value = res.data.title || ''
    await setConversationQuery(res.data.id)
  } else if (res.data?.title) {
    conversationTitle.value = res.data.title
  }
  await fetchConversationList()
}

const stopStreaming = () => {
  abortController.value?.abort()
  abortController.value = null
  streaming.value = false
}

const toggleDesktopHistory = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
}

const startNewChat = () => {
  persistSeq++
  stopStreaming()
  messages.value = []
  currentConversationId.value = ''
  conversationTitle.value = ''
  void setConversationQuery(null)
}

const sendSuggestion = (text: string) => {
  inputMessage.value = text
  sendMessage()
}

const sendMessage = async () => {
  if (!inputMessage.value.trim() || streaming.value || quotaGone.value) return

  const userMessage = inputMessage.value.trim()
  messages.value.push({
    id: crypto.randomUUID(),
    role: 'user',
    content: userMessage,
    time: new Date().toISOString(),
  })
  inputMessage.value = ''

  streaming.value = true
  const controller = new AbortController()
  abortController.value = controller

  try {
    const endpoint = selectedAgent.value !== NONE_AGENT
      ? apiUrl(`/api/v1/agents/${selectedAgent.value}/chat`, String(config.public.apiBase ?? ''))
      : apiUrl('/api/v1/chat/stream', String(config.public.apiBase ?? ''))

    const body = {
      model: selectedModel.value,
      messages: messages.value
        .filter(m => m.content.trim().length > 0)
        .map(m => ({ role: m.role, content: m.content })),
      stream: true,
      ...params,
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${useCookie('token').value}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    })

    const decoder = new TextDecoder()

    if (!response.ok) {
      const text = await response.text().catch(() => '')
      notifyChatHttpError(response.status, text)
      messages.value.pop()
      return
    }

    const reader = response.body?.getReader()
    if (!reader) {
      notifyError(t('play.sendFailBody'))
      return
    }

    messages.value.push({
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
      time: new Date().toISOString(),
    })
    const assistantMessage = messages.value[messages.value.length - 1]

    let buffer = ''

    const consumeDataLine = (line: string): boolean => {
      if (!line.startsWith('data: ')) return false
      const data = line.slice(6).trim()
      if (data === '[DONE]') return false

      try {
        const parsed = JSON.parse(data)
        if (typeof parsed?.error === 'string' && parsed.error.length > 0) {
          notifyError(parsed.error)
          if (!assistantMessage.content) {
            messages.value.pop()
          } else {
            assistantMessage.content = parsed.error
          }
          return true
        }
        const delta = parsed?.choices?.[0]?.delta?.content
        if (typeof delta === 'string' && delta.length > 0) {
          assistantMessage.content += delta
          return false
        }
        const full = parsed?.choices?.[0]?.message?.content
        if (typeof full === 'string' && full.length > 0) {
          assistantMessage.content = full
        }
      } catch {
        // ignore parse errors
      }
      return false
    }

    const consumeCompletionJSON = (raw: string): boolean => {
      const text = raw.trim()
      if (!text.startsWith('{')) return false
      try {
        const parsed = JSON.parse(text)
        const content = parsed?.choices?.[0]?.message?.content
        if (typeof content === 'string' && content.length > 0) {
          assistantMessage.content = content
          return true
        }
      } catch {
        // ignore parse errors
      }
      return false
    }

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const parts = buffer.split('\n\n')
      buffer = parts.pop() || ''

      for (const part of parts) {
        for (const line of part.split('\n')) {
          if (consumeDataLine(line)) return
        }
      }
    }

    if (buffer) {
      if (consumeCompletionJSON(buffer)) {
        return
      }
      for (const line of buffer.split('\n')) {
        if (consumeDataLine(line)) return
      }
    }
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      return
    }
    notifyError(t('play.sendFail'))
    messages.value.pop()
  } finally {
    streaming.value = false
    abortController.value = null
    await persistConversation()
    await refreshQuota()
  }
}

const loadConversation = async (id: string) => {
  if (!id || id === currentConversationId.value) return
  persistSeq++
  stopStreaming()
  const res = await getConversation(id)
  if (res.error || !res.data) {
    notifyError(res.error || t('play.loadFail'))
    return
  }
  currentConversationId.value = res.data.id
  conversationTitle.value = res.data.title || ''
  messages.value = (res.data.messages || []).map(m => ({
    id: m.id || crypto.randomUUID(),
    role: m.role === 'assistant' ? 'assistant' : 'user',
    content: m.content || '',
    time: m.time,
  }))
  await handleAgentChange(res.data.agent_id || NONE_AGENT)
  if (res.data.model) {
    selectedModel.value = res.data.model
  }
  await setConversationQuery(res.data.id)
}

const deleteConversation = async (id: string) => {
  if (!id) return
  if (!window.confirm(t('play.deleteConfirm'))) return
  const res = await removeConversation(id)
  if (res.error) {
    notifyError(res.error)
    return
  }
  conversations.value = conversations.value.filter(item => item.id !== id)
  if (currentConversationId.value === id) {
    startNewChat()
  }
}

onMounted(async () => {
  if (import.meta.client) {
    sidebarCollapsed.value = localStorage.getItem(SIDEBAR_KEY) === '1'
  }
  await fetchAgents()
  await fetchModels()
  await fetchConversationList()
  await refreshQuota()

  const conversationId = typeof route.query.c === 'string' ? route.query.c : ''
  if (conversationId) {
    await loadConversation(conversationId)
    return
  }

  const agentId = route.query.agent as string
  if (agentId) {
    selectedAgent.value = agentId
    await handleAgentChange(agentId)
  }
})

watch(
  () => (typeof route.query.c === 'string' ? route.query.c : ''),
  (id) => {
    if (id && id !== currentConversationId.value) {
      void loadConversation(id)
    }
  },
)

watch(sidebarCollapsed, (collapsed) => {
  if (!import.meta.client) return
  localStorage.setItem(SIDEBAR_KEY, collapsed ? '1' : '0')
})
</script>

<style scoped>
.playground-page {
  height: calc(100vh - 64px);
  overflow: hidden;
}

.playground-container {
  display: flex;
  height: 100%;
}

.sidebar {
  width: 280px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  padding: 16px;
  border-right: 1px solid var(--cf-line);
  overflow: hidden;
  background: var(--cf-nav-surface, var(--cf-bg-elevated));
  transition: width 0.2s ease, padding 0.2s ease, opacity 0.2s ease, border-width 0.2s ease;
}

.playground-container.is-history-collapsed .sidebar {
  width: 0;
  padding-left: 0;
  padding-right: 0;
  border-right-width: 0;
  opacity: 0;
  pointer-events: none;
}

.chat-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.chat-topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 12px 24px;
  border-bottom: 1px solid var(--cf-line);
  border-radius: 0;
  flex-shrink: 0;
}

.chat-topbar-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.history-toggle {
  display: none;
}

.sidebar-fold {
  flex-shrink: 0;
}

.chat-title {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.chat-title-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.chat-title-main {
  font-family: var(--font-display);
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--cf-ink);
  letter-spacing: -0.02em;
}

.chat-title-sub {
  font-size: 12px;
  color: var(--cf-ink-soft);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.messages-wrapper {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
  scroll-behavior: smooth;
}

.chat-column {
  width: min(780px, 100%);
  margin: 0 auto;
  min-height: 100%;
}

.chat-messages {
  min-height: 100%;
}

.empty-state {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 10px;
  text-align: center;
}

.empty-glow {
  position: absolute;
  width: 280px;
  height: 280px;
  border-radius: 50%;
  background: radial-gradient(circle, color-mix(in oklab, var(--cf-accent) 22%, transparent), transparent 70%);
  pointer-events: none;
}

.empty-icon {
  color: color-mix(in oklab, var(--cf-ink-soft) 55%, transparent);
  position: relative;
}

.empty-title {
  font-size: 20px;
  font-weight: 650;
  color: var(--cf-ink);
  margin: 0;
  position: relative;
}

.empty-sub {
  font-size: 13px;
  color: var(--cf-ink-soft);
  margin: 0;
  position: relative;
}

.suggestion-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
  margin-top: 12px;
  position: relative;
  max-width: 480px;
}

.message-md {
  line-height: 1.7;
  word-break: break-word;
  font-size: 14px;
  color: var(--cf-ink);
}

.message-md :deep(p) {
  margin: 0 0 0.6em;
}

.message-md :deep(p:last-child) {
  margin-bottom: 0;
}

.message-md :deep(code) {
  background: color-mix(in oklab, var(--cf-ink) 6%, transparent);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--cf-accent-ink);
}

.message-md :deep(pre) {
  background: color-mix(in oklab, var(--cf-ink) 92%, #0a0a0f);
  border-radius: 10px;
  padding: 14px;
  overflow-x: auto;
  margin: 8px 0;
}

.message-md :deep(pre code) {
  background: none;
  padding: 0;
  color: #e2e8f0;
}

.composer-area {
  width: min(780px, 100%);
  margin: 0 auto;
  padding: 0 24px 20px;
  flex-shrink: 0;
}

.composer-meta {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 6px;
}

.token-hint {
  font-size: 11px;
  color: var(--cf-ink-soft);
  font-family: var(--font-mono);
}

.composer-prompt {
  width: 100%;
}

.composer-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  gap: 12px;
}

.composer-hint {
  font-size: 11px;
  color: var(--cf-ink-soft);
}

@media (max-width: 900px) {
  .sidebar,
  .sidebar-fold {
    display: none;
  }

  .history-toggle {
    display: inline-flex;
  }

  .chat-topbar,
  .messages-wrapper,
  .composer-area {
    padding-left: 12px;
    padding-right: 12px;
  }

  .composer-hint {
    display: none;
  }
}
</style>
