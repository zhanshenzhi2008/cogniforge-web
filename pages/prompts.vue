<template>
  <div class="cf-page">
    <div class="cf-page-header">
      <div class="cf-page-heading">
        <h1 class="cf-page-title">{{ t('prompts.title') }}</h1>
        <p class="cf-page-sub">{{ t('prompts.sub') }}</p>
      </div>
      <div class="header-actions">
        <CfButton v-if="active" tone="secondary" icon="i-lucide-arrow-left" @click="closeDetail">
          {{ t('evals.back') }}
        </CfButton>
        <CfButton
          v-if="active"
          tone="danger"
          icon="i-lucide-trash-2"
          @click="askDelete(active)"
        >
          {{ t('prompts.deletePrompt') }}
        </CfButton>
        <CfButton v-if="!active" tone="secondary" icon="i-lucide-download" @click="showImport = true">
          {{ t('prompts.importAgent') }}
        </CfButton>
        <CfButton v-if="!active" tone="primary" icon="i-lucide-plus" @click="showCreate = true">
          {{ t('prompts.new') }}
        </CfButton>
      </div>
    </div>

    <template v-if="!active">
      <div class="list-toolbar">
        <span class="list-count">{{ t('prompts.count', { n: items.length }) }}</span>
      </div>
      <div class="cf-panel">
        <div v-if="loading" class="cf-state">
          <UIcon name="i-lucide-loader-circle" class="size-6 animate-spin" />
        </div>
        <div v-else-if="items.length === 0" class="cf-state">
          <UIcon name="i-lucide-file-text" class="size-8 opacity-50" />
          <p>{{ t('prompts.empty') }}</p>
        </div>
        <table v-else class="cf-data-table">
          <thead>
            <tr>
              <th>{{ t('common.name') }}</th>
              <th>{{ t('common.description') }}</th>
              <th>{{ t('common.updatedAt') }}</th>
              <th class="cf-col-actions">{{ t('common.actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in items" :key="p.id" class="row-click" @click="openDetail(p)">
              <td class="name">{{ p.name }}</td>
              <td class="cf-muted">{{ p.description || '—' }}</td>
              <td class="cf-muted">{{ d(p.updated_at) }}</td>
              <td @click.stop>
                <CfButton
                  tone="icon-danger"
                  icon="i-lucide-trash-2"
                  :tip="t('common.delete')"
                  @click="askDelete(p)"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

    <template v-else>
      <div class="detail-head">
        <h2>{{ active.name }}</h2>
        <p v-if="sourceLabel(active)" class="source-line">{{ sourceLabel(active) }}</p>
        <p class="cf-muted">{{ active.description }}</p>
      </div>

      <section class="cf-panel block">
        <div class="block-head">
          <h3>{{ t('prompts.varDefs') }}</h3>
          <div class="block-actions">
            <CfButton tone="secondary" icon="i-lucide-plus" @click="addVarDef">{{ t('prompts.addVar') }}</CfButton>
            <CfButton tone="primary" :loading="savingVars" @click="saveVarDefs">{{ t('prompts.saveVars') }}</CfButton>
          </div>
        </div>
        <div v-if="!varDefs.length" class="cf-muted">{{ t('prompts.varsNone') }}</div>
        <div v-for="(vd, i) in varDefs" :key="i" class="vars-row">
          <UInput v-model="vd.name" :placeholder="t('prompts.varName')" size="sm" class="var-input" />
          <UInput v-model="vd.default" :placeholder="t('prompts.varDefault')" size="sm" class="var-input" />
          <UCheckbox v-model="vd.required" :label="t('prompts.varRequired')" />
          <CfButton tone="icon-danger" icon="i-lucide-trash-2" @click="varDefs.splice(i, 1)" />
        </div>
      </section>

      <section class="cf-panel block">
        <div class="block-head">
          <h3>{{ t('prompts.usages') }}</h3>
        </div>
        <div v-if="!usages.length" class="cf-muted">{{ t('prompts.usagesEmpty') }}</div>
        <ul v-else class="usage-list">
          <li v-for="u in usages" :key="u.agent_id">{{ u.agent_name }}</li>
        </ul>
      </section>

      <section class="cf-panel block">
        <div class="block-head">
          <h3>{{ t('prompts.versions') }}</h3>
          <div class="block-actions">
            <CfButton
              tone="secondary"
              icon="i-lucide-columns-2"
              :disabled="compareIds.length !== 2"
              @click="openCompare"
            >
              {{ t('prompts.compare') }}
            </CfButton>
            <CfButton tone="secondary" icon="i-lucide-plus" @click="showVer = true">
              {{ t('prompts.newVersion') }}
            </CfButton>
          </div>
        </div>
        <p class="cf-muted compare-hint">{{ t('prompts.compareHint') }}</p>
        <div v-for="v in versions" :key="v.id" class="ver-card" :class="{ current: v.id === active.current_version_id }">
          <div class="ver-top">
            <UCheckbox
              :model-value="compareIds.includes(v.id)"
              @update:model-value="(on: boolean | 'indeterminate') => toggleCompare(v.id, on === true)"
            />
            <UBadge size="sm" variant="subtle" color="primary">v{{ v.version }}</UBadge>
            <UBadge
              size="sm"
              variant="subtle"
              :color="v.status === 'published' ? 'success' : 'neutral'"
            >
              {{ v.status === 'published' ? t('prompts.published') : t('prompts.draft') }}
            </UBadge>
            <UBadge
              v-if="v.id === active.current_version_id"
              size="sm"
              variant="solid"
              color="success"
            >
              {{ t('prompts.current') }}
            </UBadge>
            <span class="cf-muted">{{ v.changelog || '—' }}</span>
            <div class="ver-actions">
              <CfButton
                v-if="v.status === 'draft'"
                tone="secondary"
                icon="i-lucide-rocket"
                @click="doPublish(v)"
              >
                {{ t('prompts.publish') }}
              </CfButton>
              <CfButton
                v-if="v.status === 'published' && v.id !== active.current_version_id"
                tone="secondary"
                icon="i-lucide-check"
                @click="doSetCurrent(v)"
              >
                {{ t('prompts.setCurrent') }}
              </CfButton>
              <CfButton
                tone="icon-danger"
                icon="i-lucide-trash-2"
                :tip="t('common.delete')"
                :disabled="versions.length <= 1"
                @click="askDeleteVersion(v)"
              />
            </div>
          </div>
          <pre class="content">{{ v.content }}</pre>
          <div v-if="extractVars(v.content).length" class="vars-box">
            <div class="vars-head">{{ t('prompts.vars') }}</div>
            <div class="vars-row" v-for="name in extractVars(v.content)" :key="`${v.id}-${name}`">
              <code>{{ name }}</code>
              <UInput
                v-model="varSamples[`${v.id}:${name}`]"
                :placeholder="t('prompts.varsPh')"
                size="sm"
                class="var-input"
              />
            </div>
            <div class="preview-label">{{ t('prompts.preview') }}</div>
            <pre class="content preview">{{ previewContent(v) }}</pre>
          </div>
        </div>
      </section>
    </template>

    <CfModal v-model:open="showCreate">
      <template #content>
        <div class="modal-body">
          <h3>{{ t('prompts.new') }}</h3>
          <UInput v-model="form.name" :placeholder="t('prompts.namePh')" class="w-full" />
          <UTextarea v-model="form.description" :placeholder="t('prompts.descPh')" class="w-full" :rows="2" />
          <UTextarea v-model="form.content" :placeholder="t('prompts.contentPh')" class="w-full" :rows="6" />
          <div class="modal-actions">
            <CfButton tone="secondary" @click="showCreate = false">{{ t('common.cancel') }}</CfButton>
            <CfButton tone="primary" :loading="saving" @click="doCreate">{{ t('common.create') }}</CfButton>
          </div>
        </div>
      </template>
    </CfModal>

    <CfModal v-model:open="showVer">
      <template #content>
        <div class="modal-body">
          <h3>{{ t('prompts.newVersion') }}</h3>
          <UTextarea v-model="verForm.content" :placeholder="t('prompts.contentPh')" class="w-full" :rows="8" />
          <UInput v-model="verForm.changelog" :placeholder="t('prompts.changelogPh')" class="w-full" />
          <UCheckbox v-model="verForm.publish" :label="t('prompts.publishNow')" />
          <div class="modal-actions">
            <CfButton tone="secondary" @click="showVer = false">{{ t('common.cancel') }}</CfButton>
            <CfButton tone="primary" :loading="saving" @click="doVersion">{{ t('common.create') }}</CfButton>
          </div>
        </div>
      </template>
    </CfModal>

    <CfModal v-model:open="showImport">
      <template #content>
        <div class="modal-body">
          <h3>{{ t('prompts.importAgent') }}</h3>
          <USelect v-model="importAgentId" class="w-full" :items="agentOptions" :placeholder="t('prompts.importAgentPh')" />
          <div class="modal-actions">
            <CfButton tone="secondary" @click="showImport = false">{{ t('common.cancel') }}</CfButton>
            <CfButton tone="primary" :loading="saving" @click="doImport">{{ t('common.create') }}</CfButton>
          </div>
        </div>
      </template>
    </CfModal>

    <CfModal v-model:open="deleteVisible" :title="t('common.deleteConfirm')" :ui="{ content: 'sm:max-w-md' }">
      <template #body>
        <p class="delete-text">
          {{ t('prompts.deleteText', { name: deleting?.name ?? '' }) }}
        </p>
      </template>
      <template #footer>
        <div class="modal-actions">
          <CfButton tone="secondary" @click="deleteVisible = false">{{ t('common.cancel') }}</CfButton>
          <CfButton tone="danger" :loading="deletingLoading" @click="confirmDelete">
            {{ t('common.delete') }}
          </CfButton>
        </div>
      </template>
    </CfModal>

    <CfModal v-model:open="deleteVerVisible" :title="t('common.deleteConfirm')" :ui="{ content: 'sm:max-w-md' }">
      <template #body>
        <p class="delete-text">
          {{ t('prompts.deleteVersionText', { n: deletingVer?.version ?? '' }) }}
        </p>
      </template>
      <template #footer>
        <div class="modal-actions">
          <CfButton tone="secondary" @click="deleteVerVisible = false">{{ t('common.cancel') }}</CfButton>
          <CfButton tone="danger" :loading="deletingLoading" @click="confirmDeleteVersion">
            {{ t('common.delete') }}
          </CfButton>
        </div>
      </template>
    </CfModal>

    <CfModal v-model:open="compareVisible" :title="t('prompts.compareTitle')" :ui="{ content: 'sm:max-w-4xl' }">
      <template #body>
        <div v-if="comparePair.length === 2" class="compare-grid">
          <div v-for="v in comparePair" :key="v.id" class="compare-col">
            <div class="compare-label">
              <UBadge size="sm" variant="subtle" color="primary">v{{ v.version }}</UBadge>
              <span class="cf-muted">{{ v.changelog || '—' }}</span>
            </div>
            <pre class="content compare-body">{{ v.content }}</pre>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="modal-actions">
          <CfButton tone="secondary" @click="compareVisible = false">{{ t('common.cancel') }}</CfButton>
        </div>
      </template>
    </CfModal>
  </div>
</template>

<script setup lang="ts">
import type { Prompt, PromptVarDef, PromptVersion, PromptUsage } from '@/composables/usePrompts'

const { t, d } = useLocale()
const toast = useToast()
const api = usePrompts()
const { list: listAgents } = useAgents()

const loading = ref(true)
const saving = ref(false)
const savingVars = ref(false)
const items = ref<Prompt[]>([])
const active = ref<Prompt | null>(null)
const versions = ref<PromptVersion[]>([])
const usages = ref<PromptUsage[]>([])
const varDefs = ref<PromptVarDef[]>([])
const showCreate = ref(false)
const showVer = ref(false)
const showImport = ref(false)
const importAgentId = ref('')
const agentOptions = ref<{ label: string; value: string }[]>([])
const form = reactive({ name: '', description: '', content: '' })
const verForm = reactive({ content: '', changelog: '', publish: true })

const deleteVisible = ref(false)
const deleteVerVisible = ref(false)
const deleting = ref<Prompt | null>(null)
const deletingVer = ref<PromptVersion | null>(null)
const deletingLoading = ref(false)

const compareIds = ref<string[]>([])
const compareVisible = ref(false)
const comparePair = ref<PromptVersion[]>([])
const varSamples = reactive<Record<string, string>>({})

const VAR_RE = /\{\{\s*([a-zA-Z_][\w]*)\s*\}\}/g

const sourceLabel = (p: Prompt) => {
  if (p.source_type === 'agent' && p.source_name) {
    return t('prompts.sourceAgent', { name: p.source_name })
  }
  if (p.source_type === 'skill' && p.source_name) {
    return t('prompts.sourceSkill', { name: p.source_name })
  }
  return ''
}

const extractVars = (content: string): string[] => {
  const names = new Set<string>()
  for (const m of content.matchAll(VAR_RE)) {
    if (m[1]) names.add(m[1])
  }
  return [...names]
}

const previewContent = (v: PromptVersion) => {
  return v.content.replace(VAR_RE, (_, name: string) => {
    const key = `${v.id}:${name}`
    const sample = varSamples[key]
    return sample?.trim() ? sample : `{{${name}}}`
  })
}

const load = async () => {
  loading.value = true
  const res = await api.list()
  loading.value = false
  if (res.error) {
    toast.add({ title: res.error, color: 'error' })
    return
  }
  items.value = res.data || []
}

const openDetail = async (p: Prompt) => {
  active.value = p
  compareIds.value = []
  varDefs.value = (p.variables || []).map(v => ({ ...v }))
  const [verRes, useRes, one] = await Promise.all([
    api.listVersions(p.id),
    api.listUsages(p.id),
    api.getOne(p.id),
  ])
  versions.value = verRes.data || []
  usages.value = useRes.data || []
  if (one.data?.prompt) {
    active.value = one.data.prompt
    varDefs.value = (one.data.prompt.variables || []).map(v => ({ ...v }))
  }
  if (versions.value[0]) {
    verForm.content = versions.value[0].content
  }
}

const closeDetail = () => {
  active.value = null
  versions.value = []
  usages.value = []
  varDefs.value = []
  compareIds.value = []
}

const addVarDef = () => {
  varDefs.value.push({ name: '', default: '', required: false })
}

const saveVarDefs = async () => {
  if (!active.value) return
  savingVars.value = true
  const cleaned = varDefs.value
    .map(v => ({
      name: (v.name || '').trim(),
      default: v.default || '',
      required: !!v.required,
      description: v.description || '',
    }))
    .filter(v => v.name)
  const res = await api.update(active.value.id, { variables: cleaned })
  savingVars.value = false
  if (res.error) {
    toast.add({ title: res.error, color: 'error' })
    return
  }
  if (res.data) active.value = res.data
  toast.add({ title: t('common.saveOk'), color: 'success' })
  await load()
}

const doPublish = async (v: PromptVersion) => {
  if (!active.value) return
  const res = await api.publishVersion(v.id)
  if (res.error) {
    toast.add({ title: res.error, color: 'error' })
    return
  }
  if (res.data?.prompt) active.value = res.data.prompt
  await load()
  await openDetail(active.value)
}

const doImport = async () => {
  if (!importAgentId.value) return
  saving.value = true
  const res = await api.importFromAgent({ agent_id: importAgentId.value })
  saving.value = false
  if (res.error) {
    toast.add({ title: res.error, color: 'error' })
    return
  }
  showImport.value = false
  importAgentId.value = ''
  const ver = res.data?.current_version
  toast.add({
    title: ver && ver.version > 1 ? t('prompts.importUpdated') : t('prompts.importCreated'),
    color: 'success',
  })
  await load()
  if (res.data?.prompt) await openDetail(res.data.prompt)
}

const loadAgents = async () => {
  const res = await listAgents()
  agentOptions.value = (res.data || []).map(a => ({ label: a.name, value: a.id }))
}

const doCreate = async () => {
  if (!form.name.trim()) return
  saving.value = true
  const res = await api.create({
    name: form.name.trim(),
    description: form.description,
    content: form.content,
  })
  saving.value = false
  if (res.error) {
    toast.add({ title: res.error, color: 'error' })
    return
  }
  showCreate.value = false
  form.name = ''
  form.description = ''
  form.content = ''
  await load()
  if (res.data?.prompt) await openDetail(res.data.prompt)
}

const doVersion = async () => {
  if (!active.value || !verForm.content.trim()) return
  saving.value = true
  const res = await api.createVersion(active.value.id, {
    content: verForm.content.trim(),
    changelog: verForm.changelog,
    publish: verForm.publish,
  })
  saving.value = false
  if (res.error) {
    toast.add({ title: res.error, color: 'error' })
    return
  }
  showVer.value = false
  verForm.changelog = ''
  verForm.publish = true
  await load()
  await openDetail(active.value)
}

const askDelete = (p: Prompt) => {
  deleting.value = p
  deleteVisible.value = true
}

const confirmDelete = async () => {
  if (!deleting.value) return
  deletingLoading.value = true
  const res = await api.remove(deleting.value.id)
  deletingLoading.value = false
  if (res.error) {
    toast.add({ title: res.error, color: 'error' })
    return
  }
  deleteVisible.value = false
  const id = deleting.value.id
  deleting.value = null
  if (active.value?.id === id) closeDetail()
  await load()
}

const askDeleteVersion = (v: PromptVersion) => {
  if (versions.value.length <= 1) {
    toast.add({ title: t('prompts.onlyOneVersion'), color: 'warning' })
    return
  }
  deletingVer.value = v
  deleteVerVisible.value = true
}

const confirmDeleteVersion = async () => {
  if (!deletingVer.value || !active.value) return
  deletingLoading.value = true
  const res = await api.removeVersion(deletingVer.value.id)
  deletingLoading.value = false
  if (res.error) {
    toast.add({ title: res.error, color: 'error' })
    return
  }
  deleteVerVisible.value = false
  compareIds.value = compareIds.value.filter(id => id !== deletingVer.value?.id)
  deletingVer.value = null
  await load()
  await openDetail(active.value)
}

const doSetCurrent = async (v: PromptVersion) => {
  if (!active.value) return
  const res = await api.setCurrentVersion(active.value.id, v.id)
  if (res.error) {
    toast.add({ title: res.error, color: 'error' })
    return
  }
  if (res.data) {
    active.value = res.data
    const idx = items.value.findIndex(x => x.id === res.data!.id)
    if (idx >= 0) items.value[idx] = res.data
  }
}

const toggleCompare = (id: string, on: boolean) => {
  if (on) {
    if (compareIds.value.includes(id)) return
    if (compareIds.value.length >= 2) {
      compareIds.value = [compareIds.value[1]!, id]
      return
    }
    compareIds.value = [...compareIds.value, id]
  } else {
    compareIds.value = compareIds.value.filter(x => x !== id)
  }
}

const openCompare = () => {
  if (compareIds.value.length !== 2) {
    toast.add({ title: t('prompts.compareNeedTwo'), color: 'warning' })
    return
  }
  comparePair.value = compareIds.value
    .map(id => versions.value.find(v => v.id === id))
    .filter((v): v is PromptVersion => !!v)
  if (comparePair.value.length !== 2) {
    toast.add({ title: t('prompts.compareNeedTwo'), color: 'warning' })
    return
  }
  compareVisible.value = true
}

onMounted(() => {
  load()
  loadAgents()
})
</script>

<style scoped>
.header-actions { display: flex; gap: 8px; flex-wrap: wrap; }
.list-toolbar { margin-bottom: 10px; }
.list-count { font-size: 13px; color: var(--cf-ink-soft); }
.row-click { cursor: pointer; }
.row-click:hover { background: color-mix(in oklab, var(--cf-ink) 4%, transparent); }
.name { font-weight: 600; }
.detail-head { margin-bottom: 16px; }
.detail-head h2 { margin: 0 0 4px; font-size: 18px; }
.source-line {
  margin: 0 0 6px;
  font-size: 0.8125rem;
  font-weight: 550;
  color: var(--cf-accent-ink, var(--cf-ink-soft));
}
.block { margin-bottom: 16px; padding: 16px; }
.block-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; gap: 12px; flex-wrap: wrap; }
.block-head h3 { margin: 0; font-size: 15px; }
.block-actions { display: flex; gap: 8px; flex-wrap: wrap; }
.compare-hint { margin: 0 0 12px; font-size: 12px; }
.ver-card {
  border: 1px solid var(--cf-line);
  border-radius: 8px;
  padding: 10px 12px;
  margin-bottom: 10px;
}
.ver-card.current {
  border-color: color-mix(in oklab, var(--cf-accent, #2563eb) 45%, var(--cf-line));
  background: color-mix(in oklab, var(--cf-accent, #2563eb) 4%, transparent);
}
.ver-top { display: flex; gap: 10px; align-items: center; margin-bottom: 8px; flex-wrap: wrap; }
.ver-actions { margin-left: auto; display: flex; gap: 6px; align-items: center; }
.mono { font-family: ui-monospace, monospace; font-size: 11px; }
.content {
  margin: 0;
  white-space: pre-wrap;
  font-size: 13px;
  max-height: 200px;
  overflow: auto;
}
.content.preview { max-height: 140px; background: color-mix(in oklab, var(--cf-ink) 3%, transparent); padding: 8px; border-radius: 6px; }
.vars-box { margin-top: 10px; padding-top: 10px; border-top: 1px dashed var(--cf-line); }
.vars-head { font-size: 12px; font-weight: 600; margin-bottom: 8px; }
.vars-row { display: flex; gap: 8px; align-items: center; margin-bottom: 6px; }
.vars-row code { font-size: 12px; min-width: 80px; }
.var-input { flex: 1; }
.preview-label { font-size: 12px; color: var(--cf-ink-soft); margin: 8px 0 4px; }
.modal-body { padding: 20px; display: flex; flex-direction: column; gap: 12px; }
.modal-body h3 { margin: 0; }
.modal-actions { display: flex; justify-content: flex-end; gap: 8px; }
.delete-text { margin: 0; line-height: 1.5; }
.compare-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
@media (max-width: 720px) {
  .compare-grid { grid-template-columns: 1fr; }
}
.compare-label { display: flex; gap: 8px; align-items: center; margin-bottom: 8px; }
.compare-body { max-height: 60vh; border: 1px solid var(--cf-line); border-radius: 8px; padding: 10px; }
.usage-list { margin: 0; padding-left: 18px; font-size: 13px; }
.usage-list li { margin-bottom: 4px; }
</style>
