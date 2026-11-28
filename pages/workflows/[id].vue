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
        v-if="canvasDirty"
        size="sm"
        variant="subtle"
        color="warning"
        :title="t('editor.unsavedTip')"
      >
        {{ t('editor.unsaved') }}
      </UBadge>
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
      <template v-if="!collapseIssueChips">
        <button
          v-for="issue in graphIssues"
          :key="issue.key"
          type="button"
          class="unbound-chip"
          :class="issue.chipClass"
          :title="issue.tip"
          @click="issue.focus()"
        >
          <UIcon :name="issue.icon" class="size-3.5" />
          <span>{{ issue.label }}</span>
        </button>
      </template>
      <div v-else ref="issueSummaryRef" class="issue-summary">
        <button
          type="button"
          class="unbound-chip unbound-chip--summary"
          :title="t('editor.issueSummaryTip')"
          :aria-expanded="issueMenuOpen"
          @click="issueMenuOpen = !issueMenuOpen"
        >
          <UIcon name="i-lucide-list-checks" class="size-3.5" />
          <span>{{ t('editor.issueSummaryChip', { kinds: graphIssues.length, n: issueTotalCount }) }}</span>
        </button>
        <div v-if="issueMenuOpen" class="issue-summary__menu" role="menu">
          <button
            v-for="issue in graphIssues"
            :key="issue.key"
            type="button"
            class="issue-summary__item"
            role="menuitem"
            @click="onIssueMenuPick(issue)"
          >
            <UIcon :name="issue.icon" class="size-3.5" />
            <span>{{ issue.label }}</span>
          </button>
        </div>
      </div>
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
          icon="i-lucide-history"
          :disabled="isSmokeTest"
          @click="openVersions"
        >
          {{ t('editor.versions') }}
        </CfButton>
        <CfButton
          tone="secondary"
          icon="i-lucide-clock"
          :disabled="isSmokeTest"
          @click="openSchedules"
        >
          {{ t('editor.schedules') }}
        </CfButton>
        <CfButton
          tone="secondary"
          icon="i-lucide-layout-grid"
          :disabled="nodes.length === 0"
          @click="tidyLayout"
        >
          {{ t('editor.tidyLayout') }}
        </CfButton>
        <CfButton
          tone="secondary"
          icon="i-lucide-bug"
          class="debug-trigger"
          :class="{ 'is-active-run': hasActiveExecution && !showDebugPanel }"
          @click="toggleDebugPanel"
        >
          {{ t('editor.debug') }}
          <span
            v-if="hasActiveExecution && !showDebugPanel"
            class="debug-trigger__badge"
            :data-status="currentExecution?.status"
          />
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

    <!-- 侧栏打开时状态在侧栏里；关掉后只留这一条，避免和右下角悬浮重复 -->
    <div
      v-if="showExecBar"
      class="exec-bar"
      :data-status="currentExecution.status"
      role="status"
    >
      <span class="exec-bar__label">{{ t('editor.runStatus') }}</span>
      <UBadge size="sm" variant="subtle" :color="execStatusColor(currentExecution.status)">
        {{ execStatusLabel(currentExecution.status) }}
      </UBadge>
      <span v-if="currentExecution.status === 'waiting'" class="exec-bar__msg">
        {{ t('editor.waitingBanner', {
          reason: currentExecution.wait_reason || 'approval',
          msg: currentExecution.error || '',
        }) }}
        <template v-if="currentExecution.wait_until">
          · {{ t('editor.waitUntil', { time: formatWaitUntil(currentExecution.wait_until) }) }}
        </template>
      </span>
      <span v-else-if="isPolling" class="exec-bar__msg">{{ t('editor.polling') }}</span>
      <div class="exec-bar__actions">
        <CfButton
          tone="secondary"
          size="sm"
          icon="i-lucide-panel-right"
          @click="openDebugPanel"
        >
          {{ t('editor.debugDockOpen') }}
        </CfButton>
        <CfButton
          v-if="currentExecution.status === 'waiting' && (currentExecution.wait_reason || 'approval') === 'approval'"
          tone="primary"
          size="sm"
          icon="i-lucide-check"
          :loading="approving"
          @click="handleApprove"
        >
          {{ t('editor.approve') }}
        </CfButton>
        <CfButton
          v-if="currentExecution.status === 'waiting' && (currentExecution.wait_reason || 'approval') === 'approval'"
          tone="danger"
          size="sm"
          icon="i-lucide-x"
          :loading="rejecting"
          @click="handleReject"
        >
          {{ t('editor.reject') }}
        </CfButton>
        <CfButton
          v-if="currentExecution.status === 'waiting'"
          tone="primary"
          size="sm"
          icon="i-lucide-play"
          :loading="resuming"
          @click="handleResume"
        >
          {{ t('editor.resume') }}
        </CfButton>
        <CfButton
          v-if="['running', 'waiting', 'debugging', 'pending'].includes(currentExecution.status)"
          tone="secondary"
          size="sm"
          icon="i-lucide-square"
          @click="cancelDebug"
        >
          {{ t('editor.cancelRun') }}
        </CfButton>
      </div>
    </div>

    <div class="editor-container">
      <div class="node-palette">
        <div class="palette-title">{{ t('editor.nodes') }}</div>
        <p class="palette-hint">{{ t('editor.connectHint') }}</p>
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
            ref="flowCanvasRef"
            :nodes="nodes"
            :edges="edges"
            :current-workflow-id="workflowId"
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

    <CfModal
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
          <div class="field">
            <label class="field__label">{{ t('editor.webhookUrl') }}</label>
            <UInput
              v-model="workflowBasicInfo.webhookUrl"
              class="w-full"
              :placeholder="t('editor.webhookUrlPh')"
            />
            <p class="field__hint">{{ t('editor.webhookUrlHint') }}</p>
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
    </CfModal>

    <CfModal
      v-model:open="schedulesOpen"
      :title="t('editor.schedulesTitle')"
      :ui="{ content: 'sm:max-w-lg' }"
    >
      <template #body>
        <p class="debug-hint debug-hint--compact">{{ t('editor.schedulesHint') }}</p>
        <div class="form-grid" style="margin-top: 12px">
          <div class="field">
            <label class="field__label">{{ t('editor.cronExpr') }}</label>
            <UInput v-model="scheduleForm.cron" class="w-full font-mono text-xs" :placeholder="t('editor.cronExprPh')" />
          </div>
          <div class="field">
            <label class="field__label">{{ t('common.name') }}</label>
            <UInput v-model="scheduleForm.name" class="w-full" :placeholder="t('editor.scheduleNamePh')" />
          </div>
          <CfButton tone="primary" icon="i-lucide-plus" :loading="scheduleSaving" @click="addSchedule">
            {{ t('editor.scheduleAdd') }}
          </CfButton>
        </div>
        <div v-if="schedulesLoading" class="cf-state">{{ t('common.loading') }}</div>
        <ul v-else class="version-list" style="margin-top: 16px">
          <li v-for="s in scheduleList" :key="s.id" class="version-list__item">
            <div>
              <strong>{{ s.name || s.id.slice(0, 8) }}</strong>
              <div class="cf-muted font-mono text-xs">{{ s.cron_expression }}</div>
              <div class="cf-muted text-xs">
                {{ s.is_active ? t('editor.scheduleActive') : t('editor.schedulePaused') }}
                · {{ t('editor.scheduleRuns', { n: s.run_count || 0 }) }}
              </div>
            </div>
            <div class="version-list__actions">
              <CfButton
                tone="icon"
                icon="i-lucide-play"
                :tip="t('editor.scheduleRunNow')"
                :loading="scheduleActionId === `run:${s.id}`"
                @click="runSchedule(s.id)"
              />
              <CfButton
                v-if="s.is_active"
                tone="icon"
                icon="i-lucide-pause"
                :tip="t('editor.schedulePause')"
                :loading="scheduleActionId === `pause:${s.id}`"
                @click="toggleSchedule(s.id, false)"
              />
              <CfButton
                v-else
                tone="icon"
                icon="i-lucide-play-circle"
                :tip="t('editor.scheduleResume')"
                :loading="scheduleActionId === `resume:${s.id}`"
                @click="toggleSchedule(s.id, true)"
              />
              <CfButton
                tone="icon-danger"
                icon="i-lucide-trash-2"
                :tip="t('common.delete')"
                @click="removeSchedule(s.id)"
              />
            </div>
          </li>
          <li v-if="!scheduleList.length" class="cf-muted" style="padding: 8px 0">{{ t('editor.schedulesEmpty') }}</li>
        </ul>
      </template>
      <template #footer>
        <div class="modal-actions">
          <div class="modal-actions__right">
            <CfButton tone="secondary" icon="i-lucide-x" @click="schedulesOpen = false">{{ t('common.close') }}</CfButton>
          </div>
        </div>
      </template>
    </CfModal>

    <CfModal
      v-model:open="versionsOpen"
      :title="t('editor.versionsTitle')"
      :ui="{ content: 'sm:max-w-lg' }"
    >
      <template #body>
        <p class="debug-hint debug-hint--compact">{{ t('editor.versionsHint') }}</p>
        <div v-if="versionsLoading" class="cf-state">{{ t('common.loading') }}</div>
        <div v-else-if="!versionList.length" class="cf-state">{{ t('editor.versionsEmpty') }}</div>
        <ul v-else class="version-list">
          <li v-for="v in versionList" :key="v.id" class="version-list__item">
            <div>
              <strong>v{{ v.version }}</strong>
              <span class="cf-muted"> · {{ formatExecTime(v) }}</span>
              <span v-if="v.note" class="cf-muted"> · {{ v.note }}</span>
            </div>
            <CfButton
              tone="secondary"
              size="sm"
              icon="i-lucide-undo-2"
              :loading="rollingBackVersion === v.version"
              @click="askRollback(v.version)"
            >
              {{ t('editor.rollback') }}
            </CfButton>
          </li>
        </ul>
      </template>
      <template #footer>
        <div class="modal-actions">
          <div class="modal-actions__right">
            <CfButton tone="secondary" icon="i-lucide-x" @click="versionsOpen = false">{{ t('common.close') }}</CfButton>
          </div>
        </div>
      </template>
    </CfModal>

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

          <template v-if="selectedNode.type === 'start'">
            <div class="field">
              <label class="field__label">{{ t('editor.startVars') }}</label>
              <p class="field__hint">{{ t('editor.startVarsHint') }}</p>
            </div>
            <div
              v-for="(row, idx) in nodeConfig.variables"
              :key="idx"
              class="start-var-row"
            >
              <CfButton
                class="start-var-row__remove"
                tone="icon-danger"
                icon="i-lucide-trash-2"
                :tip="t('common.delete')"
                @click="nodeConfig.variables.splice(idx, 1)"
              />
              <UInput
                v-model="row.name"
                class="w-full"
                :placeholder="t('editor.startVarNamePh')"
              />
              <USelect
                v-model="row.type"
                class="w-full"
                :items="startVarTypeOptions"
                value-key="value"
              />
              <div class="start-var-default">
                <label class="field__label">{{ t('editor.startVarDefault') }}</label>
                <UInput
                  v-model="row.default"
                  class="w-full"
                  :placeholder="t('editor.startVarDefaultPh')"
                />
              </div>
              <label class="start-var-req">
                <input v-model="row.required" type="checkbox">
                {{ t('editor.startVarRequired') }}
              </label>
              <UInput
                v-model="row.description"
                class="w-full start-var-desc"
                :placeholder="t('editor.startVarDescPh')"
              />
            </div>
            <CfButton
              tone="secondary"
              size="sm"
              icon="i-lucide-plus"
              @click="addStartVariable"
            >
              {{ t('editor.startVarAdd') }}
            </CfButton>
          </template>

          <div v-if="selectedNode.type === 'llm'" class="field">
            <label class="field__label">{{ t('common.model') }}</label>
            <USelect
              v-if="modelOptions.length"
              class="w-full"
              :model-value="llmModelSelectValue"
              :items="modelOptions"
              :placeholder="t('editor.pickModel')"
              value-key="value"
              @update:model-value="(v: string) => { if (v) nodeConfig.model = v }"
            />
            <UInput
              v-model="nodeConfig.model"
              class="w-full"
              :class="{ 'mt-2': modelOptions.length }"
              :placeholder="t('editor.llmModelTemplatePh')"
            />
            <p class="field__hint">{{ t('editor.llmModelHint') }}</p>
            <p v-if="!modelOptions.length" class="field__hint">
              {{ t('editor.modelPickEmptyHint') }}
              <NuxtLink to="/models" class="field__link" target="_blank">{{ t('editor.modelGoCreate') }}</NuxtLink>
            </p>
          </div>

          <div v-if="selectedNode.type === 'llm'" class="field">
            <label class="field__label">{{ t('agents.systemPrompt') }}</label>
            <UTextarea
              v-model="nodeConfig.systemPrompt"
              class="w-full"
              :rows="5"
              :placeholder="t('editor.llmSystemPh')"
            />
            <p class="field__hint">{{ t('editor.llmSystemPromptHint') }}</p>
          </div>

          <div v-if="selectedNode.type === 'llm'" class="field">
            <label class="field__label">{{ t('editor.userPrompt') }}</label>
            <UTextarea
              v-model="nodeConfig.prompt"
              class="w-full"
              :rows="4"
              :placeholder="t('editor.userPromptPh')"
            />
            <p class="field__hint">{{ t('editor.llmPromptHint') }}</p>
            <p class="field__hint">{{ t('editor.llmResultVarsHint') }}</p>
          </div>

          <div v-if="selectedNode.type === 'llm'" class="field field--row">
            <div>
              <label class="field__label">{{ t('editor.llmStream') }}</label>
              <p class="field__hint">{{ t('editor.llmStreamHint') }}</p>
            </div>
            <USwitch v-model="nodeConfig.llmStream" size="sm" />
          </div>

          <div v-if="selectedNode.type === 'llm'" class="field">
            <label class="field__label">{{ t('editor.llmTemperature') }}</label>
            <UInput
              v-model="nodeConfig.llmTemperature"
              class="w-full"
              :placeholder="t('editor.llmTemperaturePh')"
            />
            <p class="field__hint">{{ t('editor.llmTemperatureHint') }}</p>
          </div>

          <div v-if="selectedNode.type === 'llm'" class="field">
            <label class="field__label">{{ t('editor.llmMaxTokens') }}</label>
            <UInput
              v-model="nodeConfig.llmMaxTokens"
              class="w-full"
              :placeholder="t('editor.llmMaxTokensPh')"
            />
            <p class="field__hint">{{ t('editor.llmMaxTokensHint') }}</p>
          </div>

          <div v-if="selectedNode.type === 'agent'" class="field">
            <label class="field__label">{{ t('editor.agentPick') }}</label>
            <USelect
              v-if="agentOptions.length"
              class="w-full"
              :model-value="agentSelectValue"
              :items="agentOptions"
              :placeholder="t('editor.agentPickPh')"
              value-key="value"
              @update:model-value="(v: string) => { if (v) nodeConfig.agentId = v }"
            />
            <UInput
              v-model="nodeConfig.agentId"
              class="w-full"
              :class="{ 'mt-2': agentOptions.length }"
              :placeholder="t('editor.agentIdTemplatePh')"
            />
            <p class="field__hint">{{ t('editor.agentIdHint') }}</p>
            <p v-if="!agentOptions.length" class="field__hint">
              {{ t('editor.agentPickEmptyHint') }}
              <NuxtLink to="/agents/new" class="field__link" target="_blank">{{ t('editor.agentGoCreate') }}</NuxtLink>
            </p>
          </div>
          <div v-if="selectedNode.type === 'agent'" class="field">
            <label class="field__label">{{ t('editor.userPrompt') }}</label>
            <UTextarea
              v-model="nodeConfig.prompt"
              class="w-full"
              :rows="4"
              :placeholder="t('editor.agentPromptPh')"
            />
            <p class="field__hint">{{ t('editor.llmPromptHint') }}</p>
            <p class="field__hint">{{ t('editor.agentContentResultVarsHint') }}</p>
          </div>

          <div v-if="selectedNode.type === 'team'" class="field">
            <label class="field__label">{{ t('editor.teamPick') }}</label>
            <USelect
              v-if="teamOptions.length"
              class="w-full"
              :model-value="teamSelectValue"
              :items="teamOptions"
              :placeholder="t('editor.teamPickPh')"
              value-key="value"
              @update:model-value="(v: string) => { if (v) nodeConfig.teamId = v }"
            />
            <UInput
              v-model="nodeConfig.teamId"
              class="w-full"
              :class="{ 'mt-2': teamOptions.length }"
              :placeholder="t('editor.teamIdTemplatePh')"
            />
            <p class="field__hint">{{ t('editor.teamIdHint') }}</p>
            <p v-if="!teamOptions.length" class="field__hint">
              {{ t('editor.teamPickEmptyHint') }}
              <NuxtLink to="/teams" class="field__link" target="_blank">{{ t('editor.teamGoCreate') }}</NuxtLink>
            </p>
            <p v-else class="field__hint">{{ t('editor.teamPickHint') }}</p>
          </div>
          <div v-if="selectedNode.type === 'team'" class="field">
            <label class="field__label">{{ t('editor.teamTask') }}</label>
            <UTextarea
              v-model="nodeConfig.prompt"
              class="w-full"
              :rows="4"
              :placeholder="t('editor.teamTaskPh')"
            />
            <p class="field__hint">{{ t('editor.llmPromptHint') }}</p>
            <p class="field__hint">{{ t('editor.agentContentResultVarsHint') }}</p>
          </div>

          <template v-if="selectedNode.type === 'subflow'">
            <div class="field">
              <label class="field__label">{{ t('editor.subflowPick') }}</label>
              <USelect
                v-if="subflowWorkflowOptions.length"
                class="w-full"
                :model-value="subflowSelectValue"
                :items="subflowWorkflowOptions"
                :placeholder="t('editor.subflowPickPh')"
                value-key="value"
                @update:model-value="(v: string) => { if (v) nodeConfig.subflowWorkflowId = v }"
              />
              <UInput
                v-model="nodeConfig.subflowWorkflowId"
                class="w-full"
                :class="{ 'mt-2': subflowWorkflowOptions.length }"
                :placeholder="t('editor.subflowIdTemplatePh')"
              />
              <p class="field__hint">{{ t('editor.subflowIdHint') }}</p>
              <p v-if="!subflowWorkflowOptions.length" class="field__hint">
                {{ t('editor.subflowPickEmptyHint') }}
                <NuxtLink to="/workflows" class="field__link" target="_blank">{{ t('editor.subflowGoCreate') }}</NuxtLink>
              </p>
              <p v-else-if="isSubflowSelfReference({ subflowWorkflowId: nodeConfig.subflowWorkflowId }, workflowId)" class="field__hint field__hint--warn">
                {{ t('editor.subflowSelfHint') }}
              </p>
              <p v-else class="field__hint">{{ t('editor.subflowHint') }}</p>
            </div>
            <div class="field">
              <label class="field__label">{{ t('editor.subflowInput') }}</label>
              <UTextarea
                v-model="nodeConfig.subflowInput"
                class="w-full font-mono text-xs"
                :rows="4"
                :placeholder="t('editor.subflowInputPh')"
              />
              <p class="field__hint">{{ t('editor.subflowInputHint') }}</p>
              <p class="field__hint">{{ t('editor.subflowResultVarsHint') }}</p>
            </div>
          </template>

          <template v-if="selectedNode.type === 'condition'">
            <p class="field__hint field__hint--block">{{ t('editor.conditionOutletHint') }}</p>
            <div class="field">
              <label class="field__label">{{ t('editor.conditionField') }}</label>
              <UInput
                v-model="nodeConfig.conditionField"
                class="w-full"
                :placeholder="t('editor.conditionFieldPh')"
              />
              <p class="field__hint">{{ t('editor.conditionFieldHint') }}</p>
            </div>
            <div class="field">
              <label class="field__label">{{ t('editor.conditionOperator') }}</label>
              <USelect
                v-model="nodeConfig.conditionOperator"
                class="w-full"
                :items="conditionOperatorOptions"
                value-key="value"
              />
            </div>
            <div class="field">
              <label class="field__label">{{ t('editor.conditionValue') }}</label>
              <UInput
                v-model="nodeConfig.conditionValue"
                class="w-full"
                :placeholder="t('editor.conditionValuePh')"
              />
              <p class="field__hint">{{ t('editor.conditionValueHint') }}</p>
              <p class="field__hint">{{ t('editor.conditionResultVarsHint') }}</p>
            </div>
            <div class="field">
              <label class="field__label">{{ t('common.description') }}</label>
              <UTextarea
                v-model="nodeConfig.description"
                class="w-full"
                :rows="2"
                :placeholder="t('editor.conditionPh')"
              />
            </div>
          </template>

          <template v-if="selectedNode.type === 'http'">
            <div class="field">
              <label class="field__label">{{ t('editor.httpMethod') }}</label>
              <USelect
                class="w-full"
                :model-value="httpMethodSelectValue"
                :items="httpMethodOptions"
                value-key="value"
                @update:model-value="(v: string) => { if (v) nodeConfig.httpMethod = v }"
              />
              <UInput
                v-model="nodeConfig.httpMethod"
                class="w-full mt-2"
                :placeholder="t('editor.httpMethodTemplatePh')"
              />
              <p class="field__hint">{{ t('editor.httpMethodHint') }}</p>
            </div>
            <div class="field">
              <label class="field__label">{{ t('editor.httpUrl') }}</label>
              <UInput
                v-model="nodeConfig.httpUrl"
                class="w-full"
                :placeholder="t('editor.httpUrlPh')"
              />
              <p class="field__hint">{{ t('editor.httpUrlHint') }}</p>
            </div>
            <div class="field">
              <label class="field__label">{{ t('editor.httpBody') }}</label>
              <UTextarea
                v-model="nodeConfig.httpBody"
                class="w-full"
                :rows="4"
                :placeholder="t('editor.httpBodyPh')"
              />
            </div>
            <div class="field">
              <label class="field__label">{{ t('editor.httpHeaders') }}</label>
              <UTextarea
                v-model="nodeConfig.httpHeaders"
                class="w-full font-mono text-xs"
                :rows="3"
                :placeholder="t('editor.httpHeadersPh')"
              />
              <p class="field__hint">{{ t('editor.httpHeadersHint') }}</p>
            </div>
            <div class="field">
              <label class="field__label">{{ t('editor.httpTimeout') }}</label>
              <UInput
                v-model="nodeConfig.httpTimeout"
                class="w-full"
                :placeholder="t('editor.httpTimeoutPh')"
              />
              <p class="field__hint">{{ t('editor.httpTimeoutHint') }}</p>
            </div>
            <div class="field field--row">
              <div>
                <label class="field__label">{{ t('editor.httpFailOnError') }}</label>
                <p class="field__hint">{{ t('editor.httpFailOnErrorHint') }}</p>
              </div>
              <USwitch v-model="nodeConfig.httpFailOnError" size="sm" />
            </div>
            <p class="field__hint">{{ t('editor.httpResultVarsHint') }}</p>
          </template>

          <template v-if="selectedNode.type === 'delay'">
            <div class="field">
              <label class="field__label">{{ t('editor.delayDuration') }}</label>
              <UInput
                v-model="nodeConfig.delayDuration"
                class="w-full"
                :placeholder="t('editor.delayDurationPh')"
              />
              <p class="field__hint">{{ t('editor.delayDurationHint') }}</p>
            </div>
            <div class="field">
              <label class="field__label">{{ t('editor.delayUnit') }}</label>
              <USelect
                class="w-full"
                :model-value="delayUnitSelectValue"
                :items="delayUnitOptions"
                value-key="value"
                @update:model-value="(v: string) => { if (v) nodeConfig.delayUnit = v }"
              />
              <UInput
                v-model="nodeConfig.delayUnit"
                class="w-full mt-2"
                :placeholder="t('editor.delayUnitTemplatePh')"
              />
              <p class="field__hint">{{ t('editor.delayUnitHint') }}</p>
              <p class="field__hint">{{ t('editor.delayResultVarsHint') }}</p>
            </div>
          </template>

          <template v-if="selectedNode.type === 'loop'">
            <div class="field">
              <label class="field__label">{{ t('editor.loopType') }}</label>
              <USelect
                v-model="nodeConfig.loopType"
                class="w-full"
                :items="loopTypeOptions"
                value-key="value"
              />
            </div>
            <div v-if="nodeConfig.loopType === 'times'" class="field">
              <label class="field__label">{{ t('editor.loopCount') }}</label>
              <UInput
                v-model="nodeConfig.loopCount"
                class="w-full"
                :placeholder="t('editor.loopCountPh')"
              />
              <p class="field__hint">{{ t('editor.loopCountHint') }}</p>
            </div>
            <div v-if="nodeConfig.loopType === 'while'" class="field">
              <label class="field__label">{{ t('editor.loopCondition') }}</label>
              <UInput
                v-model="nodeConfig.loopCondition"
                class="w-full"
                :placeholder="t('editor.loopConditionPh')"
              />
              <p class="field__hint">{{ t('editor.loopConditionHint') }}</p>
            </div>
            <template v-if="nodeConfig.loopType === 'for_each'">
              <div class="field">
                <label class="field__label">{{ t('editor.loopArrayVar') }}</label>
                <UInput
                  v-model="nodeConfig.loopArrayVar"
                  class="w-full"
                  :placeholder="t('editor.loopArrayVarPh')"
                />
                <p class="field__hint">{{ t('editor.loopArrayVarHint') }}</p>
              </div>
              <div class="field">
                <label class="field__label">{{ t('editor.loopItemVar') }}</label>
                <UInput
                  v-model="nodeConfig.loopItemVar"
                  class="w-full"
                  :placeholder="t('editor.loopItemVarPh')"
                />
                <p class="field__hint">{{ t('editor.loopItemVarHint') }}</p>
              </div>
              <div class="field">
                <label class="field__label">{{ t('editor.loopKeyVar') }}</label>
                <UInput
                  v-model="nodeConfig.loopKeyVar"
                  class="w-full"
                  :placeholder="t('editor.loopKeyVarPh')"
                />
                <p class="field__hint">{{ t('editor.loopKeyVarHint') }}</p>
              </div>
            </template>
            <div class="field">
              <label class="field__label">{{ t('editor.loopMaxIter') }}</label>
              <UInput
                v-model="nodeConfig.loopMaxIter"
                class="w-full"
                :placeholder="t('editor.loopMaxIterPh')"
              />
              <p class="field__hint">{{ t('editor.loopMaxIterHint') }}</p>
              <p class="field__hint">{{ t('editor.loopResultVarsHint') }}</p>
            </div>
          </template>

          <template v-if="selectedNode.type === 'code'">
            <div class="field">
              <label class="field__label">{{ t('editor.codeLanguage') }}</label>
              <USelect
                v-model="nodeConfig.codeLanguage"
                class="w-full"
                :items="codeLanguageOptions"
                value-key="value"
              />
              <p class="field__hint">{{ t('editor.codeLanguageHint') }}</p>
            </div>
            <div class="field">
              <label class="field__label">{{ t('editor.codeSource') }}</label>
              <UTextarea
                v-model="nodeConfig.codeSource"
                class="w-full"
                :rows="6"
                :placeholder="t('editor.codeSourcePh')"
              />
            </div>
            <div class="field">
              <label class="field__label">{{ t('editor.codeTimeout') }}</label>
              <UInput
                v-model="nodeConfig.codeTimeout"
                class="w-full"
                :placeholder="t('editor.codeTimeoutPh')"
              />
              <p class="field__hint">{{ t('editor.codeTimeoutHint') }}</p>
            </div>
            <p class="field__hint">{{ t('editor.codeResultVarsHint') }}</p>
          </template>

          <div v-if="selectedNode.type === 'wait'" class="field">
            <label class="field__label">{{ t('editor.waitReason') }}</label>
            <UInput
              v-model="nodeConfig.waitReason"
              class="w-full"
              :placeholder="t('editor.waitReasonPh')"
            />
            <p class="field__hint">{{ t('editor.waitReasonHint') }}</p>
          </div>
          <div v-if="selectedNode.type === 'wait'" class="field">
            <label class="field__label">{{ t('editor.waitMessage') }}</label>
            <UTextarea
              v-model="nodeConfig.waitMessage"
              class="w-full"
              :rows="3"
              :placeholder="t('editor.waitMessagePh')"
            />
            <p class="field__hint">{{ t('editor.waitMessageHint') }}</p>
          </div>
          <div v-if="selectedNode.type === 'wait'" class="field">
            <label class="field__label">{{ t('editor.waitTimeout') }}</label>
            <UInput
              v-model="nodeConfig.timeoutSec"
              class="w-full"
              :placeholder="t('editor.waitTimeoutPh')"
            />
            <p class="field__hint">{{ t('editor.waitTimeoutHint') }}</p>
            <p class="field__hint">{{ t('editor.waitResultVarsHint') }}</p>
          </div>

          <template v-if="selectedNode.type === 'search'">
            <div class="field">
              <label class="field__label">{{ t('editor.knowledgeBase') }}</label>
              <USelect
                v-if="kbOptions.length"
                class="w-full"
                :model-value="kbSelectValue"
                :items="kbOptions"
                :placeholder="t('editor.pickKnowledge')"
                value-key="value"
                @update:model-value="(v: string) => { if (v) nodeConfig.knowledgeBaseId = v }"
              />
              <UInput
                v-model="nodeConfig.knowledgeBaseId"
                class="w-full"
                :class="{ 'mt-2': kbOptions.length }"
                :placeholder="t('editor.kbIdTemplatePh')"
              />
              <p class="field__hint">{{ t('editor.kbIdHint') }}</p>
              <p v-if="!kbOptions.length" class="field__hint">
                {{ t('editor.kbPickEmptyHint') }}
                <NuxtLink to="/knowledge" class="field__link" target="_blank">{{ t('editor.kbGoCreate') }}</NuxtLink>
              </p>
            </div>

            <div v-if="selectedKBDefaults" class="kb-defaults">
              <div class="kb-defaults__title">{{ t('editor.searchKbDefaults') }}</div>
              <p class="field__hint">{{ t('editor.searchKbDefaultsHint') }}</p>
              <dl class="kb-defaults__grid">
                <div><dt>{{ t('editor.searchMode') }}</dt><dd>{{ selectedKBDefaults.modeLabel }}</dd></div>
                <div><dt>{{ t('editor.searchTopK') }}</dt><dd>{{ selectedKBDefaults.topK }}</dd></div>
                <div><dt>{{ t('editor.searchMinScore') }}</dt><dd>{{ selectedKBDefaults.minScore }}</dd></div>
                <div><dt>{{ t('editor.searchRerank') }}</dt><dd>{{ selectedKBDefaults.rerankLabel }}</dd></div>
                <div v-if="selectedKBDefaults.mode === 'hybrid'" class="kb-defaults__span">
                  <dt>{{ t('editor.searchHybridWeight') }}</dt>
                  <dd>{{ selectedKBDefaults.hybridLabel }}</dd>
                </div>
              </dl>
            </div>

            <div class="field">
              <label class="field__label">{{ t('editor.searchOverrideTitle') }}</label>
              <p class="field__hint">{{ t('editor.searchOverrideHint') }}</p>
            </div>
            <div class="field">
              <label class="field__label">{{ t('editor.searchMode') }}</label>
              <USelect
                v-model="nodeConfig.searchMode"
                class="w-full"
                :items="searchModeOptions"
                value-key="value"
              />
            </div>
            <div class="field">
              <label class="field__label">{{ t('editor.searchTopK') }}</label>
              <UInput
                v-model="nodeConfig.topK"
                class="w-full"
                :placeholder="t('editor.searchTopKPh')"
              />
              <p class="field__hint">{{ t('editor.searchTopKHint') }}</p>
            </div>
            <div class="field">
              <label class="field__label">{{ t('editor.searchMinScore') }}</label>
              <UInput
                v-model="nodeConfig.minScore"
                class="w-full"
                :placeholder="t('editor.searchMinScorePh')"
              />
              <p class="field__hint">{{ t('editor.searchMinScoreHint') }}</p>
            </div>
            <div class="field">
              <label class="field__label">{{ t('editor.searchRerank') }}</label>
              <USelect
                v-model="nodeConfig.rerankMode"
                class="w-full"
                :items="rerankModeOptions"
                value-key="value"
              />
            </div>
            <div v-if="nodeConfig.rerankMode === 'on'" class="field">
              <label class="field__label">{{ t('editor.searchRerankModel') }}</label>
              <USelect
                v-if="rerankProviderOptions.length"
                class="w-full"
                :model-value="rerankSelectValue"
                :items="rerankProviderOptions"
                value-key="value"
                :placeholder="rerankSelectPlaceholder"
                @update:model-value="(v: string) => { if (v) nodeConfig.rerankProviderId = v }"
              />
              <UInput
                v-model="nodeConfig.rerankProviderId"
                class="w-full"
                :class="{ 'mt-2': rerankProviderOptions.length }"
                :placeholder="t('editor.rerankProviderIdTemplatePh')"
              />
              <p class="field__hint">{{ t('editor.rerankProviderIdHint') }}</p>
            </div>
            <div v-if="effectiveSearchMode === 'hybrid'" class="field">
              <label class="field__label">{{ t('editor.searchHybridWeight') }}</label>
              <UInput
                v-model="nodeConfig.hybridSemanticWeight"
                class="w-full"
                :placeholder="t('editor.searchInheritPh')"
              />
              <p class="field__hint">{{ t('editor.searchHybridWeightHint') }}</p>
            </div>

            <div class="field">
              <label class="field__label">{{ t('editor.query') }}</label>
              <UInput v-model="nodeConfig.query" class="w-full" :placeholder="t('editor.queryPh')" />
              <p class="field__hint">{{ t('editor.searchQueryHint') }}</p>
              <p class="field__hint">{{ t('editor.searchResultVarsHint') }}</p>
            </div>
          </template>

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
            <CfButton
              v-if="selectedNode && selectedNode.type !== 'start'"
              tone="secondary"
              icon="i-lucide-play"
              :loading="isDebugging"
              :disabled="isSmokeTest"
              @click="debugFromSelectedNode"
            >
              {{ t('editor.debugFromNode') }}
            </CfButton>
            <CfButton tone="secondary" icon="i-lucide-x" @click="configDrawer = false">{{ t('common.cancel') }}</CfButton>
            <CfButton tone="primary" icon="i-lucide-check" @click="saveNodeConfig">{{ t('common.save') }}</CfButton>
          </div>
        </div>
      </template>
    </USlideover>

    <!-- 工作流调试侧栏：填输入 JSON → 试跑 → 看节点高亮与历史 -->
    <aside v-if="showDebugPanel" class="debug-panel" aria-label="debug">
      <div class="debug-header">
        <h4>{{ t('editor.debugPanelTitle') }}</h4>
        <CfButton
          tone="secondary"
          size="sm"
          icon="i-lucide-x"
          @click="showDebugPanel = false"
        >
          {{ t('common.close') }}
        </CfButton>
      </div>
      <div class="debug-body">
        <p class="debug-hint">{{ t('editor.debugPanelHint') }}</p>
        <div class="debug-section">
          <div class="debug-section-title">{{ t('editor.debugInput') }}</div>
          <p v-if="startVariables.length" class="debug-hint debug-hint--compact">{{ t('editor.debugInputFromStart') }}</p>
          <div v-if="startVariables.length" class="debug-var-form">
            <div
              v-for="v in startVariables"
              :key="v.name"
              class="field"
            >
              <label class="field__label">
                {{ v.name }}
                <span v-if="v.required" class="debug-var-req">*</span>
                <span v-if="v.description" class="debug-var-desc"> · {{ v.description }}</span>
              </label>
              <UInput
                v-if="v.type !== 'boolean'"
                v-model="debugForm[v.name]"
                class="w-full"
                :type="v.type === 'number' ? 'number' : 'text'"
                :placeholder="v.default != null && v.default !== '' ? String(v.default) : v.name"
                @update:model-value="syncDebugInputFromForm"
              />
              <label v-else class="start-var-req">
                <input
                  v-model="debugForm[v.name]"
                  type="checkbox"
                  @change="syncDebugInputFromForm"
                >
                {{ t('editor.startVarBool') }}
              </label>
            </div>
          </div>
          <details class="debug-json-details" :open="!startVariables.length">
            <summary>{{ t('editor.debugInputJson') }}</summary>
            <UTextarea
              v-model="debugInput"
              class="w-full font-mono text-xs"
              :rows="6"
              :placeholder='`{\n  "query": "你好"\n}`'
              @update:model-value="syncDebugFormFromInput"
            />
          </details>
        </div>
        <label class="debug-seed-opt">
          <input v-model="seedUpstreamOnDebugFrom" type="checkbox">
          <span>{{ t('editor.debugSeedUpstream') }}</span>
        </label>
        <p class="debug-hint debug-hint--compact">{{ t('editor.debugSeedUpstreamHint') }}</p>
        <div class="debug-actions">
          <CfButton
            tone="primary"
            icon="i-lucide-bug"
            :loading="isDebugging"
            :disabled="isSmokeTest"
            @click="startDebug"
          >
            {{ t('editor.debugStart') }}
          </CfButton>
          <CfButton
            tone="secondary"
            icon="i-lucide-refresh-cw"
            @click="loadExecutionHistory"
          >
            {{ t('editor.debugRefreshLogs') }}
          </CfButton>
        </div>
        <!-- 主区：只聚焦「这一次」试跑；审批/步骤都属于它 -->
        <div v-if="currentExecution" class="debug-section">
          <div class="debug-section-title">{{ t('editor.debugThisRun') }}</div>
          <p class="debug-hint debug-hint--compact">{{ t('editor.debugThisRunHint') }}</p>
          <div class="debug-status" :data-status="currentExecution.status">
            <span
              class="debug-status-dot"
              :class="currentExecution.status"
            />
            <span>{{ execStatusLabel(currentExecution.status) }}</span>
            <span v-if="currentExecution.id" class="debug-log-time" :title="currentExecution.id">
              {{ shortExecId(currentExecution.id) }}
            </span>
          </div>
          <p v-if="execRunDurationLabel" class="debug-meta">{{ execRunDurationLabel }}</p>
          <div v-if="execInputPreview || currentExecution.input" class="debug-meta debug-meta--input">
            <span v-if="execInputPreview">{{ t('editor.debugInputPreview', { text: execInputPreview }) }}</span>
            <button
              v-if="formatExecutionInputJson(currentExecution.input)"
              type="button"
              class="debug-reuse-input"
              :title="t('editor.debugReuseInputHint')"
              @click="reuseExecutionInput(currentExecution.input)"
            >
              <UIcon name="i-lucide-clipboard-paste" class="size-3.5" />
              <span>{{ t('editor.debugReuseInput') }}</span>
            </button>
          </div>
          <p v-if="currentExecution.current_node" class="debug-meta">
            {{ t('editor.debugAtNode', { name: nodeDisplayName(currentExecution.current_node) }) }}
          </p>
          <p
            v-if="currentExecution.status === 'waiting'"
            class="debug-wait-msg"
          >
            {{ t('editor.waitingBanner', {
              reason: currentExecution.wait_reason || 'approval',
              msg: currentExecution.error || '',
            }) }}
          </p>
          <p v-else-if="currentExecution.error" class="debug-error">{{ currentExecution.error }}</p>

          <div
            v-if="currentExecution.status === 'waiting'"
            class="debug-wait-actions"
          >
            <p class="debug-wait-actions__label">{{ t('editor.debugWaitActions') }}</p>
            <div class="debug-actions">
              <CfButton
                v-if="(currentExecution.wait_reason || 'approval') === 'approval'"
                tone="primary"
                size="sm"
                icon="i-lucide-check"
                :loading="approving"
                @click="handleApprove"
              >
                {{ t('editor.approve') }}
              </CfButton>
              <CfButton
                v-if="(currentExecution.wait_reason || 'approval') === 'approval'"
                tone="danger"
                size="sm"
                icon="i-lucide-x"
                :loading="rejecting"
                @click="handleReject"
              >
                {{ t('editor.reject') }}
              </CfButton>
              <CfButton
                tone="secondary"
                size="sm"
                icon="i-lucide-play"
                :loading="resuming"
                @click="handleResume"
              >
                {{ t('editor.resume') }}
              </CfButton>
              <CfButton
                tone="secondary"
                size="sm"
                icon="i-lucide-square"
                @click="cancelDebug"
              >
                {{ t('editor.cancelRun') }}
              </CfButton>
            </div>
          </div>
          <div
            v-else-if="['running', 'debugging', 'pending'].includes(currentExecution.status)"
            class="debug-actions"
          >
            <CfButton
              tone="secondary"
              size="sm"
              icon="i-lucide-square"
              @click="cancelDebug"
            >
              {{ t('editor.cancelRun') }}
            </CfButton>
          </div>

          <div v-if="liveStreamProgress" class="debug-section debug-stream">
            <div class="debug-section-title">{{ t('editor.debugStreamLive') }}</div>
            <p class="debug-hint debug-hint--compact">{{ t('editor.debugStreamLiveHint') }}</p>
            <pre class="debug-stream__text">{{ liveStreamProgress }}</pre>
          </div>

          <div class="debug-timeline">
            <div class="debug-section-title">{{ t('editor.debugTimeline') }}</div>
            <p class="debug-hint debug-hint--compact">{{ t('editor.debugTimelineHint') }}</p>
            <div v-if="execTimeline.length === 0" class="debug-empty">{{ t('editor.debugTimelineEmpty') }}</div>
            <button
              v-for="(step, idx) in execTimeline"
              :key="step.key"
              type="button"
              class="debug-timeline__item"
              :class="{ 'is-selected': selectedTimelineKey === step.key }"
              :data-status="step.status"
              @click="selectTimelineStep(step)"
            >
              <span class="debug-timeline__idx">{{ idx + 1 }}</span>
              <span class="debug-status-dot" :class="step.status" />
              <div class="debug-timeline__body">
                <div class="debug-timeline__title">
                  <UIcon :name="getNodeIcon(step.nodeType)" class="size-3.5" />
                  <span>{{ step.label }}</span>
                  <span class="debug-timeline__status">{{ execStatusLabel(step.status) }}</span>
                </div>
                <div v-if="step.note" class="debug-timeline__note">{{ step.note }}</div>
              </div>
            </button>
            <div v-if="selectedTimelineStep" class="debug-step-summary">
              <div class="debug-step-summary__head">
                <div class="debug-section-title">{{ t('editor.debugStepSummary') }}</div>
                <button
                  v-if="selectedTimelineStep.outputCopy || selectedTimelineStep.error"
                  type="button"
                  class="debug-copy-btn"
                  :title="t('editor.debugCopyHint')"
                  @click="copyDebugText(selectedTimelineStep.outputCopy || selectedTimelineStep.error || '')"
                >
                  <UIcon name="i-lucide-copy" class="size-3.5" />
                  <span>{{ t('editor.debugCopy') }}</span>
                </button>
              </div>
              <dl class="debug-step-summary__meta">
                <div>
                  <dt>{{ t('editor.debugStepStatus') }}</dt>
                  <dd>{{ execStatusLabel(selectedTimelineStep.status) }}</dd>
                </div>
                <div v-if="selectedTimelineStep.durationMs != null && selectedTimelineStep.durationMs > 0">
                  <dt>{{ t('editor.debugStepDuration') }}</dt>
                  <dd>{{ t('editor.debugTimelineMs', { ms: selectedTimelineStep.durationMs }) }}</dd>
                </div>
              </dl>
              <p v-if="selectedTimelineStep.error" class="debug-step-summary__error">
                {{ selectedTimelineStep.error }}
              </p>
              <pre
                v-if="selectedTimelineStep.outputPreview"
                class="debug-step-summary__out"
              >{{ selectedTimelineStep.outputPreview }}</pre>
              <p
                v-else-if="!selectedTimelineStep.error"
                class="debug-hint debug-hint--compact"
              >{{ t('editor.debugStepNoOutput') }}</p>
            </div>
          </div>

          <div v-if="currentExecution.output" class="debug-output">
            <div class="debug-step-summary__head">
              <div class="debug-section-title">{{ t('editor.debugOutput') }}</div>
              <button
                type="button"
                class="debug-copy-btn"
                :title="t('editor.debugCopyHint')"
                @click="copyDebugText(formatExecutionOutputForCopy(currentExecution.output))"
              >
                <UIcon name="i-lucide-copy" class="size-3.5" />
                <span>{{ t('editor.debugCopy') }}</span>
              </button>
            </div>
            <pre>{{ truncateText(String(currentExecution.output), 800) }}</pre>
          </div>
        </div>

        <!-- 更早试跑：默认折叠，避免和「这一次」抢视线 -->
        <div class="debug-section">
          <button
            type="button"
            class="debug-history-toggle"
            @click="showOlderRuns = !showOlderRuns"
          >
            <span>{{ t('editor.debugOlderRuns', { n: olderHistoryItems.length }) }}</span>
            <UIcon :name="showOlderRuns ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'" class="size-4" />
          </button>
          <p class="debug-hint debug-hint--compact">{{ t('editor.debugHistoryHint') }}</p>
          <template v-if="showOlderRuns">
            <div v-if="olderHistoryItems.length === 0" class="debug-empty">{{ t('editor.debugHistoryEmpty') }}</div>
            <button
              v-if="staleActiveExecIds.length >= 2"
              type="button"
              class="debug-log-cancel-all"
              :disabled="cancellingAllStuck"
              @click="cancelAllStuckExecutions"
            >
              <UIcon name="i-lucide-square" class="size-3.5" />
              <span>{{ t('editor.cancelAllStuckRuns', { n: staleActiveExecIds.length }) }}</span>
            </button>
            <div
              v-for="row in olderHistoryItems"
              :key="row.item.id"
              class="debug-log-item"
              :class="[
                row.item.status,
                {
                  'is-selected': currentExecution?.id === row.item.id,
                  'is-stale': row.stale,
                },
              ]"
            >
              <button
                type="button"
                class="debug-log-item__main"
                @click="selectHistoryExecution(row.item.id)"
              >
                <div class="debug-log-row">
                  <span class="debug-log-index">#{{ row.index }}</span>
                  <span class="debug-status-dot" :class="row.item.status" />
                  <span class="debug-log-status">{{ execStatusLabel(row.item.status) }}</span>
                  <span class="debug-log-time">{{ formatExecTime(row.item) }}</span>
                </div>
                <div class="debug-log-message">{{ row.primary }}</div>
                <div v-if="row.secondary" class="debug-log-secondary">{{ row.secondary }}</div>
                <div class="debug-log-id" :title="row.item.id">{{ shortExecId(row.item.id) }}</div>
              </button>
              <div class="debug-log-item__actions">
                <button
                  v-if="formatExecutionInputJson(row.item.input)"
                  type="button"
                  class="debug-reuse-input"
                  :title="t('editor.debugReuseInputHint')"
                  @click.stop="reuseExecutionInput(row.item.input)"
                >
                  <UIcon name="i-lucide-clipboard-paste" class="size-3.5" />
                  <span>{{ t('editor.debugReuseInput') }}</span>
                </button>
                <button
                  v-if="row.cancellable"
                  type="button"
                  class="debug-log-cancel"
                  :class="{ 'debug-log-cancel--stale': row.stale }"
                  :disabled="cancellingExecId === row.item.id"
                  :title="t('editor.cancelRun')"
                  @click.stop="cancelHistoryExecution(row.item.id)"
                >
                  <UIcon name="i-lucide-square" class="size-3.5" />
                  <span>{{ row.stale ? t('editor.cancelStuckRun') : t('editor.cancelRun') }}</span>
                </button>
              </div>
            </div>
          </template>
        </div>
      </div>
    </aside>

    <CfConfirmModal
      v-model:open="scheduleDeleteOpen"
      :message="t('editor.scheduleDeleteConfirm')"
      :loading="scheduleDeleting"
      @confirm="confirmRemoveSchedule"
    />
    <CfConfirmModal
      v-model:open="rollbackOpen"
      :title="t('editor.rollback')"
      :message="t('editor.rollbackConfirm', { version: pendingRollbackVersion ?? '' })"
      confirm-icon="i-lucide-undo-2"
      :loading="rollingBackVersion != null"
      @confirm="doRollback"
    />
    <CfConfirmModal
      v-model:open="leaveDirtyOpen"
      :title="t('editor.unsaved')"
      :message="t('editor.unsavedLeaveConfirm')"
      :confirm-text="t('editor.leaveWithoutSave')"
      confirm-icon="i-lucide-log-out"
      @confirm="confirmLeaveDirty"
      @cancel="onLeaveDirtyCancel"
    />
  </div>
</template>

<script setup lang="ts">
import WorkflowCanvas from '~/components/WorkflowCanvas.vue'
import { MarkerType } from '@vue-flow/core'
import { layoutWorkflowNodes } from '@/utils/workflowLayout'
import { conditionBranchKind, fromDefinitionEdge, toDefinitionEdge } from '@/utils/workflowEdge'
import {
  clearCanvasRunDecorations,
  decorateEdgesForSkippedTargets,
  findLatestTimelineKeyForNode,
  formatExecutionInputJson,
  formatExecutionOutputForCopy,
  formatNodeRunOutputPreview,
  isSeededDebugSkip,
  isUntakenConditionSkip,
} from '@/utils/workflowDebugStep'
import {
  isActiveExecutionStatus,
  isStaleActiveExecution,
  listStaleActiveExecutionIds,
} from '@/utils/workflowExecStatus'
import { WORKFLOW_PALETTE_TYPES, getWorkflowNodeMeta } from '@/utils/workflowNodeMeta'
import { isSubflowSelfReference, isWorkflowBindUnbound } from '@/utils/workflowBind'
import { formatHttpHeadersJson, parseHttpHeadersJson } from '@/utils/workflowHttpHeaders'
import { formatJsonObject, parseJsonObject } from '@/utils/workflowJsonObject'
import {
  findConditionsMissingBranches,
  findDeadEndNodes,
  findEndsWithOutgoing,
  findStartNodes,
  findStartsWithIncoming,
  findUnreachableNodes,
} from '@/utils/workflowReachability'

import { useRoute } from 'vue-router'
import { useWorkflows, type WorkflowDefinition, type WorkflowVersionSnap, type WorkflowSchedule } from '@/composables/useWorkflows'
import { useKnowledgeBases, type KnowledgeBase } from '@/composables/useKnowledgeBases'
import { useProviders, hasCap, rerankModelLabel } from '@/composables/useProviders'

/** Same as the list page smoke button: skip the API, only verify the dynamic route + Vue Flow. */
const CANVAS_SMOKE_ID = '__canvas_smoke__'

definePageMeta({
  layout: 'default',
})

const route = useRoute()
const toast = useToast()
const { t } = useLocale()

function withEdgeArrow(edge: { id: string, source: string, target: string, [k: string]: any }) {
  const kind = conditionBranchKind(edge.sourceHandle)
  const branchLabel = kind === 'true'
    ? t('editor.branchTrue')
    : kind === 'false'
      ? t('editor.branchFalse')
      : undefined
  const branchStroke = kind === 'true' ? '#16a34a' : kind === 'false' ? '#dc2626' : '#4f46e5'
  return {
    ...edge,
    ...(branchLabel ? {
      label: branchLabel,
      labelStyle: { fill: branchStroke, fontWeight: 600, fontSize: 11 },
      labelBgStyle: { fill: kind === 'true' ? '#ecfdf5' : '#fef2f2', fillOpacity: 0.95 },
      labelBgPadding: [4, 2] as [number, number],
      labelBgBorderRadius: 4,
    } : {}),
    animated: true,
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 18,
      height: 18,
      color: branchStroke,
    },
    style: { stroke: branchStroke, strokeWidth: 2, ...(edge.style || {}) },
  }
}
const {
  list: listWorkflows, get, update, execute, listExecutions, getExecution, cancelExecution,
  resumeExecution, approveExecution, rejectExecution, debug,
  listVersions, rollbackVersion,
  listSchedules, createSchedule, deleteSchedule, pauseSchedule, resumeSchedule, runScheduleNow,
} = useWorkflows()

const schedulesOpen = ref(false)
const schedulesLoading = ref(false)
const scheduleSaving = ref(false)
const scheduleActionId = ref<string | null>(null)
const scheduleList = ref<WorkflowSchedule[]>([])
const scheduleForm = reactive({ name: '', cron: '0 0 9 * * *' })

const openSchedules = async () => {
  if (!workflowId.value || isSmokeTest.value) return
  schedulesOpen.value = true
  schedulesLoading.value = true
  try {
    const res = await listSchedules(workflowId.value)
    if (res.error) {
      toast.add({ title: res.error, color: 'error' })
      scheduleList.value = []
      return
    }
    scheduleList.value = res.data || []
  } finally {
    schedulesLoading.value = false
  }
}

/** 与后端一致：秒 分 时 日 月 周，共 6 段 */
function isSixFieldCron(expr: string): boolean {
  const parts = expr.trim().split(/\s+/)
  return parts.length === 6 && parts.every(p => p.length > 0)
}

const addSchedule = async () => {
  if (!workflowId.value) return
  const cron = scheduleForm.cron.trim()
  if (!cron) {
    toast.add({ title: t('editor.cronRequired'), color: 'warning' })
    return
  }
  if (!isSixFieldCron(cron)) {
    toast.add({ title: t('editor.cronInvalid'), color: 'warning' })
    return
  }
  scheduleSaving.value = true
  try {
    const res = await createSchedule(workflowId.value, {
      name: scheduleForm.name.trim() || undefined,
      cron_expression: cron,
      is_active: true,
    })
    if (res.error) {
      toast.add({ title: res.error, color: 'error' })
      return
    }
    toast.add({ title: t('editor.scheduleAdded'), color: 'success' })
    scheduleForm.name = ''
    await openSchedules()
  } finally {
    scheduleSaving.value = false
  }
}

const scheduleDeleteOpen = ref(false)
const scheduleDeleting = ref(false)
const pendingScheduleId = ref<string | null>(null)

const removeSchedule = (scheduleId: string) => {
  if (!workflowId.value) return
  pendingScheduleId.value = scheduleId
  scheduleDeleteOpen.value = true
}

const confirmRemoveSchedule = async () => {
  if (!workflowId.value || !pendingScheduleId.value) return
  scheduleDeleting.value = true
  try {
    const res = await deleteSchedule(workflowId.value, pendingScheduleId.value)
    if (res.error) {
      toast.add({ title: res.error, color: 'error' })
      return
    }
    toast.add({ title: t('common.deleteOk'), color: 'success' })
    scheduleDeleteOpen.value = false
    pendingScheduleId.value = null
    await openSchedules()
  } finally {
    scheduleDeleting.value = false
  }
}

const toggleSchedule = async (scheduleId: string, resume: boolean) => {
  if (!workflowId.value) return
  const key = `${resume ? 'resume' : 'pause'}:${scheduleId}`
  scheduleActionId.value = key
  try {
    const res = resume
      ? await resumeSchedule(workflowId.value, scheduleId)
      : await pauseSchedule(workflowId.value, scheduleId)
    if (res.error) {
      toast.add({ title: res.error, color: 'error' })
      return
    }
    toast.add({
      title: resume ? t('editor.scheduleResumed') : t('editor.schedulePausedOk'),
      color: 'success',
    })
    await openSchedules()
  } finally {
    scheduleActionId.value = null
  }
}

const runSchedule = async (scheduleId: string) => {
  if (!workflowId.value) return
  scheduleActionId.value = `run:${scheduleId}`
  try {
    const res = await runScheduleNow(workflowId.value, scheduleId)
    if (res.error) {
      toast.add({ title: res.error, color: 'error' })
      return
    }
    toast.add({
      title: t('editor.scheduleRunStarted', { id: (res.executionId || '').slice(0, 8) }),
      color: 'success',
    })
    await openSchedules()
  } finally {
    scheduleActionId.value = null
  }
}

const versionsOpen = ref(false)
const versionsLoading = ref(false)
const versionList = ref<WorkflowVersionSnap[]>([])
const rollingBackVersion = ref<number | null>(null)

const openVersions = async () => {
  if (!workflowId.value || isSmokeTest.value) return
  versionsOpen.value = true
  versionsLoading.value = true
  try {
    const res = await listVersions(workflowId.value)
    if (res.error) {
      toast.add({ title: res.error, color: 'error' })
      versionList.value = []
      return
    }
    versionList.value = res.data || []
  } finally {
    versionsLoading.value = false
  }
}

const rollbackOpen = ref(false)
const pendingRollbackVersion = ref<number | null>(null)

const askRollback = (version: number) => {
  if (!workflowId.value) return
  pendingRollbackVersion.value = version
  rollbackOpen.value = true
}

const doRollback = async () => {
  const version = pendingRollbackVersion.value
  if (!workflowId.value || version == null) return
  rollingBackVersion.value = version
  try {
    const res = await rollbackVersion(workflowId.value, version)
    if (res.error) {
      toast.add({ title: res.error, color: 'error' })
      return
    }
    toast.add({ title: t('editor.rollbackOk', { version }), color: 'success' })
    rollbackOpen.value = false
    pendingRollbackVersion.value = null
    versionsOpen.value = false
    await loadWorkflow()
  } finally {
    rollingBackVersion.value = null
  }
}
const { list: listModels } = useModels()
const { list: listTeams } = useTeams()
const { list: listAgents } = useAgents()
const { listKBs } = useKnowledgeBases()
const { list: listProviders } = useProviders()

const canvasRef = ref<HTMLElement>()
const flowCanvasRef = ref<{ fitCanvas?: () => void } | null>(null)

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
  webhookUrl: '',
})

const nodes = ref<any[]>([])
const edges = ref<any[]>([])

const nodeConfig = reactive({
  name: '',
  model: '',
  systemPrompt: '',
  prompt: '',
  llmStream: false,
  llmTemperature: '' as string | number,
  llmMaxTokens: '' as string | number,
  teamId: '',
  agentId: '',
  knowledgeBaseId: '',
  description: '',
  query: '',
  topK: '' as string | number,
  minScore: '' as string | number,
  searchMode: '',
  rerankMode: 'inherit' as 'inherit' | 'on' | 'off',
  rerankProviderId: '',
  hybridSemanticWeight: '' as string | number,
  variable: '',
  waitReason: 'approval',
  waitMessage: '',
  timeoutSec: '' as string | number,
  conditionField: '',
  conditionOperator: '==',
  conditionValue: '',
  httpMethod: 'GET',
  httpUrl: '',
  httpBody: '',
  httpHeaders: '',
  httpTimeout: '30' as string | number,
  httpFailOnError: false,
  subflowInput: '',
  delayDuration: '1' as string | number,
  delayUnit: 'seconds',
  loopType: 'times',
  loopCount: '3' as string | number,
  loopMaxIter: '100' as string | number,
  loopCondition: '',
  loopArrayVar: '',
  loopItemVar: 'item',
  loopKeyVar: '',
  codeLanguage: 'expression',
  codeSource: '',
  codeTimeout: '30' as string | number,
  subflowWorkflowId: '',
  variables: [] as {
    name: string
    type: string
    required: boolean
    default: string
    description: string
  }[],
})

const startVarTypeOptions = computed(() => [
  { label: t('editor.startVarTypeString'), value: 'string' },
  { label: t('editor.startVarTypeNumber'), value: 'number' },
  { label: t('editor.startVarTypeBoolean'), value: 'boolean' },
])

const conditionOperatorOptions = computed(() => [
  { label: t('editor.condOpEq'), value: '==' },
  { label: t('editor.condOpNe'), value: '!=' },
  { label: t('editor.condOpGt'), value: '>' },
  { label: t('editor.condOpGte'), value: '>=' },
  { label: t('editor.condOpLt'), value: '<' },
  { label: t('editor.condOpLte'), value: '<=' },
  { label: t('editor.condOpContains'), value: 'contains' },
  { label: t('editor.condOpEmpty'), value: 'is_empty' },
])

const httpMethodOptions = [
  { label: 'GET', value: 'GET' },
  { label: 'POST', value: 'POST' },
  { label: 'PUT', value: 'PUT' },
  { label: 'PATCH', value: 'PATCH' },
  { label: 'DELETE', value: 'DELETE' },
]
/** 下拉仅在当前值是常见方法时高亮；模板/自定义时留空 */
const httpMethodSelectValue = computed(() => {
  const cur = String(nodeConfig.httpMethod || '').trim().toUpperCase()
  if (!cur || cur.includes('{{')) return undefined
  return httpMethodOptions.some(o => o.value === cur) ? cur : undefined
})

const delayUnitOptions = computed(() => [
  { label: t('editor.delayUnitSeconds'), value: 'seconds' },
  { label: t('editor.delayUnitMinutes'), value: 'minutes' },
  { label: t('editor.delayUnitHours'), value: 'hours' },
])
/** 下拉仅在当前值是常见单位时高亮；模板/自定义时留空 */
const delayUnitSelectValue = computed(() => {
  const cur = String(nodeConfig.delayUnit || '').trim().toLowerCase()
  if (!cur || cur.includes('{{')) return undefined
  return delayUnitOptions.value.some(o => o.value === cur) ? cur : undefined
})

const loopTypeOptions = computed(() => [
  { label: t('editor.loopTypeTimes'), value: 'times' },
  { label: t('editor.loopTypeWhile'), value: 'while' },
  { label: t('editor.loopTypeForEach'), value: 'for_each' },
])

const codeLanguageOptions = computed(() => [
  { label: t('editor.codeLangExpression'), value: 'expression' },
  { label: t('editor.codeLangPython'), value: 'python' },
  { label: t('editor.codeLangJavascript'), value: 'javascript' },
])

function addStartVariable() {
  nodeConfig.variables.push({
    name: '',
    type: 'string',
    required: false,
    default: '',
    description: '',
  })
}

function normalizeStartVars(raw: any): {
  name: string
  type: string
  required: boolean
  default: string
  description: string
}[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((v: any) => ({
      name: String(v?.name || '').trim(),
      type: (v?.type || 'string') as string,
      required: !!v?.required,
      default: v?.default == null ? '' : String(v.default),
      description: String(v?.description || ''),
    }))
    .filter(v => v.name)
}

/** 画布开始节点上的入参定义 */
const startVariables = computed(() => {
  const start = nodes.value.find(n => n.type === 'start')
  return normalizeStartVars(start?.data?.variables || start?.config?.variables)
})

const debugForm = reactive<Record<string, any>>({})

function syncDebugInputFromForm() {
  const obj: Record<string, any> = {}
  for (const v of startVariables.value) {
    let val = debugForm[v.name]
    if (v.type === 'boolean') {
      obj[v.name] = !!val
      continue
    }
    if (val === undefined || val === null || val === '') {
      if (v.default !== '') val = v.default
      else continue
    }
    if (v.type === 'number') {
      const n = Number(val)
      obj[v.name] = Number.isFinite(n) ? n : val
    } else {
      obj[v.name] = val
    }
  }
  // 保留 JSON 里多出来的键
  try {
    const extra = JSON.parse(debugInput.value || '{}')
    if (extra && typeof extra === 'object' && !Array.isArray(extra)) {
      for (const [k, v] of Object.entries(extra)) {
        if (!(k in obj)) obj[k] = v
      }
    }
  } catch { /* ignore */ }
  debugInput.value = JSON.stringify(obj, null, 2)
}

function syncDebugFormFromInput() {
  try {
    const obj = JSON.parse(debugInput.value || '{}')
    if (!obj || typeof obj !== 'object') return
    for (const v of startVariables.value) {
      if (v.name in obj) {
        debugForm[v.name] = obj[v.name]
      }
    }
  } catch { /* ignore */ }
}

/** 把某次试跑的输入填回上方表单，方便改一点再跑 */
function reuseExecutionInput(input: unknown) {
  const json = formatExecutionInputJson(input)
  if (!json) {
    toast.add({ title: t('editor.debugReuseInputEmpty'), color: 'warning' })
    return
  }
  debugInput.value = json
  syncDebugFormFromInput()
  toast.add({ title: t('editor.debugReuseInputOk'), color: 'success' })
}

function initDebugFormFromStartVars() {
  for (const key of Object.keys(debugForm)) delete debugForm[key]
  for (const v of startVariables.value) {
    if (v.type === 'boolean') {
      debugForm[v.name] = v.default === 'true' || v.default === '1'
    } else {
      debugForm[v.name] = v.default
    }
  }
  syncDebugInputFromForm()
}

const teamOptions = ref<{ label: string, value: string }[]>([])
/** 下拉仅在当前值是已有小队时高亮；模板/手写 ID 时留空 */
const teamSelectValue = computed(() => {
  const cur = String(nodeConfig.teamId || '').trim()
  if (!cur || cur.includes('{{')) return undefined
  return teamOptions.value.some(o => o.value === cur) ? cur : undefined
})
const workflowPickOptions = ref<{ label: string, value: string }[]>([])
const subflowWorkflowOptions = computed(() =>
  workflowPickOptions.value.filter(w => w.value !== workflowId.value),
)
/** 下拉仅在当前值是已有工作流时高亮；模板/手写 ID 时留空 */
const subflowSelectValue = computed(() => {
  const cur = String(nodeConfig.subflowWorkflowId || '').trim()
  if (!cur || cur.includes('{{')) return undefined
  return subflowWorkflowOptions.value.some(o => o.value === cur) ? cur : undefined
})
const agentOptions = ref<{ label: string, value: string }[]>([])
/** 下拉仅在当前值是已有智能体时高亮；模板/手写 ID 时留空 */
const agentSelectValue = computed(() => {
  const cur = String(nodeConfig.agentId || '').trim()
  if (!cur || cur.includes('{{')) return undefined
  return agentOptions.value.some(o => o.value === cur) ? cur : undefined
})
const kbList = ref<KnowledgeBase[]>([])
const kbOptions = computed(() =>
  kbList.value.filter(k => k.id).map(k => ({ label: k.name || k.id, value: k.id })),
)
/** 下拉仅在当前值是已有知识库时高亮；模板/手写 ID 时留空 */
const kbSelectValue = computed(() => {
  const cur = String(nodeConfig.knowledgeBaseId || '').trim()
  if (!cur || cur.includes('{{')) return undefined
  return kbOptions.value.some(o => o.value === cur) ? cur : undefined
})
const providers = ref<any[]>([])
const rerankProviderOptions = computed(() =>
  providers.value
    .filter((p: any) => p.enabled !== false && hasCap(p, 'rerank'))
    .map((p: any) => ({ label: rerankModelLabel(p), value: p.id })),
)
/** 下拉仅在当前值是已有重排模型时高亮；模板/手写 ID 时留空 */
const rerankSelectValue = computed(() => {
  const cur = String(nodeConfig.rerankProviderId || '').trim()
  if (!cur || cur.includes('{{')) return undefined
  return rerankProviderOptions.value.some(o => o.value === cur) ? cur : undefined
})
const rerankSelectPlaceholder = computed(() =>
  rerankProviderOptions.value.length ? t('kb.rerankModelPh') : t('kb.rerankModelEmpty'),
)
const searchModeOptions = computed(() => [
  { label: t('editor.searchModeInherit'), value: '' },
  { label: t('kb.searchModeSemantic'), value: 'semantic' },
  { label: t('kb.searchModeKeyword'), value: 'keyword' },
  { label: t('kb.searchModeHybrid'), value: 'hybrid' },
])
const rerankModeOptions = computed(() => [
  { label: t('editor.searchRerankInherit'), value: 'inherit' },
  { label: t('editor.searchRerankOn'), value: 'on' },
  { label: t('editor.searchRerankOff'), value: 'off' },
])

function kbModeParams(kb: KnowledgeBase, mode: string) {
  const m = (mode || kb.search_mode || 'semantic').toLowerCase()
  if (m === 'keyword') {
    return {
      mode: 'keyword',
      topK: kb.rag_top_k_keyword ?? kb.rag_top_k ?? 5,
      minScore: kb.rag_min_score_keyword ?? kb.rag_min_score ?? 0.3,
      rerank: !!kb.rerank_keyword,
      rerankProviderId: kb.rerank_provider_keyword || '',
    }
  }
  if (m === 'hybrid') {
    return {
      mode: 'hybrid',
      topK: kb.rag_top_k_hybrid ?? kb.rag_top_k ?? 5,
      minScore: kb.rag_min_score_hybrid ?? kb.rag_min_score ?? 0.3,
      rerank: !!kb.rerank_hybrid,
      rerankProviderId: kb.rerank_provider_hybrid || '',
    }
  }
  return {
    mode: 'semantic',
    topK: kb.rag_top_k_semantic ?? kb.rag_top_k ?? 5,
    minScore: kb.rag_min_score_semantic ?? kb.rag_min_score ?? 0.3,
    rerank: !!kb.rerank_semantic,
    rerankProviderId: kb.rerank_provider_semantic || '',
  }
}

function searchModeLabel(mode: string) {
  if (mode === 'keyword') return t('kb.searchModeKeyword')
  if (mode === 'hybrid') return t('kb.searchModeHybrid')
  return t('kb.searchModeSemantic')
}

const selectedKB = computed(() =>
  kbList.value.find(k => k.id === nodeConfig.knowledgeBaseId) || null,
)

const effectiveSearchMode = computed(() => {
  if (nodeConfig.searchMode) return nodeConfig.searchMode
  return (selectedKB.value?.search_mode || 'semantic').toLowerCase()
})

const selectedKBDefaults = computed(() => {
  const kb = selectedKB.value
  if (!kb) return null
  const p = kbModeParams(kb, kb.search_mode || 'semantic')
  const prov = providers.value.find((x: any) => x.id === p.rerankProviderId)
  const rerankLabel = !p.rerank
    ? t('editor.searchRerankOff')
    : (prov ? rerankModelLabel(prov) : (p.rerankProviderId || t('editor.searchRerankOn')))
  const w = typeof kb.hybrid_semantic_weight === 'number' ? kb.hybrid_semantic_weight : 0.7
  return {
    mode: p.mode,
    modeLabel: searchModeLabel(p.mode),
    topK: p.topK,
    minScore: p.minScore,
    rerankLabel,
    hybridLabel: t('editor.searchHybridWeightValue', {
      semantic: Math.round(w * 100),
      keyword: Math.round((1 - w) * 100),
    }),
  }
})

const currentWorkflow = ref<any>(null)

const showDebugPanel = ref(false)
/** 从此调试时默认灌入最近一次试跑的上游输出 */
const seedUpstreamOnDebugFrom = ref(true)
const debugInput = ref('{}')

// 必须在 showDebugPanel / debugInput 声明之后再 watch，否则 TDZ 导致整页白屏
watch(startVariables, () => {
  if (showDebugPanel.value) initDebugFormFromStartVars()
}, { deep: true })

watch(showDebugPanel, (open) => {
  if (open) initDebugFormFromStartVars()
})

const currentExecution = ref<any>(null)
const executionLogs = ref<any[]>([])
/** 更早试跑默认折叠，主区只看这一次 */
const showOlderRuns = ref(false)
const isDebugging = ref(false)
const debugPollInterval = ref<number | null>(null)
const isPolling = ref(false)
const resuming = ref(false)
const approving = ref(false)
const rejecting = ref(false)

const nodeTypes = WORKFLOW_PALETTE_TYPES

const modelOptions = ref<{ label: string; value: string }[]>([])
const firstConfiguredModel = () => modelOptions.value[0]?.value || ''
/** 下拉只在当前值是已配置模型时高亮；模板/手写 ID 时留空，避免 USelect 显示错项 */
const llmModelSelectValue = computed(() => {
  const cur = String(nodeConfig.model || '').trim()
  if (!cur || cur.includes('{{')) return undefined
  return modelOptions.value.some(o => o.value === cur) ? cur : undefined
})

const getNodeIcon = (type: string) => getWorkflowNodeMeta(type).icon

const getNodeLabel = (type: string) => {
  return t(`editor.node.${type}` as any)
}

const execStatusColor = (status: string) => {
  switch (status) {
    case 'completed':
    case 'succeeded':
      return 'success' as const
    case 'failed':
    case 'cancelled':
      return 'error' as const
    case 'waiting':
      return 'warning' as const
    case 'running':
    case 'debugging':
      return 'info' as const
    default:
      return 'neutral' as const
  }
}

function buildEditorSnapshot(): string {
  return JSON.stringify({
    name: workflowName.value,
    description: workflowBasicInfo.description || '',
    webhookUrl: workflowBasicInfo.webhookUrl || '',
    nodes: nodes.value.map((n) => {
      const raw = { ...(n.data || {}) } as Record<string, unknown>
      // 调试进度等运行时字段不计入未保存
      delete raw.streamProgress
      return {
        id: n.id,
        type: n.type,
        position: n.position,
        data: raw,
      }
    }),
    edges: edges.value.map(e => ({
      id: e.id,
      source: e.source,
      target: e.target,
      sourceHandle: e.sourceHandle || null,
      targetHandle: e.targetHandle || null,
    })),
  })
}

const cleanEditorSnapshot = ref('')
const canvasDirty = computed(() => {
  if (isSmokeTest.value) return false
  if (!cleanEditorSnapshot.value) return false
  return buildEditorSnapshot() !== cleanEditorSnapshot.value
})

function markEditorClean() {
  cleanEditorSnapshot.value = buildEditorSnapshot()
}

/** 只把基本信息标成已保存，画布改动仍算未保存 */
function markEditorMetaClean() {
  if (!cleanEditorSnapshot.value) {
    markEditorClean()
    return
  }
  try {
    const snap = JSON.parse(cleanEditorSnapshot.value) as Record<string, unknown>
    snap.name = workflowName.value
    snap.description = workflowBasicInfo.description || ''
    snap.webhookUrl = workflowBasicInfo.webhookUrl || ''
    cleanEditorSnapshot.value = JSON.stringify(snap)
  }
  catch {
    markEditorClean()
  }
}

const leaveDirtyOpen = ref(false)
let pendingLeaveAction: (() => void) | null = null
let leaveGuardNext: ((val?: boolean | void) => void) | null = null

function askLeaveIfDirty(action: () => void) {
  if (!canvasDirty.value) {
    action()
    return
  }
  pendingLeaveAction = action
  leaveDirtyOpen.value = true
}

function confirmLeaveDirty() {
  const action = pendingLeaveAction
  const guardNext = leaveGuardNext
  pendingLeaveAction = null
  leaveGuardNext = null
  leaveDirtyOpen.value = false
  markEditorClean()
  action?.()
  guardNext?.()
}

function onLeaveDirtyCancel() {
  pendingLeaveAction = null
  leaveDirtyOpen.value = false
  leaveGuardNext?.(false)
  leaveGuardNext = null
}

const loadWorkflow = async () => {
  if (!workflowId.value) {
    toast.add({ title: t('editor.missingId'), color: 'warning' })
    return
  }

  currentWorkflow.value = null
  nodes.value = []
  edges.value = []
  cleanEditorSnapshot.value = ''

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
    await nextTick()
    markEditorClean()
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
    workflowBasicInfo.webhookUrl = workflow.webhook_url || ''
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
            ...(n.type === 'team'
              ? {
                  teamId: n.data?.teamId || n.config?.team_id || '',
                  prompt: n.data?.prompt || n.config?.task || n.config?.prompt || '',
                }
              : {}),
            ...(n.type === 'subflow'
              ? {
                  subflowWorkflowId:
                    n.data?.subflowWorkflowId || n.data?.workflowId || n.config?.workflow_id || '',
                }
              : {}),
            ...(n.type === 'agent'
              ? {
                  agentId: n.data?.agentId || n.config?.agent_id || '',
                  prompt: n.data?.prompt || n.config?.prompt || '',
                }
              : {}),
            ...(n.type === 'llm'
              ? (() => {
                  const tempRaw = n.data?.temperature ?? n.data?.llmTemperature ?? n.config?.temperature ?? ''
                  const maxRaw =
                    n.data?.maxTokens ??
                    n.data?.llmMaxTokens ??
                    n.data?.max_tokens ??
                    n.config?.max_tokens ??
                    ''
                  const temperature =
                    tempRaw === 0 || tempRaw === '0' || tempRaw == null || tempRaw === ''
                      ? ''
                      : typeof tempRaw === 'string'
                        ? tempRaw
                        : String(tempRaw)
                  const maxTokens =
                    maxRaw === 0 || maxRaw === '0' || maxRaw == null || maxRaw === ''
                      ? ''
                      : typeof maxRaw === 'string'
                        ? maxRaw
                        : String(maxRaw)
                  return {
                    model: n.data?.model || n.config?.model || '',
                    systemPrompt: n.data?.systemPrompt || n.config?.system_prompt || '',
                    prompt: n.data?.prompt || n.config?.prompt || '',
                    llmStream: !!(n.data?.llmStream ?? n.data?.stream ?? n.config?.stream),
                    stream: !!(n.data?.llmStream ?? n.data?.stream ?? n.config?.stream),
                    temperature: temperature || undefined,
                    llmTemperature: temperature || undefined,
                    maxTokens: maxTokens || undefined,
                    llmMaxTokens: maxTokens || undefined,
                    max_tokens: maxTokens || undefined,
                  }
                })()
              : {}),
            ...(n.type === 'search'
              ? {
                  knowledgeBaseId: n.data?.knowledgeBaseId || n.config?.knowledge_base_id || '',
                  query: n.data?.query || n.config?.query || '',
                  topK: (() => {
                    const raw = n.data?.topK ?? n.config?.top_k ?? ''
                    if (raw === 0 || raw === '0' || raw == null || raw === '') return ''
                    return typeof raw === 'string' ? raw : String(raw)
                  })(),
                  minScore: (() => {
                    const raw = n.data?.minScore ?? n.config?.min_score ?? ''
                    if (raw === 0 || raw === '0' || raw == null || raw === '') return ''
                    return typeof raw === 'string' ? raw : String(raw)
                  })(),
                  searchMode: n.data?.searchMode || n.config?.search_mode || '',
                  rerank: n.data?.rerank ?? n.config?.rerank,
                  rerankProviderId: n.data?.rerankProviderId || n.config?.rerank_provider_id || '',
                  hybridSemanticWeight: (() => {
                    const raw = n.data?.hybridSemanticWeight ?? n.config?.hybrid_semantic_weight
                    if (raw == null || raw === '') return ''
                    return typeof raw === 'string' ? raw : String(raw)
                  })(),
                }
              : {}),
            ...(n.type === 'http'
              ? (() => {
                  const raw = n.data?.timeout ?? n.data?.httpTimeout ?? n.config?.timeout ?? '30'
                  const timeout = typeof raw === 'string' ? raw : String(raw ?? '30')
                  return {
                    method: n.data?.method || n.data?.httpMethod || n.config?.method || 'GET',
                    httpMethod: n.data?.httpMethod || n.data?.method || n.config?.method || 'GET',
                    url: n.data?.url || n.data?.httpUrl || n.config?.url || '',
                    httpUrl: n.data?.httpUrl || n.data?.url || n.config?.url || '',
                    timeout,
                    httpTimeout: timeout,
                    httpFailOnError: !!(
                      n.data?.httpFailOnError ?? n.data?.failOnError ?? n.data?.fail_on_error ?? n.config?.fail_on_error
                    ),
                    failOnError: !!(
                      n.data?.failOnError ?? n.data?.httpFailOnError ?? n.data?.fail_on_error ?? n.config?.fail_on_error
                    ),
                    fail_on_error: !!(
                      n.data?.fail_on_error ?? n.data?.failOnError ?? n.data?.httpFailOnError ?? n.config?.fail_on_error
                    ),
                  }
                })()
              : {}),
            ...(n.type === 'code'
              ? (() => {
                  const raw = n.data?.codeTimeout ?? n.data?.timeout ?? n.config?.timeout ?? '30'
                  const timeout = typeof raw === 'string' ? raw : String(raw ?? '30')
                  return {
                    codeLanguage: n.data?.codeLanguage || n.data?.language || n.config?.language || 'expression',
                    codeSource: n.data?.codeSource || n.data?.code || n.config?.code || '',
                    codeTimeout: timeout,
                    timeout,
                  }
                })()
              : {}),
            ...(n.type === 'start'
              ? {
                  variables: normalizeStartVars(n.data?.variables || n.config?.variables),
                }
              : {}),
          },
        })) || []

        edges.value = def.edges?.map((e: any) => withEdgeArrow(fromDefinitionEdge(e))) || []
      } catch {
        nodes.value = []
        edges.value = []
      }
      syncBindCaptions()
    }
  }
  await nextTick()
  markEditorClean()
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

function isHttpUrl(raw: string): boolean {
  try {
    const u = new URL(raw)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

const handleSaveBasic = async () => {
  if (isSmokeTest.value) {
    toast.add({ title: t('editor.noSaveOnTest'), color: 'info' })
    return
  }
  const hook = workflowBasicInfo.webhookUrl.trim()
  if (hook && !isHttpUrl(hook)) {
    toast.add({ title: t('editor.webhookUrlInvalid'), color: 'warning' })
    return
  }
  savingBasic.value = true
  try {
    const res = await update(workflowId.value, {
      name: workflowBasicInfo.name,
      description: workflowBasicInfo.description,
      webhook_url: hook,
    })
    if (res.error) {
      toast.add({ title: res.error, color: 'error' })
      return
    }
    workflowName.value = workflowBasicInfo.name
    if (currentWorkflow.value) {
      currentWorkflow.value.name = workflowBasicInfo.name
      currentWorkflow.value.description = workflowBasicInfo.description
      currentWorkflow.value.webhook_url = workflowBasicInfo.webhookUrl.trim()
    }
    toast.add({ title: t('editor.infoSaved'), color: 'success' })
    editPopoverShow.value = false
    markEditorMetaClean()
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
  for (const change of changes) {
    if (change.type === 'remove') {
      edges.value = edges.value.filter(e => e.id !== change.id)
    }
  }
}

/** ProcessOn 风格：从线头拖到目标节点完成连线 */
const handleConnect = (params: any) => {
  if (!params?.source || !params?.target || params.source === params.target) return
  const sourceNode = nodes.value.find(n => n.id === params.source)
  const targetNode = nodes.value.find(n => n.id === params.target)
  if (sourceNode && getWorkflowNodeMeta(String(sourceNode.type || '')).handles === 'end') {
    toast.add({ title: t('editor.endCannotConnect'), color: 'warning' })
    return
  }
  if (targetNode && getWorkflowNodeMeta(String(targetNode.type || '')).handles === 'start') {
    toast.add({ title: t('editor.startCannotReceive'), color: 'warning' })
    return
  }
  const sourceHandle = params.sourceHandle || undefined
  const targetHandle = params.targetHandle || undefined
  const dup = edges.value.some(e =>
    e.source === params.source
    && e.target === params.target
    && (e.sourceHandle || undefined) === sourceHandle
    && (e.targetHandle || undefined) === targetHandle,
  )
  if (dup) return
  edges.value.push(withEdgeArrow({
    id: `e${params.source}-${params.target}-${sourceHandle || 's'}-${targetHandle || 't'}-${Date.now()}`,
    source: params.source,
    target: params.target,
    sourceHandle,
    targetHandle,
  }))
}

/** 整理布局：按连线自动排成从左到右的整齐流水线 */
function tidyLayout() {
  if (!nodes.value.length) return
  nodes.value = layoutWorkflowNodes(nodes.value, edges.value)
  toast.add({ title: t('editor.tidyLayoutOk'), color: 'success' })
  nextTick(() => {
    flowCanvasRef.value?.fitCanvas?.()
  })
}

const addNode = (type: string) => {
  if (type === 'start' && nodes.value.some(n => n.type === 'start')) {
    toast.add({ title: t('editor.onlyOneStart'), color: 'warning' })
    return
  }
  const data: Record<string, unknown> = {
    label: getNodeLabel(type),
  }
  if (type === 'delay') {
    data.delayDuration = '1'
    data.duration = '1'
    data.delayUnit = 'seconds'
    data.unit = 'seconds'
    data.bindCaption = resolveBindCaption('delay', data)
  }
  if (type === 'wait') {
    data.waitReason = 'approval'
    data.reason = 'approval'
    data.bindCaption = resolveBindCaption('wait', data)
  }
  if (type === 'loop') {
    data.loopType = 'times'
    data.type = 'times'
    data.loopCount = '3'
    data.count = '3'
    data.loopMaxIter = '100'
    data.max_iter = '100'
    data.bindCaption = resolveBindCaption('loop', data)
  }
  if (type === 'start') {
    data.variables = []
    data.bindCaption = resolveBindCaption('start', data)
  }
  if (type === 'input' || type === 'output') {
    data.variable = ''
    data.bindCaption = resolveBindCaption(type, data)
  }
  if (type === 'end') {
    data.bindCaption = resolveBindCaption('end', data)
  }
  const newNode = {
    id: `node-${Date.now()}`,
    type,
    position: { x: Math.random() * 300 + 50, y: Math.random() * 200 + 50 },
    data,
  }
  nodes.value.push(newNode)
}

function resolveBindCaption(kind: string, data?: Record<string, unknown> | null): string {
  const d = data || {}
  if (kind === 'llm') {
    const id = String(d.model || '').trim()
    const name = modelOptions.value.find(o => o.value === id)?.label || id
    if (!name) return ''
    const stream = !!(d.llmStream ?? d.stream)
    let base = stream ? `${name} · ${t('editor.llmStreamShort')}` : name
    const tempRaw = String(d.temperature ?? d.llmTemperature ?? '').trim()
    const maxRaw = String(d.maxTokens ?? d.max_tokens ?? d.llmMaxTokens ?? '').trim()
    if (tempRaw.includes('{{')) base = `${base} · t=${tempRaw}`
    else {
      const temp = Number(tempRaw)
      if (temp > 0) base = `${base} · t=${temp}`
    }
    if (maxRaw.includes('{{')) base = `${base} · max${maxRaw}`
    else {
      const maxTok = Number(maxRaw)
      if (maxTok > 0) base = `${base} · max${maxTok}`
    }
    return base
  }
  if (kind === 'http') {
    const method = String(d.method || d.httpMethod || 'GET').trim().toUpperCase() || 'GET'
    const url = String(d.url || d.httpUrl || '').trim()
    if (!url) return ''
    const short = url.length > 36 ? `${url.slice(0, 34)}…` : url
    const timeoutRaw = String(d.timeout ?? d.httpTimeout ?? '').trim()
    const headers = parseHttpHeadersJson(d.headers ?? d.httpHeaders)
    const headerN = headers ? Object.keys(headers).length : 0
    let base = `${method} ${short}`
    if (headerN > 0) base = `${base} · ${t('editor.httpHeadersShort', { n: headerN })}`
    if (timeoutRaw.includes('{{')) base = `${base} · ${timeoutRaw}s`
    else {
      const timeout = Number(timeoutRaw)
      if (timeout > 0 && timeout !== 30) base = `${base} · ${timeout}s`
    }
    if (d.failOnError || d.fail_on_error || d.httpFailOnError) {
      base = `${base} · ${t('editor.httpFailOnErrorShort')}`
    }
    return base
  }
  if (kind === 'code') {
    const lang = String(d.codeLanguage || d.language || 'expression').trim() || 'expression'
    const src = String(d.codeSource || d.code || '').trim()
    if (!src) return ''
    const first = src.split('\n').find(l => l.trim()) || src
    const short = first.length > 28 ? `${first.slice(0, 26)}…` : first
    const base = `${lang}: ${short}`
    const timeoutRaw = String(d.codeTimeout ?? d.timeout ?? '').trim()
    if (lang !== 'expression') {
      if (timeoutRaw.includes('{{')) return `${base} · ${timeoutRaw}s`
      const timeout = Number(timeoutRaw)
      if (timeout > 0 && timeout !== 30) return `${base} · ${timeout}s`
    }
    return base
  }
  if (kind === 'condition') {
    const conds = Array.isArray(d.conditions) ? d.conditions : []
    const first = conds[0] as { field?: string, operator?: string, value?: string } | undefined
    const field = String(d.conditionField || first?.field || '').trim()
    if (!field) return ''
    const op = String(d.conditionOperator || first?.operator || '==').trim() || '=='
    const val = String(d.conditionValue ?? first?.value ?? '').trim()
    return val ? `${field} ${op} ${val}` : `${field} ${op}`
  }
  if (kind === 'team') {
    const id = String(d.teamId || '').trim()
    return teamOptions.value.find(o => o.value === id)?.label || ''
  }
  if (kind === 'agent') {
    const id = String(d.agentId || '').trim()
    return agentOptions.value.find(o => o.value === id)?.label || ''
  }
  if (kind === 'search') {
    const id = String(d.knowledgeBaseId || '').trim()
    const name = kbOptions.value.find(o => o.value === id)?.label || ''
    if (!name) return ''
    const parts = [name]
    const mode = String(d.searchMode || d.search_mode || '').trim()
    if (mode) parts.push(mode)
    const topKRaw = String(d.topK ?? d.top_k ?? '').trim()
    if (topKRaw.includes('{{')) parts.push(`top ${topKRaw}`)
    else {
      const topK = Number(topKRaw)
      if (topK > 0) parts.push(`top ${topK}`)
    }
    return parts.join(' · ')
  }
  if (kind === 'subflow') {
    if (isSubflowSelfReference(d, workflowId.value)) return t('editor.subflowSelfCaption')
    const id = String(d.subflowWorkflowId || d.workflowId || d.workflow_id || '').trim()
    const name = workflowPickOptions.value.find(o => o.value === id)?.label || ''
    if (!name) return ''
    const input = parseJsonObject(d.input ?? d.subflowInput)
    return input ? `${name} · ${t('editor.subflowInputShort')}` : name
  }
  if (kind === 'delay') {
    const raw = String(d.delayDuration ?? d.duration ?? '').trim()
    if (!raw) return ''
    const unit = String(d.delayUnit || d.unit || 'seconds')
    const unitLabel = unit === 'minutes'
      ? t('editor.delayUnitMinutes')
      : unit === 'hours'
        ? t('editor.delayUnitHours')
        : t('editor.delayUnitSeconds')
    const n = Number(raw)
    if (raw.includes('{{')) return `${raw} ${unitLabel}`
    if (!(n > 0)) return ''
    return `${n} ${unitLabel}`
  }
  if (kind === 'wait') {
    const reason = String(d.waitReason || d.reason || 'approval').trim() || 'approval'
    const msg = String(d.waitMessage || d.message || '').trim()
    let base = msg ? `${reason}: ${msg.length > 24 ? `${msg.slice(0, 22)}…` : msg}` : reason
    const timeoutRaw = String(d.timeoutSec ?? d.timeout_sec ?? d.timeout ?? '').trim()
    if (timeoutRaw) {
      if (timeoutRaw.includes('{{')) base = `${base} · ${timeoutRaw}s`
      else {
        const timeout = Number(timeoutRaw)
        if (timeout > 0) base = `${base} · ${timeout}s`
      }
    }
    return base
  }
  if (kind === 'loop') {
    let loopType = String(d.loopType || d.type || 'times').trim() || 'times'
    if (loopType === 'count') loopType = 'times'
    if (loopType === 'while') {
      const cond = String(d.loopCondition || d.condition || '').trim()
      const maxRaw = String(d.loopMaxIter ?? d.max_iter ?? '100').trim() || '100'
      if (cond) {
        const short = cond.length > 24 ? `${cond.slice(0, 22)}…` : cond
        return `${t('editor.loopTypeWhile')}: ${short}`
      }
      return `${t('editor.loopTypeWhile')} ≤${maxRaw}`
    }
    if (loopType === 'for_each') {
      const arr = String(d.loopArrayVar || d.array_var || '').trim()
      if (!arr) return ''
      const item = String(d.loopItemVar || d.item_var || 'item').trim() || 'item'
      return `${t('editor.loopTypeForEach')}: ${arr} → ${item}`
    }
    const countRaw = String(d.loopCount ?? d.count ?? '').trim()
    if (!countRaw) return t('editor.loopTypeTimes')
    if (countRaw.includes('{{')) return `${t('editor.loopTypeTimes')} ×${countRaw}`
    const n = Number(countRaw)
    if (!(n > 0)) return t('editor.loopTypeTimes')
    return `${t('editor.loopTypeTimes')} ×${n}`
  }
  if (kind === 'start') {
    const raw = Array.isArray(d.variables) ? d.variables : []
    const names = raw
      .map((v: { name?: string }) => String(v?.name || '').trim())
      .filter(Boolean)
    if (!names.length) return t('editor.startVarsNone')
    if (names.length <= 2) return names.join(', ')
    return t('editor.startVarsCaption', {
      shown: names.slice(0, 2).join(', '),
      n: names.length,
      more: names.length - 2,
    })
  }
  if (kind === 'input' || kind === 'output') {
    const v = String(d.variable || '').trim()
    if (!v) return t('editor.ioVarNone')
    return t('editor.ioVarCaption', { v })
  }
  if (kind === 'end') {
    return t('editor.endCaption')
  }
  return ''
}

/** 选项列表刷新后，给已绑定节点补上资源名副文案 */
function syncBindCaptions() {
  nodes.value = nodes.value.map((n) => {
    const kind = String(n.type || '')
    if (!['llm', 'http', 'code', 'condition', 'delay', 'wait', 'loop', 'start', 'team', 'agent', 'search', 'subflow'].includes(kind)) return n
    const caption = resolveBindCaption(kind, n.data)
    if ((n.data?.bindCaption || '') === caption) return n
    return { ...n, data: { ...n.data, bindCaption: caption } }
  })
}

async function refreshModelOptions() {
  const res = await listModels()
  if (res.error) {
    toast.add({ title: res.error, color: 'error' })
    return
  }
  modelOptions.value = (res.data || [])
    .filter(m => m.id)
    .map(m => ({ label: m.name || m.id, value: m.id }))
  if (!nodeConfig.model && modelOptions.value[0]) {
    nodeConfig.model = modelOptions.value[0]!.value
  }
  syncBindCaptions()
}

async function refreshTeamOptions() {
  const res = await listTeams()
  if (res.error) {
    toast.add({ title: res.error, color: 'error' })
    return
  }
  teamOptions.value = (res.data || [])
    .filter(t => t.id && (!t.status || t.status === 'active'))
    .map(t => ({ label: t.name || t.id, value: t.id }))
  syncBindCaptions()
}

async function refreshAgentOptions() {
  const res = await listAgents()
  if (res.error) {
    toast.add({ title: res.error, color: 'error' })
    return
  }
  agentOptions.value = (res.data || [])
    .filter(a => a.id)
    .map(a => ({ label: a.name || a.id, value: a.id }))
  syncBindCaptions()
}

async function refreshWorkflowPickOptions() {
  const res = await listWorkflows()
  if (res.error) {
    toast.add({ title: res.error, color: 'error' })
    return
  }
  workflowPickOptions.value = (res.data || [])
    .filter(w => w.id)
    .map(w => ({ label: w.name || w.id, value: w.id }))
  syncBindCaptions()
}

async function refreshKbOptions() {
  const res = await listKBs()
  if (res.error) {
    toast.add({ title: res.error, color: 'error' })
    return
  }
  kbList.value = (res.data || []).filter(k => k.id)
  syncBindCaptions()
}

/** 时间线选节点时避免与画布点击互相覆盖 */
let syncingTimelineToCanvas = false

const handleNodeClick = (event: any) => {
  selectedNode.value = event.node
  if (!syncingTimelineToCanvas && execTimeline.value.length) {
    selectedTimelineKey.value = findLatestTimelineKeyForNode(execTimeline.value, event.node.id)
  }
  nodeConfig.name = event.node.data?.label || ''
  nodeConfig.model = event.node.data?.model || firstConfiguredModel()
  nodeConfig.systemPrompt = event.node.data?.systemPrompt || ''
  nodeConfig.prompt = event.node.data?.prompt || event.node.data?.task || ''
  nodeConfig.llmStream = !!(event.node.data?.llmStream ?? event.node.data?.stream)
  nodeConfig.llmTemperature = (() => {
    const raw = event.node.data?.llmTemperature ?? event.node.data?.temperature ?? ''
    if (raw === 0 || raw === '0' || raw == null || raw === '') return ''
    return typeof raw === 'string' ? raw : String(raw)
  })()
  nodeConfig.llmMaxTokens = (() => {
    const raw =
      event.node.data?.llmMaxTokens ?? event.node.data?.maxTokens ?? event.node.data?.max_tokens ?? ''
    if (raw === 0 || raw === '0' || raw == null || raw === '') return ''
    return typeof raw === 'string' ? raw : String(raw)
  })()
  nodeConfig.teamId = event.node.data?.teamId || event.node.data?.team_id || ''
  nodeConfig.agentId = event.node.data?.agentId || event.node.data?.agent_id || ''
  if (event.node?.type === 'llm') {
    void refreshModelOptions()
  }
  if (event.node?.type === 'team') {
    void refreshTeamOptions()
  }
  if (event.node?.type === 'agent') {
    void refreshAgentOptions()
  }
  if (event.node?.type === 'subflow') {
    void refreshWorkflowPickOptions()
  }
  if (event.node?.type === 'search') {
    void refreshKbOptions()
  }
  nodeConfig.knowledgeBaseId = event.node.data?.knowledgeBaseId || event.node.data?.knowledge_base_id || ''
  nodeConfig.description = event.node.data?.description || ''
  nodeConfig.query = event.node.data?.query || ''
  {
    const raw = event.node.data?.topK ?? event.node.data?.top_k ?? ''
    nodeConfig.topK = raw === 0 || raw === '0' || raw == null || raw === ''
      ? ''
      : (typeof raw === 'string' ? raw : String(raw))
  }
  {
    const raw = event.node.data?.minScore ?? event.node.data?.min_score ?? ''
    nodeConfig.minScore = raw === 0 || raw === '0' || raw == null || raw === ''
      ? ''
      : (typeof raw === 'string' ? raw : String(raw))
  }
  nodeConfig.searchMode = event.node.data?.searchMode || event.node.data?.search_mode || ''
  if (event.node.data?.rerank === true) nodeConfig.rerankMode = 'on'
  else if (event.node.data?.rerank === false) nodeConfig.rerankMode = 'off'
  else nodeConfig.rerankMode = 'inherit'
  nodeConfig.rerankProviderId = event.node.data?.rerankProviderId || event.node.data?.rerank_provider_id || ''
  const hy = event.node.data?.hybridSemanticWeight ?? event.node.data?.hybrid_semantic_weight
  nodeConfig.hybridSemanticWeight =
    hy == null || hy === '' ? '' : typeof hy === 'string' ? hy : String(hy)
  nodeConfig.variable = event.node.data?.variable || ''
  nodeConfig.waitReason = event.node.data?.waitReason || event.node.data?.reason || 'approval'
  nodeConfig.waitMessage = event.node.data?.waitMessage || event.node.data?.message || ''
  {
    const raw = event.node.data?.timeoutSec ?? event.node.data?.timeout_sec ?? ''
    nodeConfig.timeoutSec = raw === 0 || raw === '0' ? '' : (typeof raw === 'string' ? raw : (raw ? String(raw) : ''))
  }
  const cond0 = Array.isArray(event.node.data?.conditions) ? event.node.data.conditions[0] : null
  nodeConfig.conditionField = event.node.data?.conditionField || cond0?.field || ''
  nodeConfig.conditionOperator = event.node.data?.conditionOperator || cond0?.operator || '=='
  nodeConfig.conditionValue = String(
    event.node.data?.conditionValue ?? cond0?.value ?? '',
  )
  nodeConfig.httpMethod = event.node.data?.method || event.node.data?.httpMethod || 'GET'
  nodeConfig.httpUrl = event.node.data?.url || event.node.data?.httpUrl || ''
  const bodyRaw = event.node.data?.body ?? event.node.data?.httpBody
  nodeConfig.httpBody = typeof bodyRaw === 'string'
    ? bodyRaw
    : (bodyRaw != null ? JSON.stringify(bodyRaw, null, 2) : '')
  nodeConfig.httpHeaders = formatHttpHeadersJson(
    event.node.data?.headers ?? event.node.data?.httpHeaders,
  )
  {
    const raw = event.node.data?.timeout ?? event.node.data?.httpTimeout ?? '30'
    nodeConfig.httpTimeout = typeof raw === 'string' ? raw : String(raw ?? '30')
  }
  nodeConfig.httpFailOnError = !!(
    event.node.data?.httpFailOnError
    ?? event.node.data?.failOnError
    ?? event.node.data?.fail_on_error
  )
  {
    const raw = event.node.data?.delayDuration ?? event.node.data?.duration ?? '1'
    nodeConfig.delayDuration = typeof raw === 'string' ? raw : String(raw ?? '1')
  }
  nodeConfig.delayUnit = event.node.data?.delayUnit || event.node.data?.unit || 'seconds'
  nodeConfig.loopType = event.node.data?.loopType || event.node.data?.type || 'times'
  if (nodeConfig.loopType === 'count') nodeConfig.loopType = 'times'
  {
    const raw = event.node.data?.loopCount ?? event.node.data?.count ?? '3'
    nodeConfig.loopCount = typeof raw === 'string' ? raw : String(raw ?? '3')
  }
  {
    const raw = event.node.data?.loopMaxIter ?? event.node.data?.max_iter ?? '100'
    nodeConfig.loopMaxIter = typeof raw === 'string' ? raw : String(raw ?? '100')
  }
  nodeConfig.loopCondition = event.node.data?.loopCondition || event.node.data?.condition || ''
  nodeConfig.loopArrayVar = event.node.data?.loopArrayVar || event.node.data?.array_var || ''
  nodeConfig.loopItemVar = event.node.data?.loopItemVar || event.node.data?.item_var || 'item'
  nodeConfig.loopKeyVar = event.node.data?.loopKeyVar || event.node.data?.key_var || ''
  nodeConfig.codeLanguage = event.node.data?.codeLanguage || event.node.data?.language || 'expression'
  nodeConfig.codeSource = event.node.data?.codeSource || event.node.data?.code || ''
  {
    const raw = event.node.data?.codeTimeout ?? event.node.data?.timeout ?? '30'
    nodeConfig.codeTimeout = typeof raw === 'string' ? raw : String(raw ?? '30')
  }
  nodeConfig.subflowWorkflowId =
    event.node.data?.subflowWorkflowId || event.node.data?.workflowId || event.node.data?.workflow_id || ''
  nodeConfig.subflowInput = formatJsonObject(
    event.node.data?.input ?? event.node.data?.subflowInput,
  )
  nodeConfig.variables = normalizeStartVars(
    event.node.data?.variables || event.node.config?.variables,
  ).map(v => ({ ...v }))
  if (event.node.type === 'start' && !nodeConfig.variables.length) {
    nodeConfig.variables = []
  }
  configDrawer.value = true
}

const handlePaneClick = () => {
  selectedNode.value = null
  selectedTimelineKey.value = null
  configDrawer.value = false
  issueMenuOpen.value = false
}

const saveNodeConfig = () => {
  if (!selectedNode.value) return

  const node = nodes.value.find(n => n.id === selectedNode.value.id)
  if (node) {
    const nextBindData = {
      model: nodeConfig.model,
      llmStream: !!nodeConfig.llmStream,
      stream: !!nodeConfig.llmStream,
      ...(() => {
        const raw = String(nodeConfig.llmTemperature ?? '').trim()
        if (!raw) return { llmTemperature: 0, temperature: 0 }
        const asNum = Number(raw)
        const temperature = raw.includes('{{') ? raw : (asNum > 0 ? asNum : 0)
        return { llmTemperature: temperature, temperature }
      })(),
      ...(() => {
        const raw = String(nodeConfig.llmMaxTokens ?? '').trim()
        if (!raw) return { llmMaxTokens: 0, maxTokens: 0, max_tokens: 0 }
        const asNum = Number(raw)
        const maxTokens = raw.includes('{{') ? raw : (asNum > 0 ? asNum : 0)
        return { llmMaxTokens: maxTokens, maxTokens, max_tokens: maxTokens }
      })(),
      ...(() => {
        const raw = String(nodeConfig.topK ?? '').trim()
        if (!raw) return { topK: 0, top_k: 0 }
        const asNum = Number(raw)
        const topK = raw.includes('{{') ? raw : (asNum > 0 ? asNum : 0)
        return { topK, top_k: topK }
      })(),
      searchMode: nodeConfig.searchMode || '',
      search_mode: nodeConfig.searchMode || '',
      ...(() => {
        const raw = String(nodeConfig.timeoutSec ?? '').trim()
        if (!raw) return { timeoutSec: 0, timeout_sec: 0 }
        const asNum = Number(raw)
        const timeoutSec = raw.includes('{{') ? raw : (asNum > 0 ? asNum : 0)
        return { timeoutSec, timeout_sec: timeoutSec }
      })(),
      ...(() => {
        const raw = String(nodeConfig.httpTimeout ?? '').trim()
        const asNum = Number(raw)
        const timeout = raw.includes('{{') ? raw : (asNum > 0 ? asNum : 30)
        return { httpTimeout: timeout, timeout }
      })(),
      httpFailOnError: !!nodeConfig.httpFailOnError,
      failOnError: !!nodeConfig.httpFailOnError,
      fail_on_error: !!nodeConfig.httpFailOnError,
      method: nodeConfig.httpMethod,
      httpMethod: nodeConfig.httpMethod,
      url: nodeConfig.httpUrl,
      httpUrl: nodeConfig.httpUrl,
      codeLanguage: nodeConfig.codeLanguage,
      language: nodeConfig.codeLanguage,
      codeSource: nodeConfig.codeSource,
      code: nodeConfig.codeSource,
      ...(() => {
        const raw = String(nodeConfig.codeTimeout ?? '').trim()
        const asNum = Number(raw)
        const timeout = raw.includes('{{') ? raw : (asNum > 0 ? asNum : 30)
        return { codeTimeout: timeout, timeout }
      })(),
      conditionField: nodeConfig.conditionField,
      conditionOperator: nodeConfig.conditionOperator,
      conditionValue: nodeConfig.conditionValue,
      conditions: nodeConfig.conditionField
        ? [{
            field: nodeConfig.conditionField,
            operator: nodeConfig.conditionOperator || '==',
            value: nodeConfig.conditionValue,
          }]
        : [],
      delayDuration: nodeConfig.delayDuration,
      duration: nodeConfig.delayDuration,
      delayUnit: nodeConfig.delayUnit,
      unit: nodeConfig.delayUnit,
      waitReason: nodeConfig.waitReason,
      reason: nodeConfig.waitReason,
      waitMessage: nodeConfig.waitMessage,
      message: nodeConfig.waitMessage,
      loopType: nodeConfig.loopType,
      type: nodeConfig.loopType,
      loopCount: nodeConfig.loopCount,
      count: nodeConfig.loopCount,
      loopMaxIter: nodeConfig.loopMaxIter,
      max_iter: nodeConfig.loopMaxIter,
      loopCondition: nodeConfig.loopCondition,
      condition: nodeConfig.loopCondition,
      loopArrayVar: nodeConfig.loopArrayVar,
      array_var: nodeConfig.loopArrayVar,
      loopItemVar: nodeConfig.loopItemVar,
      item_var: nodeConfig.loopItemVar,
      loopKeyVar: nodeConfig.loopKeyVar,
      key_var: nodeConfig.loopKeyVar,
      variables: nodeConfig.variables,
      variable: nodeConfig.variable,
      teamId: nodeConfig.teamId,
      agentId: nodeConfig.agentId,
      knowledgeBaseId: nodeConfig.knowledgeBaseId,
      subflowWorkflowId: nodeConfig.subflowWorkflowId,
      workflowId: nodeConfig.subflowWorkflowId,
      workflow_id: nodeConfig.subflowWorkflowId,
      input: parseJsonObject(nodeConfig.subflowInput) || undefined,
      subflowInput: parseJsonObject(nodeConfig.subflowInput) || undefined,
    }
    node.data = {
      ...node.data,
      label: nodeConfig.name,
      model: nodeConfig.model,
      systemPrompt: nodeConfig.systemPrompt,
      prompt: nodeConfig.prompt,
      llmStream: !!nodeConfig.llmStream,
      stream: !!nodeConfig.llmStream,
      ...(selectedNode.value.type === 'llm'
        ? (() => {
            const tempRaw = String(nodeConfig.llmTemperature ?? '').trim()
            const maxRaw = String(nodeConfig.llmMaxTokens ?? '').trim()
            const temperature = !tempRaw
              ? undefined
              : tempRaw.includes('{{')
                ? tempRaw
                : (Number(tempRaw) > 0 ? Number(tempRaw) : undefined)
            const maxTokens = !maxRaw
              ? undefined
              : maxRaw.includes('{{')
                ? maxRaw
                : (Number(maxRaw) > 0 ? Number(maxRaw) : undefined)
            return {
              llmTemperature: temperature,
              temperature,
              llmMaxTokens: maxTokens,
              maxTokens,
              max_tokens: maxTokens,
            }
          })()
        : {}),
      teamId: nodeConfig.teamId,
      agentId: nodeConfig.agentId,
      knowledgeBaseId: nodeConfig.knowledgeBaseId,
      bindCaption: resolveBindCaption(String(selectedNode.value.type || ''), nextBindData),
      description: nodeConfig.description,
      query: nodeConfig.query,
      ...(() => {
        const raw = String(nodeConfig.topK ?? '').trim()
        if (!raw) return { topK: 0 }
        const asNum = Number(raw)
        return { topK: raw.includes('{{') ? raw : (asNum > 0 ? asNum : 0) }
      })(),
      ...(() => {
        const raw = String(nodeConfig.minScore ?? '').trim()
        if (!raw) return { minScore: 0, min_score: 0 }
        const asNum = Number(raw)
        const minScore = raw.includes('{{') ? raw : (asNum > 0 ? asNum : 0)
        return { minScore, min_score: minScore }
      })(),
      searchMode: nodeConfig.searchMode || '',
      rerank: nodeConfig.rerankMode === 'inherit' ? undefined : nodeConfig.rerankMode === 'on',
      rerankProviderId: nodeConfig.rerankMode === 'on' ? nodeConfig.rerankProviderId : '',
      ...(() => {
        const raw = String(nodeConfig.hybridSemanticWeight ?? '').trim()
        if (!raw) return { hybridSemanticWeight: undefined }
        const asNum = Number(raw)
        const hybridSemanticWeight = raw.includes('{{')
          ? raw
          : (Number.isFinite(asNum) ? asNum : undefined)
        return { hybridSemanticWeight }
      })(),
      variable: nodeConfig.variable,
      waitReason: nodeConfig.waitReason,
      waitMessage: nodeConfig.waitMessage,
      ...(() => {
        const raw = String(nodeConfig.timeoutSec ?? '').trim()
        if (!raw) return { timeoutSec: 0, timeout_sec: 0 }
        const asNum = Number(raw)
        const timeoutSec = raw.includes('{{') ? raw : (asNum > 0 ? asNum : 0)
        return { timeoutSec, timeout_sec: timeoutSec }
      })(),
      ...(selectedNode.value.type === 'condition'
        ? {
            conditionField: nodeConfig.conditionField,
            conditionOperator: nodeConfig.conditionOperator || '==',
            conditionValue: nodeConfig.conditionValue,
            conditions: nodeConfig.conditionField
              ? [{
                  field: nodeConfig.conditionField,
                  operator: nodeConfig.conditionOperator || '==',
                  value: nodeConfig.conditionValue,
                  branch: 'true',
                }]
              : [],
          }
        : {}),
      ...(selectedNode.value.type === 'http'
        ? (() => {
            let body: any = nodeConfig.httpBody
            const trimmed = String(nodeConfig.httpBody || '').trim()
            if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
              try { body = JSON.parse(trimmed) } catch { /* keep string */ }
            }
            const headers = parseHttpHeadersJson(nodeConfig.httpHeaders)
            if (String(nodeConfig.httpHeaders || '').trim() && !headers) {
              toast.add({ title: t('editor.httpHeadersInvalid'), color: 'warning' })
            }
            const timeoutRaw = String(nodeConfig.httpTimeout ?? '').trim()
            const timeoutNum = Number(timeoutRaw)
            const timeout = timeoutRaw.includes('{{')
              ? timeoutRaw
              : (timeoutNum > 0 ? timeoutNum : 30)
            return {
              method: nodeConfig.httpMethod || 'GET',
              url: nodeConfig.httpUrl,
              body: trimmed ? body : undefined,
              headers: headers || undefined,
              httpHeaders: headers || undefined,
              timeout,
              httpTimeout: timeout,
              httpFailOnError: !!nodeConfig.httpFailOnError,
              failOnError: !!nodeConfig.httpFailOnError,
              fail_on_error: !!nodeConfig.httpFailOnError,
            }
          })()
        : {}),
      ...(selectedNode.value.type === 'delay'
        ? {
            ...(() => {
              const raw = String(nodeConfig.delayDuration ?? '').trim()
              const asNum = Number(raw)
              const duration = raw.includes('{{') ? raw : (asNum > 0 ? asNum : 1)
              return {
                delayDuration: duration,
                delayUnit: nodeConfig.delayUnit || 'seconds',
                duration,
                unit: nodeConfig.delayUnit || 'seconds',
              }
            })(),
          }
        : {}),
      ...(selectedNode.value.type === 'loop'
        ? {
            loopType: nodeConfig.loopType || 'times',
            ...(() => {
              const countRaw = String(nodeConfig.loopCount ?? '').trim()
              const countNum = Number(countRaw)
              const count = countRaw.includes('{{')
                ? countRaw
                : (countNum > 0 ? countNum : 1)
              const maxRaw = String(nodeConfig.loopMaxIter ?? '').trim()
              const maxNum = Number(maxRaw)
              const max_iter = maxRaw.includes('{{')
                ? maxRaw
                : (maxNum > 0 ? maxNum : 100)
              return {
                loopCount: count,
                loopMaxIter: max_iter,
                loopCondition: nodeConfig.loopCondition,
                loopArrayVar: nodeConfig.loopArrayVar,
                loopItemVar: nodeConfig.loopItemVar || 'item',
                loopKeyVar: nodeConfig.loopKeyVar,
                type: nodeConfig.loopType || 'times',
                count,
                max_iter,
                condition: nodeConfig.loopCondition,
                array_var: nodeConfig.loopArrayVar,
                item_var: nodeConfig.loopItemVar || 'item',
                key_var: nodeConfig.loopKeyVar,
              }
            })(),
          }
        : {}),
      ...(selectedNode.value.type === 'code'
        ? (() => {
            const raw = String(nodeConfig.codeTimeout ?? '').trim()
            const asNum = Number(raw)
            const timeout = raw.includes('{{') ? raw : (asNum > 0 ? asNum : 30)
            return {
              codeLanguage: nodeConfig.codeLanguage || 'expression',
              codeSource: nodeConfig.codeSource,
              language: nodeConfig.codeLanguage || 'expression',
              code: nodeConfig.codeSource,
              codeTimeout: timeout,
              timeout,
            }
          })()
        : {}),
      ...(selectedNode.value.type === 'subflow'
        ? (() => {
            const input = parseJsonObject(nodeConfig.subflowInput)
            if (String(nodeConfig.subflowInput || '').trim() && !input) {
              toast.add({ title: t('editor.subflowInputInvalid'), color: 'warning' })
            }
            return {
              subflowWorkflowId: nodeConfig.subflowWorkflowId,
              workflowId: nodeConfig.subflowWorkflowId,
              workflow_id: nodeConfig.subflowWorkflowId,
              input: input || undefined,
              subflowInput: input || undefined,
            }
          })()
        : {}),
      ...(selectedNode.value.type === 'start'
        ? {
            variables: nodeConfig.variables
              .map(v => ({
                name: String(v.name || '').trim(),
                type: v.type || 'string',
                required: !!v.required,
                default: v.default === '' ? undefined : (
                  v.type === 'number' ? Number(v.default) : (
                    v.type === 'boolean' ? (v.default === 'true' || v.default === '1') : v.default
                  )
                ),
                description: v.description || undefined,
              }))
              .filter(v => v.name),
          }
        : {}),
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

function findUnboundBindNodes(): { id: string, label: string, kind: string, selfSubflow?: boolean }[] {
  const out: { id: string, label: string, kind: string, selfSubflow?: boolean }[] = []
  const bindOpts = { currentWorkflowId: workflowId.value }
  for (const n of nodes.value) {
    const kind = String(n.type || '')
    if (!isWorkflowBindUnbound(kind, n.data, bindOpts)) continue
    out.push({
      id: n.id,
      label: String(n.data?.label || getNodeLabel(kind)),
      kind,
      selfSubflow: kind === 'subflow' && isSubflowSelfReference(n.data, workflowId.value),
    })
  }
  return out
}

const unboundBindCount = computed(() => findUnboundBindNodes().length)
const unreachableCount = computed(
  () => findUnreachableNodes(nodes.value, edges.value).length,
)
const startNodeCount = computed(() => findStartNodes(nodes.value).length)
const extraStartCount = computed(() => Math.max(0, startNodeCount.value - 1))
const endOutgoingCount = computed(
  () => findEndsWithOutgoing(nodes.value, edges.value).length,
)
const startIncomingCount = computed(
  () => findStartsWithIncoming(nodes.value, edges.value).length,
)
const conditionBranchCount = computed(
  () => findConditionsMissingBranches(nodes.value, edges.value).length,
)
const deadEndCount = computed(
  () => findDeadEndNodes(nodes.value, edges.value).length,
)

type GraphIssueChip = {
  key: string
  icon: string
  chipClass: string
  label: string
  tip: string
  count: number
  focus: () => void
}

const graphIssues = computed((): GraphIssueChip[] => {
  const items: GraphIssueChip[] = []
  if (unboundBindCount.value > 0) {
    items.push({
      key: 'unbound',
      icon: 'i-lucide-triangle-alert',
      chipClass: '',
      label: t('editor.unboundChip', { n: unboundBindCount.value }),
      tip: t('editor.unboundChipTip'),
      count: unboundBindCount.value,
      focus: focusFirstUnboundNode,
    })
  }
  if (unreachableCount.value > 0) {
    items.push({
      key: 'orphan',
      icon: 'i-lucide-unlink',
      chipClass: 'unbound-chip--orphan',
      label: t('editor.unreachableChip', { n: unreachableCount.value }),
      tip: t('editor.unreachableChipTip'),
      count: unreachableCount.value,
      focus: focusFirstUnreachableNode,
    })
  }
  if (extraStartCount.value > 0) {
    items.push({
      key: 'multi-start',
      icon: 'i-lucide-git-branch-plus',
      chipClass: 'unbound-chip--multi-start',
      label: t('editor.multiStartChip', { n: startNodeCount.value }),
      tip: t('editor.multiStartChipTip'),
      count: extraStartCount.value,
      focus: focusExtraStartNode,
    })
  }
  if (endOutgoingCount.value > 0) {
    items.push({
      key: 'end-out',
      icon: 'i-lucide-log-out',
      chipClass: 'unbound-chip--end-out',
      label: t('editor.endOutgoingChip', { n: endOutgoingCount.value }),
      tip: t('editor.endOutgoingChipTip'),
      count: endOutgoingCount.value,
      focus: focusEndWithOutgoing,
    })
  }
  if (startIncomingCount.value > 0) {
    items.push({
      key: 'start-in',
      icon: 'i-lucide-log-in',
      chipClass: 'unbound-chip--start-in',
      label: t('editor.startIncomingChip', { n: startIncomingCount.value }),
      tip: t('editor.startIncomingChipTip'),
      count: startIncomingCount.value,
      focus: focusStartWithIncoming,
    })
  }
  if (conditionBranchCount.value > 0) {
    items.push({
      key: 'branch',
      icon: 'i-lucide-git-fork',
      chipClass: 'unbound-chip--branch',
      label: t('editor.conditionBranchChip', { n: conditionBranchCount.value }),
      tip: t('editor.conditionBranchChipTip'),
      count: conditionBranchCount.value,
      focus: focusConditionMissingBranch,
    })
  }
  if (deadEndCount.value > 0) {
    items.push({
      key: 'dead-end',
      icon: 'i-lucide-circle-off',
      chipClass: 'unbound-chip--dead-end',
      label: t('editor.deadEndChip', { n: deadEndCount.value }),
      tip: t('editor.deadEndChipTip'),
      count: deadEndCount.value,
      focus: focusDeadEndNode,
    })
  }
  return items
})

const issueTotalCount = computed(() =>
  graphIssues.value.reduce((sum, item) => sum + item.count, 0),
)
/** 三种及以上问题收成摘要，避免顶栏挤爆 */
const collapseIssueChips = computed(() => graphIssues.value.length >= 3)
const issueMenuOpen = ref(false)
const issueSummaryRef = ref<HTMLElement | null>(null)

function closeIssueMenu() {
  issueMenuOpen.value = false
}

function onIssueMenuPick(issue: GraphIssueChip) {
  closeIssueMenu()
  issue.focus()
}

function onIssueMenuPointerDown(ev: PointerEvent) {
  if (!issueMenuOpen.value) return
  const root = issueSummaryRef.value
  const target = ev.target as Node | null
  if (root && target && root.contains(target)) return
  closeIssueMenu()
}

function onIssueMenuKeydown(ev: KeyboardEvent) {
  if (ev.key === 'Escape' && issueMenuOpen.value) {
    closeIssueMenu()
  }
}

watch(collapseIssueChips, (collapsed) => {
  if (!collapsed) closeIssueMenu()
})

watch(issueMenuOpen, (open) => {
  if (open) {
    // 下一拍再挂，避免打开按钮的同一次点击立刻关掉
    nextTick(() => {
      document.addEventListener('pointerdown', onIssueMenuPointerDown, true)
      document.addEventListener('keydown', onIssueMenuKeydown, true)
    })
  }
  else {
    document.removeEventListener('pointerdown', onIssueMenuPointerDown, true)
    document.removeEventListener('keydown', onIssueMenuKeydown, true)
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onIssueMenuPointerDown, true)
  document.removeEventListener('keydown', onIssueMenuKeydown, true)
  window.removeEventListener('beforeunload', onBrowserBeforeUnload)
})

/** 顶栏芯片：打开第一个未绑定节点的配置侧栏 */
function focusFirstUnboundNode() {
  const unbound = findUnboundBindNodes()
  if (!unbound.length) return
  const first = unbound[0]!
  const node = nodes.value.find(n => n.id === first.id)
  if (node) {
    selectedNode.value = node
    configDrawer.value = true
    handleNodeClick({ node })
  }
}

/** 顶栏芯片：打开第一个从 start 不可达的节点 */
function focusFirstUnreachableNode() {
  const orphan = findUnreachableNodes(nodes.value, edges.value)
  if (!orphan.length) return
  const first = orphan[0]!
  const node = nodes.value.find(n => n.id === first.id)
  if (node) {
    selectedNode.value = node
    configDrawer.value = true
    handleNodeClick({ node })
  }
}

/** 顶栏芯片：打开第二个及以后的开始节点 */
function focusExtraStartNode() {
  const starts = findStartNodes(nodes.value)
  if (starts.length < 2) return
  const extra = starts[1]!
  const node = nodes.value.find(n => n.id === extra.id)
  if (node) {
    selectedNode.value = node
    configDrawer.value = true
    handleNodeClick({ node })
  }
}

/** 顶栏芯片：打开仍有出边的结束/输出节点 */
function focusEndWithOutgoing() {
  const bad = findEndsWithOutgoing(nodes.value, edges.value)
  if (!bad.length) return
  const first = bad[0]!
  const node = nodes.value.find(n => n.id === first.id)
  if (node) {
    selectedNode.value = node
    configDrawer.value = true
    handleNodeClick({ node })
  }
}

/** 顶栏芯片：打开仍有入边的开始/输入节点 */
function focusStartWithIncoming() {
  const bad = findStartsWithIncoming(nodes.value, edges.value)
  if (!bad.length) return
  const first = bad[0]!
  const node = nodes.value.find(n => n.id === first.id)
  if (node) {
    selectedNode.value = node
    configDrawer.value = true
    handleNodeClick({ node })
  }
}

/** 顶栏芯片：打开缺真/假出边的条件节点 */
function focusConditionMissingBranch() {
  const bad = findConditionsMissingBranches(nodes.value, edges.value)
  if (!bad.length) return
  const first = bad[0]!
  const node = nodes.value.find(n => n.id === first.id)
  if (node) {
    selectedNode.value = node
    configDrawer.value = true
    handleNodeClick({ node })
  }
}

/** 顶栏芯片：打开没有出边的非结束节点 */
function focusDeadEndNode() {
  const bad = findDeadEndNodes(nodes.value, edges.value)
  if (!bad.length) return
  const first = bad[0]!
  const node = nodes.value.find(n => n.id === first.id)
  if (node) {
    selectedNode.value = node
    configDrawer.value = true
    handleNodeClick({ node })
  }
}

/** 未配置必填绑定时提示并打开首个节点；通过返回 true */
function ensureBindConfigured(): boolean {
  const unbound = findUnboundBindNodes()
  if (!unbound.length) return true
  const first = unbound[0]!
  const kindLabel = t(`editor.bindKind.${first.kind}` as any)
  toast.add({
    title: first.selfSubflow
      ? t('editor.subflowSelfRequired', { name: first.label })
      : t('editor.bindRequired', { name: first.label, kind: kindLabel }),
    description: unbound.length > 1
      ? t('editor.bindRequiredMore', { n: unbound.length - 1 })
      : undefined,
    color: 'warning',
  })
  focusFirstUnboundNode()
  return false
}

/** 至少有一个开始、一个结束节点才允许保存/试跑 */
function ensureHasTerminalNodes(): boolean {
  const kinds = new Set(nodes.value.map(n => String(n.type || '')))
  if (!kinds.has('start')) {
    toast.add({ title: t('editor.needStartNode'), color: 'warning' })
    return false
  }
  if (!kinds.has('end')) {
    toast.add({ title: t('editor.needEndNode'), color: 'warning' })
    return false
  }
  return true
}

/** 只能有一个开始节点（可达性 BFS 也只认第一个） */
function ensureSingleStartNode(): boolean {
  const starts = findStartNodes(nodes.value)
  if (starts.length <= 1) return true
  toast.add({
    title: t('editor.multiStartNode', { n: starts.length }),
    color: 'warning',
  })
  focusExtraStartNode()
  return false
}

/** 结束/输出节点不得再有出边（旧图/导入可能残留） */
function ensureNoEndOutgoing(): boolean {
  const bad = findEndsWithOutgoing(nodes.value, edges.value)
  if (!bad.length) return true
  const first = bad[0]!
  toast.add({
    title: t('editor.endOutgoingNode', { name: first.label }),
    description: bad.length > 1
      ? t('editor.endOutgoingMore', { n: bad.length - 1 })
      : undefined,
    color: 'warning',
  })
  focusEndWithOutgoing()
  return false
}

/** 开始/输入节点不得再有入边（旧图/导入可能残留） */
function ensureNoStartIncoming(): boolean {
  const bad = findStartsWithIncoming(nodes.value, edges.value)
  if (!bad.length) return true
  const first = bad[0]!
  toast.add({
    title: t('editor.startIncomingNode', { name: first.label }),
    description: bad.length > 1
      ? t('editor.startIncomingMore', { n: bad.length - 1 })
      : undefined,
    color: 'warning',
  })
  focusStartWithIncoming()
  return false
}

/** 条件节点须同时连上真/假两条出边 */
function ensureConditionBranches(): boolean {
  const bad = findConditionsMissingBranches(nodes.value, edges.value)
  if (!bad.length) return true
  const first = bad[0]!
  toast.add({
    title: t('editor.conditionBranchNode', { name: first.label }),
    description: bad.length > 1
      ? t('editor.conditionBranchMore', { n: bad.length - 1 })
      : undefined,
    color: 'warning',
  })
  focusConditionMissingBranch()
  return false
}

/** 可达的非结束节点须有出边，否则流程会卡死 */
function ensureNoDeadEnds(): boolean {
  const bad = findDeadEndNodes(nodes.value, edges.value)
  if (!bad.length) return true
  const first = bad[0]!
  toast.add({
    title: t('editor.deadEndNode', { name: first.label }),
    description: bad.length > 1
      ? t('editor.deadEndMore', { n: bad.length - 1 })
      : undefined,
    color: 'warning',
  })
  focusDeadEndNode()
  return false
}

/** 所有非 start 节点须从 start 可达 */
function ensureReachableFromStart(): boolean {
  const orphan = findUnreachableNodes(nodes.value, edges.value)
  if (!orphan.length) return true
  const first = orphan[0]!
  toast.add({
    title: t('editor.unreachableNode', { name: first.label }),
    description: orphan.length > 1
      ? t('editor.unreachableMore', { n: orphan.length - 1 })
      : undefined,
    color: 'warning',
  })
  focusFirstUnreachableNode()
  return false
}

const handleSave = async () => {
  if (isSmokeTest.value) {
    toast.add({ title: t('editor.noSaveOnTest'), color: 'info' })
    return
  }
  if (!ensureBindConfigured()) return
  if (!ensureHasTerminalNodes()) return
  if (!ensureSingleStartNode()) return
  if (!ensureNoEndOutgoing()) return
  if (!ensureNoStartIncoming()) return
  if (!ensureConditionBranches()) return
  if (!ensureNoDeadEnds()) return
  if (!ensureReachableFromStart()) return
  saving.value = true
  try {
    const definition: WorkflowDefinition = {
      nodes: nodes.value.map(n => ({
        id: n.id,
        type: n.type,
        name: n.data?.label,
        position: n.position,
        data: {
          label: n.data?.label,
          model: n.data?.model,
          systemPrompt: n.data?.systemPrompt,
          prompt: n.data?.prompt,
          teamId: n.data?.teamId,
          agentId: n.data?.agentId,
          knowledgeBaseId: n.data?.knowledgeBaseId,
          subflowWorkflowId: n.data?.subflowWorkflowId,
          workflowId: n.data?.subflowWorkflowId || n.data?.workflowId,
          description: n.data?.description,
          query: n.data?.query,
          topK: n.data?.topK,
          minScore: n.data?.minScore,
          searchMode: n.data?.searchMode,
          rerank: n.data?.rerank,
          rerankProviderId: n.data?.rerankProviderId,
          hybridSemanticWeight: n.data?.hybridSemanticWeight,
          variable: n.data?.variable,
          waitReason: n.data?.waitReason,
          waitMessage: n.data?.waitMessage,
          timeoutSec: n.data?.timeoutSec || 0,
          variables: n.data?.variables,
        },
        config: n.type === 'start'
          ? {
              variables: normalizeStartVars(n.data?.variables),
            }
          : n.type === 'wait'
          ? (() => {
              const raw = String(n.data?.timeoutSec ?? n.data?.timeout_sec ?? '').trim()
              let timeout_sec: string | number | undefined
              if (raw) {
                if (raw.includes('{{')) timeout_sec = raw
                else {
                  const nSec = Number(raw)
                  if (nSec > 0) timeout_sec = nSec
                }
              }
              return {
                reason: n.data?.waitReason || 'approval',
                message: n.data?.waitMessage || '',
                timeout_sec,
              }
            })()
          : n.type === 'team'
            ? {
                team_id: n.data?.teamId || '',
                task: n.data?.prompt || '',
                prompt: n.data?.prompt || '',
              }
            : n.type === 'agent'
              ? {
                  agent_id: n.data?.agentId || '',
                  prompt: n.data?.prompt || '',
                }
              : n.type === 'search'
                ? {
                    knowledge_base_id: n.data?.knowledgeBaseId || '',
                    query: n.data?.query || '',
                    ...(() => {
                      const raw = String(n.data?.topK ?? n.data?.top_k ?? '').trim()
                      if (!raw) return {}
                      if (raw.includes('{{')) return { top_k: raw }
                      const nTop = Number(raw)
                      return nTop > 0 ? { top_k: nTop } : {}
                    })(),
                    ...(() => {
                      const raw = String(n.data?.minScore ?? n.data?.min_score ?? '').trim()
                      if (!raw) return {}
                      if (raw.includes('{{')) return { min_score: raw }
                      const nScore = Number(raw)
                      return nScore > 0 ? { min_score: nScore } : {}
                    })(),
                    ...(n.data?.searchMode ? { search_mode: n.data.searchMode } : {}),
                    ...(n.data?.rerank === true || n.data?.rerank === false ? { rerank: n.data.rerank } : {}),
                    ...(n.data?.rerankProviderId ? { rerank_provider_id: n.data.rerankProviderId } : {}),
                    ...(() => {
                      const raw = String(n.data?.hybridSemanticWeight ?? n.data?.hybrid_semantic_weight ?? '').trim()
                      if (!raw) return {}
                      if (raw.includes('{{')) return { hybrid_semantic_weight: raw }
                      const nW = Number(raw)
                      return Number.isFinite(nW) ? { hybrid_semantic_weight: nW } : {}
                    })(),
                  }
                : n.type === 'subflow'
                  ? {
                      workflow_id: n.data?.subflowWorkflowId || n.data?.workflowId || '',
                    }
                  : undefined,
      })),
      edges: edges.value.map(e => toDefinitionEdge(e)),
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
    markEditorClean()
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
  if (!ensureBindConfigured()) return
  if (!ensureHasTerminalNodes()) return
  if (!ensureSingleStartNode()) return
  if (!ensureNoEndOutgoing()) return
  if (!ensureNoStartIncoming()) return
  if (!ensureConditionBranches()) return
  if (!ensureNoDeadEnds()) return
  if (!ensureReachableFromStart()) return

  executing.value = true
  try {
    const res = await execute(workflowId.value)
    if (res.error) {
      toast.add({ title: res.error, color: 'error' })
      return
    }
    toast.add({ title: t('flows.started', { id: res.executionId }), color: 'success' })
    if (res.executionId) {
      currentExecution.value = { id: res.executionId, status: res.status || 'running' }
      startExecutionPoll(res.executionId)
    }
  } catch {
    toast.add({ title: t('editor.runFail'), color: 'error' })
  } finally {
    executing.value = false
  }
}

const startExecutionPoll = (executionId: string) => {
  stopPolling()
  isPolling.value = true
  debugPollInterval.value = window.setInterval(async () => {
    const execRes = await getExecution(workflowId.value, executionId)
    if (!execRes.data) return
    currentExecution.value = execRes.data
    applyNodeRunHighlight(execRes.data)
    const st = execRes.data.status
    if (st === 'waiting') {
      stopPolling()
      isPolling.value = false
      return
    }
    if (st === 'completed' || st === 'succeeded' || st === 'failed' || st === 'cancelled') {
      stopPolling()
      isPolling.value = false
      isDebugging.value = false
      loadExecutionHistory()
      if (st === 'completed' || st === 'succeeded') {
        toast.add({ title: t('editor.debugDone'), color: 'success' })
      } else if (st === 'failed') {
        toast.add({ title: t('editor.debugFail', { error: execRes.data.error || '' }), color: 'error' })
      }
    }
  }, 1000)
}

const handleResume = async () => {
  if (!currentExecution.value?.id) return
  resuming.value = true
  try {
    const res = await resumeExecution(workflowId.value, currentExecution.value.id)
    if (res.error) {
      toast.add({ title: res.error || t('editor.resumeFail'), color: 'error' })
      return
    }
    toast.add({ title: t('editor.resumed'), color: 'success' })
    currentExecution.value = { ...currentExecution.value, status: 'running', wait_reason: '', wait_until: null }
    startExecutionPoll(currentExecution.value.id)
  } finally {
    resuming.value = false
  }
}

const formatWaitUntil = (v: string) => {
  try {
    return new Date(v).toLocaleString()
  } catch {
    return v
  }
}

const handleApprove = async () => {
  if (!currentExecution.value?.id) return
  approving.value = true
  try {
    const res = await approveExecution(workflowId.value, currentExecution.value.id)
    if (res.error) {
      toast.add({ title: res.error || t('editor.approveFail'), color: 'error' })
      return
    }
    toast.add({ title: t('editor.approved'), color: 'success' })
    currentExecution.value = { ...currentExecution.value, status: 'running', wait_reason: '', wait_until: null }
    startExecutionPoll(currentExecution.value.id)
  } finally {
    approving.value = false
  }
}

const handleReject = async () => {
  if (!currentExecution.value?.id) return
  rejecting.value = true
  try {
    const res = await rejectExecution(workflowId.value, currentExecution.value.id)
    if (res.error) {
      toast.add({ title: res.error || t('editor.rejectFail'), color: 'error' })
      return
    }
    stopPolling()
    currentExecution.value = { ...currentExecution.value, status: 'failed', wait_reason: '', wait_until: null }
    toast.add({ title: t('editor.rejected'), color: 'warning' })
  } finally {
    rejecting.value = false
  }
}

const handleBack = () => {
  askLeaveIfDirty(() => {
    navigateTo('/workflows')
  })
}

onBeforeRouteLeave((_to, _from, next) => {
  if (!canvasDirty.value) {
    next()
    return
  }
  leaveGuardNext = next
  leaveDirtyOpen.value = true
})

function onBrowserBeforeUnload(ev: BeforeUnloadEvent) {
  if (!canvasDirty.value) return
  ev.preventDefault()
  ev.returnValue = ''
}

const ACTIVE_EXEC_STATUSES = ['running', 'waiting', 'debugging', 'pending'] as const

const hasActiveExecution = computed(() => {
  const st = currentExecution.value?.status
  return !!st && (ACTIVE_EXEC_STATUSES as readonly string[]).includes(st)
})

/** 有执行且侧栏关着：只走顶栏一条，不另开右下角悬浮 */
const showExecBar = computed(() => !!currentExecution.value && !showDebugPanel.value)

function toggleDebugPanel() {
  showDebugPanel.value = !showDebugPanel.value
  if (showDebugPanel.value) {
    loadExecutionHistory()
  }
}

function openDebugPanel() {
  showDebugPanel.value = true
  loadExecutionHistory()
}

const prepareDebugInput = (): Record<string, any> | null => {
  syncDebugInputFromForm()
  let input: Record<string, any> = {}
  try {
    input = JSON.parse(debugInput.value || '{}')
  } catch {
    toast.add({ title: t('editor.badJson'), color: 'error' })
    return null
  }
  for (const v of startVariables.value) {
    const cur = input[v.name]
    const empty = cur === undefined || cur === null || cur === ''
    if (empty && v.default !== '') {
      input[v.name] = v.type === 'number' ? Number(v.default) : (
        v.type === 'boolean' ? (v.default === 'true' || v.default === '1') : v.default
      )
    }
    if (v.required && (input[v.name] === undefined || input[v.name] === null || input[v.name] === '')) {
      toast.add({ title: t('editor.startVarMissing', { name: v.name }), color: 'warning' })
      return null
    }
  }
  return input
}

const startDebug = async (startFromNode?: string) => {
  if (!workflowId.value || isSmokeTest.value) return
  if (!currentWorkflow.value) {
    toast.add({ title: t('editor.saveFirst'), color: 'warning' })
    return
  }
  if (!ensureBindConfigured()) return
  if (!ensureHasTerminalNodes()) return
  if (!ensureSingleStartNode()) return
  if (!ensureNoEndOutgoing()) return
  if (!ensureNoStartIncoming()) return
  if (!ensureConditionBranches()) return
  if (!ensureNoDeadEnds()) return
  if (!ensureReachableFromStart()) return

  isDebugging.value = true
  executionLogs.value = []
  currentExecution.value = null
  selectedTimelineKey.value = null
  showDebugPanel.value = true
  {
    const cleared = clearCanvasRunDecorations(nodes.value, edges.value)
    nodes.value = cleared.nodes
    edges.value = cleared.edges
  }

  try {
    const input = prepareDebugInput()
    if (!input) {
      isDebugging.value = false
      return
    }

    let seedExecutionId: string | undefined
    if (startFromNode && seedUpstreamOnDebugFrom.value) {
      seedExecutionId = resolveSeedExecutionId()
    }
    const res = await debug(workflowId.value, input, undefined, startFromNode, seedExecutionId)
    if (res.error) {
      toast.add({ title: res.error, color: 'error' })
      isDebugging.value = false
      return
    }

    toast.add({
      title: startFromNode
        ? (seedExecutionId
            ? t('editor.debugFromNodeSeeded', { node: nodeDisplayName(startFromNode) || startFromNode })
            : t('editor.debugFromNodeStarted', { node: nodeDisplayName(startFromNode) || startFromNode }))
        : t('editor.debugStarted', { id: res.executionId }),
      color: 'success',
    })
    currentExecution.value = { id: res.executionId, status: 'debugging' }

    startExecutionPoll(res.executionId!)
    loadExecutionHistory()
  } catch {
    toast.add({ title: t('editor.debugStartFail'), color: 'error' })
    isDebugging.value = false
  }
}

/** 选种子执行：当前详情带输出 → 否则历史列表最近一条 */
function resolveSeedExecutionId(): string | undefined {
  const cur = currentExecution.value
  if (cur?.id && Array.isArray(cur.node_runs) && cur.node_runs.some((r: any) => r?.output && Object.keys(r.output || {}).length)) {
    return cur.id
  }
  const hist = (executionLogs.value || []).find((item: any) => item?.id)
  return hist?.id || cur?.id || undefined
}

const debugFromSelectedNode = async () => {
  if (!selectedNode.value?.id) return
  saveNodeConfig()
  configDrawer.value = false
  showDebugPanel.value = true
  await startDebug(selectedNode.value.id)
}

const stopPolling = () => {
  if (debugPollInterval.value) {
    clearInterval(debugPollInterval.value)
    debugPollInterval.value = null
  }
  isPolling.value = false
}

/** 按 node_runs / current_node 给画布节点上色；running 时刷 streamProgress（阶段十八 W1 + 流式 UI） */
const applyNodeRunHighlight = (exec: {
  current_node?: string
  node_runs?: {
    node_id: string
    status: string
    node_type?: string
    detail?: { progress?: string }
  }[]
}) => {
  const byId = new Map<string, string>()
  const progressById = new Map<string, string>()
  for (const r of exec.node_runs || []) {
    if (r.node_type === 'human_action') continue
    byId.set(r.node_id, r.status)
    if (r.status === 'running' && r.detail?.progress) {
      progressById.set(r.node_id, String(r.detail.progress))
    }
  }
  if (exec.current_node && !byId.has(exec.current_node)) {
    byId.set(exec.current_node, 'running')
  }
  nodes.value = nodes.value.map((n) => {
    const st = byId.get(n.id)
    const base = (n.class || '').split(' ').filter((c: string) => !c.startsWith('run-'))
    if (st === 'running') base.push('run-running')
    else if (st === 'succeeded' || st === 'completed') base.push('run-succeeded')
    else if (st === 'failed') base.push('run-failed')
    else if (st === 'skipped') base.push('run-skipped')
    else if (st === 'waiting') base.push('run-waiting')
    const streamProgress = progressById.get(n.id) || undefined
    return {
      ...n,
      class: base.filter(Boolean).join(' '),
      data: { ...(n.data || {}), streamProgress },
    }
  })
  edges.value = decorateEdgesForSkippedTargets(edges.value, byId)
}

const cancellingExecId = ref<string | null>(null)

const clearCanvasRunHighlight = () => {
  const cleared = clearCanvasRunDecorations(nodes.value, edges.value)
  nodes.value = cleared.nodes
  edges.value = cleared.edges
  selectedTimelineKey.value = null
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
  if (currentExecution.value) {
    currentExecution.value = { ...currentExecution.value, status: 'cancelled' }
  }
  clearCanvasRunHighlight()
  toast.add({ title: t('editor.runCancelled'), color: 'success' })
  await loadExecutionHistory()
}

const cancellingAllStuck = ref(false)

/** 更早试跑里取消卡住的运行中/等待中执行 */
const cancelHistoryExecution = async (executionId: string) => {
  if (!executionId || !workflowId.value || isSmokeTest.value) return
  cancellingExecId.value = executionId
  try {
    const res = await cancelExecution(workflowId.value, executionId)
    if (res.error) {
      toast.add({ title: res.error, color: 'error' })
      return
    }
    executionLogs.value = (executionLogs.value || []).map((item: any) =>
      item.id === executionId ? { ...item, status: 'cancelled' } : item,
    )
    if (currentExecution.value?.id === executionId) {
      stopPolling()
      isDebugging.value = false
      currentExecution.value = { ...currentExecution.value, status: 'cancelled' }
      clearCanvasRunHighlight()
    }
    toast.add({ title: t('editor.runCancelled'), color: 'success' })
    await loadExecutionHistory()
  } finally {
    cancellingExecId.value = null
  }
}

/** 一键取消全部可能卡住的活跃执行 */
const cancelAllStuckExecutions = async () => {
  const ids = staleActiveExecIds.value
  if (!ids.length || !workflowId.value || isSmokeTest.value) return
  cancellingAllStuck.value = true
  let ok = 0
  let fail = 0
  try {
    for (const id of ids) {
      const res = await cancelExecution(workflowId.value, id)
      if (res.error) {
        fail++
        continue
      }
      ok++
      executionLogs.value = (executionLogs.value || []).map((item: any) =>
        item.id === id ? { ...item, status: 'cancelled' } : item,
      )
      if (currentExecution.value?.id === id) {
        stopPolling()
        isDebugging.value = false
        currentExecution.value = { ...currentExecution.value, status: 'cancelled' }
        clearCanvasRunHighlight()
      }
    }
    if (ok && !fail) {
      toast.add({ title: t('editor.cancelAllStuckOk', { n: ok }), color: 'success' })
    } else if (ok && fail) {
      toast.add({ title: t('editor.cancelAllStuckPartial', { ok, fail }), color: 'warning' })
    } else {
      toast.add({ title: t('editor.cancelAllStuckFail'), color: 'error' })
    }
    await loadExecutionHistory()
  } finally {
    cancellingAllStuck.value = false
  }
}

const loadExecutionHistory = async () => {
  if (!workflowId.value || isSmokeTest.value) return
  const res = await listExecutions(workflowId.value)
  if (res.data) {
    executionLogs.value = res.data
  }
}

const EXEC_STATUS_KEYS: Record<string, string> = {
  pending: 'editor.execStatus.pending',
  running: 'editor.execStatus.running',
  debugging: 'editor.execStatus.debugging',
  waiting: 'editor.execStatus.waiting',
  completed: 'editor.execStatus.succeeded',
  succeeded: 'editor.execStatus.succeeded',
  approved: 'editor.execStatus.approved',
  rejected: 'editor.execStatus.rejected',
  skipped: 'editor.execStatus.skipped',
  failed: 'editor.execStatus.failed',
  cancelled: 'editor.execStatus.cancelled',
}

function execStatusLabel(status?: string) {
  if (!status) return ''
  const key = EXEC_STATUS_KEYS[status]
  return key ? t(key) : status
}

function shortExecId(id?: string) {
  if (!id) return ''
  return id.length > 8 ? id.slice(0, 8) : id
}

function truncateText(text: string, max = 80) {
  const s = (text || '').replace(/\s+/g, ' ').trim()
  if (!s) return ''
  return s.length > max ? `${s.slice(0, max)}…` : s
}

function nodeDisplayName(nodeId?: string) {
  if (!nodeId) return ''
  const n = nodes.value.find((x: any) => x.id === nodeId)
  return (n?.data?.label || n?.label || n?.name || nodeId) as string
}

function formatExecTime(item: { created_at?: string; started_at?: string | null; completed_at?: string | null }) {
  const raw = item.completed_at || item.started_at || item.created_at
  if (!raw) return ''
  try {
    return new Date(raw).toLocaleString()
  } catch {
    return String(raw)
  }
}

function inputPreviewFrom(item: { input?: Record<string, any> | string | null }) {
  const input = item.input
  if (!input) return ''
  if (typeof input === 'string') return truncateText(input, 72)
  const preferred = input.query ?? input.input ?? input.message ?? input.prompt ?? input.text
  if (preferred != null && preferred !== '') return truncateText(String(preferred), 72)
  try {
    return truncateText(JSON.stringify(input), 72)
  } catch {
    return ''
  }
}

/** 列表主文案：优先「这次试跑输入了什么」，方便区分多次点击 */
function historyPrimary(item: {
  status?: string
  error?: string
  output?: string
  current_node?: string
  input?: Record<string, any> | string | null
}) {
  const preview = inputPreviewFrom(item)
  if (preview) return t('editor.debugInputPreview', { text: preview })
  if (item.output) return truncateText(String(item.output), 90)
  if (item.current_node) {
    return t('editor.debugAtNode', { name: nodeDisplayName(item.current_node) })
  }
  return t('editor.debugHistoryNoDetail')
}

function historySecondary(item: {
  status?: string
  error?: string
  current_node?: string
  started_at?: string | null
  created_at?: string
}) {
  const parts: string[] = []
  if (item.status === 'cancelled') {
    parts.push(t('editor.debugHistoryCancelled'))
  } else if (item.error && item.status === 'failed') {
    parts.push(truncateText(item.error, 72))
  } else if (item.current_node) {
    parts.push(t('editor.debugAtNode', { name: nodeDisplayName(item.current_node) }))
  }
  if (isStaleActiveExecution(item)) {
    parts.push(t('editor.debugHistoryStale'))
  }
  return parts.filter(Boolean).join(' · ')
}

/** 列表用：#1 = 最新一次 */
const historyItems = computed(() => {
  const list = (executionLogs.value || []).slice(0, 12)
  return list.map((item, i) => ({
    item,
    index: i + 1,
    primary: historyPrimary(item),
    secondary: historySecondary(item),
    cancellable: isActiveExecutionStatus(item.status),
    stale: isStaleActiveExecution(item),
  }))
})

/** 更早试跑：排除当前正在看的那一次 */
const olderHistoryItems = computed(() => {
  const curId = currentExecution.value?.id
  return historyItems.value.filter(row => row.item.id !== curId)
})

const staleActiveExecIds = computed(() =>
  listStaleActiveExecutionIds(executionLogs.value || []),
)

const execInputPreview = computed(() => inputPreviewFrom(currentExecution.value || {}))

/** 这一次试跑总耗时（有开始+结束时间才显示） */
const execRunDurationLabel = computed(() => {
  const ex = currentExecution.value as {
    started_at?: string | null
    completed_at?: string | null
  } | null
  if (!ex?.started_at || !ex?.completed_at) return ''
  const start = Date.parse(ex.started_at)
  const end = Date.parse(ex.completed_at)
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return ''
  const ms = end - start
  if (ms < 1000) return t('editor.debugRunDurationMs', { ms })
  if (ms < 60_000) return t('editor.debugRunDurationSec', { sec: (ms / 1000).toFixed(1) })
  const sec = Math.round(ms / 1000)
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return t('editor.debugRunDurationMin', { m, s })
})

/** 调试侧栏：当前 running 节点的流式进度文案 */
const liveStreamProgress = computed(() => {
  const ex = currentExecution.value
  if (!ex || !['running', 'debugging', 'pending'].includes(ex.status || '')) return ''
  const runs = (ex.node_runs || []) as { status?: string; detail?: { progress?: string } }[]
  for (const r of runs) {
    if (r.status === 'running' && r.detail?.progress) return String(r.detail.progress)
  }
  return ''
})

type TimelineStep = {
  key: string
  nodeId: string
  nodeType: string
  label: string
  status: string
  note: string
  durationMs?: number | null
  error?: string
  outputPreview?: string
  /** 剪贴板用全文（未截断） */
  outputCopy?: string
}

const selectedTimelineKey = ref<string | null>(null)

/** 这一次试跑的步骤时间线（审批挂在 wait 步骤说明里） */
const execTimeline = computed(() => {
  const ex = currentExecution.value
  if (!ex) return [] as TimelineStep[]
  const runs = (ex.node_runs || []) as {
    id?: string
    node_id: string
    node_type?: string
    status?: string
    error?: string
    attempt?: number
    duration_ms?: number
    output?: unknown
    detail?: {
      human_action?: boolean
      action?: string
      actor_user_id?: string
      wait_node_id?: string
      wait_reason?: string
      at?: string
      note?: string
      progress?: string
    }
    created_at?: string
  }[]
  if (!runs.length) {
    if (ex.current_node) {
      return [{
        key: `cur-${ex.current_node}`,
        nodeId: ex.current_node,
        nodeType: 'default',
        label: nodeDisplayName(ex.current_node),
        status: ex.status === 'waiting' ? 'waiting' : (ex.status || 'running'),
        note: ex.status === 'waiting' ? t('editor.debugTimelineWaiting') : '',
        durationMs: null,
        error: '',
        outputPreview: '',
        outputCopy: '',
      }]
    }
    return []
  }
  return runs.map((r, i) => {
    const nodeType = r.node_type || 'default'
    if (nodeType === 'human_action' || r.detail?.human_action) {
      const action = r.detail?.action || (r.status === 'rejected' ? 'reject' : 'approve')
      const when = r.detail?.at || r.created_at || ''
      const actor = r.detail?.actor_user_id
        ? truncateText(String(r.detail.actor_user_id), 12)
        : '—'
      const waitLabel = nodeDisplayName(r.detail?.wait_node_id || r.node_id) || r.node_id
      const noteExtra = r.detail?.note ? ` · ${truncateText(r.detail.note, 40)}` : ''
      return {
        key: r.id || `human-${r.node_id}-${r.attempt || i}`,
        nodeId: r.detail?.wait_node_id || r.node_id,
        nodeType: 'human_action',
        label: action === 'reject'
          ? t('editor.debugTimelineRejectAction', { node: waitLabel })
          : t('editor.debugTimelineApproveAction', { node: waitLabel }),
        status: r.status || (action === 'reject' ? 'rejected' : 'approved'),
        note: t('editor.debugTimelineAudit', { actor, when: when ? formatWaitUntil(when) : '—' }) + noteExtra,
        durationMs: r.duration_ms ?? null,
        error: r.error ? truncateText(r.error, 240) : '',
        outputPreview: formatNodeRunOutputPreview(r.output),
        outputCopy: formatExecutionOutputForCopy(r.output),
      }
    }
    const label = nodeDisplayName(r.node_id) || r.node_id
    let note = ''
    if (r.error) note = truncateText(r.error, 80)
    else if (r.status === 'running' && r.detail?.progress) {
      note = truncateText(String(r.detail.progress), 120)
    } else if (nodeType === 'wait' || r.status === 'waiting') {
      if (ex.status === 'waiting' && ex.current_node === r.node_id) {
        note = t('editor.debugTimelineWaiting')
      } else if (r.status === 'succeeded' || r.status === 'completed') {
        note = t('editor.debugTimelineApproved')
      }
    } else if (r.status === 'skipped') {
      if (isUntakenConditionSkip(r.output)) {
        note = t('editor.debugTimelineSkippedBranch')
      } else if (isSeededDebugSkip(r.detail, r.output)) {
        note = t('editor.debugTimelineSkippedSeeded')
      } else {
        note = t('editor.debugTimelineSkipped')
      }
    } else if (r.duration_ms != null && r.duration_ms > 0) {
      note = t('editor.debugTimelineMs', { ms: r.duration_ms })
    }
    return {
      key: r.id || `${r.node_id}-${r.attempt || i}`,
      nodeId: r.node_id,
      nodeType,
      label,
      status: r.status || 'pending',
      note,
      durationMs: r.duration_ms ?? null,
      error: r.error ? truncateText(r.error, 240) : '',
      outputPreview: formatNodeRunOutputPreview(r.output),
      outputCopy: formatExecutionOutputForCopy(r.output),
    }
  })
})

const selectedTimelineStep = computed(() =>
  execTimeline.value.find(s => s.key === selectedTimelineKey.value) || null,
)

watch(() => currentExecution.value?.id, () => {
  selectedTimelineKey.value = null
})

async function copyDebugText(text: string) {
  const value = String(text || '').trim()
  if (!value) {
    toast.add({ title: t('editor.debugCopyEmpty'), color: 'warning' })
    return
  }
  try {
    await navigator.clipboard.writeText(value)
    toast.add({ title: t('common.copied'), color: 'success' })
  } catch {
    toast.add({ title: t('editor.debugCopyFail'), color: 'error' })
  }
}

function selectTimelineStep(step: TimelineStep) {
  selectedTimelineKey.value = selectedTimelineKey.value === step.key ? null : step.key
  if (!selectedTimelineKey.value || !step.nodeId || step.nodeType === 'human_action') return
  const n = nodes.value.find((x: any) => x.id === step.nodeId)
  if (!n) return
  syncingTimelineToCanvas = true
  try {
    selectedNode.value = n
    nodes.value = nodes.value.map((x: any) => ({
      ...x,
      selected: x.id === step.nodeId,
    }))
  } finally {
    syncingTimelineToCanvas = false
  }
}

/** 点历史记录：拉详情、高亮画布；若仍在跑则继续轮询 */
const selectHistoryExecution = async (executionId: string) => {
  if (!workflowId.value || !executionId) return
  const res = await getExecution(workflowId.value, executionId)
  if (res.error || !res.data) {
    toast.add({ title: res.error || t('editor.debugLoadFail'), color: 'error' })
    return
  }
  currentExecution.value = res.data
  applyNodeRunHighlight(res.data)
  const st = res.data.status
  if (['running', 'pending', 'debugging'].includes(st)) {
    isDebugging.value = true
    startExecutionPoll(executionId)
  } else {
    stopPolling()
    isDebugging.value = false
  }
}

onMounted(() => {
  window.addEventListener('beforeunload', onBrowserBeforeUnload)
  void refreshModelOptions()
  void refreshTeamOptions()
  void refreshAgentOptions()
  void refreshWorkflowPickOptions()
  void refreshKbOptions()
  listProviders().then((res) => {
    providers.value = res.data || []
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

.unbound-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin: 0;
  padding: 3px 8px;
  border-radius: 999px;
  border: 1px dashed #f59e0b;
  background: #fffbeb;
  color: #b45309;
  font-size: 12px;
  line-height: 1.2;
  cursor: pointer;
  white-space: nowrap;
}

.unbound-chip:hover {
  background: #fef3c7;
}

.unbound-chip--orphan {
  border-color: #64748b;
  background: #f8fafc;
  color: #475569;
}

.unbound-chip--orphan:hover {
  background: #f1f5f9;
}

.unbound-chip--multi-start {
  border-color: #dc2626;
  background: #fef2f2;
  color: #b91c1c;
}

.unbound-chip--multi-start:hover {
  background: #fee2e2;
}

.unbound-chip--end-out {
  border-color: #c2410c;
  background: #fff7ed;
  color: #c2410c;
}

.unbound-chip--end-out:hover {
  background: #ffedd5;
}

.unbound-chip--start-in {
  border-color: #15803d;
  background: #f0fdf4;
  color: #15803d;
}

.unbound-chip--start-in:hover {
  background: #dcfce7;
}

.unbound-chip--branch {
  border-color: #d97706;
  background: #fffbeb;
  color: #b45309;
}

.unbound-chip--branch:hover {
  background: #fef3c7;
}

.unbound-chip--dead-end {
  border-color: #7c3aed;
  background: #f5f3ff;
  color: #6d28d9;
}

.unbound-chip--dead-end:hover {
  background: #ede9fe;
}

.unbound-chip--summary {
  border-color: #475569;
  background: #f8fafc;
  color: #334155;
}

.unbound-chip--summary:hover {
  background: #f1f5f9;
}

.issue-summary {
  position: relative;
  display: inline-flex;
}

.issue-summary__menu {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  z-index: 40;
  min-width: 180px;
  padding: 4px;
  border: 1px solid var(--cf-line, #e2e8f0);
  border-radius: 8px;
  background: var(--cf-surface, #fff);
  box-shadow: 0 8px 24px rgb(15 23 42 / 0.12);
}

.issue-summary__item {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  margin: 0;
  padding: 6px 8px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--cf-ink, #0f172a);
  font-size: 12px;
  line-height: 1.3;
  text-align: left;
  cursor: pointer;
}

.issue-summary__item:hover {
  background: #f1f5f9;
}

.exec-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  padding: 8px 16px;
  border-bottom: 1px solid var(--cf-line, #e2e8f0);
  background: color-mix(in oklab, var(--cf-accent-soft, #f8fafc) 80%, transparent);
  font-size: 13px;
  /* 高于调试侧栏，避免右侧「审批」按钮被挡住 */
  position: sticky;
  top: 0;
  z-index: 120;
}
.exec-bar[data-status='waiting'] {
  background: color-mix(in oklab, #ffedd5 70%, transparent);
}
.exec-bar__label {
  font-weight: 600;
  color: var(--cf-ink-soft, #64748b);
}
.exec-bar__msg {
  flex: 1;
  min-width: 120px;
  color: var(--cf-ink, #0f172a);
}
.exec-bar__actions {
  display: flex;
  gap: 8px;
  margin-left: auto;
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
  margin-bottom: 6px;
  text-transform: uppercase;
}

.palette-hint {
  margin: 0 0 12px;
  font-size: 11px;
  line-height: 1.4;
  color: var(--cf-ink-soft, #64748b);
  opacity: 0.9;
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

.flow-node-subflow {
  border-color: #0d9488;
  background: color-mix(in oklab, #0d9488 12%, white);
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

.canvas-container :deep(.vue-flow__node.run-running) {
  box-shadow: 0 0 0 2px #3b82f6;
}
.canvas-container :deep(.vue-flow__node.run-succeeded) {
  box-shadow: 0 0 0 2px #10b981;
}
.canvas-container :deep(.vue-flow__node.run-failed) {
  box-shadow: 0 0 0 2px #ef4444;
}
.canvas-container :deep(.vue-flow__node.run-waiting) {
  box-shadow: 0 0 0 2px #ea580c;
}
.canvas-container :deep(.vue-flow__node.run-skipped) {
  opacity: 0.55;
}
.canvas-container :deep(.vue-flow__edge.run-edge-skipped) {
  opacity: 0.4;
}
.canvas-container :deep(.vue-flow__edge.run-edge-skipped .vue-flow__edge-path) {
  stroke-dasharray: 5 4;
}
.canvas-container :deep(.vue-flow__edge.run-edge-skipped .vue-flow__edge-text) {
  opacity: 0.55;
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
.field--row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.field__hint--warn {
  color: #b45309;
}
.field__hint {
  margin: 0;
  font-size: 11px;
  line-height: 1.4;
  color: var(--cf-ink-soft, #64748b);
  opacity: 0.85;
}
.field__hint--block {
  margin-bottom: 8px;
}
.field__link {
  color: var(--cf-accent, #0f9f8a);
  text-decoration: none;
  margin-left: 4px;
}
.field__link:hover {
  text-decoration: underline;
}

.start-var-row {
  position: relative;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 10px;
  padding: 28px 10px 10px;
  border: 1px solid var(--cf-line, #e2e8f0);
  border-radius: 8px;
  background: var(--cf-bg, #f8fafc);
}
.start-var-row__remove {
  position: absolute;
  top: 6px;
  left: 6px;
  z-index: 1;
}
.start-var-default {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}
.start-var-desc {
  grid-column: 1 / -1;
}
.start-var-req {
  display: flex;
  align-items: flex-end;
  gap: 6px;
  padding-bottom: 8px;
  font-size: 12px;
  color: var(--cf-ink-soft, #64748b);
}

.debug-var-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 10px;
}
.debug-var-req {
  color: #dc2626;
  margin-left: 2px;
}
.debug-var-desc {
  font-weight: 400;
  opacity: 0.75;
}
.debug-json-details {
  margin-top: 4px;
  font-size: 12px;
}
.debug-json-details summary {
  cursor: pointer;
  color: var(--cf-ink-soft, #64748b);
  margin-bottom: 6px;
}

.kb-defaults {
  margin: 4px 0 8px;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid var(--cf-line, #e2e8f0);
  background: var(--cf-bg, #f8fafc);
}
.kb-defaults__title {
  font-size: 12px;
  font-weight: 600;
  color: var(--cf-ink, #334155);
  margin-bottom: 4px;
}
.kb-defaults__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px 12px;
  margin: 8px 0 0;
}
.kb-defaults__grid > div {
  min-width: 0;
}
.kb-defaults__span {
  grid-column: 1 / -1;
}
.kb-defaults__grid dt {
  font-size: 10px;
  color: var(--cf-ink-soft, #64748b);
  margin: 0 0 2px;
}
.kb-defaults__grid dd {
  margin: 0;
  font-size: 12px;
  color: var(--cf-ink, #334155);
  word-break: break-word;
}

.version-list {
  list-style: none;
  margin: 12px 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.version-list__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 10px;
  border: 1px solid color-mix(in oklab, var(--cf-border, #e2e8f0) 80%, transparent);
  border-radius: 8px;
}

.version-list__actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
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

.debug-trigger {
  position: relative;
}
.debug-trigger.is-active-run {
  box-shadow: 0 0 0 1px color-mix(in oklab, #ea580c 55%, transparent);
}
.debug-trigger__badge {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #3b82f6;
  box-shadow: 0 0 0 2px var(--cf-bg-elevated, #fff);
}
.debug-trigger__badge[data-status='waiting'] {
  background: #ea580c;
  animation: pulse 1s infinite;
}
.debug-trigger__badge[data-status='running'],
.debug-trigger__badge[data-status='debugging'],
.debug-trigger__badge[data-status='pending'] {
  animation: pulse 1s infinite;
}

.debug-panel {
  position: fixed;
  right: 0;
  top: var(--ui-header-height, 56px);
  bottom: 0;
  width: min(400px, 92vw);
  background: var(--cf-bg-elevated, #fff);
  border-left: 1px solid var(--cf-line, #e2e8f0);
  display: flex;
  flex-direction: column;
  z-index: 100;
  box-shadow: -4px 0 12px rgba(0, 0, 0, 0.1);
}
.debug-hint {
  margin: 0 0 12px;
  font-size: 12px;
  line-height: 1.5;
  opacity: 0.75;
}
.debug-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}
.debug-empty {
  font-size: 12px;
  opacity: 0.55;
}
.debug-error {
  margin: 8px 0 0;
  font-size: 12px;
  color: #ef4444;
  word-break: break-word;
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
  margin-bottom: 8px;
}
.debug-status[data-status='waiting'] {
  background: color-mix(in oklab, #ffedd5 80%, transparent);
}
.debug-wait-msg {
  margin: 0 0 10px;
  font-size: 12px;
  line-height: 1.5;
  color: #9a3412;
}
.debug-wait-actions {
  margin-bottom: 8px;
  padding: 10px;
  border: 1px solid color-mix(in oklab, #ea580c 35%, transparent);
  border-radius: 8px;
  background: color-mix(in oklab, #fff7ed 90%, transparent);
}
.debug-wait-actions__label {
  margin: 0 0 8px;
  font-size: 12px;
  font-weight: 600;
  color: #9a3412;
}
.debug-wait-actions .debug-actions {
  margin-bottom: 0;
}

.debug-status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.debug-status-dot.pending { background: #f59e0b; }
.debug-status-dot.running { background: #3b82f6; animation: pulse 1s infinite; }
.debug-status-dot.debugging { background: #3b82f6; animation: pulse 1s infinite; }
.debug-status-dot.waiting { background: #ea580c; }
.debug-status-dot.completed,
.debug-status-dot.succeeded,
.debug-status-dot.approved { background: #10b981; }
.debug-status-dot.skipped { background: #94a3b8; }
.debug-status-dot.failed,
.debug-status-dot.rejected,
.debug-status-dot.cancelled { background: #ef4444; }

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.debug-hint--compact {
  margin: 0 0 8px;
  font-size: 11px;
  opacity: 0.75;
}
.debug-seed-opt {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin: 8px 0 2px;
  font-size: 12px;
  color: var(--cf-ink, #334155);
  cursor: pointer;
}
.debug-seed-opt input {
  margin-top: 2px;
}

.debug-meta {
  margin: 6px 0 0;
  font-size: 12px;
  line-height: 1.45;
  color: var(--cf-ink-muted, #64748b);
  word-break: break-word;
}

.debug-output {
  margin-top: 8px;
}
.debug-output pre,
.debug-stream__text {
  margin: 4px 0 0;
  padding: 8px 10px;
  max-height: 160px;
  overflow: auto;
  border-radius: 6px;
  background: var(--cf-bg, #f8fafc);
  border: 1px solid var(--cf-line, #e2e8f0);
  font-size: 11px;
  line-height: 1.4;
  white-space: pre-wrap;
  word-break: break-word;
}
.debug-stream__text {
  max-height: 96px;
  color: #4338ca;
  border-color: color-mix(in oklab, #6366f1 35%, var(--cf-line, #e2e8f0));
}

.debug-log-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
  padding: 8px 12px;
  margin-bottom: 8px;
  background: var(--cf-bg, #f8fafc);
  border-radius: 6px;
  font-size: 12px;
  border: 1px solid transparent;
  border-left: 3px solid var(--cf-line, #e2e8f0);
}
.debug-log-item__main {
  display: block;
  width: 100%;
  padding: 0;
  margin: 0;
  text-align: left;
  background: transparent;
  border: 0;
  cursor: pointer;
  color: inherit;
  font: inherit;
}
.debug-log-item:hover {
  border-color: color-mix(in oklab, var(--cf-accent, #3b82f6) 35%, transparent);
}
.debug-log-item.is-selected {
  border-color: color-mix(in oklab, var(--cf-accent, #3b82f6) 55%, transparent);
  background: color-mix(in oklab, var(--cf-accent, #3b82f6) 8%, #fff);
}
.debug-log-item.is-stale {
  border-color: color-mix(in oklab, #f59e0b 45%, transparent);
}
.debug-meta--input {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}
.debug-log-item__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}
.debug-reuse-input {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: 4px;
  border: 1px solid var(--cf-line, #e2e8f0);
  background: #fff;
  color: var(--cf-ink-soft, #64748b);
  font-size: 11px;
  cursor: pointer;
}
.debug-reuse-input:hover {
  border-color: color-mix(in oklab, var(--cf-accent, #3b82f6) 55%, var(--cf-line, #e2e8f0));
  color: var(--cf-accent, #2563eb);
}
.debug-log-cancel {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  align-self: flex-start;
  padding: 3px 8px;
  border-radius: 4px;
  border: 1px solid var(--cf-line, #e2e8f0);
  background: #fff;
  color: var(--cf-ink-soft, #64748b);
  font-size: 11px;
  cursor: pointer;
}
.debug-log-cancel:hover:not(:disabled) {
  border-color: #ef4444;
  color: #dc2626;
}
.debug-log-cancel--stale {
  border-color: color-mix(in oklab, #f59e0b 55%, var(--cf-line, #e2e8f0));
  color: #b45309;
}
.debug-log-cancel:disabled {
  opacity: 0.55;
  cursor: wait;
}
.debug-log-cancel-all {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin: 0 0 8px;
  padding: 4px 10px;
  border-radius: 4px;
  border: 1px solid color-mix(in oklab, #f59e0b 55%, var(--cf-line, #e2e8f0));
  background: #fffbeb;
  color: #b45309;
  font-size: 11px;
  cursor: pointer;
}
.debug-log-cancel-all:hover:not(:disabled) {
  border-color: #ef4444;
  color: #dc2626;
  background: #fef2f2;
}
.debug-log-cancel-all:disabled {
  opacity: 0.55;
  cursor: wait;
}

.debug-log-item.pending,
.debug-log-item.waiting { border-left-color: #f59e0b; }
.debug-log-item.running,
.debug-log-item.debugging,
.debug-log-item.info { border-left-color: #3b82f6; }
.debug-log-item.warn { border-left-color: #f59e0b; }
.debug-log-item.failed,
.debug-log-item.cancelled,
.debug-log-item.error { border-left-color: #ef4444; }
.debug-log-item.completed,
.debug-log-item.succeeded,
.debug-log-item.success { border-left-color: #10b981; }

.debug-log-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}
.debug-history-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  margin: 0 0 6px;
  padding: 8px 10px;
  border: 1px solid var(--cf-line, #e2e8f0);
  border-radius: 8px;
  background: var(--cf-bg, #f8fafc);
  font-size: 13px;
  font-weight: 600;
  color: var(--cf-ink, #334155);
  cursor: pointer;
}
.debug-history-toggle:hover {
  border-color: color-mix(in oklab, var(--cf-accent, #3b82f6) 40%, transparent);
}

.debug-timeline {
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px dashed var(--cf-line, #e2e8f0);
}
.debug-timeline__item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  width: 100%;
  margin: 0;
  padding: 8px 4px;
  text-align: left;
  font: inherit;
  color: inherit;
  background: transparent;
  border: 0;
  border-bottom: 1px solid color-mix(in oklab, var(--cf-line, #e2e8f0) 70%, transparent);
  border-radius: 4px;
  cursor: pointer;
}
.debug-timeline__item:hover {
  background: color-mix(in oklab, var(--cf-accent, #3b82f6) 6%, transparent);
}
.debug-timeline__item.is-selected {
  background: color-mix(in oklab, var(--cf-accent, #3b82f6) 10%, #fff);
}
.debug-timeline__item:last-child {
  border-bottom: 0;
}
.debug-timeline__idx {
  flex-shrink: 0;
  width: 18px;
  text-align: center;
  font-size: 11px;
  font-weight: 700;
  color: #94a3b8;
  line-height: 16px;
}
.debug-timeline__body {
  min-width: 0;
  flex: 1;
}
.debug-timeline__title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--cf-ink, #334155);
}
.debug-timeline__status {
  margin-left: auto;
  font-weight: 500;
  font-size: 11px;
  color: var(--cf-ink-soft, #64748b);
}
.debug-timeline__note {
  margin-top: 2px;
  font-size: 11px;
  color: var(--cf-ink-soft, #64748b);
  word-break: break-word;
}
.debug-step-summary {
  margin-top: 10px;
  padding: 8px 10px;
  border-radius: 6px;
  border: 1px solid var(--cf-line, #e2e8f0);
  background: var(--cf-bg, #f8fafc);
}
.debug-step-summary__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 4px;
}
.debug-step-summary__head .debug-section-title {
  margin: 0;
}
.debug-copy-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
  padding: 2px 8px;
  border-radius: 4px;
  border: 1px solid var(--cf-line, #e2e8f0);
  background: #fff;
  color: var(--cf-ink-soft, #64748b);
  font-size: 11px;
  cursor: pointer;
}
.debug-copy-btn:hover {
  border-color: color-mix(in oklab, var(--cf-accent, #3b82f6) 55%, var(--cf-line, #e2e8f0));
  color: var(--cf-accent, #2563eb);
}
.debug-output .debug-step-summary__head {
  margin-bottom: 6px;
}
.debug-step-summary__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  margin: 0 0 6px;
  font-size: 12px;
}
.debug-step-summary__meta dt {
  display: inline;
  margin: 0;
  color: var(--cf-ink-muted, #64748b);
}
.debug-step-summary__meta dt::after {
  content: '：';
}
.debug-step-summary__meta dd {
  display: inline;
  margin: 0;
  font-weight: 500;
}
.debug-step-summary__error {
  margin: 0 0 6px;
  font-size: 12px;
  color: #dc2626;
  word-break: break-word;
}
.debug-step-summary__out {
  margin: 0;
  padding: 8px 10px;
  max-height: 140px;
  overflow: auto;
  border-radius: 6px;
  background: #fff;
  border: 1px solid var(--cf-line, #e2e8f0);
  font-size: 11px;
  line-height: 1.4;
  white-space: pre-wrap;
  word-break: break-word;
}
.debug-timeline__item[data-status='waiting'] .debug-timeline__note {
  color: #c2410c;
}

.debug-log-index {
  flex-shrink: 0;
  font-weight: 700;
  font-size: 11px;
  color: var(--cf-ink-soft, #64748b);
}
.debug-log-status {
  font-weight: 600;
  color: var(--cf-ink, #334155);
}
.debug-log-time {
  margin-left: auto;
  color: #94a3b8;
  font-size: 10px;
}
.debug-log-message {
  color: var(--cf-ink, #334155);
  word-break: break-word;
  line-height: 1.4;
}
.debug-log-secondary {
  margin-top: 2px;
  font-size: 11px;
  color: var(--cf-ink-soft, #64748b);
  word-break: break-word;
  line-height: 1.4;
}
.debug-log-id {
  margin-top: 4px;
  color: #94a3b8;
  font-size: 10px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
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
