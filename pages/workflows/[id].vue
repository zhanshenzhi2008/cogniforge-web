<template>
  <div class="workflow-editor">
    <div class="mobile-desktop-tip" role="status">
      <UIcon name="i-lucide-monitor" class="size-4" />
      <span>{{ t('editor.mobileTip') }}</span>
      <CfButton tone="secondary" icon="i-lucide-arrow-left" @click="navigateTo('/workflows')">
        {{ t('editor.backList') }}
      </CfButton>
    </div>
    <div class="editor-header">
      <CfButton tone="secondary" icon="i-lucide-arrow-left" @click="handleBack">
        {{ t('common.back') }}
      </CfButton>
      <h3>{{ workflowName }}</h3>
      <UBadge
        v-if="currentWorkflow"
        size="sm"
        variant="subtle"
        :color="statusType(currentWorkflow.status)"
      >
        {{ statusText(currentWorkflow.status) }}
      </UBadge>
      <UBadge v-else-if="isSmokeTest" size="sm" variant="subtle" color="warning">
        {{ t('editor.routeTest') }}
      </UBadge>
      <div class="header-actions">
        <CfButton
          tone="secondary"
          icon="i-lucide-pencil"
          :disabled="isSmokeTest"
          @click="editPopoverShow = true"
        >
          {{ t('common.edit') }}
        </CfButton>
        <CfButton
          tone="secondary"
          icon="i-lucide-check"
          :disabled="isSmokeTest"
          :loading="saving"
          @click="handleSave"
        >
          {{ t('common.save') }}
        </CfButton>
        <CfButton
          tone="secondary"
          icon="i-lucide-bug"
          @click="showDebugPanel = !showDebugPanel"
        >
          {{ t('editor.debug') }}
        </CfButton>
        <CfButton
          tone="primary"
          icon="i-lucide-play"
          :disabled="isSmokeTest"
          :loading="executing"
          @click="handleExecute"
        >
          {{ t('editor.run') }}
        </CfButton>
      </div>
    </div>

    <div class="editor-container">
      <div class="node-palette">
        <div class="palette-title">{{ t('editor.nodes') }}</div>
        <div
          v-for="type in nodeTypes"
          :key="type"
          class="palette-item"
          :data-type="type"
        >
          <UIcon :name="getNodeIcon(type)" class="size-4" />
          {{ getNodeLabel(type) }}
        </div>
      </div>

      <div ref="canvasRef" class="canvas-container">
        <ClientOnly>
          <WorkflowCanvas
            :nodes="nodes"
            :edges="edges"
            @node-click="handleNodeClick"
            @pane-click="handlePaneClick"
            @connect="handleConnect"
            @nodes-change="handleNodesChange"
            @edges-change="handleEdgesChange"
          />
          <template #fallback>
            <div class="canvas-loading">{{ t('editor.loading') }}</div>
          </template>
        </ClientOnly>
      </div>
    </div>

    <UModal
      v-model:open="editPopoverShow"
      :title="t('editor.editInfo')"
      :ui="{ content: 'sm:max-w-md' }"
    >
      <template #body>
        <div class="form-grid">
          <div class="field">
            <label class="field__label">{{ t('common.name') }}</label>
            <UInput v-model="workflowBasicInfo.name" class="w-full" :placeholder="t('editor.namePh')" />
          </div>
          <div class="field">
            <label class="field__label">{{ t('common.description') }}</label>
            <UTextarea
              v-model="workflowBasicInfo.description"
              class="w-full"
              :rows="3"
              :placeholder="t('editor.descPh')"
            />
          </div>
        </div>
      </template>
      <template #footer>
        <div class="modal-actions">
          <div class="modal-actions__right">
            <CfButton tone="secondary" icon="i-lucide-x" @click="handleCancelEdit">{{ t('common.cancel') }}</CfButton>
            <CfButton
              tone="primary"
              icon="i-lucide-check"
              :loading="savingBasic"
              @click="handleSaveBasic"
            >
              {{ t('common.save') }}
            </CfButton>
          </div>
        </div>
      </template>
    </UModal>

    <USlideover
      v-model:open="configDrawer"
      :title="selectedNode ? t('editor.configType', { name: getNodeLabel(selectedNode.type) }) : t('editor.nodeConfig')"
      :ui="{ content: 'max-w-md w-full' }"
    >
      <template #body>
        <div v-if="selectedNode" class="form-grid">
          <div class="field">
            <label class="field__label">{{ t('editor.nodeName') }}</label>
            <UInput v-model="nodeConfig.name" class="w-full" :placeholder="t('editor.nodeNamePh')" />
          </div>

          <div v-if="selectedNode.type === 'llm'" class="field">
            <label class="field__label">{{ t('common.model') }}</label>
            <USelect
              v-model="nodeConfig.model"
              class="w-full"
              :items="modelOptions"
              :placeholder="t('editor.pickModel')"
              value-key="value"
            />
          </div>

          <div v-if="selectedNode.type === 'llm'" class="field">
            <label class="field__label">{{ t('agents.systemPrompt') }}</label>
            <UTextarea
              v-model="nodeConfig.systemPrompt"
              class="w-full"
              :rows="5"
              :placeholder="t('agents.systemPh')"
            />
          </div>

          <div v-if="selectedNode.type === 'condition'" class="field">
            <label class="field__label">{{ t('common.description') }}</label>
            <UTextarea
              v-model="nodeConfig.description"
              class="w-full"
              :rows="3"
              :placeholder="t('editor.conditionPh')"
            />
          </div>

          <div v-if="selectedNode.type === 'search'" class="field">
            <label class="field__label">{{ t('editor.query') }}</label>
            <UInput v-model="nodeConfig.query" class="w-full" :placeholder="t('editor.queryPh')" />
          </div>

          <div v-if="selectedNode.type === 'input' || selectedNode.type === 'output'" class="field">
            <label class="field__label">{{ t('editor.variable') }}</label>
            <UInput v-model="nodeConfig.variable" class="w-full" :placeholder="t('editor.variablePh')" />
          </div>
        </div>
      </template>

      <template #footer>
        <div class="drawer-footer">
          <CfButton
            tone="danger"
            icon="i-lucide-trash-2"
            :disabled="!selectedNode"
            @click="handleDeleteNode"
          >
            {{ t('editor.deleteNode') }}
          </CfButton>
          <div class="drawer-footer-right">
            <CfButton tone="secondary" icon="i-lucide-x" @click="configDrawer = false">{{ t('common.cancel') }}</CfButton>
            <CfButton tone="primary" icon="i-lucide-check" @click="saveNodeConfig">{{ t('common.save') }}</CfButton>
          </div>
        </div>
      </template>
    </USlideover>
  </div>
</template>

<script setup lang="ts">
import WorkflowCanvas from '~/components/WorkflowCanvas.vue'

import { useRoute } from 'vue-router'
import { useWorkflows, type WorkflowDefinition } from '@/composables/useWorkflows'

/** Same as the list page smoke button: skip the API, only verify the dynamic route + Vue Flow. */
const CANVAS_SMOKE_ID = '__canvas_smoke__'

definePageMeta({
  layout: 'default',
})

const route = useRoute()
const toast = useToast()
const { t } = useLocale()
const { get, update, execute, listExecutions, getExecution, cancelExecution, debug } = useWorkflows()
const { list: listModels } = useModels()

const canvasRef = ref<HTMLElement>()

const workflowId = computed(() => {
  const raw = route.params.id
  return typeof raw === 'string' ? raw : Array.isArray(raw) ? raw[0] ?? '' : ''
})

const isSmokeTest = computed(() => workflowId.value === CANVAS_SMOKE_ID)

const workflowName = ref(t('editor.newName'))

const saving = ref(false)
const savingBasic = ref(false)
const executing = ref(false)
const configDrawer = ref(false)
const selectedNode = ref<any>(null)
const editPopoverShow = ref(false)

const workflowBasicInfo = reactive({
  name: '',
  description: '',
})

const nodes = ref<any[]>([])
const edges = ref<any[]>([])

const nodeConfig = reactive({
  name: '',
  model: '',
  systemPrompt: '',
  description: '',
  query: '',
  variable: '',
})

const currentWorkflow = ref<any>(null)

const showDebugPanel = ref(false)
const debugInput = ref('{}')
const currentExecution = ref<any>(null)
const executionLogs = ref<any[]>([])
const isDebugging = ref(false)
const debugPollInterval = ref<number | null>(null)

const nodeTypes = ['start', 'end', 'llm', 'agent', 'condition', 'loop', 'http', 'code', 'delay']

const modelOptions = ref<{ label: string; value: string }[]>([])
const firstConfiguredModel = () => modelOptions.value[0]?.value || ''

const getNodeIcon = (type: string) => {
  const icons: Record<string, string> = {
    start: 'i-lucide-play',
    end: 'i-lucide-square',
    llm: 'i-lucide-message-square',
    agent: 'i-lucide-message-square',
    condition: 'i-lucide-git-branch',
    loop: 'i-lucide-refresh-cw',
    http: 'i-lucide-download',
    code: 'i-lucide-upload',
    delay: 'i-lucide-timer',
    search: 'i-lucide-search',
    input: 'i-lucide-download',
    output: 'i-lucide-upload',
  }
  return icons[type] || 'i-lucide-message-square'
}

const getNodeLabel = (type: string) => {
  return t(`editor.node.${type}`)
}

const loadWorkflow = async () => {
  if (!workflowId.value) {
    toast.add({ title: t('editor.missingId'), color: 'warning' })
    return
  }

  currentWorkflow.value = null
  nodes.value = []
  edges.value = []

  if (isSmokeTest.value) {
    workflowName.value = t('editor.smokeName')
    workflowBasicInfo.name = workflowName.value
    workflowBasicInfo.description = t('editor.smokeDesc')
    nodes.value = [
      {
        id: 'smoke-llm',
        type: 'llm',
        position: { x: 120, y: 80 },
        data: { label: t('editor.smokeNode') },
      },
    ]
    edges.value = []
    return
  }

  const res = await get(workflowId.value)
  if (res.error) {
    toast.add({ title: res.error, color: 'error' })
    return
  }

  currentWorkflow.value = res.data
  const workflow = res.data
  if (workflow) {
    workflowName.value = workflow.name
    workflowBasicInfo.name = workflow.name
    workflowBasicInfo.description = workflow.description || ''
    if (workflow.definition) {
      try {
        const def: WorkflowDefinition = typeof workflow.definition === 'string'
          ? JSON.parse(workflow.definition)
          : workflow.definition
        nodes.value = def.nodes?.map((n: any) => ({
          id: n.id,
          type: n.type,
          position: n.position,
          data: {
            label: n.data?.label || getNodeLabel(n.type),
            ...n.data,
          },
        })) || []

        edges.value = def.edges?.map((e: any) => ({
          id: e.id,
          source: e.source,
          target: e.target,
          animated: true,
          style: { stroke: '#4f46e5' },
        })) || []
      } catch {
        nodes.value = []
        edges.value = []
      }
    }
  }
}

watch(workflowId, async (newId, oldId) => {
  if (newId && newId !== oldId) {
    await loadWorkflow()
  }
}, { immediate: true })

const statusType = (status: string) => {
  switch (status) {
    case 'draft': return 'neutral' as const
    case 'published': return 'success' as const
    case 'archived': return 'warning' as const
    default: return 'neutral' as const
  }
}

const statusText = (status: string) => {
  if (status === 'draft' || status === 'published' || status === 'archived') {
    return t(`status.${status}`)
  }
  return status
}

const handleCancelEdit = () => {
  editPopoverShow.value = false
}

const handleSaveBasic = async () => {
  if (isSmokeTest.value) {
    toast.add({ title: t('editor.noSaveOnTest'), color: 'info' })
    return
  }
  savingBasic.value = true
  try {
    const res = await update(workflowId.value, {
      name: workflowBasicInfo.name,
      description: workflowBasicInfo.description,
    })
    if (res.error) {
      toast.add({ title: res.error, color: 'error' })
      return
    }
    workflowName.value = workflowBasicInfo.name
    if (currentWorkflow.value) {
      currentWorkflow.value.name = workflowBasicInfo.name
      currentWorkflow.value.description = workflowBasicInfo.description
    }
    toast.add({ title: t('editor.infoSaved'), color: 'success' })
    editPopoverShow.value = false
  } catch {
    toast.add({ title: t('common.saveFail'), color: 'error' })
  } finally {
    savingBasic.value = false
  }
}

const handleNodesChange = (changes: any[]) => {
  changes.forEach(change => {
    if (change.type === 'position' && change.position) {
      const node = nodes.value.find(n => n.id === change.id)
      if (node) {
        node.position = change.position
      }
    }
  })
}

const handleEdgesChange = (changes: any[]) => {
  // handle edge changes
}

const handleConnect = (params: any) => {
  edges.value.push({
    id: `e${params.source}-${params.target}`,
    source: params.source,
    target: params.target,
    animated: true,
  })
}

const addNode = (type: string) => {
  const newNode = {
    id: `node-${Date.now()}`,
    type,
    position: { x: Math.random() * 300 + 50, y: Math.random() * 200 + 50 },
    data: {
      label: getNodeLabel(type),
    },
  }
  nodes.value.push(newNode)
}

const handleNodeClick = (event: any) => {
  selectedNode.value = event.node
  nodeConfig.name = event.node.data?.label || ''
  nodeConfig.model = event.node.data?.model || firstConfiguredModel()
  nodeConfig.systemPrompt = event.node.data?.systemPrompt || ''
  nodeConfig.description = event.node.data?.description || ''
  nodeConfig.query = event.node.data?.query || ''
  nodeConfig.variable = event.node.data?.variable || ''
  configDrawer.value = true
}

const handlePaneClick = () => {
  selectedNode.value = null
  configDrawer.value = false
}

const saveNodeConfig = () => {
  if (!selectedNode.value) return

  const node = nodes.value.find(n => n.id === selectedNode.value.id)
  if (node) {
    node.data = {
      ...node.data,
      label: nodeConfig.name,
      model: nodeConfig.model,
      systemPrompt: nodeConfig.systemPrompt,
      description: nodeConfig.description,
      query: nodeConfig.query,
      variable: nodeConfig.variable,
    }
  }

  toast.add({ title: t('editor.nodeSaved'), color: 'success' })
  configDrawer.value = false
}

const handleDeleteNode = () => {
  if (!selectedNode.value) return
  nodes.value = nodes.value.filter(n => n.id !== selectedNode.value.id)
  edges.value = edges.value.filter(e => e.source !== selectedNode.value.id && e.target !== selectedNode.value.id)
  selectedNode.value = null
  configDrawer.value = false
  toast.add({ title: t('editor.nodeDeleted'), color: 'success' })
}

const handleSave = async () => {
  if (isSmokeTest.value) {
    toast.add({ title: t('editor.noSaveOnTest'), color: 'info' })
    return
  }
  saving.value = true
  try {
    const definition: WorkflowDefinition = {
      nodes: nodes.value.map(n => ({
        id: n.id,
        type: n.type,
        position: n.position,
        data: {
          label: n.data?.label,
          model: n.data?.model,
          systemPrompt: n.data?.systemPrompt,
          description: n.data?.description,
          query: n.data?.query,
          variable: n.data?.variable,
        },
      })),
      edges: edges.value.map(e => ({
        id: e.id,
        source: e.source,
        target: e.target,
      })),
    }

    const res = await update(workflowId.value, {
      name: workflowName.value,
      definition,
    })

    if (res.error) {
      toast.add({ title: res.error, color: 'error' })
      return
    }

    toast.add({ title: t('editor.flowSaved'), color: 'success' })
  } catch {
    toast.add({ title: t('common.saveFail'), color: 'error' })
  } finally {
    saving.value = false
  }
}

const handleExecute = async () => {
  if (isSmokeTest.value) {
    toast.add({ title: t('editor.noRunOnTest'), color: 'info' })
    return
  }
  if (!currentWorkflow.value) {
    toast.add({ title: t('editor.saveFirst'), color: 'error' })
    return
  }
  if (currentWorkflow.value.status === 'draft') {
    toast.add({ title: t('editor.draftNoRun'), color: 'warning' })
    return
  }
  if (currentWorkflow.value.status === 'archived') {
    toast.add({ title: t('editor.archivedNoRun'), color: 'warning' })
    return
  }

  executing.value = true
  try {
    const res = await execute(workflowId.value)
    if (res.error) {
      toast.add({ title: res.error, color: 'error' })
      return
    }
    toast.add({ title: t('flows.started', { id: res.executionId }), color: 'success' })
  } catch {
    toast.add({ title: t('editor.runFail'), color: 'error' })
  } finally {
    executing.value = false
  }
}

const handleBack = () => {
  navigateTo('/workflows')
}

const startDebug = async () => {
  if (!workflowId.value || isSmokeTest.value) return
  if (!currentWorkflow.value) {
    toast.add({ title: t('editor.saveFirst'), color: 'warning' })
    return
  }

  isDebugging.value = true
  executionLogs.value = []
  currentExecution.value = null

  try {
    let input = {}
    try {
      input = JSON.parse(debugInput.value || '{}')
    } catch {
      toast.add({ title: t('editor.badJson'), color: 'error' })
      isDebugging.value = false
      return
    }

    const res = await debug(workflowId.value, input)
    if (res.error) {
      toast.add({ title: res.error, color: 'error' })
      isDebugging.value = false
      return
    }

    toast.add({ title: t('editor.debugStarted', { id: res.executionId }), color: 'success' })
    currentExecution.value = { id: res.executionId, status: 'debugging' }

    debugPollInterval.value = window.setInterval(async () => {
      const execRes = await getExecution(workflowId.value, res.executionId!)
      if (execRes.data) {
        currentExecution.value = execRes.data
        if (execRes.data.status === 'completed' || execRes.data.status === 'failed' || execRes.data.status === 'cancelled') {
          stopPolling()
          isDebugging.value = false
          if (execRes.data.status === 'completed') {
            toast.add({ title: t('editor.debugDone'), color: 'success' })
          } else if (execRes.data.status === 'failed') {
            toast.add({ title: t('editor.debugFail', { error: execRes.data.error }), color: 'error' })
          }
        }
      }
    }, 1000)
  } catch {
    toast.add({ title: t('editor.debugStartFail'), color: 'error' })
    isDebugging.value = false
  }
}

const stopPolling = () => {
  if (debugPollInterval.value) {
    clearInterval(debugPollInterval.value)
    debugPollInterval.value = null
  }
}

const cancelDebug = async () => {
  if (!currentExecution.value?.id) return
  const res = await cancelExecution(workflowId.value, currentExecution.value.id)
  if (res.error) {
    toast.add({ title: res.error, color: 'error' })
    return
  }
  stopPolling()
  isDebugging.value = false
  toast.add({ title: t('editor.debugCancel'), color: 'success' })
}

const loadExecutionHistory = async () => {
  if (!workflowId.value || isSmokeTest.value) return
  const res = await listExecutions(workflowId.value)
  if (res.data) {
    executionLogs.value = res.data
  }
}

onMounted(() => {
  listModels().then((res) => {
    modelOptions.value = (res.data || [])
      .filter(m => m.id)
      .map(m => ({ label: m.name || m.id, value: m.id }))
  })
  nextTick(() => {
    const palette = document.querySelector('.node-palette')
    if (palette) {
      palette.addEventListener('click', (e) => {
        const item = (e.target as HTMLElement).closest('.palette-item') as HTMLElement
        if (item && item.dataset.type) {
          addNode(item.dataset.type)
        }
      })
    }
  })
})
</script>

<style scoped>
.workflow-editor {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 56px);
  background: var(--cf-bg, #f8fafc);
}

.mobile-desktop-tip {
  display: none;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  font-size: 12px;
  color: var(--cf-ink);
  background: color-mix(in oklab, var(--cf-accent) 12%, transparent);
  border-bottom: 1px solid var(--cf-line, #e2e8f0);
}

.mobile-desktop-tip span {
  flex: 1;
  min-width: 0;
}

.editor-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 20px;
  background: var(--cf-bg-elevated, #fff);
  border-bottom: 1px solid var(--cf-line, #e2e8f0);
}

.editor-header h3 {
  margin: 0;
  flex: 1;
  font-size: 16px;
  color: var(--cf-ink, inherit);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}

.editor-container {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.node-palette {
  width: 160px;
  background: var(--cf-bg-elevated, #fff);
  border-right: 1px solid var(--cf-line, #e2e8f0);
  padding: 12px;
  flex-shrink: 0;
}

.palette-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--cf-ink-soft, #64748b);
  margin-bottom: 12px;
  text-transform: uppercase;
}

.palette-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  margin-bottom: 8px;
  background: var(--cf-bg, #f8fafc);
  border: 1px solid var(--cf-line, #e2e8f0);
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  color: var(--cf-ink, inherit);
  transition: all 0.2s;
}

.palette-item:hover {
  border-color: color-mix(in oklab, var(--cf-accent, #4f46e5) 40%, var(--cf-line, #e2e8f0));
  background: color-mix(in oklab, var(--cf-accent-soft, #f0f0ff) 70%, transparent);
}

.canvas-container {
  flex: 1;
  position: relative;
}

.canvas-container :deep(.vue-flow) {
  width: 100%;
  height: 100%;
}

.canvas-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: var(--cf-ink-soft, #64748b);
  font-size: 14px;
}

.flow-node {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-radius: 8px;
  border: 2px solid var(--cf-line, #e2e8f0);
  background: var(--cf-bg-elevated, #fff);
  font-size: 13px;
  min-width: 100px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
}

.flow-node:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.flow-node-llm {
  border-color: #4f46e5;
  color: #4f46e5;
}

.flow-node-condition {
  border-color: #f59e0b;
  color: #f59e0b;
}

.flow-node-search {
  border-color: #10b981;
  color: #10b981;
}

.flow-node-input {
  border-color: #3b82f6;
  color: #3b82f6;
}

.flow-node-output {
  border-color: #8b5cf6;
  color: #8b5cf6;
}

.canvas-container :deep(.vue-flow__edge-path) {
  stroke: #4f46e5;
  stroke-width: 2;
}

.canvas-container :deep(.vue-flow__minimap) {
  background: var(--cf-bg-elevated, #fff);
  border: 1px solid var(--cf-line, #e2e8f0);
  border-radius: 8px;
}

.canvas-container :deep(.vue-flow__controls) {
  background: var(--cf-bg-elevated, #fff);
  border: 1px solid var(--cf-line, #e2e8f0);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.form-grid {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field__label {
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--cf-ink-soft, #64748b);
}

.modal-actions__right {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}

.drawer-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 8px;
}

.drawer-footer-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.debug-panel {
  position: fixed;
  right: 0;
  top: 56px;
  bottom: 0;
  width: 400px;
  background: var(--cf-bg-elevated, #fff);
  border-left: 1px solid var(--cf-line, #e2e8f0);
  display: flex;
  flex-direction: column;
  z-index: 100;
  box-shadow: -4px 0 12px rgba(0, 0, 0, 0.1);
}

.debug-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--cf-line, #e2e8f0);
  background: var(--cf-bg, #f8fafc);
}

.debug-header h4 {
  margin: 0;
  font-size: 14px;
}

.debug-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.debug-section {
  margin-bottom: 16px;
}

.debug-section-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--cf-ink-soft, #64748b);
  margin-bottom: 8px;
  text-transform: uppercase;
}

.debug-status {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: var(--cf-bg, #f8fafc);
  border-radius: 8px;
  margin-bottom: 16px;
}

.debug-status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.debug-status-dot.pending { background: #f59e0b; }
.debug-status-dot.running { background: #3b82f6; animation: pulse 1s infinite; }
.debug-status-dot.completed { background: #10b981; }
.debug-status-dot.failed { background: #ef4444; }

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.debug-log-item {
  padding: 8px 12px;
  margin-bottom: 8px;
  background: var(--cf-bg, #f8fafc);
  border-radius: 6px;
  font-size: 12px;
  border-left: 3px solid var(--cf-line, #e2e8f0);
}

.debug-log-item.info { border-left-color: #3b82f6; }
.debug-log-item.warn { border-left-color: #f59e0b; }
.debug-log-item.error { border-left-color: #ef4444; }
.debug-log-item.success { border-left-color: #10b981; }

.debug-log-time {
  color: #94a3b8;
  font-size: 10px;
  margin-bottom: 4px;
}

.debug-log-message {
  color: var(--cf-ink, #334155);
  word-break: break-all;
}

@media (max-width: 900px) {
  .mobile-desktop-tip {
    display: flex;
  }

  .editor-header {
    flex-wrap: wrap;
    gap: 8px;
    padding: 10px 12px;
  }

  .editor-header h3 {
    flex: 1 1 100%;
    order: -1;
    font-size: 15px;
  }

  .header-actions {
    width: 100%;
    flex-wrap: wrap;
    margin-left: 0;
  }

  .node-palette {
    display: none;
  }
}
</style>
