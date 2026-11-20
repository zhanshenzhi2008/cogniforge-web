<template>
  <div class="cf-page">
    <div class="cf-page-header">
      <div class="cf-page-heading">
        <h1 class="cf-page-title">{{ t('agents.title') }}</h1>
        <p class="cf-page-sub">{{ t('agents.sub') }}</p>
      </div>
      <div class="header-actions">
        <CfViewModeToggle v-model="viewMode" storage-key="cf-agents-view" />
        <CfButton tone="primary" icon="i-lucide-plus" @click="goCreate">
          {{ t('agents.new') }}
        </CfButton>
      </div>
    </div>

    <div class="list-toolbar">
      <span class="list-count">{{ t('agents.count', { n: agents.length }) }}</span>
      <span class="list-hint">{{ t('agents.cardHint') }}</span>
    </div>

    <div v-if="loading" class="cf-panel">
      <div class="cf-state">
        <UIcon name="i-lucide-loader-circle" class="size-6 animate-spin" />
        <span>{{ t('common.loading') }}</span>
      </div>
    </div>

    <div v-else-if="agents.length === 0" class="cf-panel">
      <div class="cf-state">
        <UIcon name="i-lucide-bot" class="size-8 opacity-50" />
        <p>{{ t('agents.empty') }}</p>
        <CfButton tone="primary" icon="i-lucide-plus" @click="goCreate">
          {{ t('agents.new') }}
        </CfButton>
      </div>
    </div>

    <!-- Card view -->
    <div v-else-if="viewMode === 'card'" class="agent-grid">
      <div
        v-for="agent in agents"
        :key="agent.id"
        class="agent-card cf-surface"
        @click="goEdit(agent)"
      >
        <div class="agent-card__head">
          <div class="agent-card__identity">
            <span class="agent-card__icon">
              <UIcon name="i-lucide-bot" class="size-5" />
            </span>
            <div class="agent-card__titles">
              <div class="agent-card__name-row">
                <span class="agent-card__name">{{ agent.name }}</span>
                <UBadge
                  size="sm"
                  variant="subtle"
                  :color="agent.status === 'active' ? 'success' : 'neutral'"
                >
                  {{ agent.status === 'active' ? t('common.enabled') : t('common.disabled') }}
                </UBadge>
              </div>
              <UBadge size="sm" variant="subtle" color="primary">{{ agent.model }}</UBadge>
            </div>
          </div>
          <div class="action-btns" @click.stop>
            <CfButton
              tone="icon-accent"
              icon="i-lucide-pencil"
              :tip="t('common.edit')"
              @click="goEdit(agent)"
            />
            <CfButton
              tone="icon"
              icon="i-lucide-message-square"
              :tip="t('agents.chat')"
              @click="handleChat(agent)"
            />
            <CfButton
              tone="icon-danger"
              icon="i-lucide-trash-2"
              :tip="t('common.delete')"
              @click="askDelete(agent)"
            />
          </div>
        </div>
        <p class="agent-card__desc">{{ agent.description || t('common.noDesc') }}</p>
        <div class="agent-card__meta">{{ d(agent.created_at) }}</div>
      </div>
    </div>

    <!-- List view -->
    <div v-else class="cf-panel">
      <div class="cf-table-wrap">
        <table class="cf-data-table">
          <thead>
            <tr>
              <th>{{ t('common.name') }}</th>
              <th>{{ t('common.description') }}</th>
              <th>{{ t('common.model') }}</th>
              <th>{{ t('common.createdAt') }}</th>
              <th class="cf-col-actions">{{ t('common.actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="agent in agents"
              :key="agent.id"
              class="list-row"
              @dblclick="goEdit(agent)"
            >
              <td>
                <div class="agent-name">
                  <span class="name">{{ agent.name }}</span>
                  <UBadge
                    size="sm"
                    variant="subtle"
                    :color="agent.status === 'active' ? 'success' : 'neutral'"
                  >
                    {{ agent.status === 'active' ? t('common.enabled') : t('common.disabled') }}
                  </UBadge>
                </div>
              </td>
              <td class="cf-muted">{{ agent.description || '—' }}</td>
              <td>
                <UBadge size="sm" variant="subtle" color="primary">{{ agent.model }}</UBadge>
              </td>
              <td class="cf-muted">{{ d(agent.created_at) }}</td>
              <td @dblclick.stop>
                <div class="action-btns">
                  <CfButton
                    tone="icon-accent"
                    icon="i-lucide-pencil"
                    :tip="t('common.edit')"
                    @click="goEdit(agent)"
                  />
                  <CfButton
                    tone="icon"
                    icon="i-lucide-message-square"
                    :tip="t('agents.chat')"
                    @click="handleChat(agent)"
                  />
                  <CfButton
                    tone="icon-danger"
                    icon="i-lucide-trash-2"
                    :tip="t('common.delete')"
                    @click="askDelete(agent)"
                  />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <CfModal v-model:open="deleteVisible" :title="t('common.deleteConfirm')" :ui="{ content: 'sm:max-w-md' }">
      <template #body>
        <p class="delete-text">
          {{ t('agents.deleteText', { name: deleting?.name ?? '' }) }}
        </p>
      </template>
      <template #footer>
        <div class="modal-actions">
          <div class="modal-actions__right">
            <CfButton tone="secondary" icon="i-lucide-x" @click="deleteVisible = false">{{ t('common.cancel') }}</CfButton>
            <CfButton
              tone="danger"
              strong
              icon="i-lucide-trash-2"
              :loading="deletingLoading"
              @click="confirmDelete"
            >
              {{ t('common.delete') }}
            </CfButton>
          </div>
        </div>
      </template>
    </CfModal>
  </div>
</template>

<script setup lang="ts">
import type { Agent } from '@/composables/useAgents'
import type { ViewMode } from '@/components/CfViewModeToggle.vue'

definePageMeta({
  layout: 'default',
})

const router = useRouter()
const toast = useToast()
const { t, d } = useLocale()
const { list, remove } = useAgents()

const loading = ref(false)
const agents = ref<Agent[]>([])
const viewMode = ref<ViewMode>('card')
const deleteVisible = ref(false)
const deletingLoading = ref(false)
const deleting = ref<Agent | null>(null)

function goCreate() {
  navigateTo('/agents/new')
}

function goEdit(agent: Agent) {
  navigateTo(`/agents/${encodeURIComponent(agent.id)}`)
}

function handleChat(agent: Agent) {
  router.push(`/playground?agent=${agent.id}`)
}

function askDelete(agent: Agent) {
  deleting.value = agent
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
    await fetchAgents()
  } finally {
    deletingLoading.value = false
  }
}

async function fetchAgents() {
  loading.value = true
  try {
    const res = await list()
    if (res.error) {
      toast.add({ title: res.error, color: 'error' })
      return
    }
    agents.value = res.data || []
  } catch {
    toast.add({ title: t('agents.listFail'), color: 'error' })
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchAgents()
})
</script>

<style scoped>
.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.list-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.list-count,
.list-hint {
  font-size: 0.8rem;
  color: var(--cf-ink-soft);
}

.agent-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 14px;
}

.agent-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px;
  border-radius: 12px;
  border: 1px solid var(--cf-line);
  cursor: pointer;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.agent-card:hover {
  border-color: color-mix(in srgb, var(--cf-accent, #0f9f8a) 45%, var(--cf-line));
  box-shadow: 0 8px 24px rgb(15 23 42 / 6%);
}

.agent-card__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}

.agent-card__identity {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  min-width: 0;
}

.agent-card__icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: var(--cf-accent);
  background: color-mix(in oklab, var(--cf-accent) 12%, transparent);
}

.agent-card__titles {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.agent-card__name-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}

.agent-card__name {
  font-weight: 600;
  color: var(--cf-ink);
  line-height: 1.3;
}

.agent-card__desc {
  margin: 0;
  font-size: 0.85rem;
  line-height: 1.5;
  color: var(--cf-ink-soft);
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.agent-card__meta {
  font-size: 0.75rem;
  color: var(--cf-muted, #64748b);
}

.list-row {
  cursor: pointer;
}

.agent-name {
  display: flex;
  align-items: center;
  gap: 8px;
}

.agent-name .name {
  font-weight: 600;
  color: var(--cf-ink);
}

.action-btns {
  display: flex;
  align-items: center;
  gap: 2px;
}

.modal-actions__right {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}

.delete-text {
  margin: 0;
  color: var(--cf-ink-soft);
  line-height: 1.5;
}
</style>
