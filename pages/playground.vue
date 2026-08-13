<template>
  <div class="playground-page">
    <div class="playground-container">
      <!-- 左侧配置面板（桌面） -->
      <aside class="sidebar cf-surface">
        <PlaygroundConfigPanel
          v-model:selected-agent="selectedAgent"
          v-model:selected-model="selectedModel"
          :selected-agent-info="selectedAgentInfo"
          :agent-options="agentOptions"
          :model-options="modelOptions"
          :params="params"
          show-brand
          @agent-change="handleAgentChange"
        />
      </aside>

      <!-- 右侧聊天区域 -->
      <main class="chat-area">
        <div class="chat-topbar cf-surface">
          <div class="chat-title">
            <UIcon
              :name="selectedAgent !== NONE_AGENT ? 'i-lucide-sparkles' : 'i-lucide-messages-square'"
              class="size-5 title-icon"
            />
            <span>{{ currentTitle }}</span>
          </div>
          <div class="chat-topbar-actions">
            <UButton
              class="config-toggle"
              color="neutral"
              variant="soft"
              size="sm"
              icon="i-lucide-sliders-horizontal"
              @click="configOpen = true"
            >
              参数
            </UButton>
            <UButton
              color="error"
              variant="ghost"
              size="sm"
              icon="i-lucide-trash-2"
              @click="clearMessages"
            >
              清空
            </UButton>
          </div>
        </div>

        <div class="messages-wrapper">
          <div v-if="messages.length === 0" class="empty-state">
            <div class="empty-glow" />
            <UIcon name="i-lucide-messages-square" class="size-14 empty-icon" />
            <p class="empty-title font-display">开始新对话</p>
            <p class="empty-sub">输入消息与 AI 互动</p>
            <div class="suggestion-chips">
              <UButton
                v-for="chip in suggestionChips"
                :key="chip"
                size="sm"
                color="primary"
                variant="soft"
                @click="sendSuggestion(chip)"
              >
                {{ chip }}
              </UButton>
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
                <UChatShimmer text="正在思考…" />
              </template>
            </UChatMessages>
          </div>
        </div>

        <div class="composer-area">
          <div class="composer-meta">
            <span class="token-hint">{{ tokenCount }} tokens</span>
          </div>
          <UChatPrompt
            v-model="inputMessage"
            :disabled="streaming"
            :submit-on-enter="true"
            placeholder="输入消息… (Enter 发送, Shift+Enter 换行)"
            variant="subtle"
            :rows="2"
            :maxrows="6"
            class="composer-prompt"
            @submit="sendMessage"
          >
            <template #footer>
              <div class="composer-footer">
                <span class="composer-hint">Enter 发送 · Shift+Enter 换行</span>
                <UChatPromptSubmit
                  :status="chatStatus"
                  color="primary"
                  :disabled="!inputMessage.trim() && chatStatus === 'ready'"
                  @stop="stopStreaming"
                />
              </div>
            </template>
          </UChatPrompt>
        </div>
      </main>
    </div>

    <USlideover v-model:open="configOpen" title="对话参数" :ui="{ content: 'max-w-sm w-full' }">
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
const config = useRuntimeConfig()
const toast = useToast()
const { list: listAgents, get: getAgent } = useAgents()
const { get } = useApi()

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

const suggestionChips = [
  '介绍一下你自己',
  '帮我写一段产品说明',
  '用三点总结今天的重点',
]

const currentTitle = computed(() => {
  if (selectedAgentInfo.value) {
    return `与 ${selectedAgentInfo.value.name} 对话`
  }
  return '通用对话'
})

const agentOptions = computed(() =>
  [
    { label: '不选择 Agent（通用对话）', value: NONE_AGENT },
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

const stopStreaming = () => {
  abortController.value?.abort()
  abortController.value = null
  streaming.value = false
}

const sendSuggestion = (text: string) => {
  inputMessage.value = text
  sendMessage()
}

const sendMessage = async () => {
  if (!inputMessage.value.trim() || streaming.value) return

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
      messages: messages.value.map(m => ({ role: m.role, content: m.content })),
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
      notifyError(`发送失败：HTTP ${response.status}${text ? ` - ${text}` : ''}`)
      return
    }

    const reader = response.body?.getReader()
    if (!reader) {
      notifyError('发送失败：response body 不可用')
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
          assistantMessage.content = parsed.error
          return true
        }
        const content = parsed?.choices?.[0]?.delta?.content
        if (typeof content === 'string' && content.length > 0) {
          assistantMessage.content += content
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
      for (const line of buffer.split('\n')) {
        if (consumeDataLine(line)) return
      }
    }
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      return
    }
    notifyError('发送失败')
    messages.value.pop()
  } finally {
    streaming.value = false
    abortController.value = null
  }
}

const clearMessages = () => {
  stopStreaming()
  messages.value = []
}

onMounted(async () => {
  await fetchAgents()
  await fetchModels()

  const agentId = route.query.agent as string
  if (agentId) {
    selectedAgent.value = agentId
    await handleAgentChange(agentId)
  }
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
  gap: 14px;
  padding: 16px;
  border-right: 1px solid var(--cf-line);
  border-radius: 0;
  overflow-y: auto;
}

.sidebar-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--cf-line);
}

.header-logo {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: var(--cf-accent);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.sidebar-title {
  display: flex;
  flex-direction: column;
}

.app-name {
  font-size: 16px;
  font-weight: 700;
  color: var(--cf-ink);
  letter-spacing: 0.2px;
}

.app-sub {
  font-size: 10px;
  color: var(--cf-ink-soft);
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.config-block {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--cf-ink-soft);
}

.card-header :deep(svg) {
  color: var(--cf-accent);
}

.agent-meta {
  margin-top: 2px;
  padding-top: 10px;
  border-top: 1px solid var(--cf-line);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.meta-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.meta-label {
  font-size: 11px;
  color: var(--cf-ink-soft);
  min-width: 32px;
  padding-top: 2px;
}

.meta-desc {
  font-size: 12px;
  color: var(--cf-ink-soft);
  margin: 0;
  line-height: 1.5;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.params-block {
  flex: 1;
}

.param-row {
  margin-bottom: 14px;
}

.param-row:last-child {
  margin-bottom: 0;
}

.param-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 12px;
  color: var(--cf-ink-soft);
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

.config-toggle {
  display: none;
}

.chat-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 15px;
  font-weight: 600;
  color: var(--cf-ink);
}

.title-icon {
  color: var(--cf-accent);
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
  .sidebar {
    display: none;
  }

  .config-toggle {
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
