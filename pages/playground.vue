<template>
  <div class="playground-page">
    <div class="playground-container">
      <!-- 左侧：模型选择和参数配置 -->
      <div class="sidebar">
        <el-card>
          <template #header>
            <span>模型选择</span>
          </template>
          <el-select v-model="selectedModel" placeholder="选择模型" style="width: 100%">
            <el-option
              v-for="model in models"
              :key="model.id"
              :label="model.name"
              :value="model.id"
            />
          </el-select>
        </el-card>

        <el-card class="params-card">
          <template #header>
            <span>参数配置</span>
          </template>
          <el-form label-position="top" size="small">
            <el-form-item label="Temperature">
              <el-slider v-model="params.temperature" :min="0" :max="2" :step="0.1" show-input />
            </el-form-item>
            <el-form-item label="Max Tokens">
              <el-input-number v-model="params.max_tokens" :min="1" :max="4096" />
            </el-form-item>
            <el-form-item label="Top P">
              <el-slider v-model="params.top_p" :min="0" :max="1" :step="0.05" />
            </el-form-item>
          </el-form>
        </el-card>
      </div>

      <!-- 右侧：聊天区域 -->
      <div class="chat-area">
        <el-card class="messages-card" ref="messagesCard">
          <template #header>
            <div class="messages-header">
              <span>对话</span>
              <el-button link type="danger" size="small" @click="clearMessages">
                清空对话
              </el-button>
            </div>
          </template>

          <div class="messages" ref="messagesContainer">
            <div v-if="messages.length === 0" class="empty-state">
              <el-icon size="48"><ChatDotRound /></el-icon>
              <p>开始一个新对话</p>
            </div>

            <div
              v-for="(msg, index) in messages"
              :key="index"
              :class="['message', msg.role]"
            >
              <div class="message-avatar">
                <el-icon v-if="msg.role === 'user'"><User /></el-icon>
                <el-icon v-else><MagicStick /></el-icon>
              </div>
              <div class="message-content">
                <div class="message-text" v-html="renderMarkdown(msg.content)" />
              </div>
            </div>

            <div v-if="streaming" class="message assistant streaming">
              <div class="message-avatar">
                <el-icon><MagicStick /></el-icon>
              </div>
              <div class="message-content">
                <div class="message-text" v-html="renderMarkdown(streamingContent)" />
                <span class="cursor">|</span>
              </div>
            </div>
          </div>
        </el-card>

        <div class="input-area">
          <el-input
            v-model="inputMessage"
            type="textarea"
            :rows="3"
            placeholder="输入消息... (Shift+Enter 换行，Enter 发送)"
            :disabled="streaming"
            @keydown="handleKeyDown"
          />
          <div class="input-actions">
            <span class="token-count">{{ tokenCount }} tokens</span>
            <el-button
              type="primary"
              :loading="streaming"
              :disabled="!inputMessage.trim()"
              @click="sendMessage"
            >
              {{ streaming ? '生成中...' : '发送' }}
            </el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { ChatDotRound, User, MagicStick } from '@element-plus/icons-vue'
import { marked } from 'marked'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface Model {
  id: string
  name: string
}

const config = useRuntimeConfig()
const { get, post } = useApi()
const messages = ref<Message[]>([])
const inputMessage = ref('')
const streaming = ref(false)
const streamingContent = ref('')
const selectedModel = ref('')
const models = ref<Model[]>([])
const messagesContainer = ref<HTMLElement | null>(null)

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
    const response = await fetch(`${config.public.apiBase}/api/v1/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${useCookie('token').value}`
      },
      body: JSON.stringify({
        model: selectedModel.value,
        messages: messages.value.map(m => ({ role: m.role, content: m.content })),
        stream: true,
        ...params
      })
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

onMounted(() => {
  fetchModels()
})
</script>

<style scoped>
.playground-page {
  height: calc(100vh - 60px);
  padding: 20px;
  background: #f5f7fa;
}

.playground-container {
  display: flex;
  gap: 20px;
  height: 100%;
}

.sidebar {
  width: 280px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.params-card {
  flex: 1;
}

.chat-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}

.messages-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.messages-card :deep(.el-card__body) {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.messages-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #909399;
}

.empty-state p {
  margin-top: 16px;
}

.message {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.message.user {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.message.user .message-avatar {
  background: #409eff;
  color: #fff;
}

.message.assistant .message-avatar {
  background: #67c23a;
  color: #fff;
}

.message-content {
  max-width: 70%;
  padding: 12px 16px;
  border-radius: 12px;
}

.message.user .message-content {
  background: #409eff;
  color: #fff;
}

.message.assistant .message-content {
  background: #fff;
  border: 1px solid #e4e7ed;
}

.message-text {
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}

.message-text :deep(code) {
  background: #f1f1f1;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: monospace;
}

.message.user .message-text :deep(code) {
  background: rgba(255, 255, 255, 0.2);
}

.streaming .cursor {
  animation: blink 1s infinite;
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

.input-area {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
}

.input-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
}

.token-count {
  color: #909399;
  font-size: 12px;
}
</style>
