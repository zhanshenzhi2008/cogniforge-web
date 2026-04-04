<template>
  <div class="playground-page">
    <!-- 顶部栏 -->
    <header class="page-header">
      <div class="header-left">
        <h1 class="page-title">
          <el-icon><ChatLineSquare /></el-icon>
          AI Playground
        </h1>
        <span v-if="selectedAgentInfo" class="current-agent">
          <el-icon><Connection /></el-icon>
          {{ selectedAgentInfo.name }}
        </span>
      </div>
      <div class="header-right">
        <el-tag v-if="selectedModel" type="info" effect="plain" size="small">
          {{ selectedModel }}
        </el-tag>
        <el-button link type="danger" @click="clearMessages">
          <el-icon><Delete /></el-icon>
          清空
        </el-button>
      </div>
    </header>

    <div class="playground-container">
      <!-- 左侧：配置面板 -->
      <aside class="sidebar">
        <!-- Agent 选择 -->
        <div class="config-section">
          <div class="section-label">Agent</div>
          <el-select
            v-model="selectedAgent"
            placeholder="选择 Agent"
            clearable
            size="large"
            class="config-select"
            @change="handleAgentChange"
          >
            <template #prefix>
              <el-icon><User /></el-icon>
            </template>
            <el-option
              v-for="agent in agents"
              :key="agent.id"
              :label="agent.name"
              :value="agent.id"
            />
          </el-select>
          <div v-if="selectedAgentInfo" class="agent-info-card">
            <div class="agent-meta">
              <el-tag size="small">{{ selectedAgentInfo.model }}</el-tag>
            </div>
            <p class="agent-desc">{{ selectedAgentInfo.description || '暂无描述' }}</p>
          </div>
        </div>

        <!-- 模型选择 -->
        <div class="config-section">
          <div class="section-label">模型</div>
          <el-select
            v-model="selectedModel"
            placeholder="选择模型"
            size="large"
            class="config-select"
          >
            <template #prefix>
              <el-icon><Cpu /></el-icon>
            </template>
            <el-option
              v-for="model in models"
              :key="model.id"
              :label="model.name"
              :value="model.id"
            />
          </el-select>
        </div>

        <!-- 参数配置 -->
        <div class="config-section params-section">
          <div class="section-label">参数</div>
          <div class="param-item">
            <div class="param-header">
              <span class="param-name">Temperature</span>
              <span class="param-value">{{ params.temperature }}</span>
            </div>
            <el-slider v-model="params.temperature" :min="0" :max="2" :step="0.1" :show-tooltip="false" />
          </div>
          <div class="param-item">
            <div class="param-header">
              <span class="param-name">Max Tokens</span>
              <span class="param-value">{{ params.max_tokens }}</span>
            </div>
            <el-slider v-model="params.max_tokens" :min="256" :max="8192" :step="256" :show-tooltip="false" />
          </div>
          <div class="param-item">
            <div class="param-header">
              <span class="param-name">Top P</span>
              <span class="param-value">{{ params.top_p }}</span>
            </div>
            <el-slider v-model="params.top_p" :min="0" :max="1" :step="0.05" :show-tooltip="false" />
          </div>
        </div>
      </aside>

      <!-- 右侧：聊天区域 -->
      <main class="chat-area">
        <!-- 消息列表 -->
        <div class="messages-wrapper" ref="messagesContainer">
          <!-- 空状态 -->
          <div v-if="messages.length === 0 && !streaming" class="empty-state">
            <div class="empty-icon">
              <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                <circle cx="32" cy="32" r="30" stroke="currentColor" stroke-width="2" stroke-dasharray="6 4"/>
                <path d="M20 28h24M20 36h16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                <circle cx="44" cy="44" r="8" fill="#6366f1"/>
                <path d="M41 44l2 2 4-4" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <p class="empty-title">开始一段对话</p>
            <p class="empty-hint">输入消息，AI 将为你生成回复</p>
          </div>

          <!-- 消息列表 -->
          <div class="messages-list">
            <div
              v-for="(msg, index) in messages"
              :key="index"
              :class="['message', msg.role]"
            >
              <div class="message-avatar">
                <el-avatar v-if="msg.role === 'user'" :size="36" color="#6366f1">
                  <el-icon><User /></el-icon>
                </el-avatar>
                <el-avatar v-else :size="36" :style="{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }">
                  <el-icon><MagicStick /></el-icon>
                </el-avatar>
              </div>
              <div class="message-body">
                <div class="message-bubble" :class="{ 'user-bubble': msg.role === 'user' }">
                  <div class="message-text" v-html="renderMarkdown(msg.content)" />
                </div>
              </div>
            </div>

            <!-- 流式输出 -->
            <div v-if="streaming" class="message assistant streaming">
              <div class="message-avatar">
                <el-avatar :size="36" :style="{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }">
                  <el-icon><MagicStick /></el-icon>
                </el-avatar>
              </div>
              <div class="message-body">
                <div class="message-bubble streaming-bubble">
                  <span class="streaming-text" v-html="renderMarkdown(streamingContent)" />
                  <span class="typing-cursor" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 输入区域 -->
        <div class="input-wrapper">
          <div class="input-card">
            <el-input
              v-model="inputMessage"
              type="textarea"
              :rows="3"
              placeholder="输入消息... (Shift+Enter 换行，Enter 发送)"
              :disabled="streaming"
              resize="none"
              @keydown="handleKeyDown"
            />
            <div class="input-footer">
              <span class="token-indicator">
                <el-icon><Odometer /></el-icon>
                {{ tokenCount }} tokens
              </span>
              <el-button
                type="primary"
                size="large"
                :loading="streaming"
                :disabled="!inputMessage.trim()"
                @click="sendMessage"
              >
                <template #icon v-if="!streaming">
                  <el-icon><Promotion /></el-icon>
                </template>
                {{ streaming ? '生成中...' : '发送' }}
              </el-button>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { ChatLineSquare, Connection, Delete, User, MagicStick, Cpu, Odometer, Promotion } from '@element-plus/icons-vue'
import { marked } from 'marked'
import type { Agent } from '@/composables/useAgents'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface Model {
  id: string
  name: string
}

const route = useRoute()
const config = useRuntimeConfig()
const { list: listAgents, get: getAgent } = useAgents()
const { get, post } = useApi()
const messages = ref<Message[]>([])
const inputMessage = ref('')
const streaming = ref(false)
const streamingContent = ref('')
const selectedModel = ref('')
const models = ref<Model[]>([])
const messagesContainer = ref<HTMLElement | null>(null)

// Agent 相关
const agents = ref<Agent[]>([])
const selectedAgent = ref<string>('')
const selectedAgentInfo = ref<Agent | null>(null)

const params = reactive({
  temperature: 0.7,
  max_tokens: 2048,
  top_p: 0.9
})

const tokenCount = computed(() => {
  return messages.value.reduce((acc, msg) => acc + msg.content.length / 4, 0) | 0
})

const renderMarkdown = (content: string) => {
  return marked.parse(content, { async: false }) as string
}

const fetchAgents = async () => {
  try {
    const res = await listAgents()
    if (res.error) {
      ElMessage.error(res.error)
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
    ElMessage.error(res.error)
    return
  }
  selectedAgentInfo.value = res.data || null
  if (res.data?.model) {
    selectedModel.value = res.data.model
  }
}

const fetchModels = async () => {
  try {
    const res = await get<{ models: Model[] }>('/api/v1/models/')
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
  messages.value.push({ role: 'user', content: userMessage })
  inputMessage.value = ''
  scrollToBottom()

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
      ...params
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${useCookie('token').value}`
      },
      body: JSON.stringify(body)
    })

    const decoder = new TextDecoder()

    if (!response.ok) {
      const text = await response.text().catch(() => '')
      ElMessage.error(
        `发送消息失败：HTTP ${response.status}${text ? ` - ${text}` : ''}`,
      )
      return
    }

    const reader = response.body?.getReader()
    if (!reader) {
      ElMessage.error('发送消息失败：response body 不可用')
      return
    }

    messages.value.push({ role: 'assistant', content: '' })
    const assistantMessage = messages.value[messages.value.length - 1]

    // SSE 可能会被拆成多段读取，必须做缓冲处理，避免跨块导致解析不到 `data: ...`。
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
            // 后端错误会走 `data: {"error": "..."}` 这种结构
            if (typeof parsed?.error === 'string' && parsed.error.length > 0) {
              ElMessage.error(parsed.error)
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
            // ignore parse errors (may happen on chunk boundaries)
          }
        }
      }
    }

    // 兜底：处理最后一段残留 buffer（如果服务端没以 '\n\n' 结尾）
    if (buffer) {
      const lines = buffer.split('\n')
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const data = line.slice(6).trim()
        if (data === '[DONE]') continue
        try {
          const parsed = JSON.parse(data)
          // 后端错误会走 `data: {"error": "..."}` 这种结构
          if (typeof parsed?.error === 'string' && parsed.error.length > 0) {
            ElMessage.error(parsed.error)
            assistantMessage.content = parsed.error
            streamingContent.value = assistantMessage.content
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
    ElMessage.error('发送消息失败')
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

  // 从 URL 参数加载 agent
  const agentId = route.query.agent as string
  if (agentId) {
    selectedAgent.value = agentId
    await handleAgentChange(agentId)
  }
})
</script>

<style scoped>
.playground-page {
  height: calc(100vh - 60px);
  display: flex;
  flex-direction: column;
  background: #0f0f0f;
  color: #fff;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  background: #1a1a1a;
  border-bottom: 1px solid #2a2a2a;
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.page-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 20px;
  font-weight: 600;
  color: #fff;
  margin: 0;
}

.current-agent {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  background: rgba(99, 102, 241, 0.15);
  border: 1px solid rgba(99, 102, 241, 0.3);
  border-radius: 20px;
  font-size: 13px;
  color: #a5b4fc;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.playground-container {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.sidebar {
  width: 280px;
  flex-shrink: 0;
  background: #1a1a1a;
  border-right: 1px solid #2a2a2a;
  padding: 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.config-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.section-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #6b7280;
}

.config-select {
  width: 100%;
}

.config-select :deep(.el-input__wrapper) {
  background: #262626;
  border: 1px solid #3a3a3a;
  box-shadow: none;
  border-radius: 8px;
}

.config-select :deep(.el-input__wrapper:hover) {
  border-color: #6366f1;
}

.config-select :deep(.el-input__wrapper.is-focus) {
  border-color: #6366f1;
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
}

.agent-info-card {
  background: #262626;
  border: 1px solid #3a3a3a;
  border-radius: 10px;
  padding: 12px;
}

.agent-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.agent-meta .el-tag {
  background: rgba(99, 102, 241, 0.15);
  border: none;
  color: #a5b4fc;
}

.agent-desc {
  font-size: 13px;
  color: #9ca3af;
  line-height: 1.5;
  margin: 0;
}

.params-section {
  flex: 1;
}

.param-item {
  background: #262626;
  border: 1px solid #3a3a3a;
  border-radius: 10px;
  padding: 12px 14px;
  margin-bottom: 10px;
}

.param-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.param-name {
  font-size: 13px;
  color: #d1d5db;
}

.param-value {
  font-size: 13px;
  font-weight: 600;
  color: #6366f1;
  font-variant-numeric: tabular-nums;
}

.param-item :deep(.el-slider__runway) {
  background: #3a3a3a;
  height: 4px;
  border-radius: 2px;
}

.param-item :deep(.el-slider__bar) {
  background: linear-gradient(90deg, #6366f1, #8b5cf6);
  height: 4px;
  border-radius: 2px;
}

.param-item :deep(.el-slider__button) {
  width: 14px;
  height: 14px;
  border: 2px solid #6366f1;
  background: #fff;
}

.chat-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.messages-wrapper {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  scroll-behavior: smooth;
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
  color: #4b5563;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

.empty-title {
  font-size: 18px;
  font-weight: 500;
  color: #9ca3af;
  margin: 8px 0 0;
}

.empty-hint {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

.messages-list {
  max-width: 800px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.message {
  display: flex;
  gap: 14px;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.message.user {
  flex-direction: row-reverse;
}

.message-avatar {
  flex-shrink: 0;
}

.message.user .message-avatar :deep(.el-avatar) {
  background: #6366f1;
}

.message-body {
  max-width: 75%;
  display: flex;
  flex-direction: column;
}

.message.user .message-body {
  align-items: flex-end;
}

.message-bubble {
  padding: 12px 16px;
  border-radius: 16px;
  line-height: 1.6;
}

.user-bubble {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff;
  border-bottom-right-radius: 4px;
}

.message:not(.user) .message-bubble {
  background: #262626;
  border: 1px solid #3a3a3a;
  border-bottom-left-radius: 4px;
}

.streaming-bubble {
  display: flex;
  align-items: center;
  gap: 2px;
}

.message-text {
  white-space: pre-wrap;
  word-break: break-word;
}

.message-text :deep(p) {
  margin: 0 0 8px;
}

.message-text :deep(p:last-child) {
  margin-bottom: 0;
}

.message-text :deep(code) {
  background: rgba(0, 0, 0, 0.3);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.9em;
}

.message.user .message-text :deep(code) {
  background: rgba(255, 255, 255, 0.15);
}

.message-text :deep(pre) {
  background: #1a1a1a;
  border: 1px solid #3a3a3a;
  border-radius: 8px;
  padding: 12px;
  overflow-x: auto;
  margin: 8px 0;
}

.message-text :deep(pre code) {
  background: none;
  padding: 0;
}

.typing-cursor {
  display: inline-block;
  width: 2px;
  height: 16px;
  background: #6366f1;
  border-radius: 1px;
  animation: blink 0.8s infinite;
  vertical-align: middle;
  margin-left: 2px;
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

.input-wrapper {
  padding: 16px 24px 24px;
  background: linear-gradient(to top, #0f0f0f 60%, transparent);
  flex-shrink: 0;
}

.input-card {
  max-width: 800px;
  margin: 0 auto;
  background: #1a1a1a;
  border: 1px solid #2a2a2a;
  border-radius: 16px;
  padding: 4px;
  transition: border-color 0.2s;
}

.input-card:focus-within {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
}

.input-card :deep(.el-textarea__inner) {
  background: transparent;
  border: none;
  color: #fff;
  font-size: 15px;
  padding: 12px 16px;
  line-height: 1.6;
}

.input-card :deep(.el-textarea__inner::placeholder) {
  color: #6b7280;
}

.input-card :deep(.el-textarea__inner:focus) {
  box-shadow: none;
}

.input-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
}

.token-indicator {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #6b7280;
}

.input-card :deep(.el-button--primary) {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  border: none;
  padding: 10px 24px;
  font-weight: 500;
}

.input-card :deep(.el-button--primary:hover) {
  background: linear-gradient(135deg, #5558e3, #7c4fd6);
}

.input-card :deep(.el-button--primary.is-disabled) {
  background: #3a3a3a;
  color: #6b7280;
}

@media (max-width: 768px) {
  .sidebar {
    display: none;
  }

  .messages-wrapper {
    padding: 16px;
  }

  .message-body {
    max-width: 85%;
  }
}
</style>
