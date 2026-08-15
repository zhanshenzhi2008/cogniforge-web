<template>
  <div class="dashboard-page">
    <header class="hero">
      <h1 class="hero-title font-display">
        {{ t('dash.welcome', { name: firstName }) }}
      </h1>
      <p class="hero-sub hero-sub--desktop">
        {{ t('dash.subDesktop') }}
      </p>
      <p class="hero-sub hero-sub--mobile">
        {{ t('dash.subMobile') }}
      </p>
    </header>

    <div class="stat-grid">
      <button
        v-for="card in statCards"
        :key="card.key"
        type="button"
        class="stat-card"
        @click="go(card.to)"
      >
        <div class="stat-top">
          <span class="stat-value font-display">{{ card.value }}</span>
          <span class="stat-icon" aria-hidden="true">
            <UIcon :name="card.icon" class="size-5" />
          </span>
        </div>
        <div class="stat-label">{{ card.label }}</div>
        <div class="stat-caption" :class="{ 'is-muted': !card.accent }">
          {{ card.caption }}
        </div>
      </button>
    </div>

    <div class="section-grid">
      <section class="panel panel--steps">
        <h2 class="panel-title font-display">{{ t('dash.nextSteps') }}</h2>
        <div class="quick-list">
          <button
            v-for="item in quickActions"
            :key="item.to"
            type="button"
            class="quick-item"
            @click="go(item.to)"
          >
            <span class="quick-icon" aria-hidden="true">
              <UIcon :name="item.icon" class="size-4" />
            </span>
            <span class="quick-text">
              <span class="quick-title">{{ item.title }}</span>
              <span class="quick-desc">{{ item.desc }}</span>
            </span>
            <UIcon name="i-lucide-chevron-right" class="quick-chevron size-4" />
          </button>
        </div>
        <CfButton
          class="cta-btn"
          tone="primary"
          icon="i-lucide-flask-conical"
          block
          @click="go('/playground')"
        >
          {{ t('dash.openPlay') }}
        </CfButton>
      </section>

      <section class="panel panel--activity">
        <h2 class="panel-title font-display">{{ t('dash.activity') }}</h2>
        <div class="activity-empty">
          <UIcon name="i-lucide-zap" class="activity-icon size-9" />
          <p class="activity-title">{{ t('dash.activityEmpty') }}</p>
          <p class="activity-hint">{{ t('dash.activityHint') }}</p>
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
const { t } = useLocale()
const { list: listAgents } = useAgents()
const { list: listWorkflows } = useWorkflows()
const { listKBs } = useKnowledgeBases()
const { get } = useApi()

const firstName = computed(() => {
  const name = (user.value?.name || t('dash.guestName')).trim()
  return name.split(/\s+/)[0] || t('dash.guestName')
})

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
    label: t('dash.stat.agents'),
    value: loading.value ? '—' : String(counts.agents),
    caption: counts.agents > 0 ? t('dash.stat.total', { n: counts.agents }) : t('dash.stat.firstAgent'),
    accent: counts.agents > 0,
    icon: 'i-lucide-bot',
    to: '/agents',
  },
  {
    key: 'flows',
    label: t('dash.stat.flows'),
    value: loading.value ? '—' : String(counts.flows),
    caption: counts.flows > 0 ? t('dash.stat.total', { n: counts.flows }) : t('dash.stat.firstFlow'),
    accent: counts.flows > 0,
    icon: 'i-lucide-git-branch',
    to: '/workflows',
  },
  {
    key: 'knowledge',
    label: t('dash.stat.knowledge'),
    value: loading.value ? '—' : String(counts.knowledge),
    caption: counts.knowledge > 0 ? t('dash.stat.kbOn') : t('dash.stat.kbOff'),
    accent: counts.knowledge > 0,
    icon: 'i-lucide-book-open',
    to: '/knowledge',
  },
  {
    key: 'keys',
    label: t('dash.stat.keys'),
    value: loading.value ? '—' : String(counts.keys),
    caption: counts.keys > 0 ? t('dash.stat.total', { n: counts.keys }) : t('dash.stat.firstKey'),
    accent: counts.keys > 0,
    icon: 'i-lucide-key-round',
    to: '/keys',
  },
])

const quickActions = computed(() => [
  {
    title: t('dash.q.play.title'),
    desc: t('dash.q.play.desc'),
    to: '/playground',
    icon: 'i-lucide-zap',
  },
  {
    title: t('dash.q.flow.title'),
    desc: t('dash.q.flow.desc'),
    to: '/workflows',
    icon: 'i-lucide-git-branch',
  },
  {
    title: t('dash.q.kb.title'),
    desc: t('dash.q.kb.desc'),
    to: '/knowledge',
    icon: 'i-lucide-book-open',
  },
  {
    title: t('dash.q.keys.title'),
    desc: t('dash.q.keys.desc'),
    to: '/keys',
    icon: 'i-lucide-key-round',
  },
])

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
    // keep zeros — dashboard stays usable
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
  max-width: 1120px;
  width: 100%;
  margin: 0 auto;
  padding: 36px 28px 56px;
  box-sizing: border-box;
}

.hero {
  margin-bottom: 32px;
}

.hero-title {
  margin: 0;
  font-size: clamp(2rem, 4vw, 2.75rem);
  font-weight: 700;
  letter-spacing: -0.035em;
  color: var(--cf-ink);
  line-height: 1.12;
}

.hero-sub {
  margin: 12px 0 0;
  font-size: 1rem;
  color: var(--cf-ink-soft);
  line-height: 1.5;
}

.hero-sub--mobile {
  display: none;
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

@media (min-width: 960px) {
  .stat-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 16px;
  }
}

.stat-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
  padding: 20px 18px 16px;
  border-radius: 8px;
  border: 1px solid var(--cf-line);
  background: color-mix(in oklab, var(--cf-bg-elevated) 92%, white);
  box-shadow: none;
  cursor: pointer;
  text-align: left;
  font: inherit;
  color: inherit;
  transition: border-color 0.15s ease, transform 0.15s ease;
}

.stat-card:hover {
  transform: translateY(-1px);
  border-color: color-mix(in oklab, var(--cf-accent) 40%, var(--cf-line));
}

.stat-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 6px;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--cf-ink);
  line-height: 1;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.03em;
}

.stat-icon {
  color: var(--cf-accent);
  margin-top: 2px;
  opacity: 0.95;
}

.stat-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--cf-ink);
}

.stat-caption {
  margin-top: 2px;
  font-size: 0.78rem;
  color: var(--cf-accent);
}

.stat-caption.is-muted {
  color: var(--cf-ink-soft);
}

.section-grid {
  margin-top: 28px;
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
  align-items: stretch;
}

@media (min-width: 900px) {
  .section-grid {
    grid-template-columns: minmax(280px, 0.9fr) minmax(0, 1.35fr);
    gap: 24px;
  }
}

.panel {
  border-radius: 8px;
  border: 1px solid var(--cf-line);
  background: color-mix(in oklab, var(--cf-bg-elevated) 92%, white);
  padding: 22px 20px 20px;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.panel-title {
  margin: 0 0 8px;
  font-size: 1.35rem;
  font-weight: 700;
  letter-spacing: -0.025em;
  color: var(--cf-ink);
}

.quick-list {
  display: flex;
  flex-direction: column;
  flex: 1;
  margin-top: 4px;
}

.quick-item {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  padding: 14px 2px;
  border: 0;
  border-bottom: 1px solid var(--cf-line);
  border-radius: 0;
  background: transparent;
  cursor: pointer;
  text-align: left;
  font: inherit;
  transition: background 0.12s ease;
}

.quick-item:last-of-type {
  border-bottom: 0;
}

.quick-item:hover {
  background: color-mix(in oklab, var(--cf-accent) 5%, transparent);
}

.quick-icon {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: var(--cf-accent);
  background: transparent;
}

.quick-text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.quick-title {
  font-size: 0.92rem;
  font-weight: 600;
  color: var(--cf-ink);
}

.quick-desc {
  font-size: 0.78rem;
  color: var(--cf-ink-soft);
}

.quick-chevron {
  color: color-mix(in oklab, var(--cf-ink-soft) 80%, transparent);
  flex-shrink: 0;
}

.cta-btn {
  margin-top: 16px;
  font-weight: 600;
}

.panel--activity {
  min-height: 340px;
}

.activity-empty {
  flex: 1;
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 8px;
  padding: 28px 20px;
  border: 1px dashed color-mix(in oklab, var(--cf-line) 90%, var(--cf-ink-soft));
  border-radius: 8px;
  background: color-mix(in oklab, var(--cf-bg) 35%, transparent);
}

.activity-icon {
  color: var(--cf-accent);
  margin-bottom: 6px;
}

.activity-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--cf-ink);
}

.activity-hint {
  margin: 0;
  font-size: 0.85rem;
  color: var(--cf-ink-soft);
  max-width: 260px;
  line-height: 1.45;
}

/* Mobile: match cogniforge-ui-mobile — stats 2×2, next steps, no activity */
@media (max-width: 899px) {
  .dashboard-page {
    padding: 24px 16px 40px;
    max-width: 560px;
  }

  .hero {
    margin-bottom: 22px;
  }

  .hero-title {
    font-size: clamp(1.85rem, 7vw, 2.2rem);
  }

  .hero-sub--desktop {
    display: none;
  }

  .hero-sub--mobile {
    display: block;
    font-size: 0.95rem;
  }

  .stat-grid {
    gap: 10px;
  }

  .stat-card {
    padding: 16px 14px 14px;
    border-radius: 10px;
  }

  .stat-value {
    font-size: 1.75rem;
  }

  .section-grid {
    margin-top: 26px;
  }

  .panel--steps {
    border: 0;
    background: transparent;
    padding: 0;
  }

  .panel--activity {
    display: none;
  }

  .quick-item {
    padding: 16px 0;
  }

  .cta-btn {
    margin-top: 20px;
    border-radius: 10px;
  }
}
</style>
