<template>
  <div class="cf-page">
    <div class="cf-page-header">
      <div class="cf-page-heading">
        <h1 class="cf-page-title">{{ t('evals.title') }}</h1>
        <p class="cf-page-sub">{{ t('evals.sub') }}</p>
      </div>
      <div class="header-actions">
        <CfButton
          v-if="activeSuite"
          tone="secondary"
          icon="i-lucide-arrow-left"
          @click="closeSuite"
        >
          {{ t('evals.back') }}
        </CfButton>
        <CfButton v-if="!activeSuite" tone="primary" icon="i-lucide-plus" @click="showCreate = true">
          {{ t('evals.new') }}
        </CfButton>
      </div>
    </div>

    <!-- 列表 -->
    <template v-if="!activeSuite">
      <div class="list-toolbar">
        <span class="list-count">{{ t('evals.count', { n: suites.length }) }}</span>
      </div>
      <div class="cf-panel">
        <div v-if="loading" class="cf-state">
          <UIcon name="i-lucide-loader-circle" class="size-6 animate-spin" />
        </div>
        <div v-else-if="suites.length === 0" class="cf-state">
          <UIcon name="i-lucide-clipboard-check" class="size-8 opacity-50" />
          <p>{{ t('evals.empty') }}</p>
        </div>
        <div v-else class="cf-table-wrap">
          <table class="cf-data-table">
            <thead>
              <tr>
                <th>{{ t('common.name') }}</th>
                <th>{{ t('common.description') }}</th>
                <th>{{ t('common.updatedAt') }}</th>
                <th class="cf-col-actions">{{ t('common.actions') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="s in suites" :key="s.id" class="row-click" @click="openSuite(s)">
                <td class="name">{{ s.name }}</td>
                <td class="cf-muted">{{ s.description || '—' }}</td>
                <td class="cf-muted">{{ d(s.updated_at) }}</td>
                <td @click.stop>
                  <CfButton
                    tone="icon-danger"
                    icon="i-lucide-trash-2"
                    :tip="t('common.delete')"
                    @click="askDelete(s)"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <!-- 详情：用例 + 运行 -->
    <template v-else>
      <div class="detail-head">
        <h2>{{ activeSuite.name }}</h2>
        <p class="cf-muted">{{ activeSuite.description }}</p>
      </div>

      <section class="cf-panel block">
        <div class="block-head">
          <h3>{{ t('evals.cases') }}</h3>
          <CfButton tone="secondary" icon="i-lucide-plus" @click="showCase = true">
            {{ t('evals.addCase') }}
          </CfButton>
        </div>
        <div v-if="cases.length === 0" class="cf-state compact">
          <p>{{ t('evals.noCases') }}</p>
        </div>
        <table v-else class="cf-data-table">
          <thead>
            <tr>
              <th>{{ t('evals.input') }}</th>
              <th>{{ t('evals.expected') }}</th>
              <th>{{ t('evals.judge') }}</th>
              <th class="cf-col-actions">{{ t('common.actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="c in cases" :key="c.id">
              <td>{{ c.input }}</td>
              <td class="cf-muted">{{ c.expected || '—' }}</td>
              <td><UBadge size="sm" variant="subtle">{{ c.judge_type }}</UBadge></td>
              <td>
                <CfButton
                  tone="icon-danger"
                  icon="i-lucide-trash-2"
                  :tip="t('common.delete')"
                  @click="removeCase(c.id)"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <section class="cf-panel block">
        <div class="block-head">
          <h3>{{ t('evals.run') }}</h3>
        </div>
        <div class="run-form">
          <USelect
            v-model="runTargetType"
            :items="targetOptions"
            value-key="value"
            class="target-type"
          />
          <template v-if="runTargetType === 'prompt'">
            <USelect
              v-if="promptOptions.length"
              v-model="selectedPromptId"
              :items="promptOptions"
              value-key="value"
              class="prompt-pick"
              :placeholder="t('evals.pickPrompt')"
            />
            <USelect
              v-if="versionOptions.length"
              v-model="runTargetId"
              :items="versionOptions"
              value-key="value"
              class="prompt-pick"
              :placeholder="t('evals.pickVersion')"
            />
            <UInput
              v-model="runModel"
              class="w-full"
              :placeholder="t('evals.chatModelPh')"
            />
            <p v-if="promptOptions.length === 0" class="param-hint full">{{ t('evals.noPrompts') }}</p>
          </template>
          <UInput
            v-else
            v-model="runTargetId"
            class="w-full"
            :placeholder="targetIdPlaceholder"
          />
          <CfButton
            tone="primary"
            icon="i-lucide-play"
            :loading="running"
            :disabled="!canRun"
            @click="doRun"
          >
            {{ running ? t('evals.running') : t('evals.run') }}
          </CfButton>
        </div>
        <UTextarea
          v-model="runSystemPrompt"
          class="w-full sys-prompt"
          :rows="3"
          :placeholder="t('evals.systemPromptPh')"
        />
        <p class="param-hint">{{ t('evals.systemPrompt') }}</p>

        <div v-if="lastRun" class="run-summary">
          <UBadge color="primary" variant="subtle">
            {{ t('evals.score') }}: {{ (lastRun.score * 100).toFixed(0) }}%
          </UBadge>
          <span class="cf-muted">
            {{ t('evals.passFail', { p: lastRun.pass_count, f: lastRun.fail_count, s: lastRun.skip_count }) }}
          </span>
        </div>

        <div v-if="lastResults.length" class="results">
          <div v-for="r in lastResults" :key="r.id" class="result-card">
            <div class="result-top">
              <UBadge
                size="sm"
                variant="subtle"
                :color="r.status === 'pass' ? 'success' : r.status === 'fail' || r.status === 'error' ? 'error' : 'neutral'"
              >
                {{ r.status }}
              </UBadge>
              <span class="cf-muted">{{ r.latency_ms }}ms</span>
            </div>
            <p class="actual-label">{{ t('evals.actual') }}</p>
            <pre class="actual">{{ r.actual_output || '—' }}</pre>
          </div>
        </div>
      </section>
    </template>

    <UModal v-model:open="showCreate">
      <template #content>
        <div class="modal-body">
          <h3>{{ t('evals.createTitle') }}</h3>
          <UInput v-model="form.name" :placeholder="t('evals.namePh')" class="w-full" />
          <UTextarea v-model="form.description" :placeholder="t('evals.descPh')" class="w-full" :rows="3" />
          <div class="modal-actions">
            <CfButton tone="secondary" @click="showCreate = false">{{ t('common.cancel') }}</CfButton>
            <CfButton tone="primary" :loading="saving" @click="createSuite">{{ t('common.create') }}</CfButton>
          </div>
        </div>
      </template>
    </UModal>

    <UModal v-model:open="showCase">
      <template #content>
        <div class="modal-body">
          <h3>{{ t('evals.addCase') }}</h3>
          <UTextarea v-model="caseForm.input" :placeholder="t('evals.input')" class="w-full" :rows="2" />
          <UInput v-model="caseForm.expected" :placeholder="t('evals.expected')" class="w-full" />
          <USelect
            v-model="caseForm.judge_type"
            :items="judgeOptions"
            value-key="value"
            class="w-full"
          />
          <div class="modal-actions">
            <CfButton tone="secondary" @click="showCase = false">{{ t('common.cancel') }}</CfButton>
            <CfButton tone="primary" :loading="saving" @click="addCase">{{ t('common.create') }}</CfButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import type { EvalCase, EvalResult, EvalRun, EvalSuite } from '@/composables/useEvals'

const { t, d } = useLocale()
const toast = useToast()
const api = useEvals()

const loading = ref(true)
const saving = ref(false)
const running = ref(false)
const suites = ref<EvalSuite[]>([])
const activeSuite = ref<EvalSuite | null>(null)
const cases = ref<EvalCase[]>([])
const showCreate = ref(false)
const showCase = ref(false)
const form = reactive({ name: '', description: '' })
const caseForm = reactive({ input: '', expected: '', judge_type: 'contains' })
const judgeOptions = [
  { label: 'contains', value: 'contains' },
  { label: 'exact', value: 'exact' },
  { label: 'llm_judge (skip)', value: 'llm_judge' },
]
const promptApi = usePrompts()
const runTargetType = ref<'model' | 'agent' | 'prompt'>('model')
const runTargetId = ref('')
const runModel = ref('')
const runSystemPrompt = ref('')
const selectedPromptId = ref('')
const promptList = ref<{ id: string; name: string }[]>([])
const versionList = ref<{ id: string; version: number; changelog?: string }[]>([])
const targetOptions = [
  { label: 'model', value: 'model' },
  { label: 'agent', value: 'agent' },
  { label: 'prompt', value: 'prompt' },
]
const promptOptions = computed(() =>
  promptList.value.map(p => ({ label: p.name, value: p.id })),
)
const versionOptions = computed(() =>
  versionList.value.map(v => ({
    label: v.changelog ? `v${v.version} · ${v.changelog}` : `v${v.version}`,
    value: v.id,
  })),
)
const targetIdPlaceholder = computed(() => {
  if (runTargetType.value === 'agent') return t('evals.agentIdPh')
  return t('evals.modelIdPh')
})
const canRun = computed(() => {
  if (!runTargetId.value.trim() || cases.value.length === 0) return false
  if (runTargetType.value === 'prompt' && !runModel.value.trim()) return false
  return true
})
const lastRun = ref<EvalRun | null>(null)
const lastResults = ref<EvalResult[]>([])

const loadPromptCatalog = async () => {
  const res = await promptApi.list()
  if (res.error) {
    promptList.value = []
    return
  }
  promptList.value = (res.data || []).map(p => ({ id: p.id, name: p.name }))
}

watch(runTargetType, async (tt) => {
  runTargetId.value = ''
  selectedPromptId.value = ''
  versionList.value = []
  if (tt === 'prompt') {
    await loadPromptCatalog()
  }
})

watch(selectedPromptId, async (pid) => {
  runTargetId.value = ''
  versionList.value = []
  if (!pid) return
  const res = await promptApi.listVersions(pid)
  versionList.value = (res.data || []).map(v => ({
    id: v.id,
    version: v.version,
    changelog: v.changelog,
  }))
  if (versionList.value[0]) {
    runTargetId.value = versionList.value[0].id
  }
})

const loadSuites = async () => {
  loading.value = true
  const res = await api.listSuites()
  loading.value = false
  if (res.error) {
    toast.add({ title: t('evals.listFail'), description: res.error, color: 'error' })
    return
  }
  suites.value = res.data || []
}

const openSuite = async (s: EvalSuite) => {
  activeSuite.value = s
  lastRun.value = null
  lastResults.value = []
  runTargetType.value = 'model'
  runTargetId.value = ''
  selectedPromptId.value = ''
  versionList.value = []
  const res = await api.listCases(s.id)
  cases.value = res.data || []
}

const closeSuite = () => {
  activeSuite.value = null
  cases.value = []
}

const createSuite = async () => {
  if (!form.name.trim()) return
  saving.value = true
  const res = await api.createSuite({ name: form.name.trim(), description: form.description })
  saving.value = false
  if (res.error) {
    toast.add({ title: res.error, color: 'error' })
    return
  }
  showCreate.value = false
  form.name = ''
  form.description = ''
  await loadSuites()
  if (res.data) await openSuite(res.data)
}

const askDelete = async (s: EvalSuite) => {
  if (!confirm(t('evals.deleteText', { name: s.name }))) return
  const res = await api.deleteSuite(s.id)
  if (res.error) {
    toast.add({ title: res.error, color: 'error' })
    return
  }
  await loadSuites()
}

const addCase = async () => {
  if (!activeSuite.value || !caseForm.input.trim()) return
  saving.value = true
  const res = await api.createCase(activeSuite.value.id, {
    input: caseForm.input.trim(),
    expected: caseForm.expected,
    judge_type: caseForm.judge_type,
  })
  saving.value = false
  if (res.error) {
    toast.add({ title: res.error, color: 'error' })
    return
  }
  showCase.value = false
  caseForm.input = ''
  caseForm.expected = ''
  caseForm.judge_type = 'contains'
  const list = await api.listCases(activeSuite.value.id)
  cases.value = list.data || []
}

const removeCase = async (id: string) => {
  const res = await api.deleteCase(id)
  if (res.error) {
    toast.add({ title: res.error, color: 'error' })
    return
  }
  if (activeSuite.value) {
    const list = await api.listCases(activeSuite.value.id)
    cases.value = list.data || []
  }
}

const doRun = async () => {
  if (!activeSuite.value || !canRun.value) return
  running.value = true
  const body: {
    target_type: string
    target_id: string
    model?: string
    system_prompt?: string
  } = {
    target_type: runTargetType.value,
    target_id: runTargetId.value.trim(),
  }
  if (runTargetType.value === 'prompt') {
    body.model = runModel.value.trim()
  }
  if (runSystemPrompt.value.trim()) {
    body.system_prompt = runSystemPrompt.value.trim()
  }
  const res = await api.createRun(activeSuite.value.id, body)
  running.value = false
  if (res.error) {
    toast.add({ title: res.error, color: 'error' })
    return
  }
  lastRun.value = res.data?.run || null
  lastResults.value = res.data?.results || []
}

onMounted(loadSuites)
</script>

<style scoped>
.header-actions { display: flex; gap: 8px; align-items: center; }
.list-toolbar { margin-bottom: 10px; }
.list-count { font-size: 13px; color: var(--cf-ink-soft); }
.row-click { cursor: pointer; }
.row-click:hover { background: color-mix(in oklab, var(--cf-ink) 4%, transparent); }
.name { font-weight: 600; }
.detail-head { margin-bottom: 16px; }
.detail-head h2 { margin: 0 0 4px; font-size: 18px; }
.block { margin-bottom: 16px; padding: 16px; }
.block-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.block-head h3 { margin: 0; font-size: 15px; }
.cf-state.compact { padding: 24px; }
.run-form { display: flex; gap: 10px; align-items: center; margin-bottom: 12px; flex-wrap: wrap; }
.target-type { width: 120px; flex-shrink: 0; }
.prompt-pick { min-width: 160px; flex: 1; }
.sys-prompt { margin-bottom: 4px; }
.param-hint { font-size: 11px; color: var(--cf-ink-soft); margin: 0 0 12px; }
.param-hint.full { width: 100%; flex-basis: 100%; margin: 0; }
.run-summary { display: flex; gap: 12px; align-items: center; margin-bottom: 12px; }
.results { display: flex; flex-direction: column; gap: 10px; }
.result-card {
  border: 1px solid var(--cf-line);
  border-radius: 8px;
  padding: 10px 12px;
}
.result-top { display: flex; justify-content: space-between; margin-bottom: 6px; }
.actual-label { margin: 0; font-size: 11px; color: var(--cf-ink-soft); }
.actual {
  margin: 4px 0 0;
  white-space: pre-wrap;
  font-size: 13px;
  max-height: 160px;
  overflow: auto;
}
.modal-body { padding: 20px; display: flex; flex-direction: column; gap: 12px; }
.modal-body h3 { margin: 0; }
.modal-actions { display: flex; justify-content: flex-end; gap: 8px; }
</style>
