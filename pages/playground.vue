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
          @pin="togglePinConversation"
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
                <div class="message-body">
                  <div
                    v-if="messageImages(message?.id).length > 0"
                    class="message-images"
                  >
                    <a
                      v-for="(src, idx) in messageImages(message?.id)"
                      :key="`${message?.id}-${idx}`"
                      class="message-md-img-link"
                      :href="src"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <img class="message-md-img" :src="src" alt="" loading="lazy" />
                    </a>
                  </div>
                  <div
                    v-if="partsToText(message?.parts)"
                    class="message-md"
                    v-html="renderMarkdown(partsToText(message?.parts))"
                  />
                  <div
                    v-if="message?.role === 'user' && !streaming && !insertAfterId"
                    class="message-actions"
                  >
                    <CfButton
                      tone="secondary"
                      icon="i-lucide-corner-down-left"
                      @click="beginInsert(message.id)"
                    >
                      {{ t('play.insertAfter') }}
                    </CfButton>
                  </div>
                </div>
              </template>
              <template #indicator>
                <UChatShimmer :text="t('play.thinking')" />
              </template>
            </UChatMessages>
          </div>
        </div>

        <div
          class="composer-area"
          :class="{ 'is-dragover': imageDragOver }"
          @paste="onComposerPaste"
          @dragenter.prevent="onComposerDragEnter"
          @dragover.prevent="onComposerDragOver"
          @dragleave.prevent="onComposerDragLeave"
          @drop.prevent="onComposerDrop"
          @keydown.escape="onComposerEscape"
        >
          <div v-if="imageDragOver" class="composer-drop-hint">
            {{ t('play.dropImages') }}
          </div>
          <QuotaBar :snap="quotaSnap" />
          <div class="composer-meta">
            <span class="token-hint">{{ tokenCount }} tokens</span>
          </div>

          <div v-if="insertAfterId" class="insert-bar">
            <p class="insert-bar-hint">{{ t('play.insertHint') }}</p>
            <div class="insert-bar-actions">
              <CfButton tone="secondary" icon="i-lucide-x" @click="cancelInsert">
                {{ t('play.insertCancel') }}
              </CfButton>
            </div>
          </div>

          <PlaygroundQueueBar
            :items="messageQueue"
            :editing-id="queueEditingId"
            @update="onQueueUpdate"
            @move="onQueueMove"
            @edit="startQueueEdit"
            @cancel-edit="cancelQueueEdit"
          />

          <div v-if="pendingImages.length > 0" class="pending-images">
            <div
              v-for="(src, idx) in pendingImages"
              :key="idx"
              class="pending-image"
            >
              <a
                class="pending-image-link"
                :href="src"
                target="_blank"
                rel="noopener noreferrer"
                :title="t('play.previewImage')"
              >
                <img :src="src" alt="" />
              </a>
              <CfButton
                tone="icon-danger"
                icon="i-lucide-x"
                :tip="t('play.removeImage')"
                @click.stop="removePendingImage(idx)"
              />
            </div>
          </div>
          <p v-if="pendingImages.length > 0" class="vision-hint">{{ t('play.visionHint') }}</p>
          <UChatPrompt
            v-model="inputMessage"
            :disabled="quotaGone"
            :submit-on-enter="true"
            :placeholder="composerPlaceholder"
            variant="subtle"
            :rows="2"
            :maxrows="6"
            class="composer-prompt"
            @submit="onComposerSubmit"
          >
            <template #footer>
              <div class="composer-footer">
                <div class="composer-footer-left">
                  <input
                    ref="imageInput"
                    type="file"
                    :accept="CHAT_IMAGE_ACCEPT"
                    multiple
                    class="sr-only"
                    @change="onImageInputChange"
                  >
                  <CfButton
                    tone="icon"
                    icon="i-lucide-image-plus"
                    :tip="t('play.attachImage')"
                    :disabled="quotaGone || pendingImages.length >= CHAT_IMAGE_MAX_COUNT"
                    @click="imageInput?.click()"
                  />
                  <span class="composer-hint">{{ composerHint }}</span>
                </div>
                <UChatPromptSubmit
                  class="cf-btn cf-btn--primary"
                  :status="queueEditingId ? 'ready' : chatStatus"
                  color="primary"
                  variant="solid"
                  :disabled="quotaGone || (!canSend && (queueEditingId ? true : chatStatus === 'ready'))"
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
          @pin="togglePinConversation"
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
import { renderChatMarkdown } from '~/utils/chatMarkdown'
import {
  CHAT_IMAGE_ACCEPT,
  CHAT_IMAGE_MAX_COUNT,
  ChatImageError,
  collectClipboardFiles,
  filesToChatDataUrls,
  partitionChatImages,
  toVisionContent,
} from '~/utils/chatImages'
import { apiUrl } from '~/utils/apiBase'
import type { Agent } from '@/composables/useAgents'
import type {
  ConversationMessage,
  ConversationQueueItem,
  ConversationSummary,
} from '@/composables/useConversations'
import type { QuotaSnapshot } from '@/composables/useQuota'

definePageMeta({
  layout: 'default',
  requiresAuth: true,
})

const MAX_MESSAGE_QUEUE = 5

/** Local playground message. */
interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  images?: string[]
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
const messageQueue = ref<ConversationQueueItem[]>([])
const queueEditingId = ref('')
const insertAfterId = ref('')
const inputMessage = ref('')
const pendingImages = ref<string[]>([])
const imageInput = ref<HTMLInputElement | null>(null)
const imageDragOver = ref(false)
let imageDragDepth = 0
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

const composerPlaceholder = computed(() => {
  if (quotaGone.value) return t('quota.placeholderDone')
  if (queueEditingId.value) return t('play.queueEditingPlaceholder')
  if (insertAfterId.value) return t('play.insertSend')
  if (streaming.value) return t('play.queueAdd')
  return t('play.placeholder')
})

const composerHint = computed(() => {
  if (queueEditingId.value) return t('play.queueEditingHint')
  if (streaming.value) return `${t('play.queueAdd')} · ${t('play.hint')}`
  return t('play.hint')
})

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
  memory_turns: 10, // 阶段十四 14.2：服务端滑动窗口轮数
})

const tokenCount = computed(() => {
  return messages.value.reduce((acc, msg) => {
    const imgBoost = (msg.images?.length || 0) * 300
    return acc + msg.content.length / 4 + imgBoost
  }, 0) | 0
})

const canSend = computed(
  () => inputMessage.value.trim().length > 0 || pendingImages.value.length > 0,
)

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

function messageImages(id?: string): string[] {
  if (!id) return []
  return messages.value.find(m => m.id === id)?.images || []
}

const renderMarkdown = (content: string) => renderChatMarkdown(content)

function notifyImageError(err: unknown) {
  if (err instanceof ChatImageError) {
    const map: Record<string, string> = {
      tooMany: t('play.imageTooMany'),
      tooBig: t('play.imageTooBig'),
      badType: t('play.imageBadType'),
      readFail: t('play.imageReadFail'),
    }
    notifyError(map[err.code] || t('play.imageReadFail'))
    return
  }
  notifyError(t('play.imageReadFail'))
}

async function addImageFiles(files: File[]) {
  if (!files.length) return
  const { images, rejected } = partitionChatImages(files)
  if (rejected.length > 0 && images.length === 0) {
    notifyImageError(new ChatImageError('badType', 'unsupported image type'))
    return
  }
  if (!images.length) return
  try {
    const urls = await filesToChatDataUrls(images, pendingImages.value.length)
    pendingImages.value = [...pendingImages.value, ...urls]
    if (rejected.length > 0) {
      notifyError(t('play.imageBadType'))
    }
  } catch (err) {
    notifyImageError(err)
  }
}

function removePendingImage(idx: number) {
  pendingImages.value = pendingImages.value.filter((_, i) => i !== idx)
}

async function onImageInputChange(ev: Event) {
  const input = ev.target as HTMLInputElement
  const files = Array.from(input.files || [])
  input.value = ''
  await addImageFiles(files)
}

async function onComposerPaste(ev: ClipboardEvent) {
  const files = collectClipboardFiles(ev.clipboardData)
  if (!files.length) return
  ev.preventDefault()
  if (quotaGone.value) return
  await addImageFiles(files)
}

function dragHasFiles(ev: DragEvent): boolean {
  const types = Array.from(ev.dataTransfer?.types || [])
  return types.includes('Files')
}

function onComposerDragEnter(ev: DragEvent) {
  if (!dragHasFiles(ev) || quotaGone.value) return
  imageDragDepth += 1
  imageDragOver.value = true
  if (ev.dataTransfer) ev.dataTransfer.dropEffect = 'copy'
}

function onComposerDragOver(ev: DragEvent) {
  if (!dragHasFiles(ev) || quotaGone.value) return
  if (ev.dataTransfer) ev.dataTransfer.dropEffect = 'copy'
  imageDragOver.value = true
}

function onComposerDragLeave() {
  imageDragDepth = Math.max(0, imageDragDepth - 1)
  if (imageDragDepth === 0) imageDragOver.value = false
}

async function onComposerDrop(ev: DragEvent) {
  imageDragDepth = 0
  imageDragOver.value = false
  if (quotaGone.value) return
  await addImageFiles(collectClipboardFiles(ev.dataTransfer))
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
      images: m.images?.length ? m.images : undefined,
      time: m.time,
    })),
    message_queue: messageQueue.value.map((q, i): ConversationQueueItem => ({
      id: q.id,
      content: q.content,
      images: q.images?.length ? q.images : undefined,
      status: q.status === 'sending' ? 'sending' : 'queued',
      sort: i,
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

async function persistConversation(opts?: { allowEmpty?: boolean; queueOnly?: boolean }) {
  if (!opts?.allowEmpty && messages.value.length === 0 && messageQueue.value.length === 0) return
  const seq = ++persistSeq
  const snapshotId = currentConversationId.value
  const payload = conversationPayload()
  if (opts?.queueOnly && snapshotId) {
    const res = await updateConversation(snapshotId, { message_queue: payload.message_queue })
    if (seq !== persistSeq) return
    if (res.error) notifyError(res.error || t('play.saveFail'))
    return
  }
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

async function persistQueue() {
  if (!currentConversationId.value) {
    if (messages.value.length > 0) await persistConversation()
    return
  }
  await persistConversation({ allowEmpty: true, queueOnly: true })
}

function onQueueUpdate(items: ConversationQueueItem[]) {
  if (queueEditingId.value && !items.some(i => i.id === queueEditingId.value)) {
    restoreComposerStash()
    queueEditingId.value = ''
  }
  messageQueue.value = items.map((item, i) => ({ ...item, sort: i }))
  void persistQueue()
}

function onQueueMove(id: string, delta: number) {
  const idx = messageQueue.value.findIndex(i => i.id === id)
  if (idx < 0) return
  const next = idx + delta
  if (next < 0 || next >= messageQueue.value.length) return
  if (messageQueue.value[idx].status === 'sending' || messageQueue.value[next].status === 'sending') return
  const copy = [...messageQueue.value]
  const [row] = copy.splice(idx, 1)
  copy.splice(next, 0, row)
  messageQueue.value = copy.map((item, i) => ({ ...item, sort: i }))
  void persistQueue()
}

let composerStash: { text: string; images: string[] } | null = null

function restoreComposerStash() {
  inputMessage.value = composerStash?.text ?? ''
  pendingImages.value = composerStash?.images ?? []
  composerStash = null
}

function startQueueEdit(id: string) {
  const item = messageQueue.value.find(i => i.id === id)
  if (!item || item.status === 'sending') return
  if (queueEditingId.value && queueEditingId.value !== id) {
    if (!saveQueueEdit({ drain: false })) return
  }
  if (insertAfterId.value) cancelInsert()
  if (!queueEditingId.value) {
    composerStash = {
      text: inputMessage.value,
      images: [...pendingImages.value],
    }
  }
  queueEditingId.value = id
  inputMessage.value = item.content || ''
  pendingImages.value = [...(item.images || [])]
}

function cancelQueueEdit() {
  if (!queueEditingId.value) return
  queueEditingId.value = ''
  restoreComposerStash()
  if (!streaming.value) void drainQueueIfNeeded()
}

function saveQueueEdit(opts?: { drain?: boolean }): boolean {
  const id = queueEditingId.value
  if (!id) return false
  const content = inputMessage.value.trim()
  const images = [...pendingImages.value]
  if (!content && images.length === 0) return false
  messageQueue.value = messageQueue.value.map((item, i) => {
    if (item.id !== id) return item
    return {
      ...item,
      content,
      images: images.length ? images : undefined,
      sort: i,
    }
  })
  queueEditingId.value = ''
  restoreComposerStash()
  void persistQueue()
  if (opts?.drain !== false && !streaming.value) void drainQueueIfNeeded()
  return true
}

function onComposerEscape() {
  if (queueEditingId.value) {
    cancelQueueEdit()
    return
  }
  if (insertAfterId.value) cancelInsert()
}

function beginInsert(messageId: string) {
  if (streaming.value) return
  if (queueEditingId.value) cancelQueueEdit()
  insertAfterId.value = messageId
}

function cancelInsert() {
  insertAfterId.value = ''
}

const stopStreaming = () => {
  abortController.value?.abort()
  abortController.value = null
  streaming.value = false
  messageQueue.value = messageQueue.value.map(item => (
    item.status === 'sending' ? { ...item, status: 'queued' as const } : item
  ))
}

const toggleDesktopHistory = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
}

const startNewChat = () => {
  persistSeq++
  stopStreaming()
  messages.value = []
  messageQueue.value = []
  queueEditingId.value = ''
  composerStash = null
  insertAfterId.value = ''
  pendingImages.value = []
  imageDragOver.value = false
  imageDragDepth = 0
  currentConversationId.value = ''
  conversationTitle.value = ''
  void setConversationQuery(null)
}

const sendSuggestion = (text: string) => {
  inputMessage.value = text
  void onComposerSubmit()
}

function enqueueFromComposer(): boolean {
  if (messageQueue.value.length >= MAX_MESSAGE_QUEUE) {
    notifyError(t('play.queueFull'))
    return false
  }
  const content = inputMessage.value.trim()
  const images = [...pendingImages.value]
  if (!content && images.length === 0) return false
  messageQueue.value = [
    ...messageQueue.value,
    {
      id: crypto.randomUUID(),
      content,
      images: images.length ? images : undefined,
      status: 'queued',
      sort: messageQueue.value.length,
    },
  ]
  inputMessage.value = ''
  pendingImages.value = []
  void persistQueue()
  return true
}

async function onComposerSubmit() {
  if (quotaGone.value) return
  if (!canSend.value) return

  if (queueEditingId.value) {
    saveQueueEdit()
    return
  }

  if (insertAfterId.value) {
    await confirmAndInsert()
    return
  }

  if (streaming.value) {
    enqueueFromComposer()
    return
  }

  await sendMessage()
}

async function confirmAndInsert() {
  const afterId = insertAfterId.value
  if (!afterId) return
  const idx = messages.value.findIndex(m => m.id === afterId)
  if (idx < 0) {
    cancelInsert()
    return
  }
  const removeCount = messages.value.length - idx - 1
  if (removeCount > 0) {
    const ok = window.confirm(t('play.insertConfirm', { n: removeCount }))
    if (!ok) return
  }
  messages.value = messages.value.slice(0, idx + 1)
  messageQueue.value = []
  queueEditingId.value = ''
  composerStash = null
  insertAfterId.value = ''
  await sendMessage()
}

async function drainQueueIfNeeded() {
  if (streaming.value || quotaGone.value || queueEditingId.value) return
  const next = messageQueue.value.find(i => i.status === 'queued')
  if (!next) return
  messageQueue.value = messageQueue.value.map(item => (
    item.id === next.id ? { ...item, status: 'sending' as const } : item
  ))
  await persistQueue()
  inputMessage.value = next.content
  pendingImages.value = [...(next.images || [])]
  messageQueue.value = messageQueue.value.filter(item => item.id !== next.id)
  await persistQueue()
  await sendMessage()
}

const sendMessage = async () => {
  if ((!inputMessage.value.trim() && pendingImages.value.length === 0) || streaming.value || quotaGone.value) return

  const userMessage = inputMessage.value.trim()
  const images = [...pendingImages.value]
  messages.value.push({
    id: crypto.randomUUID(),
    role: 'user',
    content: userMessage,
    images: images.length ? images : undefined,
    time: new Date().toISOString(),
  })
  inputMessage.value = ''
  pendingImages.value = []

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
        .filter(m => m.content.trim().length > 0 || (m.images?.length ?? 0) > 0)
        .map(m => ({ role: m.role, content: toVisionContent(m.content, m.images) })),
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
    await persistConversation({ allowEmpty: true })
    await refreshQuota()
    await drainQueueIfNeeded()
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
    images: Array.isArray(m.images) ? m.images.filter(Boolean) : undefined,
    time: m.time,
  }))
  messageQueue.value = (res.data.message_queue || []).map((q, i) => ({
    id: q.id || crypto.randomUUID(),
    content: q.content || '',
    images: Array.isArray(q.images) ? q.images.filter(Boolean) : undefined,
    status: q.status === 'sending' ? 'queued' : (q.status || 'queued'),
    sort: typeof q.sort === 'number' ? q.sort : i,
  }))
  insertAfterId.value = ''
  queueEditingId.value = ''
  composerStash = null
  pendingImages.value = []
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

const togglePinConversation = async (id: string, pinned: boolean) => {
  if (!id) return
  const res = await updateConversation(id, { pinned })
  if (res.error) {
    notifyError(res.error || t('play.pinFail'))
    return
  }
  await fetchConversationList()
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

.message-md :deep(.message-md-img-link) {
  display: block;
  max-width: 100%;
  margin: 10px 0;
  line-height: 0;
  border-radius: 12px;
  overflow: hidden;
  background: color-mix(in oklab, var(--cf-ink) 4%, transparent);
}

.message-md :deep(.message-md-img),
.message-md :deep(img) {
  display: block;
  max-width: min(100%, 520px);
  width: auto;
  height: auto;
  max-height: 420px;
  object-fit: contain;
  border-radius: 12px;
  border: 1px solid color-mix(in oklab, var(--cf-ink) 10%, transparent);
  cursor: zoom-in;
}

.message-md :deep(a.message-md-img-link:hover .message-md-img),
.message-md :deep(a.message-md-img-link:hover img) {
  opacity: 0.92;
}

.message-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.message-actions {
  display: flex;
  justify-content: flex-end;
  opacity: 0;
  transition: opacity 0.12s ease;
}

.message-body:hover .message-actions,
.message-body:focus-within .message-actions {
  opacity: 1;
}

.insert-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px dashed color-mix(in oklab, var(--cf-accent) 50%, transparent);
  background: color-mix(in oklab, var(--cf-accent) 8%, transparent);
}

.insert-bar-hint {
  margin: 0;
  font-size: 12px;
  color: var(--cf-ink);
  line-height: 1.4;
}

.insert-bar-actions {
  flex-shrink: 0;
}

.message-images {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.message-images .message-md-img-link {
  margin: 0;
  max-width: min(100%, 280px);
}

.message-images .message-md-img {
  max-height: 240px;
}

.pending-images {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 6px;
}

.vision-hint {
  margin: 0 0 10px;
  font-size: 11px;
  color: var(--cf-ink-soft);
  line-height: 1.4;
}

.pending-image {
  position: relative;
  width: 72px;
  height: 72px;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid color-mix(in oklab, var(--cf-ink) 12%, transparent);
  background: color-mix(in oklab, var(--cf-ink) 4%, transparent);
}

.pending-image-link {
  display: block;
  width: 100%;
  height: 100%;
  cursor: zoom-in;
}

.pending-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.pending-image :deep(.cf-btn) {
  position: absolute;
  top: 2px;
  right: 2px;
  z-index: 2;
  background: color-mix(in oklab, #000 45%, transparent) !important;
}

.composer-footer-left {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.composer-area {
  position: relative;
  width: min(780px, 100%);
  margin: 0 auto;
  padding: 0 24px 20px;
  flex-shrink: 0;
  border-radius: 16px;
  transition: box-shadow 0.15s ease, background 0.15s ease;
}

.composer-area.is-dragover {
  background: color-mix(in oklab, var(--cf-accent) 8%, transparent);
  box-shadow: inset 0 0 0 2px color-mix(in oklab, var(--cf-accent) 45%, transparent);
}

.composer-drop-hint {
  position: absolute;
  inset: 8px 24px 12px;
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  border: 1.5px dashed color-mix(in oklab, var(--cf-accent) 55%, transparent);
  background: color-mix(in oklab, var(--cf-bg, #fff) 88%, transparent);
  color: var(--cf-accent-ink, var(--cf-accent));
  font-size: 14px;
  font-weight: 600;
  pointer-events: none;
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

.composer-prompt :deep(button:disabled),
.composer-prompt :deep(button[aria-disabled="true"]) {
  background: var(--cf-btn-disabled-bg) !important;
  color: var(--cf-btn-disabled-fg) !important;
  border-color: transparent !important;
  opacity: 1 !important;
  cursor: not-allowed !important;
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
