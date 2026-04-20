<template>
  <div class="playground-page">
        <div class="playground-container">

          <!-- 左侧配置面板 -->
          <aside class="sidebar">
            <!-- 顶部标题 -->
            <div class="sidebar-header">
              <div class="header-logo">
                <n-icon :component="HardwareChipOutline" :size="22" />
              </div>
              <div class="sidebar-title">
                <span class="app-name">CogniForge</span>
                <span class="app-sub">AI Agent Platform</span>
              </div>
            </div>

            <!-- Agent 选择 -->
            <n-card size="small" class="config-card">
              <template #header>
                <div class="card-header">
                  <n-icon :component="AgentIcon" />
                  <span>Agent</span>
                </div>
              </template>
              <n-select
                v-model:value="selectedAgent"
                :options="agentOptions"
                placeholder="选择 Agent"
                clearable
                @update:value="handleAgentChange"
              />
              <div v-if="selectedAgentInfo" class="agent-meta">
                <div class="meta-item">
                  <span class="meta-label">模型</span>
                  <n-tag size="small" type="info">{{ selectedAgentInfo.model }}</n-tag>
                </div>
                <div class="meta-item">
                  <span class="meta-label">描述</span>
                  <p class="meta-desc">{{ selectedAgentInfo.description || '暂无描述' }}</p>
                </div>
              </div>
            </n-card>

            <!-- 模型选择 -->
            <n-card size="small" class="config-card">
              <template #header>
                <div class="card-header">
                  <n-icon :component="SettingsIcon" />
                  <span>模型</span>
                </div>
              </template>
              <n-select
                v-model:value="selectedModel"
                :options="modelOptions"
                placeholder="选择模型"
              />
            </n-card>

            <!-- 参数配置 -->
            <n-card size="small" class="config-card params-card">
              <template #header>
                <div class="card-header">
                  <n-icon :component="SettingsIcon" />
                  <span>参数</span>
                </div>
              </template>
              <div class="param-row">
                <div class="param-label">
                  <span>Temperature</span>
                  <n-tag size="small" type="warning">{{ params.temperature }}</n-tag>
                </div>
                <n-slider
                  v-model:value="params.temperature"
                  :min="0"
                  :max="2"
                  :step="0.1"
                  :tooltip="false"
                />
              </div>
              <div class="param-row">
                <div class="param-label">
                  <span>Max Tokens</span>
                  <n-tag size="small" type="warning">{{ params.max_tokens }}</n-tag>
                </div>
                <n-input-number
                  v-model:value="params.max_tokens"
                  :min="1"
                  :max="8192"
                  size="small"
                  :show-button="false"
                />
              </div>
              <div class="param-row">
                <div class="param-label">
                  <span>Top P</span>
                  <n-tag size="small" type="warning">{{ params.top_p }}</n-tag>
                </div>
                <n-slider
                  v-model:value="params.top_p"
                  :min="0"
                  :max="1"
                  :step="0.05"
                  :tooltip="false"
                />
              </div>
            </n-card>

          </aside>

          <!-- 右侧聊天区域 -->
          <main class="chat-area">
            <!-- 顶部栏 -->
            <div class="chat-topbar">
              <div class="chat-title">
                <n-icon :component="selectedAgent ? SparklesIcon : ChatIcon" :size="20" />
                <span>{{ currentTitle }}</span>
              </div>
              <n-button
                quaternary
                size="small"
                type="error"
                @click="clearMessages"
              >
                <template #icon>
                  <n-icon :component="TrashIcon" />
                </template>
                清空
              </n-button>
            </div>

            <!-- 消息列表 -->
            <div class="messages-wrapper" ref="messagesContainer">
              <div v-if="messages.length === 0" class="empty-state">
                <div class="empty-glow" />
                <n-icon :component="ChatIcon" :size="56" class="empty-icon" />
                <p class="empty-title">开始新对话</p>
                <p class="empty-sub">输入消息与 AI 互动</p>
              </div>

              <TransitionGroup name="msg" tag="div" class="messages">
                <div
                  v-for="(msg, index) in messages"
                  :key="msg.id || `msg-${index}`"
                  :class="['message', msg.role]"
                >
                  <div class="message-avatar">
                    <n-icon v-if="msg.role === 'user'" :component="UserIcon" :size="20" />
                    <n-icon v-else :component="BotIcon" :size="20" />
                  </div>
                  <div class="message-bubble">
                    <div class="message-text" v-html="renderMarkdown(msg.content)" />
                    <div class="message-time">{{ formatTime(msg.time) }}</div>
                  </div>
                </div>

                <!-- 流式输出 -->
                <div v-if="streaming" :key="'streaming-' + streamingKey" :class="['message', 'assistant', 'streaming']">
                  <div class="message-avatar">
                    <n-icon :component="BotIcon" :size="20" />
                  </div>
                  <div class="message-bubble">
                    <div class="message-text" v-html="renderMarkdown(streamingContent)" />
                    <span class="cursor">▍</span>
                  </div>
                </div>
              </TransitionGroup>
            </div>

            <!-- 输入区域 -->
            <div class="input-area">
              <div class="input-box">
                <textarea
                  v-model="inputMessage"
                  class="chat-input"
                  placeholder="输入消息... (Enter 发送, Shift+Enter 换行)"
                  :disabled="streaming"
                  rows="3"
                  @keydown="handleKeyDown"
                />
                <div class="input-footer">
                  <span class="token-hint">{{ tokenCount }} tokens</span>
                  <n-button
                    type="primary"
                    :loading="streaming"
                    :disabled="!inputMessage.trim()"
                    @click="sendMessage"
                  >
                    <template #icon>
                      <n-icon :component="SendIcon" />
                    </template>
                    {{ streaming ? '生成中' : '发送' }}
                  </n-button>
                </div>
              </div>
            </div>
          </main>

        </div>
      </div>
</template>

<script setup lang="ts">
import { useMessage } from 'naive-ui'
import { marked } from 'marked'
import {
  ChatbubbleOutline,
  PersonOutline,
  SparklesOutline,
  HardwareChipOutline,
  SettingsOutline,
  PaperPlaneOutline,
  TrashOutline,
} from '~/constants/icons'

const SparklesIcon = SparklesOutline
import type { Agent } from '@/composables/useAgents'

const ChatIcon = ChatbubbleOutline
const UserIcon = PersonOutline
const BotIcon = SparklesOutline
const AgentIcon = HardwareChipOutline
const SettingsIcon = SettingsOutline
const SendIcon = PaperPlaneOutline
const TrashIcon = TrashOutline

const route = useRoute()
const config = useRuntimeConfig()
const { list: listAgents, get: getAgent } = useAgents()
const { get } = useApi()
const message = useMessage()

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  time?: string
}

interface Model {
  id: string
  name: string
}

const messages = ref<Message[]>([])
const inputMessage = ref('')
const streamingKey = ref(0)

const streaming = ref(false)
const streamingContent = ref('')
const selectedModel = ref('')
const models = ref<Model[]>([])
const messagesContainer = ref<HTMLElement | null>(null)

const agents = ref<Agent[]>([])
const selectedAgent = ref<string>('')
const selectedAgentInfo = ref<Agent | null>(null)

const currentTitle = computed(() => {
  if (selectedAgentInfo.value) {
    return `与 ${selectedAgentInfo.value.name} 对话`
  }
  return '通用对话'
})

const agentOptions = computed(() =>
  agents.value.map(a => ({ label: a.name, value: a.id }))
)

const modelOptions = computed(() =>
  models.value.map(m => ({ label: m.name, value: m.id }))
)

const params = reactive({
  temperature: 0.7,
  max_tokens: 2048,
  top_p: 0.9,
})

const tokenCount = computed(() => {
  return messages.value.reduce((acc, msg) => acc + msg.content.length / 4, 0) | 0
})

const renderMarkdown = (content: string) => {
  return marked.parse(content, { async: false }) as string
}

const formatTime = (time?: string) => {
  if (!time) return ''
  return new Date(time).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

const fetchAgents = async () => {
  try {
    const res = await listAgents()
    if (res.error) {
      message.error(res.error)
      return
    }
    agents.value = res.data || []
  } catch (error) {
    console.error('Failed to fetch agents:', error)
  }
}

const handleAgentChange = async (agentId: string) => {
  if (!agentId) {
    selectedAgentInfo.value = null
    selectedModel.value = models.value[0]?.id || ''
    return
  }
  const res = await getAgent(agentId)
  if (res.error) {
    message.error(res.error)
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
    if (models.value.length > 0) {
      selectedModel.value = models.value[0].id
    }
  } catch (error) {
    console.error('Failed to fetch models:', error)
  }
}

const sendMessage = async () => {
  if (!inputMessage.value.trim() || streaming.value) return

  const userMessage = inputMessage.value.trim()
  messages.value.push({ id: crypto.randomUUID(), role: 'user', content: userMessage, time: new Date().toISOString() })
  inputMessage.value = ''
  scrollToBottom()

  streamingKey.value++
  streaming.value = true
  streamingContent.value = ''

  try {
    const endpoint = selectedAgent.value
      ? `${config.public.apiBase}/api/v1/agents/${selectedAgent.value}/chat`
      : `${config.public.apiBase}/api/v1/chat/stream`

    const body: any = {
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
    })

    const decoder = new TextDecoder()

    if (!response.ok) {
      const text = await response.text().catch(() => '')
      message.error(`发送失败：HTTP ${response.status}${text ? ` - ${text}` : ''}`)
      return
    }

    const reader = response.body?.getReader()
    if (!reader) {
      message.error('发送失败：response body 不可用')
      return
    }

    messages.value.push({ id: crypto.randomUUID(), role: 'assistant', content: '', time: new Date().toISOString() })
    const assistantMessage = messages.value[messages.value.length - 1]

    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const parts = buffer.split('\n\n')
      buffer = parts.pop() || ''

      for (const part of parts) {
        const lines = part.split('\n')
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue

          const data = line.slice(6).trim()
          if (data === '[DONE]') continue

          try {
            const parsed = JSON.parse(data)
            if (typeof parsed?.error === 'string' && parsed.error.length > 0) {
              message.error(parsed.error)
              assistantMessage.content = parsed.error
              streamingContent.value = assistantMessage.content
              scrollToBottom()
              return
            }
            const content = parsed?.choices?.[0]?.delta?.content
            if (typeof content === 'string' && content.length > 0) {
              assistantMessage.content += content
              streamingContent.value = assistantMessage.content
              scrollToBottom()
            }
          } catch {
            // ignore parse errors
          }
        }
      }
    }

    if (buffer) {
      const lines = buffer.split('\n')
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const data = line.slice(6).trim()
        if (data === '[DONE]') continue
        try {
          const parsed = JSON.parse(data)
          if (typeof parsed?.error === 'string' && parsed.error.length > 0) {
            message.error(parsed.error)
            assistantMessage.content = parsed.error
            streamingContent.value = assistantMessage.content
            scrollToBottom()
            return
          }
          const content = parsed?.choices?.[0]?.delta?.content
          if (typeof content === 'string' && content.length > 0) {
            assistantMessage.content += content
            streamingContent.value = assistantMessage.content
            scrollToBottom()
          }
        } catch {
          // ignore parse errors
        }
      }
    }
  } catch (error) {
    message.error('发送失败')
    messages.value.pop()
  } finally {
    streaming.value = false
    streamingContent.value = ''
  }
}

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    sendMessage()
  }
}

const clearMessages = () => {
  messages.value = []
}

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
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
/* === 全局布局 === */
.playground-page {
  height: calc(100vh - 56px);
  background: #f1f5f9;
  background: #0a0a0f;
  overflow: hidden;
}

.playground-container {
  display: flex;
  height: 100%;
}

/* === 左侧边栏 === */
.sidebar {
  width: 280px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  border-right: 1px solid #e2e8f0;
  background: #ffffff;
  overflow-y: auto;
}

.sidebar-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f1f5f9;
  margin-bottom: 4px;
}

.header-logo {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: linear-gradient(135deg, #6366f1, #7c3aed);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #fff;
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.35);
}

.sidebar-title {
  display: flex;
  flex-direction: column;
}

.app-name {
  font-size: 16px;
  font-weight: 700;
  color: #4f46e5;
  letter-spacing: 0.5px;
}

.app-sub {
  font-size: 10px;
  color: #94a3b8;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.config-card {
  backdrop-filter: blur(12px);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #64748b;
}

.card-header :deep(.n-icon) {
  color: #6366f1;
}

.agent-meta {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f1f5f9;
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
  color: #94a3b8;
  min-width: 32px;
  padding-top: 2px;
}

.meta-desc {
  font-size: 12px;
  color: #64748b;
  margin: 0;
  line-height: 1.5;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.params-card {
  flex: 1;
}

.param-row {
  margin-bottom: 16px;
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
  color: #94a3b8;
}

/* === 右侧聊天区 === */
.chat-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  background: #f1f5f9;
}

.chat-topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 24px;
  border-bottom: 1px solid #e2e8f0;
  background: #ffffff;
  flex-shrink: 0;
}

.chat-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
}

.chat-title :deep(.n-icon) {
  color: #6366f1;
}

/* === 消息列表 === */
.messages-wrapper {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  scroll-behavior: smooth;
}

.messages-wrapper::-webkit-scrollbar {
  width: 6px;
}

.messages-wrapper::-webkit-scrollbar-track {
  background: transparent;
}

.messages-wrapper::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.12);
  border-radius: 3px;
}

.messages-wrapper::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.2);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 12px;
}

.empty-icon {
  color: #cbd5e1;
}

.empty-title {
  font-size: 18px;
  font-weight: 600;
  color: #94a3b8;
  margin: 0;
}

.empty-sub {
  font-size: 13px;
  color: #cbd5e1;
  margin: 0;
}

.messages {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.message {
  display: flex;
  gap: 14px;
  align-items: flex-start;
  max-width: 80%;
}

.message.user {
  flex-direction: row-reverse;
  margin-left: auto;
}

.message-avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: 1px solid #e2e8f0;
}

.message.user .message-avatar {
  background: linear-gradient(135deg, #6366f1 0%, #7c3aed 100%);
  color: #fff;
}

.message.assistant .message-avatar {
  background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
  color: #6366f1;
}

.message-bubble {
  padding: 12px 16px;
  border-radius: 16px;
  position: relative;
  border: 1px solid #e2e8f0;
}

.message.user .message-bubble {
  background: linear-gradient(135deg, #6366f1 0%, #7c3aed 100%);
  color: #fff;
  border-color: transparent;
  border-bottom-right-radius: 4px;
}

.message.assistant .message-bubble {
  background: #ffffff;
  border-bottom-left-radius: 4px;
  border-color: #e2e8f0;
}

.message-text {
  line-height: 1.7;
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 14px;
}

.message.user .message-text {
  color: #f1f5f9;
}

.message.assistant .message-text {
  color: #1e293b;
}

.message-text :deep(code) {
  background: #f1f5f9;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Fira Code', 'Cascadia Code', monospace;
  font-size: 13px;
  color: #4f46e5;
}

.message.assistant .message-text :deep(code) {
  background: #f1f5f9;
}

.message.user .message-text :deep(pre),
.message.user .message-text :deep(code) {
  background: rgba(255, 255, 255, 0.2);
  color: #f1f5f9;
}

.message-text :deep(pre) {
  background: #1e293b;
  border-radius: 10px;
  padding: 16px;
  overflow-x: auto;
  margin: 8px 0;
}

.message-text :deep(pre code) {
  background: none;
  border: none;
  padding: 0;
  color: #e2e8f0;
}

.message-time {
  font-size: 10px;
  color: #94a3b8;
  margin-top: 6px;
  text-align: right;
}

.message.user .message-time {
  color: rgba(255, 255, 255, 0.6);
}

.streaming .cursor {
  display: inline-block;
  color: #6366f1;
  animation: blink 1.2s infinite;
  font-size: 12px;
  margin-left: 2px;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

/* === 输入区域 === */
.input-area {
  padding: 16px 24px 20px;
  border-top: 1px solid #e2e8f0;
  background: #ffffff;
  flex-shrink: 0;
}

.input-box {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 14px 16px 12px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.input-box:focus-within {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
}

.chat-input {
  width: 100%;
  background: transparent;
  border: none;
  outline: none;
  color: #1e293b;
  font-size: 14px;
  line-height: 1.6;
  resize: none;
  font-family: inherit;
  caret-color: #6366f1;
}

.chat-input::placeholder {
  color: #94a3b8;
}

.chat-input:disabled {
  opacity: 0.5;
}

.input-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
}

.token-hint {
  font-size: 11px;
  color: #94a3b8;
  padding-top: 2px;
}

/* === 消息动画 === */
.msg-enter-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.msg-leave-active {
  transition: all 0.2s ease;
}

.msg-enter-from {
  opacity: 0;
  transform: translateY(12px) scale(0.98);
}

.msg-leave-to {
  opacity: 0;
  transform: scale(0.98);
}
</style>
