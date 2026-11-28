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
      <CfLoadingState />
    </div>

    <div v-else-if="agents.length === 0" class="cf-panel">
      <CfEmptyState :icon="CF_ICONS.agent" :message="t('agents.empty')">
        <template #action>
          <CfButton tone="primary" icon="i-lucide-plus" @click="goCreate">
            {{ t('agents.new') }}
          </CfButton>
        </template>
      </CfEmptyState>
    </div>

    <!-- Card view -->
    <div v-else-if="viewMode === 'card'" class="agent-grid">
      <CfResourceCard
        v-for="agent in agents"
        :key="agent.id"
        :icon="CF_ICONS.agent"
        :title="agent.name"
        :description="agent.description || t('common.noDesc')"
        :meta="d(agent.created_at)"
        @click="goEdit(agent)"
      >
        <template #badges>
          <UBadge
            size="sm"
            variant="subtle"
            :color="agent.status === 'active' ? 'success' : 'neutral'"
          >
            {{ agent.status === 'active' ? t('common.enabled') : t('common.disabled') }}
          </UBadge>
        </template>
        <template #sub>
          <UBadge size="sm" variant="subtle" color="primary">{{ agent.model }}</UBadge>
        </template>
        <template #actions>
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
        </template>
      </CfResourceCard>
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

    <CfConfirmModal
      v-model:open="deleteVisible"
      :message="t('agents.deleteText', { name: deleting?.name ?? '' })"
      :loading="deletingLoading"
      @confirm="confirmDelete"
    />
  </div>
</template>

<script setup lang="ts">
import type { Agent } from '@/composables/useAgents'
import type { ViewMode } from '@/components/CfViewModeToggle.vue'
import { CF_ICONS } from '~/constants/icons'

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
