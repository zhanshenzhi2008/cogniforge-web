<template>
  <div class="dashboard-page">
    <header class="hero">
      <h1 class="hero-title font-display">
        Welcome back, {{ displayName }}.
      </h1>
      <p class="hero-sub">
        Ship smarter with AI—your studio, your rules.
      </p>
    </header>

    <div class="stat-grid">
      <button
        v-for="card in statCards"
        :key="card.key"
        type="button"
        class="stat-card cf-surface"
        @click="go(card.to)"
      >
        <div class="stat-top">
          <span class="stat-value">{{ card.value }}</span>
          <span class="stat-icon">
            <UIcon :name="card.icon" class="size-4" />
          </span>
        </div>
        <div class="stat-label">{{ card.label }}</div>
        <div class="stat-caption" :class="{ 'stat-caption--accent': card.accent }">
          {{ card.caption }}
        </div>
      </button>
    </div>

    <div class="section-grid">
      <section class="panel cf-surface">
        <h2 class="panel-title font-display">Next steps</h2>
        <div class="quick-list">
          <button
            v-for="item in quickActions"
            :key="item.to"
            type="button"
            class="quick-item"
            @click="go(item.to)"
          >
            <span class="quick-icon">
              <UIcon :name="item.icon" class="size-4" />
            </span>
            <span class="quick-text">
              <span class="quick-title">{{ item.title }}</span>
              <span class="quick-desc">{{ item.desc }}</span>
            </span>
            <UIcon name="i-lucide-chevron-right" class="quick-chevron size-4" />
          </button>
        </div>
        <UButton
          color="primary"
          class="cta-btn"
          icon="i-lucide-flask-conical"
          block
          @click="go('/playground')"
        >
          Open Playground
        </UButton>
      </section>

      <section class="panel panel--activity cf-surface">
        <h2 class="panel-title font-display">Recent activity</h2>
        <div class="activity-empty">
          <div class="activity-empty__box">
            <UIcon name="i-lucide-zap" class="activity-icon size-8" />
            <p class="activity-title">No recent activity</p>
            <p class="activity-hint">Your runs, edits, and events will show up here.</p>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'default',
})

const { user } = useAuth()
const { list: listAgents } = useAgents()
const { list: listWorkflows } = useWorkflows()
const { listKBs } = useKnowledgeBases()
const { get } = useApi()

const displayName = computed(() => user.value?.name || 'there')

const counts = reactive({
  agents: 0,
  flows: 0,
  knowledge: 0,
  keys: 0,
})

const loading = ref(true)

function go(path: string) {
  void navigateTo(path)
}

const statCards = computed(() => [
  {
    key: 'agents',
    label: 'Agents',
    value: loading.value ? '—' : String(counts.agents),
    caption: counts.agents > 0 ? 'Ready to chat' : 'Create your first agent',
    accent: counts.agents > 0,
    icon: 'i-lucide-bot',
    to: '/agents',
  },
  {
    key: 'flows',
    label: 'Flows',
    value: loading.value ? '—' : String(counts.flows),
    caption: counts.flows > 0 ? 'Orchestration ready' : 'Build a workflow',
    accent: counts.flows > 0,
    icon: 'i-lucide-git-branch',
    to: '/workflows',
  },
  {
    key: 'knowledge',
    label: 'Knowledge Bases',
    value: loading.value ? '—' : String(counts.knowledge),
    caption: counts.knowledge > 0 ? 'Connected' : '— No changes',
    accent: false,
    icon: 'i-lucide-book-open',
    to: '/knowledge',
  },
  {
    key: 'keys',
    label: 'API Keys',
    value: loading.value ? '—' : String(counts.keys),
    caption: counts.keys > 0 ? 'Active credentials' : 'Add a key to start',
    accent: counts.keys > 0,
    icon: 'i-lucide-key-round',
    to: '/keys',
  },
])

const quickActions = [
  {
    title: 'Try the Playground',
    desc: 'Chat with models and agents',
    to: '/playground',
    icon: 'i-lucide-zap',
  },
  {
    title: 'Create a new Flow',
    desc: 'Wire nodes into an automation',
    to: '/workflows',
    icon: 'i-lucide-git-branch',
  },
  {
    title: 'Add to Knowledge',
    desc: 'Upload docs for retrieval',
    to: '/knowledge',
    icon: 'i-lucide-book-open',
  },
  {
    title: 'Manage API Keys',
    desc: 'Issue or revoke credentials',
    to: '/keys',
    icon: 'i-lucide-key-round',
  },
]

async function loadCounts() {
  loading.value = true
  try {
    const [agentsRes, flowsRes, kbRes, keysRes] = await Promise.all([
      listAgents(),
      listWorkflows(),
      listKBs(),
      get<{ keys?: unknown[]; data?: unknown[]; total?: number } | unknown[]>('/api/v1/keys'),
    ])

    if (!agentsRes.error && Array.isArray(agentsRes.data)) {
      counts.agents = agentsRes.data.length
    }
    if (!flowsRes.error && Array.isArray(flowsRes.data)) {
      counts.flows = flowsRes.data.length
    }
    if (!kbRes.error && Array.isArray(kbRes.data)) {
      counts.knowledge = kbRes.data.length
    }

    if (!keysRes.error && keysRes.data) {
      const raw = keysRes.data as any
      if (Array.isArray(raw)) {
        counts.keys = raw.length
      } else if (Array.isArray(raw.keys)) {
        counts.keys = raw.keys.length
      } else if (Array.isArray(raw.data)) {
        counts.keys = raw.data.length
      } else if (typeof raw.total === 'number') {
        counts.keys = raw.total
      }
    }
  } catch {
    // keep zeros on failure — dashboard stays usable
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  void loadCounts()
})
</script>

<style scoped>
.dashboard-page {
  max-width: 1400px;
  width: 100%;
  margin: 0 auto;
  padding: 28px 20px 48px;
  box-sizing: border-box;
}

.hero {
  margin-bottom: 28px;
}

.hero-title {
  margin: 0;
  font-size: clamp(1.75rem, 3.2vw, 2.35rem);
  font-weight: 700;
  letter-spacing: -0.03em;
  color: var(--cf-ink);
  line-height: 1.15;
}

.hero-sub {
  margin: 10px 0 0;
  font-size: 0.95rem;
  color: var(--cf-ink-soft);
  line-height: 1.5;
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

@media (min-width: 960px) {
  .stat-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 14px;
  }
}

.stat-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
  padding: 18px 16px 16px;
  border-radius: 10px;
  cursor: pointer;
  text-align: left;
  font: inherit;
  color: inherit;
  transition: transform 0.15s ease, border-color 0.15s ease;
}

.stat-card:hover {
  transform: translateY(-1px);
  border-color: color-mix(in oklab, var(--cf-accent) 35%, var(--cf-line));
}

.stat-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--cf-ink);
  line-height: 1.1;
  font-variant-numeric: tabular-nums;
}

.stat-icon {
  color: var(--cf-accent);
  opacity: 0.9;
  margin-top: 4px;
}

.stat-label {
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--cf-ink);
}

.stat-caption {
  font-size: 0.75rem;
  color: var(--cf-ink-soft);
}

.stat-caption--accent {
  color: var(--cf-accent);
}

.section-grid {
  margin-top: 18px;
  display: grid;
  grid-template-columns: 1fr;
  gap: 14px;
}

@media (min-width: 900px) {
  .section-grid {
    grid-template-columns: 5fr 7fr;
  }
}

.panel {
  border-radius: 10px;
  padding: 18px 16px;
  min-height: 320px;
  display: flex;
  flex-direction: column;
}

.panel-title {
  margin: 0 0 14px;
  font-size: 1.15rem;
  font-weight: 650;
  letter-spacing: -0.02em;
  color: var(--cf-ink);
}

.quick-list {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.quick-item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px 4px;
  border: 0;
  border-bottom: 1px solid var(--cf-line);
  border-radius: 0;
  background: transparent;
  cursor: pointer;
  text-align: left;
  font: inherit;
  transition: background 0.15s ease;
}

.quick-item:last-of-type {
  border-bottom: 0;
}

.quick-item:hover {
  background: color-mix(in oklab, var(--cf-accent) 6%, transparent);
}

.quick-icon {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: var(--cf-accent);
  background: color-mix(in oklab, var(--cf-accent) 12%, transparent);
}

.quick-text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.quick-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--cf-ink);
}

.quick-desc {
  font-size: 0.75rem;
  color: var(--cf-ink-soft);
}

.quick-chevron {
  color: var(--cf-ink-soft);
  flex-shrink: 0;
}

.cta-btn {
  margin-top: 14px;
}

.panel--activity {
  align-items: stretch;
}

.activity-empty {
  flex: 1;
  display: flex;
  align-items: stretch;
}

.activity-empty__box {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 8px;
  padding: 24px 16px;
  border: 1px dashed var(--cf-line);
  border-radius: 10px;
  background: color-mix(in oklab, var(--cf-bg-elevated) 55%, transparent);
}

.activity-icon {
  color: var(--cf-accent);
  margin-bottom: 4px;
}

.activity-title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--cf-ink);
}

.activity-hint {
  margin: 0;
  font-size: 0.8125rem;
  color: var(--cf-ink-soft);
  max-width: 280px;
}

@media (max-width: 640px) {
  .dashboard-page {
    padding: 20px 16px 36px;
  }

  .hero {
    margin-bottom: 20px;
  }

  .hero-sub {
    font-size: 0.875rem;
  }

  .panel {
    min-height: 0;
  }

  .panel--activity {
    min-height: 220px;
  }
}
</style>
