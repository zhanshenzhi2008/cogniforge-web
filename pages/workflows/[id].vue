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
              @click="confirmRollback(v.version)"
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

          <div v-if="selectedNode.type === 'llm'" class="field">
            <label class="field__label">{{ t('editor.userPrompt') }}</label>
            <UTextarea
              v-model="nodeConfig.prompt"
              class="w-full"
              :rows="4"
              :placeholder="t('editor.userPromptPh')"
            />
          </div>

          <div v-if="selectedNode.type === 'llm'" class="field field--row">
            <div>
              <label class="field__label">{{ t('editor.llmStream') }}</label>
              <p class="field__hint">{{ t('editor.llmStreamHint') }}</p>
            </div>
            <USwitch v-model="nodeConfig.llmStream" size="sm" />
          </div>

          <div v-if="selectedNode.type === 'agent'" class="field">
            <label class="field__label">{{ t('editor.agentPick') }}</label>
            <USelect
              v-model="nodeConfig.agentId"
              class="w-full"
              :items="agentOptions"
              :placeholder="agentOptions.length ? t('editor.agentPickPh') : t('editor.agentPickEmpty')"
              value-key="value"
              :disabled="!agentOptions.length"
            />
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
          </div>

          <div v-if="selectedNode.type === 'team'" class="field">
            <label class="field__label">{{ t('editor.teamPick') }}</label>
            <USelect
              v-model="nodeConfig.teamId"
              class="w-full"
              :items="teamOptions"
              :placeholder="teamOptions.length ? t('editor.teamPickPh') : t('editor.teamPickEmpty')"
              value-key="value"
              :disabled="!teamOptions.length"
            />
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
          </div>

          <template v-if="selectedNode.type === 'subflow'">
            <div class="field">
              <label class="field__label">{{ t('editor.subflowPick') }}</label>
              <USelect
                v-model="nodeConfig.subflowWorkflowId"
                class="w-full"
                :items="subflowWorkflowOptions"
                :placeholder="subflowWorkflowOptions.length ? t('editor.subflowPickPh') : t('editor.subflowPickEmpty')"
                value-key="value"
                :disabled="!subflowWorkflowOptions.length"
              />
              <p v-if="!subflowWorkflowOptions.length" class="field__hint">
                {{ t('editor.subflowPickEmptyHint') }}
                <NuxtLink to="/workflows" class="field__link" target="_blank">{{ t('editor.subflowGoCreate') }}</NuxtLink>
              </p>
              <p v-else class="field__hint">{{ t('editor.subflowHint') }}</p>
            </div>
          </template>

          <template v-if="selectedNode.type === 'condition'">
            <div class="field">
              <label class="field__label">{{ t('editor.conditionField') }}</label>
              <UInput
                v-model="nodeConfig.conditionField"
                class="w-full"
                :placeholder="t('editor.conditionFieldPh')"
              />
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
                v-model="nodeConfig.httpMethod"
                class="w-full"
                :items="httpMethodOptions"
                value-key="value"
              />
            </div>
            <div class="field">
              <label class="field__label">{{ t('editor.httpUrl') }}</label>
              <UInput
                v-model="nodeConfig.httpUrl"
                class="w-full"
                :placeholder="t('editor.httpUrlPh')"
              />
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
              <label class="field__label">{{ t('editor.httpTimeout') }}</label>
              <UInput
                v-model.number="nodeConfig.httpTimeout"
                type="number"
                class="w-full"
                :placeholder="t('editor.httpTimeoutPh')"
              />
            </div>
          </template>

          <template v-if="selectedNode.type === 'delay'">
            <div class="field">
              <label class="field__label">{{ t('editor.delayDuration') }}</label>
              <UInput
                v-model.number="nodeConfig.delayDuration"
                type="number"
                class="w-full"
                :placeholder="t('editor.delayDurationPh')"
              />
            </div>
            <div class="field">
              <label class="field__label">{{ t('editor.delayUnit') }}</label>
              <USelect
                v-model="nodeConfig.delayUnit"
                class="w-full"
                :items="delayUnitOptions"
                value-key="value"
              />
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
                v-model.number="nodeConfig.loopCount"
                type="number"
                class="w-full"
                :placeholder="t('editor.loopCountPh')"
              />
            </div>
            <div v-if="nodeConfig.loopType === 'while'" class="field">
              <label class="field__label">{{ t('editor.loopCondition') }}</label>
              <UInput
                v-model="nodeConfig.loopCondition"
                class="w-full"
                :placeholder="t('editor.loopConditionPh')"
              />
            </div>
            <div class="field">
              <label class="field__label">{{ t('editor.loopMaxIter') }}</label>
              <UInput
                v-model.number="nodeConfig.loopMaxIter"
                type="number"
                class="w-full"
                :placeholder="t('editor.loopMaxIterPh')"
              />
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
          </template>

          <div v-if="selectedNode.type === 'wait'" class="field">
            <label class="field__label">{{ t('editor.waitReason') }}</label>
            <UInput
              v-model="nodeConfig.waitReason"
              class="w-full"
              :placeholder="t('editor.waitReasonPh')"
            />
          </div>
          <div v-if="selectedNode.type === 'wait'" class="field">
            <label class="field__label">{{ t('editor.waitMessage') }}</label>
            <UTextarea
              v-model="nodeConfig.waitMessage"
              class="w-full"
              :rows="3"
              :placeholder="t('editor.waitMessagePh')"
            />
          </div>
          <div v-if="selectedNode.type === 'wait'" class="field">
            <label class="field__label">{{ t('editor.waitTimeout') }}</label>
            <UInput
              v-model.number="nodeConfig.timeoutSec"
              type="number"
              class="w-full"
              :placeholder="t('editor.waitTimeoutPh')"
            />
          </div>

          <template v-if="selectedNode.type === 'search'">
            <div class="field">
              <label class="field__label">{{ t('editor.knowledgeBase') }}</label>
              <USelect
                v-model="nodeConfig.knowledgeBaseId"
                class="w-full"
                :items="kbOptions"
                :placeholder="kbOptions.length ? t('editor.pickKnowledge') : t('editor.kbPickEmpty')"
                value-key="value"
                :disabled="!kbOptions.length"
              />
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
                v-model.number="nodeConfig.topK"
                type="number"
                class="w-full"
                :min="0"
                :max="20"
                :placeholder="t('editor.searchInheritPh')"
              />
              <p class="field__hint">{{ t('editor.searchTopKHint') }}</p>
            </div>
            <div class="field">
              <label class="field__label">{{ t('editor.searchMinScore') }}</label>
              <UInput
                v-model.number="nodeConfig.minScore"
                type="number"
                class="w-full"
                :min="0"
                :max="1"
                :step="0.05"
                :placeholder="t('editor.searchInheritPh')"
              />
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
                v-model="nodeConfig.rerankProviderId"
                class="w-full"
                :items="rerankProviderOptions"
                value-key="value"
                :placeholder="rerankSelectPlaceholder"
                :disabled="!rerankProviderOptions.length"
              />
            </div>
            <div v-if="effectiveSearchMode === 'hybrid'" class="field">
              <label class="field__label">{{ t('editor.searchHybridWeight') }}</label>
              <UInput
                v-model.number="nodeConfig.hybridSemanticWeight"
                type="number"
                class="w-full"
                :min="0"
                :max="1"
                :step="0.05"
                :placeholder="t('editor.searchInheritPh')"
              />
              <p class="field__hint">{{ t('editor.searchHybridWeightHint') }}</p>
            </div>

            <div class="field">
              <label class="field__label">{{ t('editor.query') }}</label>
              <UInput v-model="nodeConfig.query" class="w-full" :placeholder="t('editor.queryPh')" />
              <p class="field__hint">{{ t('editor.searchQueryHint') }}</p>
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
          <div v-if="execInputPreview" class="debug-meta">
            {{ t('editor.debugInputPreview', { text: execInputPreview }) }}
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
            <div
              v-for="(step, idx) in execTimeline"
              :key="step.key"
              class="debug-timeline__item"
              :data-status="step.status"
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
            </div>
          </div>

          <div v-if="currentExecution.output" class="debug-output">
            <div class="debug-section-title">{{ t('editor.debugOutput') }}</div>
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
              v-for="row in olderHistoryItems"
              :key="row.item.id"
              type="button"
              class="debug-log-item"
              :class="[row.item.status, { 'is-selected': currentExecution?.id === row.item.id }]"
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
          </template>
        </div>
      </div>
    </aside>
  </div>
</template>

<script setup lang="ts">
import WorkflowCanvas from '~/components/WorkflowCanvas.vue'
import { MarkerType } from '@vue-flow/core'
import { layoutWorkflowNodes } from '@/utils/workflowLayout'
import { WORKFLOW_PALETTE_TYPES, getWorkflowNodeMeta, isWorkflowBindUnbound } from '@/utils/workflowNodeMeta'

import { useRoute } from 'vue-router'
import { useWorkflows, type WorkflowDefinition, type WorkflowVersionSnap, type WorkflowSchedule } from '@/composables/useWorkflows'
import { useKnowledgeBases, type KnowledgeBase } from '@/composables/useKnowledgeBases'
import { useProviders, hasCap, rerankModelLabel } from '@/composables/useProviders'

function withEdgeArrow(edge: { id: string, source: string, target: string, [k: string]: any }) {
  return {
    ...edge,
    animated: true,
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 18,
      height: 18,
      color: '#4f46e5',
    },
    style: { stroke: '#4f46e5', strokeWidth: 2, ...(edge.style || {}) },
  }
}

/** Same as the list page smoke button: skip the API, only verify the dynamic route + Vue Flow. */
const CANVAS_SMOKE_ID = '__canvas_smoke__'

definePageMeta({
  layout: 'default',
})

const route = useRoute()
const toast = useToast()
const { t } = useLocale()
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

const addSchedule = async () => {
  if (!workflowId.value) return
  const cron = scheduleForm.cron.trim()
  if (!cron) {
    toast.add({ title: t('editor.cronRequired'), color: 'warning' })
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

const removeSchedule = async (scheduleId: string) => {
  if (!workflowId.value || !confirm(t('editor.scheduleDeleteConfirm'))) return
  const res = await deleteSchedule(workflowId.value, scheduleId)
  if (res.error) {
    toast.add({ title: res.error, color: 'error' })
    return
  }
  toast.add({ title: t('common.deleteOk'), color: 'success' })
  await openSchedules()
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

const confirmRollback = async (version: number) => {
  if (!workflowId.value || !confirm(t('editor.rollbackConfirm', { version }))) return
  rollingBackVersion.value = version
  try {
    const res = await rollbackVersion(workflowId.value, version)
    if (res.error) {
      toast.add({ title: res.error, color: 'error' })
      return
    }
    toast.add({ title: t('editor.rollbackOk', { version }), color: 'success' })
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
  teamId: '',
  agentId: '',
  knowledgeBaseId: '',
  description: '',
  query: '',
  topK: 0,
  minScore: 0,
  searchMode: '',
  rerankMode: 'inherit' as 'inherit' | 'on' | 'off',
  rerankProviderId: '',
  hybridSemanticWeight: null as number | null,
  variable: '',
  waitReason: 'approval',
  waitMessage: '',
  timeoutSec: 0,
  conditionField: '',
  conditionOperator: '==',
  conditionValue: '',
  httpMethod: 'GET',
  httpUrl: '',
  httpBody: '',
  httpTimeout: 30,
  delayDuration: 1,
  delayUnit: 'seconds',
  loopType: 'times',
  loopCount: 3,
  loopMaxIter: 100,
  loopCondition: '',
  codeLanguage: 'expression',
  codeSource: '',
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

const delayUnitOptions = computed(() => [
  { label: t('editor.delayUnitSeconds'), value: 'seconds' },
  { label: t('editor.delayUnitMinutes'), value: 'minutes' },
  { label: t('editor.delayUnitHours'), value: 'hours' },
])

const loopTypeOptions = computed(() => [
  { label: t('editor.loopTypeTimes'), value: 'times' },
  { label: t('editor.loopTypeWhile'), value: 'while' },
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
const workflowPickOptions = ref<{ label: string, value: string }[]>([])
const subflowWorkflowOptions = computed(() =>
  workflowPickOptions.value.filter(w => w.value !== workflowId.value),
)
const agentOptions = ref<{ label: string, value: string }[]>([])
const kbList = ref<KnowledgeBase[]>([])
const kbOptions = computed(() =>
  kbList.value.filter(k => k.id).map(k => ({ label: k.name || k.id, value: k.id })),
)
const providers = ref<any[]>([])
const rerankProviderOptions = computed(() =>
  providers.value
    .filter((p: any) => p.enabled !== false && hasCap(p, 'rerank'))
    .map((p: any) => ({ label: rerankModelLabel(p), value: p.id })),
)
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
            ...(n.type === 'search'
              ? {
                  knowledgeBaseId: n.data?.knowledgeBaseId || n.config?.knowledge_base_id || '',
                  query: n.data?.query || n.config?.query || '',
                  topK: Number(n.data?.topK ?? n.config?.top_k ?? 0) || 0,
                  minScore: Number(n.data?.minScore ?? n.config?.min_score ?? 0) || 0,
                  searchMode: n.data?.searchMode || n.config?.search_mode || '',
                  rerank: n.data?.rerank ?? n.config?.rerank,
                  rerankProviderId: n.data?.rerankProviderId || n.config?.rerank_provider_id || '',
                  hybridSemanticWeight: n.data?.hybridSemanticWeight ?? n.config?.hybrid_semantic_weight,
                }
              : {}),
            ...(n.type === 'start'
              ? {
                  variables: normalizeStartVars(n.data?.variables || n.config?.variables),
                }
              : {}),
          },
        })) || []

        edges.value = def.edges?.map((e: any) => withEdgeArrow({
          id: e.id,
          source: e.source,
          target: e.target,
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
      webhook_url: workflowBasicInfo.webhookUrl.trim(),
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

async function refreshTeamOptions() {
  const res = await listTeams()
  if (res.error) {
    toast.add({ title: res.error, color: 'error' })
    return
  }
  teamOptions.value = (res.data || [])
    .filter(t => t.id && (!t.status || t.status === 'active'))
    .map(t => ({ label: t.name || t.id, value: t.id }))
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
}

async function refreshKbOptions() {
  const res = await listKBs()
  if (res.error) {
    toast.add({ title: res.error, color: 'error' })
    return
  }
  kbList.value = (res.data || []).filter(k => k.id)
}

const handleNodeClick = (event: any) => {
  selectedNode.value = event.node
  nodeConfig.name = event.node.data?.label || ''
  nodeConfig.model = event.node.data?.model || firstConfiguredModel()
  nodeConfig.systemPrompt = event.node.data?.systemPrompt || ''
  nodeConfig.prompt = event.node.data?.prompt || event.node.data?.task || ''
  nodeConfig.llmStream = !!(event.node.data?.llmStream ?? event.node.data?.stream)
  nodeConfig.teamId = event.node.data?.teamId || event.node.data?.team_id || ''
  nodeConfig.agentId = event.node.data?.agentId || event.node.data?.agent_id || ''
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
  nodeConfig.topK = Number(event.node.data?.topK || event.node.data?.top_k || 0) || 0
  nodeConfig.minScore = Number(event.node.data?.minScore || event.node.data?.min_score || 0) || 0
  nodeConfig.searchMode = event.node.data?.searchMode || event.node.data?.search_mode || ''
  if (event.node.data?.rerank === true) nodeConfig.rerankMode = 'on'
  else if (event.node.data?.rerank === false) nodeConfig.rerankMode = 'off'
  else nodeConfig.rerankMode = 'inherit'
  nodeConfig.rerankProviderId = event.node.data?.rerankProviderId || event.node.data?.rerank_provider_id || ''
  const hy = event.node.data?.hybridSemanticWeight ?? event.node.data?.hybrid_semantic_weight
  nodeConfig.hybridSemanticWeight = hy == null || hy === '' ? null : Number(hy)
  nodeConfig.variable = event.node.data?.variable || ''
  nodeConfig.waitReason = event.node.data?.waitReason || event.node.data?.reason || 'approval'
  nodeConfig.waitMessage = event.node.data?.waitMessage || event.node.data?.message || ''
  nodeConfig.timeoutSec = Number(event.node.data?.timeoutSec || event.node.data?.timeout_sec || 0)
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
  nodeConfig.httpTimeout = Number(event.node.data?.timeout || event.node.data?.httpTimeout || 30) || 30
  nodeConfig.delayDuration = Number(
    event.node.data?.delayDuration ?? event.node.data?.duration ?? 1,
  ) || 1
  nodeConfig.delayUnit = event.node.data?.delayUnit || event.node.data?.unit || 'seconds'
  nodeConfig.loopType = event.node.data?.loopType || event.node.data?.type || 'times'
  if (nodeConfig.loopType === 'count') nodeConfig.loopType = 'times'
  nodeConfig.loopCount = Number(event.node.data?.loopCount ?? event.node.data?.count ?? 3) || 3
  nodeConfig.loopMaxIter = Number(event.node.data?.loopMaxIter ?? event.node.data?.max_iter ?? 100) || 100
  nodeConfig.loopCondition = event.node.data?.loopCondition || event.node.data?.condition || ''
  nodeConfig.codeLanguage = event.node.data?.codeLanguage || event.node.data?.language || 'expression'
  nodeConfig.codeSource = event.node.data?.codeSource || event.node.data?.code || ''
  nodeConfig.subflowWorkflowId =
    event.node.data?.subflowWorkflowId || event.node.data?.workflowId || event.node.data?.workflow_id || ''
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
      prompt: nodeConfig.prompt,
      llmStream: !!nodeConfig.llmStream,
      stream: !!nodeConfig.llmStream,
      teamId: nodeConfig.teamId,
      agentId: nodeConfig.agentId,
      knowledgeBaseId: nodeConfig.knowledgeBaseId,
      description: nodeConfig.description,
      query: nodeConfig.query,
      topK: Number(nodeConfig.topK) > 0 ? Number(nodeConfig.topK) : 0,
      minScore: Number(nodeConfig.minScore) > 0 ? Number(nodeConfig.minScore) : 0,
      searchMode: nodeConfig.searchMode || '',
      rerank: nodeConfig.rerankMode === 'inherit' ? undefined : nodeConfig.rerankMode === 'on',
      rerankProviderId: nodeConfig.rerankMode === 'on' ? nodeConfig.rerankProviderId : '',
      hybridSemanticWeight: nodeConfig.hybridSemanticWeight == null || nodeConfig.hybridSemanticWeight === ('' as any)
        ? undefined
        : Number(nodeConfig.hybridSemanticWeight),
      variable: nodeConfig.variable,
      waitReason: nodeConfig.waitReason,
      waitMessage: nodeConfig.waitMessage,
      timeoutSec: nodeConfig.timeoutSec || 0,
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
            return {
              method: nodeConfig.httpMethod || 'GET',
              url: nodeConfig.httpUrl,
              body: trimmed ? body : undefined,
              timeout: Number(nodeConfig.httpTimeout) > 0 ? Number(nodeConfig.httpTimeout) : 30,
            }
          })()
        : {}),
      ...(selectedNode.value.type === 'delay'
        ? {
            delayDuration: Number(nodeConfig.delayDuration) || 1,
            delayUnit: nodeConfig.delayUnit || 'seconds',
            duration: Number(nodeConfig.delayDuration) || 1,
            unit: nodeConfig.delayUnit || 'seconds',
          }
        : {}),
      ...(selectedNode.value.type === 'loop'
        ? {
            loopType: nodeConfig.loopType || 'times',
            loopCount: Number(nodeConfig.loopCount) || 1,
            loopMaxIter: Number(nodeConfig.loopMaxIter) || 100,
            loopCondition: nodeConfig.loopCondition,
            type: nodeConfig.loopType || 'times',
            count: Number(nodeConfig.loopCount) || 1,
            max_iter: Number(nodeConfig.loopMaxIter) || 100,
            condition: nodeConfig.loopCondition,
          }
        : {}),
      ...(selectedNode.value.type === 'code'
        ? {
            codeLanguage: nodeConfig.codeLanguage || 'expression',
            codeSource: nodeConfig.codeSource,
            language: nodeConfig.codeLanguage || 'expression',
            code: nodeConfig.codeSource,
          }
        : {}),
      ...(selectedNode.value.type === 'subflow'
        ? {
            subflowWorkflowId: nodeConfig.subflowWorkflowId,
            workflowId: nodeConfig.subflowWorkflowId,
            workflow_id: nodeConfig.subflowWorkflowId,
          }
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

function findUnboundBindNodes(): { id: string, label: string, kind: string }[] {
  const out: { id: string, label: string, kind: string }[] = []
  for (const n of nodes.value) {
    const kind = String(n.type || '')
    if (!isWorkflowBindUnbound(kind, n.data)) continue
    out.push({
      id: n.id,
      label: String(n.data?.label || getNodeLabel(kind)),
      kind,
    })
  }
  return out
}

/** 未配置必填绑定时提示并打开首个节点；通过返回 true */
function ensureBindConfigured(): boolean {
  const unbound = findUnboundBindNodes()
  if (!unbound.length) return true
  const first = unbound[0]!
  const kindLabel = t(`editor.bindKind.${first.kind}` as any)
  toast.add({
    title: t('editor.bindRequired', { name: first.label, kind: kindLabel }),
    description: unbound.length > 1
      ? t('editor.bindRequiredMore', { n: unbound.length - 1 })
      : undefined,
    color: 'warning',
  })
  const node = nodes.value.find(n => n.id === first.id)
  if (node) {
    selectedNode.value = node
    configDrawer.value = true
    handleNodeClick({ node })
  }
  return false
}

const handleSave = async () => {
  if (isSmokeTest.value) {
    toast.add({ title: t('editor.noSaveOnTest'), color: 'info' })
    return
  }
  if (!ensureBindConfigured()) return
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
          ? {
              reason: n.data?.waitReason || 'approval',
              message: n.data?.waitMessage || '',
              timeout_sec: Number(n.data?.timeoutSec || 0) || undefined,
            }
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
                    ...(Number(n.data?.topK) > 0 ? { top_k: Number(n.data.topK) } : {}),
                    ...(Number(n.data?.minScore) > 0 ? { min_score: Number(n.data.minScore) } : {}),
                    ...(n.data?.searchMode ? { search_mode: n.data.searchMode } : {}),
                    ...(n.data?.rerank === true || n.data?.rerank === false ? { rerank: n.data.rerank } : {}),
                    ...(n.data?.rerankProviderId ? { rerank_provider_id: n.data.rerankProviderId } : {}),
                    ...(n.data?.hybridSemanticWeight != null && n.data?.hybridSemanticWeight !== ''
                      ? { hybrid_semantic_weight: Number(n.data.hybridSemanticWeight) }
                      : {}),
                  }
                : n.type === 'subflow'
                  ? {
                      workflow_id: n.data?.subflowWorkflowId || n.data?.workflowId || '',
                    }
                  : undefined,
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
  if (!ensureBindConfigured()) return

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
  navigateTo('/workflows')
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

  isDebugging.value = true
  executionLogs.value = []
  currentExecution.value = null
  showDebugPanel.value = true

  try {
    const input = prepareDebugInput()
    if (!input) {
      isDebugging.value = false
      return
    }

    const res = await debug(workflowId.value, input, undefined, startFromNode)
    if (res.error) {
      toast.add({ title: res.error, color: 'error' })
      isDebugging.value = false
      return
    }

    toast.add({
      title: startFromNode
        ? t('editor.debugFromNodeStarted', { node: nodeDisplayName(startFromNode) || startFromNode })
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

const debugFromSelectedNode = async () => {
  if (!selectedNode.value?.id) return
  saveNodeConfig()
  configDrawer.value = false
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
  toast.add({ title: t('editor.runCancelled'), color: 'success' })
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
  // 很久还显示「运行中」：多半是上次没取消干净，提示一下
  if (['running', 'debugging', 'pending'].includes(item.status || '')) {
    const raw = item.started_at || item.created_at
    if (raw) {
      const ageMs = Date.now() - new Date(raw).getTime()
      if (Number.isFinite(ageMs) && ageMs > 10 * 60 * 1000) {
        parts.push(t('editor.debugHistoryStale'))
      }
    }
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
  }))
})

/** 更早试跑：排除当前正在看的那一次 */
const olderHistoryItems = computed(() => {
  const curId = currentExecution.value?.id
  return historyItems.value.filter(row => row.item.id !== curId)
})

const execInputPreview = computed(() => inputPreviewFrom(currentExecution.value || {}))

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

/** 这一次试跑的步骤时间线（审批挂在 wait 步骤说明里） */
const execTimeline = computed(() => {
  const ex = currentExecution.value
  if (!ex) return [] as {
    key: string
    nodeType: string
    label: string
    status: string
    note: string
  }[]
  const runs = (ex.node_runs || []) as {
    id?: string
    node_id: string
    node_type?: string
    status?: string
    error?: string
    attempt?: number
    duration_ms?: number
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
        nodeType: 'default',
        label: nodeDisplayName(ex.current_node),
        status: ex.status === 'waiting' ? 'waiting' : (ex.status || 'running'),
        note: ex.status === 'waiting' ? t('editor.debugTimelineWaiting') : '',
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
        nodeType: 'human_action',
        label: action === 'reject'
          ? t('editor.debugTimelineRejectAction', { node: waitLabel })
          : t('editor.debugTimelineApproveAction', { node: waitLabel }),
        status: r.status || (action === 'reject' ? 'rejected' : 'approved'),
        note: t('editor.debugTimelineAudit', { actor, when: when ? formatWaitUntil(when) : '—' }) + noteExtra,
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
      note = t('editor.debugTimelineSkipped')
    } else if (r.duration_ms != null && r.duration_ms > 0) {
      note = t('editor.debugTimelineMs', { ms: r.duration_ms })
    }
    return {
      key: r.id || `${r.node_id}-${r.attempt || i}`,
      nodeType,
      label,
      status: r.status || 'pending',
      note,
    }
  })
})

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
  listModels().then((res) => {
    modelOptions.value = (res.data || [])
      .filter(m => m.id)
      .map(m => ({ label: m.name || m.id, value: m.id }))
  })
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

.field__hint {
  margin: 0;
  font-size: 11px;
  line-height: 1.4;
  color: var(--cf-ink-soft, #64748b);
  opacity: 0.85;
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
  display: block;
  width: 100%;
  text-align: left;
  padding: 8px 12px;
  margin-bottom: 8px;
  background: var(--cf-bg, #f8fafc);
  border-radius: 6px;
  font-size: 12px;
  border: 1px solid transparent;
  border-left: 3px solid var(--cf-line, #e2e8f0);
  cursor: pointer;
}
.debug-log-item:hover {
  border-color: color-mix(in oklab, var(--cf-accent, #3b82f6) 35%, transparent);
}
.debug-log-item.is-selected {
  border-color: color-mix(in oklab, var(--cf-accent, #3b82f6) 55%, transparent);
  background: color-mix(in oklab, var(--cf-accent, #3b82f6) 8%, #fff);
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
  padding: 8px 0;
  border-bottom: 1px solid color-mix(in oklab, var(--cf-line, #e2e8f0) 70%, transparent);
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
