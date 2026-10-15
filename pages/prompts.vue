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
        <p class="cf-muted">{{ active.description }}</p>
      </div>

      <section class="cf-panel block">
        <div class="block-head">
          <h3>{{ t('prompts.versions') }}</h3>
          <CfButton tone="secondary" icon="i-lucide-plus" @click="showVer = true">
            {{ t('prompts.newVersion') }}
          </CfButton>
        </div>
        <div v-for="v in versions" :key="v.id" class="ver-card">
          <div class="ver-top">
            <UBadge size="sm" variant="subtle" color="primary">v{{ v.version }}</UBadge>
            <span class="cf-muted">{{ v.changelog || '—' }}</span>
            <span class="cf-muted mono">{{ v.id }}</span>
          </div>
          <pre class="content">{{ v.content }}</pre>
        </div>
      </section>
    </template>

    <UModal v-model:open="showCreate">
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
    </UModal>

    <UModal v-model:open="showVer">
      <template #content>
        <div class="modal-body">
          <h3>{{ t('prompts.newVersion') }}</h3>
          <UTextarea v-model="verForm.content" :placeholder="t('prompts.contentPh')" class="w-full" :rows="8" />
          <UInput v-model="verForm.changelog" :placeholder="t('prompts.changelogPh')" class="w-full" />
          <div class="modal-actions">
            <CfButton tone="secondary" @click="showVer = false">{{ t('common.cancel') }}</CfButton>
            <CfButton tone="primary" :loading="saving" @click="doVersion">{{ t('common.create') }}</CfButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import type { Prompt, PromptVersion } from '@/composables/usePrompts'

const { t, d } = useLocale()
const toast = useToast()
const api = usePrompts()

const loading = ref(true)
const saving = ref(false)
const items = ref<Prompt[]>([])
const active = ref<Prompt | null>(null)
const versions = ref<PromptVersion[]>([])
const showCreate = ref(false)
const showVer = ref(false)
const form = reactive({ name: '', description: '', content: '' })
const verForm = reactive({ content: '', changelog: '' })

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
  const res = await api.listVersions(p.id)
  versions.value = res.data || []
  if (versions.value[0]) {
    verForm.content = versions.value[0].content
  }
}

const closeDetail = () => {
  active.value = null
  versions.value = []
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
  })
  saving.value = false
  if (res.error) {
    toast.add({ title: res.error, color: 'error' })
    return
  }
  showVer.value = false
  verForm.changelog = ''
  await openDetail(active.value)
}

const askDelete = async (p: Prompt) => {
  if (!confirm(t('prompts.deleteText', { name: p.name }))) return
  const res = await api.remove(p.id)
  if (res.error) {
    toast.add({ title: res.error, color: 'error' })
    return
  }
  await load()
}

onMounted(load)
</script>

<style scoped>
.header-actions { display: flex; gap: 8px; }
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
.ver-card {
  border: 1px solid var(--cf-line);
  border-radius: 8px;
  padding: 10px 12px;
  margin-bottom: 10px;
}
.ver-top { display: flex; gap: 10px; align-items: center; margin-bottom: 8px; flex-wrap: wrap; }
.mono { font-family: ui-monospace, monospace; font-size: 11px; }
.content {
  margin: 0;
  white-space: pre-wrap;
  font-size: 13px;
  max-height: 200px;
  overflow: auto;
}
.modal-body { padding: 20px; display: flex; flex-direction: column; gap: 12px; }
.modal-body h3 { margin: 0; }
.modal-actions { display: flex; justify-content: flex-end; gap: 8px; }
</style>
