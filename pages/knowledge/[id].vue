<template>
  <div class="cf-page">
    <div class="cf-page-header kb-detail-header">
      <div class="kb-detail-heading">
        <CfButton tone="secondary" icon="i-lucide-arrow-left" @click="goBack">
          {{ t('common.back') }}
        </CfButton>
        <div class="kb-detail-titles">
          <h1 class="cf-page-title">{{ selectedKB?.name || t('kb.fallbackTitle') }}</h1>
          <p class="cf-page-sub">{{ selectedKB?.description || t('common.noDesc') }}</p>
        </div>
      </div>
    </div>

    <div v-if="pageLoading" class="cf-state">
      <UIcon name="i-lucide-loader-circle" class="size-6 animate-spin" />
      <span>{{ t('common.loading') }}</span>
    </div>

    <div v-else-if="!selectedKB" class="cf-state">
      <UIcon name="i-lucide-book-x" class="size-8 opacity-50" />
      <p>{{ t('kb.notFound') }}</p>
      <CfButton tone="secondary" icon="i-lucide-arrow-left" @click="goBack">
        {{ t('common.back') }}
      </CfButton>
    </div>

    <template v-else>
      <UTabs
        v-model="drawerActiveTab"
        :items="drawerTabs"
        class="w-full"
      >
        <template #docs>
          <div class="docs-toolbar">
            <div class="docs-toolbar__left">
              <span class="cf-muted">{{ t('kb.docs', { n: documents.length }) }}</span>
            </div>
            <CfButton tone="primary" icon="i-lucide-plus" @click="openUploadModal">
              {{ t('kb.addFile') }}
            </CfButton>
          </div>

          <div v-if="docsLoading" class="cf-state cf-state--compact">
            <UIcon name="i-lucide-loader-circle" class="size-5 animate-spin" />
            <span>{{ t('common.loading') }}</span>
          </div>

          <div v-else-if="documents.length === 0" class="cf-state cf-state--compact">
              <UIcon name="i-lucide-file" class="size-7 opacity-50" />
              <p>{{ t('kb.noDocs') }}</p>
            </div>

            <div
              v-else
              class="docs-workspace"
              :class="{
                'docs-workspace--preview': !!previewDoc,
                'docs-workspace--preview-max': !!previewDoc && previewMaximized,
              }"
            >
              <div v-show="!(previewDoc && previewMaximized)" class="docs-list-pane">
                <div class="cf-table-wrap">
                  <table class="cf-data-table">
                    <thead>
                      <tr>
                        <th>{{ t('common.name') }}</th>
                        <th>{{ t('common.status') }}</th>
                        <th v-if="!previewDoc">{{ t('kb.chunks') }}</th>
                        <th v-if="!previewDoc">{{ t('kb.size') }}</th>
                        <th v-if="!previewDoc">{{ t('kb.time') }}</th>
                        <th class="cf-col-actions">{{ t('common.actions') }}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        v-for="doc in pagedDocuments"
                        :key="doc.id"
                        class="doc-row"
                        :class="{ 'doc-row--active': previewDoc?.id === doc.id }"
                        @click="openDocPreview(doc)"
                      >
                        <td>
                          <button
                            type="button"
                            class="doc-name-cell doc-name-btn"
                            :title="t('kb.openPreview')"
                            @click.stop="openDocPreview(doc)"
                          >
                            <UIcon :name="getFileIcon(doc.file_type)" class="size-4 shrink-0 opacity-60" />
                            <span class="doc-name">{{ doc.name }}</span>
                          </button>
                        </td>
                        <td>
                          <UBadge size="sm" variant="subtle" :color="docStatusColor(doc.status)">
                            {{ docStatusLabel(doc.status) }}
                          </UBadge>
                        </td>
                        <td v-if="!previewDoc" class="cf-muted">{{ doc.chunk_count || '—' }}</td>
                        <td v-if="!previewDoc" class="cf-muted">{{ formatFileSize(doc.file_size) }}</td>
                        <td v-if="!previewDoc" class="cf-muted">{{ d(doc.created_at) }}</td>
                        <td @click.stop>
                          <div class="action-btns">
                            <CfButton
                              tone="icon"
                              icon="i-lucide-scan-text"
                              :tip="t('kb.reparse')"
                              @click="handleReparseDoc(doc)"
                            />
                            <CfButton
                              tone="icon-danger"
                              icon="i-lucide-trash-2"
                              :tip="t('common.delete')"
                              @click="askDeleteDoc(doc)"
                            />
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div v-if="documents.length > 0" class="doc-pager">
                  <CfButton tone="secondary" icon="i-lucide-chevron-left" :disabled="docPage <= 1" @click="docPage -= 1">
                    {{ t('common.prev') }}
                  </CfButton>
                  <span class="cf-muted">{{ t('kb.pageOf', { page: docPage, total: docPageCount }) }}</span>
                  <CfButton tone="secondary" icon="i-lucide-chevron-right" :disabled="docPage >= docPageCount" @click="docPage += 1">
                    {{ t('common.next') }}
                  </CfButton>
                </div>
              </div>

              <aside
                v-if="previewDoc"
                class="docs-preview-pane"
                :class="{ 'docs-preview-pane--max': previewMaximized }"
              >
                <div class="preview-toolbar">
                  <div class="preview-title-wrap">
                    <UIcon :name="getFileIcon(previewDoc.file_type)" class="size-4 shrink-0 opacity-70" />
                    <span class="preview-title">{{ previewDoc.name }}</span>
                  </div>
                  <div class="preview-toolbar__actions">
                    <div
                      v-if="previewDoc.previewable && previewDoc.editable"
                      class="preview-mode-switch"
                      role="tablist"
                      :aria-label="t('kb.docViewMode')"
                    >
                      <button
                        type="button"
                        role="tab"
                        class="preview-mode-btn"
                        :class="{ 'preview-mode-btn--active': previewMode === 'preview' }"
                        :aria-selected="previewMode === 'preview'"
                        @click="setPreviewMode('preview')"
                      >
                        {{ t('kb.modePreview') }}
                      </button>
                      <button
                        type="button"
                        role="tab"
                        class="preview-mode-btn"
                        :class="{ 'preview-mode-btn--active': previewMode === 'edit' }"
                        :aria-selected="previewMode === 'edit'"
                        @click="setPreviewMode('edit')"
                      >
                        {{ t('kb.modeEdit') }}
                      </button>
                    </div>
                    <CfButton
                      tone="icon"
                      :icon="previewMaximized ? 'i-lucide-minimize-2' : 'i-lucide-maximize-2'"
                      :tip="previewMaximized ? t('common.restore') : t('common.maximize')"
                      @click="previewMaximized = !previewMaximized"
                    />
                    <CfButton
                      tone="icon"
                      icon="i-lucide-x"
                      :tip="t('kb.closePreview')"
                      @click="closeDocPreview"
                    />
                  </div>
                </div>
                <div class="preview-meta">
                  <UBadge size="sm" variant="subtle" :color="docStatusColor(previewDoc.status)">
                    {{ docStatusLabel(previewDoc.status) }}
                  </UBadge>
                  <span class="cf-muted">{{ t('kb.chunks') }} {{ previewDoc.chunk_count || 0 }}</span>
                  <span class="cf-muted">{{ formatFileSize(previewDoc.file_size) }}</span>
                  <span v-if="previewDirty" class="preview-dirty">{{ t('kb.unsaved') }}</span>
                </div>
                <div v-if="previewDoc.error" class="preview-error">{{ previewDoc.error }}</div>
                <div v-if="previewLoading" class="cf-state cf-state--compact">
                  <UIcon name="i-lucide-loader-circle" class="size-5 animate-spin" />
                  <span>{{ t('common.loading') }}</span>
                </div>
                <div v-else-if="!previewDoc.previewable" class="preview-empty">
                  <UIcon name="i-lucide-eye-off" class="size-7 opacity-50" />
                  <p>{{ previewDoc.preview_note || t('kb.previewUnsupported') }}</p>
                </div>
                <template v-else-if="previewMode === 'edit' && previewDoc.editable">
                  <textarea
                    v-model="previewEditContent"
                    class="preview-editor"
                    :placeholder="t('kb.editPlaceholder')"
                    spellcheck="false"
                  />
                  <div class="preview-edit-bar">
                    <span class="cf-muted">{{ t('kb.editHint') }}</span>
                    <div class="preview-edit-bar__actions">
                      <CfButton tone="secondary" icon="i-lucide-rotate-ccw" :disabled="previewSaving || !previewDirty" @click="resetPreviewEdit">
                        {{ t('common.reset') }}
                      </CfButton>
                      <CfButton
                        tone="primary"
                        icon="i-lucide-save"
                        :loading="previewSaving"
                        :disabled="!previewDirty"
                        @click="savePreviewEdit"
                      >
                        {{ t('common.save') }}
                      </CfButton>
                    </div>
                  </div>
                </template>
                <template v-else>
                  <p v-if="previewDoc.truncated" class="preview-truncated">{{ previewDoc.preview_note || t('kb.previewTruncated') }}</p>
                  <div
                    v-if="previewDoc.file_type === 'md'"
                    class="preview-body preview-body--md chat-markdown"
                    v-html="renderPreviewMarkdown(previewDisplayContent)"
                  />
                  <pre v-else class="preview-body preview-body--plain">{{ previewDisplayContent }}</pre>
                </template>
              </aside>
            </div>
          </template>

          <template #search>
            <div class="search-panel">
              <div class="search-compose">
                <div class="search-compose__bar">
                  <button
                    type="button"
                    class="search-mode-chip"
                    :aria-label="t('kb.searchSettings')"
                    @click="openSearchSettings"
                  >
                    <UIcon :name="searchModeIcon(searchMode)" class="size-3.5 shrink-0" />
                    <span>{{ searchModeLabel(searchMode) }}</span>
                    <UIcon name="i-lucide-sliders-horizontal" class="size-3.5 shrink-0 opacity-70" />
                  </button>
                  <UTooltip :text="t('kb.searchQueryTip')" :content="fieldHelpTooltipContent" :ui="fieldHelpTooltipUi">
                    <button type="button" class="field__help" :aria-label="t('kb.searchQueryTip')">
                      <UIcon name="i-lucide-circle-help" class="size-3.5" />
                    </button>
                  </UTooltip>
                </div>
                <UTextarea
                  v-model="searchQuery"
                  class="search-textarea"
                  :rows="4"
                  autoresize
                  :placeholder="t('kb.searchPh')"
                  @keydown="onSearchKeydown"
                />
              </div>
              <div class="search-toolbar">
                <span class="search-toolbar__meta cf-muted">
                  {{ t('kb.searchTestMeta', { mode: searchModeLabel(searchMode), k: searchTopK }) }}
                </span>
                <div class="search-actions">
                  <CfButton tone="secondary" icon="i-lucide-eraser" @click="clearSearch">
                    {{ t('kb.clear') }}
                  </CfButton>
                  <CfButton
                    tone="primary"
                    icon="i-lucide-play"
                    :loading="searchLoading"
                    @click="handleSearch"
                  >
                    {{ t('kb.search') }}
                  </CfButton>
                </div>
              </div>
            </div>

            <div v-if="searchResults.length > 0" class="search-results">
              <div class="results-header">
                <span>{{ t('kb.searchHits', { n: searchResults.length }) }}</span>
                <span class="cf-muted">{{ t('kb.searchMs', { ms: searchDuration }) }}</span>
              </div>

              <div v-for="result in searchResults" :key="result.chunk_id" class="result-item">
                <div class="result-header">
                  <span class="result-doc-name">{{ result.document_name }}</span>
                  <UBadge size="sm" variant="subtle" :color="getScoreColor(result.score)">
                    {{ t('kb.score', { n: (result.score * 100).toFixed(1) }) }}
                  </UBadge>
                </div>
                <div class="result-content">{{ result.content }}</div>
              </div>
            </div>

            <div v-else-if="!searchLoading && hasSearched" class="cf-state cf-state--compact">
              <UIcon name="i-lucide-search-x" class="size-7 opacity-50" />
              <p>{{ t('kb.noHits') }}</p>
            </div>
          </template>

          <template #settings>
            <div class="settings-panel">
              <section class="settings-section">
                <h3 class="settings-section__title">{{ t('kb.settingsSearchMode') }}</h3>
                <p class="settings-section__desc">{{ t('kb.settingsSearchModeDesc') }}</p>
                <div class="search-mode-list" role="radiogroup" :aria-label="t('kb.settingsSearchMode')">
                  <label
                    class="search-mode-card"
                    :class="{ 'search-mode-card--on': settingsForm.search_mode === 'semantic' }"
                  >
                    <input
                      v-model="settingsForm.search_mode"
                      class="search-mode-card__radio"
                      type="radio"
                      name="kb-search-mode"
                      value="semantic"
                    >
                    <div class="search-mode-card__body">
                      <div class="search-mode-card__head">
                        <span class="search-mode-card__title">{{ t('kb.searchModeSemantic') }}</span>
                        <span class="search-mode-card__hint">{{ t('kb.searchModeSemanticDesc') }}</span>
                      </div>
                      <div class="search-mode-card__rerank" @click.stop>
                        <span>{{ t('kb.rerankEnable') }}</span>
                        <USwitch v-model="settingsForm.rerank_semantic" size="sm" />
                      </div>
                    </div>
                  </label>
                  <label
                    class="search-mode-card"
                    :class="{ 'search-mode-card--on': settingsForm.search_mode === 'keyword' }"
                  >
                    <input
                      v-model="settingsForm.search_mode"
                      class="search-mode-card__radio"
                      type="radio"
                      name="kb-search-mode"
                      value="keyword"
                    >
                    <div class="search-mode-card__body">
                      <div class="search-mode-card__head">
                        <span class="search-mode-card__title">{{ t('kb.searchModeKeyword') }}</span>
                        <span class="search-mode-card__hint">{{ t('kb.searchModeKeywordDesc') }}</span>
                      </div>
                      <div class="search-mode-card__rerank" @click.stop>
                        <span>{{ t('kb.rerankEnable') }}</span>
                        <USwitch v-model="settingsForm.rerank_keyword" size="sm" />
                      </div>
                    </div>
                  </label>
                  <label
                    class="search-mode-card"
                    :class="{ 'search-mode-card--on': settingsForm.search_mode === 'hybrid' }"
                  >
                    <input
                      v-model="settingsForm.search_mode"
                      class="search-mode-card__radio"
                      type="radio"
                      name="kb-search-mode"
                      value="hybrid"
                    >
                    <div class="search-mode-card__body">
                      <div class="search-mode-card__head">
                        <span class="search-mode-card__title">{{ t('kb.searchModeHybrid') }}</span>
                        <span class="search-mode-card__hint">{{ t('kb.searchModeHybridDesc') }}</span>
                      </div>
                      <div class="search-mode-card__rerank" @click.stop>
                        <span>{{ t('kb.rerankEnable') }}</span>
                        <USwitch v-model="settingsForm.rerank_hybrid" size="sm" />
                      </div>
                    </div>
                  </label>
                </div>
              </section>

              <section class="settings-section">
                <h3 class="settings-section__title">{{ t('kb.settingsRetrieveParams') }}</h3>
                <p class="settings-section__desc">{{ t('kb.settingsRetrieveParamsDesc') }}</p>
                <div class="parse-grid">
                  <div class="field">
                    <label class="field__label">
                      <span>{{ t('kb.ragTopK') }}</span>
                      <UTooltip :text="t('kb.ragTopKTip')" :content="fieldHelpTooltipContent" :ui="fieldHelpTooltipUi">
                        <button type="button" class="field__help" :aria-label="t('kb.ragTopKTip')">
                          <UIcon name="i-lucide-circle-help" class="size-3.5" />
                        </button>
                      </UTooltip>
                    </label>
                    <UInput v-model.number="settingsForm.rag_top_k" type="number" :min="1" :max="20" />
                  </div>
                  <div class="field">
                    <label class="field__label">
                      <span>{{ t('kb.ragMinScore') }}</span>
                      <UTooltip :text="t('kb.ragMinScoreTip')" :content="fieldHelpTooltipContent" :ui="fieldHelpTooltipUi">
                        <button type="button" class="field__help" :aria-label="t('kb.ragMinScoreTip')">
                          <UIcon name="i-lucide-circle-help" class="size-3.5" />
                        </button>
                      </UTooltip>
                    </label>
                    <UInput
                      v-model.number="settingsForm.rag_min_score"
                      type="number"
                      :min="0"
                      :max="1"
                      :step="0.05"
                    />
                  </div>
                </div>
              </section>

              <div class="settings-actions">
                <CfButton
                  tone="primary"
                  icon="i-lucide-save"
                  :loading="settingsSaving"
                  @click="saveKBSettings"
                >
                  {{ t('common.save') }}
                </CfButton>
              </div>
            </div>
          </template>

        </UTabs>

    <USlideover
      v-model:open="searchSettingsOpen"
      :title="t('kb.searchSettings')"
      :description="t('kb.searchSettingsDesc')"
      :ui="{ content: 'max-w-md w-full' }"
    >
      <template #body>
        <div class="search-settings">
          <section class="settings-section">
            <h3 class="settings-section__title">{{ t('kb.settingsSearchMode') }}</h3>
            <div class="search-mode-list" role="radiogroup" :aria-label="t('kb.settingsSearchMode')">
              <label
                class="search-mode-card"
                :class="{ 'search-mode-card--on': searchDraft.mode === 'semantic' }"
              >
                <input
                  v-model="searchDraft.mode"
                  class="search-mode-card__radio"
                  type="radio"
                  name="kb-search-test-mode"
                  value="semantic"
                >
                <div class="search-mode-card__body">
                  <div class="search-mode-card__head">
                    <span class="search-mode-card__title">
                      <UIcon :name="searchModeIcon('semantic')" class="size-4" />
                      {{ t('kb.searchModeSemantic') }}
                    </span>
                    <span class="search-mode-card__hint">{{ t('kb.searchModeSemanticDesc') }}</span>
                  </div>
                  <div v-if="searchDraft.mode === 'semantic'" class="search-mode-card__rerank" @click.stop>
                    <span>{{ t('kb.rerankEnable') }}</span>
                    <USwitch v-model="searchDraft.rerank" size="sm" />
                  </div>
                </div>
              </label>
              <label
                class="search-mode-card"
                :class="{ 'search-mode-card--on': searchDraft.mode === 'keyword' }"
              >
                <input
                  v-model="searchDraft.mode"
                  class="search-mode-card__radio"
                  type="radio"
                  name="kb-search-test-mode"
                  value="keyword"
                >
                <div class="search-mode-card__body">
                  <div class="search-mode-card__head">
                    <span class="search-mode-card__title">
                      <UIcon :name="searchModeIcon('keyword')" class="size-4" />
                      {{ t('kb.searchModeKeyword') }}
                    </span>
                    <span class="search-mode-card__hint">{{ t('kb.searchModeKeywordDesc') }}</span>
                  </div>
                  <div v-if="searchDraft.mode === 'keyword'" class="search-mode-card__rerank" @click.stop>
                    <span>{{ t('kb.rerankEnable') }}</span>
                    <USwitch v-model="searchDraft.rerank" size="sm" />
                  </div>
                </div>
              </label>
              <label
                class="search-mode-card"
                :class="{ 'search-mode-card--on': searchDraft.mode === 'hybrid' }"
              >
                <input
                  v-model="searchDraft.mode"
                  class="search-mode-card__radio"
                  type="radio"
                  name="kb-search-test-mode"
                  value="hybrid"
                >
                <div class="search-mode-card__body">
                  <div class="search-mode-card__head">
                    <span class="search-mode-card__title">
                      <UIcon :name="searchModeIcon('hybrid')" class="size-4" />
                      {{ t('kb.searchModeHybrid') }}
                    </span>
                    <span class="search-mode-card__hint">{{ t('kb.searchModeHybridDesc') }}</span>
                  </div>
                  <div v-if="searchDraft.mode === 'hybrid'" class="search-mode-card__rerank" @click.stop>
                    <span>{{ t('kb.rerankEnable') }}</span>
                    <USwitch v-model="searchDraft.rerank" size="sm" />
                  </div>
                </div>
              </label>
            </div>
          </section>

          <section class="settings-section">
            <div class="field">
              <label class="field__label">
                <span>{{ t('kb.ragTopK') }}</span>
                <UTooltip :text="t('kb.ragTopKTip')" :content="fieldHelpTooltipContent" :ui="fieldHelpTooltipUi">
                  <button type="button" class="field__help" :aria-label="t('kb.ragTopKTip')">
                    <UIcon name="i-lucide-circle-help" class="size-3.5" />
                  </button>
                </UTooltip>
              </label>
              <div class="search-topk-row">
                <UInput
                  v-model.number="searchDraft.top_k"
                  type="number"
                  :min="1"
                  :max="20"
                  class="search-topk-input"
                />
                <input
                  v-model.number="searchDraft.top_k"
                  class="search-topk-slider"
                  type="range"
                  min="1"
                  max="20"
                  step="1"
                >
              </div>
            </div>
            <div class="field">
              <label class="field__label">
                <span>{{ t('kb.ragMinScore') }}</span>
                <UTooltip :text="t('kb.ragMinScoreTip')" :content="fieldHelpTooltipContent" :ui="fieldHelpTooltipUi">
                  <button type="button" class="field__help" :aria-label="t('kb.ragMinScoreTip')">
                    <UIcon name="i-lucide-circle-help" class="size-3.5" />
                  </button>
                </UTooltip>
              </label>
              <UInput
                v-model.number="searchDraft.min_score"
                type="number"
                :min="0"
                :max="1"
                :step="0.05"
              />
            </div>
          </section>
        </div>
      </template>
      <template #footer>
        <div class="modal-actions">
          <div class="modal-actions__right">
            <CfButton tone="secondary" @click="searchSettingsOpen = false">{{ t('common.cancel') }}</CfButton>
            <CfButton tone="primary" icon="i-lucide-check" @click="applySearchSettings">
              {{ t('common.save') }}
            </CfButton>
          </div>
        </div>
      </template>
    </USlideover>

    <CfModal
      v-model:open="uploadModalVisible"
      :title="t('kb.addFile')"
      :description="t('kb.uploadModalDesc')"
      :ui="{ content: 'sm:max-w-5xl' }"
      @update:open="onUploadModalOpen"
    >
      <template #body>
        <div class="upload-panel upload-panel--modal">

              <div class="upload-panel__head">
                <nav class="upload-stepper" :aria-label="t('kb.uploadSteps')">
                  <ol class="upload-stepper__list">
                    <li
                      class="upload-stepper__item"
                      :class="{
                        'upload-stepper__item--on': uploadStep === 1,
                        'upload-stepper__item--done': uploadStep > 1,
                      }"
                    >
                      <button
                        type="button"
                        class="upload-stepper__btn"
                        :aria-current="uploadStep === 1 ? 'step' : undefined"
                        @click="goUploadStep(1)"
                      >
                        <span class="upload-stepper__index" aria-hidden="true">
                          <UIcon v-if="uploadStep > 1" name="i-lucide-check" class="size-3.5" />
                          <template v-else>1</template>
                        </span>
                        <span class="upload-stepper__text">
                          <span class="upload-stepper__title">{{ t('kb.uploadStepFile') }}</span>
                          <span class="upload-stepper__desc">{{ t('kb.uploadStepFileDesc') }}</span>
                        </span>
                      </button>
                    </li>
                    <li class="upload-stepper__rail" aria-hidden="true" />
                    <li
                      class="upload-stepper__item"
                      :class="{
                        'upload-stepper__item--on': uploadStep === 2,
                        'upload-stepper__item--locked': uploadStep === 1 && !uploadFiles?.length,
                      }"
                    >
                      <button
                        type="button"
                        class="upload-stepper__btn"
                        :aria-current="uploadStep === 2 ? 'step' : undefined"
                        :disabled="uploadStep === 1 && !uploadFiles?.length"
                        @click="goUploadStep(2)"
                      >
                        <span class="upload-stepper__index" aria-hidden="true">2</span>
                        <span class="upload-stepper__text">
                          <span class="upload-stepper__title">{{ t('kb.uploadStepParse') }}</span>
                          <span class="upload-stepper__desc">{{ t('kb.uploadStepParseDesc') }}</span>
                        </span>
                      </button>
                    </li>
                  </ol>
                </nav>
              </div>
              <div v-if="uploadStep === 1">
                <UFileUpload
                  v-model="uploadFiles"
                  multiple
                  accept=".pdf,.txt,.md,.docx,.html"
                  icon="i-lucide-cloud-upload"
                  file-icon="i-lucide-file-text"
                  :file-image="false"
                  :label="t('kb.uploadLabel')"
                  :description="t('kb.uploadDesc')"
                  layout="list"
                />
              </div>
              <div v-else class="parse-step">
                <p class="parse-step__hint">{{ t('kb.parseHint', { n: uploadFiles?.length || 0 }) }}</p>
                <ul v-if="uploadFiles?.length" class="upload-file-list">
                  <li
                    v-for="file in uploadFiles"
                    :key="file.name + file.size"
                    class="upload-file-list__item"
                    :class="{ 'upload-file-list__item--bad': file.size > MAX_UPLOAD_BYTES }"
                  >
                    <span class="upload-file-list__name">{{ file.name }}</span>
                    <span>{{ formatBytes(file.size) }}</span>
                  </li>
                </ul>
                <p v-if="chunkPreviewError" class="field__error" role="alert">{{ chunkPreviewError }}</p>
                <div class="parse-grid">
                  <div class="field">
                    <label class="field__label">
                      <span>{{ t('kb.splitMode') }}</span>
                      <UTooltip :text="t('kb.splitModeTip')" :content="fieldHelpTooltipContent" :ui="fieldHelpTooltipUi">
                        <button type="button" class="field__help" :aria-label="t('kb.splitModeTip')">
                          <UIcon name="i-lucide-circle-help" class="size-3.5" />
                        </button>
                      </UTooltip>
                    </label>
                    <USelect
                      v-model="parseForm.split_mode"
                      :items="splitModeOptions"
                      value-key="value"
                      class="w-full"
                    />
                  </div>
                  <div class="field">
                    <label class="field__label">
                      <span>{{ t('kb.chunkSize') }}</span>
                      <UTooltip :text="t('kb.chunkSizeTip')" :content="fieldHelpTooltipContent" :ui="fieldHelpTooltipUi">
                        <button type="button" class="field__help" :aria-label="t('kb.chunkSizeTip')">
                          <UIcon name="i-lucide-circle-help" class="size-3.5" />
                        </button>
                      </UTooltip>
                    </label>
                    <UInput v-model.number="parseForm.chunk_size" type="number" :min="64" :max="4000" />
                  </div>
                  <div class="field">
                    <label class="field__label">
                      <span>{{ t('kb.chunkOverlap') }}</span>
                      <UTooltip :text="t('kb.chunkOverlapTip')" :content="fieldHelpTooltipContent" :ui="fieldHelpTooltipUi">
                        <button type="button" class="field__help" :aria-label="t('kb.chunkOverlapTip')">
                          <UIcon name="i-lucide-circle-help" class="size-3.5" />
                        </button>
                      </UTooltip>
                    </label>
                    <UInput v-model.number="parseForm.chunk_overlap" type="number" :min="0" :max="2000" />
                  </div>
                  <div v-if="parseForm.split_mode === 'separator'" class="field">
                    <label class="field__label">
                      <span>{{ t('kb.splitSeparator') }}</span>
                      <UTooltip :text="t('kb.splitSeparatorTip')" :content="fieldHelpTooltipContent" :ui="fieldHelpTooltipUi">
                        <button type="button" class="field__help" :aria-label="t('kb.splitSeparatorTip')">
                          <UIcon name="i-lucide-circle-help" class="size-3.5" />
                        </button>
                      </UTooltip>
                    </label>
                    <UInput v-model="parseForm.split_separator" :placeholder="t('kb.splitSeparatorPh')" />
                  </div>
                </div>
                <div class="parse-preview-actions">
                  <CfButton
                    tone="secondary"
                    icon="i-lucide-eye"
                    :loading="chunkPreviewLoading"
                    :disabled="!uploadFiles?.length || !!oversizedFile()"
                    @click="handlePreviewChunks"
                  >
                    {{ t('kb.previewChunks') }}
                  </CfButton>
                  <span v-if="chunkPreview" class="cf-muted">
                    {{ t('kb.previewSummary', { total: chunkPreview.total_chunks, chars: chunkPreview.char_count }) }}
                  </span>
                </div>
                <div v-if="chunkPreview?.chunks?.length" class="chunk-preview-list">
                  <div v-for="chunk in chunkPreview.chunks" :key="chunk.index" class="chunk-preview-item">
                    <div class="chunk-preview-item__meta">
                      #{{ chunk.index + 1 }} · {{ chunk.char_count }} {{ t('kb.chars') }}
                    </div>
                    <pre class="chunk-preview-item__body">{{ chunk.content }}</pre>
                  </div>
                </div>
              </div>
        </div>
      </template>
      <template #footer>
        <div class="modal-actions">
          <div class="modal-actions__left">
            <CfButton
              v-if="uploadStep === 2"
              tone="secondary"
              icon="i-lucide-arrow-left"
              @click="uploadStep = 1"
            >
              {{ t('common.back') }}
            </CfButton>
          </div>
          <div class="modal-actions__right">
            <CfButton
              v-if="uploadStep === 1"
              tone="primary"
              icon="i-lucide-arrow-right"
              :disabled="!uploadFiles?.length"
              @click="goParseStep"
            >
              {{ t('kb.nextParse') }}
            </CfButton>
            <CfButton
              v-else
              tone="primary"
              icon="i-lucide-cloud-upload"
              :loading="uploadLoading"
              :disabled="!uploadFiles?.length || !!oversizedFile()"
              @click="handleUploadSubmit"
            >
              {{ t('kb.upload') }}
            </CfButton>
          </div>
        </div>
      </template>
    </CfModal>


    <!-- Delete Doc confirm -->
    <CfModal v-model:open="deleteDocVisible" :title="t('common.deleteConfirm')" :ui="{ content: 'sm:max-w-md' }">
      <template #body>
        <p class="delete-text">
          {{ t('kb.deleteDocText', { name: deletingDoc?.name ?? '' }) }}
        </p>
      </template>
      <template #footer>
        <div class="modal-actions">
          <div class="modal-actions__right">
            <CfButton tone="secondary" @click="deleteDocVisible = false">{{ t('common.cancel') }}</CfButton>
            <CfButton
              tone="danger"
              strong
              icon="i-lucide-trash-2"
              :loading="deletingDocLoading"
              @click="confirmDeleteDoc"
            >
              {{ t('common.delete') }}
            </CfButton>
          </div>
        </div>
      </template>
    </CfModal>

    </template>
  </div>
</template>

<script setup lang="ts">
import type {
  KnowledgeBase,
  Document,
  DocumentPreview,
  UpdateKBInput,
  SearchResult,
  ParseOptions,
  ChunkPreviewResponse,
} from '@/composables/useKnowledgeBases'
import { renderChatMarkdown } from '~/utils/chatMarkdown'

definePageMeta({
  layout: 'default',
})

const toast = useToast()
const { t, d } = useLocale()
const route = useRoute()
const {
  getKB,
  updateKB,
  listDocs,
  getDoc,
  updateDocContent,
  uploadDoc,
  previewChunks,
  deleteDoc,
  reparseDoc,
  searchKB,
} = useKnowledgeBases()

const pageLoading = ref(true)
const selectedKB = ref<KnowledgeBase | null>(null)
const uploadModalVisible = ref(false)

// Documents
const drawerActiveTab = ref('docs')
const docsLoading = ref(false)
const documents = ref<Document[]>([])
const previewDoc = ref<DocumentPreview | null>(null)
const previewLoading = ref(false)
const previewMode = ref<'preview' | 'edit'>('preview')
const previewEditContent = ref('')
const previewSaving = ref(false)
const previewMaximized = ref(false)

const previewDirty = computed(() => {
  if (!previewDoc.value || previewMode.value !== 'edit') return false
  return previewEditContent.value !== (previewDoc.value.content || '')
})

const previewDisplayContent = computed(() => {
  // 可编辑文档：预览也跟编辑稿走，方便「改完切预览」对照
  if (previewDoc.value?.editable) return previewEditContent.value
  return previewDoc.value?.content || ''
})

function clearPreviewState() {
  previewDoc.value = null
  previewLoading.value = false
  previewMode.value = 'preview'
  previewEditContent.value = ''
  previewSaving.value = false
  previewMaximized.value = false
}

watch(drawerActiveTab, (tab) => {
  if (tab !== 'docs') {
    if (previewDirty.value && !window.confirm(t('kb.discardEditConfirm'))) {
      drawerActiveTab.value = 'docs'
      return
    }
    clearPreviewState()
  }
})

function renderPreviewMarkdown(content: string) {
  return renderChatMarkdown(content || '')
}

function setPreviewMode(mode: 'preview' | 'edit') {
  if (!previewDoc.value?.editable && mode === 'edit') return
  if (mode === 'preview' && previewDirty.value) {
    // 切回预览时用当前编辑稿渲染，不丢未保存内容
  }
  if (mode === 'edit' && !previewDirty.value) {
    previewEditContent.value = previewDoc.value?.content || ''
  }
  previewMode.value = mode
}

function resetPreviewEdit() {
  previewEditContent.value = previewDoc.value?.content || ''
}

async function openDocPreview(doc: Document) {
  if (!selectedKB.value) return
  if (previewDirty.value && !window.confirm(t('kb.discardEditConfirm'))) return
  previewLoading.value = true
  previewMode.value = 'preview'
  previewEditContent.value = ''
  previewDoc.value = {
    ...doc,
    content: '',
    previewable: false,
    editable: false,
  }
  const res = await getDoc(selectedKB.value.id, doc.id)
  previewLoading.value = false
  if (res.error || !res.data) {
    toast.add({ title: res.error || t('kb.previewFail'), color: 'error' })
    return
  }
  previewDoc.value = res.data
  previewEditContent.value = res.data.content || ''
}

function closeDocPreview() {
  if (previewDirty.value && !window.confirm(t('kb.discardEditConfirm'))) return
  clearPreviewState()
}

async function savePreviewEdit() {
  if (!selectedKB.value || !previewDoc.value?.editable) return
  previewSaving.value = true
  try {
    const res = await updateDocContent(selectedKB.value.id, previewDoc.value.id, {
      content: previewEditContent.value,
      reparse: true,
    })
    if (res.error || !res.data) {
      toast.add({ title: res.error || t('kb.saveDocFail'), color: 'error' })
      return
    }
    previewDoc.value = res.data
    previewEditContent.value = res.data.content || ''
    previewMode.value = 'preview'
    toast.add({ title: t('kb.saveDocOk'), color: 'success' })
    await fetchDocuments(selectedKB.value.id)
    startDocRefresh()
  } finally {
    previewSaving.value = false
  }
}

const deleteDocVisible = ref(false)
const deletingDocLoading = ref(false)
const deletingDoc = ref<Document | null>(null)

// Upload
const DOC_PAGE_SIZE = 8
const docPage = ref(1)
const docPageCount = computed(() => Math.max(1, Math.ceil(documents.value.length / DOC_PAGE_SIZE)))
const pagedDocuments = computed(() => {
  const start = (docPage.value - 1) * DOC_PAGE_SIZE
  return documents.value.slice(start, start + DOC_PAGE_SIZE)
})
watch(docPageCount, (n) => {
  if (docPage.value > n) docPage.value = n
})
const MAX_UPLOAD_BYTES = 50 * 1024 * 1024
const uploadFiles = ref<File[] | null>(null)
const uploadLoading = ref(false)
const uploadStep = ref<1 | 2>(1)
const chunkPreviewLoading = ref(false)
const chunkPreview = ref<ChunkPreviewResponse | null>(null)
const chunkPreviewError = ref('')
const parseForm = reactive({
  chunk_size: 512,
  chunk_overlap: 50,
  split_mode: 'recursive',
  split_separator: '\\n\\n',
})
const splitModeOptions = computed(() => [
  { label: t('kb.splitRecursive'), value: 'recursive' },
  { label: t('kb.splitFixed'), value: 'fixed' },
  { label: t('kb.splitSeparator'), value: 'separator' },
])
const fieldHelpTooltipContent = { side: 'top' as const, collisionPadding: 8 }
const fieldHelpTooltipUi = { content: 'max-w-xs whitespace-normal' }

function currentParseOptions(): ParseOptions {
  return {
    chunk_size: Number(parseForm.chunk_size) || 512,
    chunk_overlap: Number(parseForm.chunk_overlap) || 0,
    split_mode: parseForm.split_mode || 'recursive',
    split_separator:
      parseForm.split_mode === 'separator'
        ? parseForm.split_separator.replace(/\\n/g, '\n')
        : '\n\n',
  }
}

function formatBytes(n: number) {
  if (!Number.isFinite(n) || n < 1024) return `${Math.max(0, Math.round(n || 0))} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(n >= 10 * 1024 * 1024 ? 0 : 1)} MB`
}

function oversizedFile() {
  return uploadFiles.value?.find((file) => file.size > MAX_UPLOAD_BYTES) || null
}

function tooLargeMessage(file: File) {
  return t('kb.fileTooLarge', { name: file.name, size: formatBytes(file.size) })
}

function resetUploadState() {
  uploadFiles.value = null
  uploadStep.value = 1
  chunkPreview.value = null
  chunkPreviewError.value = ''
  chunkPreviewLoading.value = false
  parseForm.chunk_size = selectedKB.value?.chunk_size || 512
  parseForm.chunk_overlap = selectedKB.value?.chunk_overlap ?? 50
  parseForm.split_mode = selectedKB.value?.split_mode || 'recursive'
  const sep = selectedKB.value?.split_separator || '\n\n'
  parseForm.split_separator = sep === '\n\n' ? '\\n\\n' : sep
}

function goParseStep() {
  if (!uploadFiles.value?.length) {
    toast.add({ title: t('kb.needFiles'), color: 'warning' })
    return
  }
  chunkPreview.value = null
  const big = oversizedFile()
  chunkPreviewError.value = big ? tooLargeMessage(big) : ''
  uploadStep.value = 2
}

function goUploadStep(step: 1 | 2) {
  if (step === 1) {
    uploadStep.value = 1
    return
  }
  goParseStep()
}

async function handlePreviewChunks() {
  const file = uploadFiles.value?.[0]
  if (!selectedKB.value || !file) return
  const big = oversizedFile()
  if (big) {
    chunkPreviewError.value = tooLargeMessage(big)
    toast.add({ title: chunkPreviewError.value, color: 'error' })
    return
  }
  chunkPreviewLoading.value = true
  chunkPreviewError.value = ''
  chunkPreview.value = null
  try {
    const res = await previewChunks(selectedKB.value.id, file, currentParseOptions())
    if (res.error) {
      const msg = /413/.test(res.error) ? t('kb.fileRejected') : res.error
      chunkPreviewError.value = msg
      toast.add({ title: msg, color: 'error' })
      return
    }
    chunkPreview.value = res.data || null
    if (!chunkPreview.value?.chunks?.length) {
      chunkPreviewError.value = t('kb.previewEmpty')
    }
  } finally {
    chunkPreviewLoading.value = false
  }
}

// Search
const searchQuery = ref('')
const searchLoading = ref(false)
const searchResults = ref<SearchResult[]>([])
const searchDuration = ref(0)
const hasSearched = ref(false)
const searchTopK = ref(5)
const searchMinScore = ref(0.3)
const searchMode = ref<'semantic' | 'keyword' | 'hybrid'>('semantic')
const searchRerank = ref(false)
const searchSettingsOpen = ref(false)
const searchDraft = reactive({
  mode: 'semantic' as 'semantic' | 'keyword' | 'hybrid',
  rerank: false,
  top_k: 5,
  min_score: 0.3,
})

function searchModeLabel(mode: string) {
  if (mode === 'keyword') return t('kb.searchModeKeyword')
  if (mode === 'hybrid') return t('kb.searchModeHybrid')
  return t('kb.searchModeSemantic')
}

function searchModeIcon(mode: string) {
  if (mode === 'keyword') return 'i-lucide-layout-grid'
  if (mode === 'hybrid') return 'i-lucide-layers'
  return 'i-lucide-sparkles'
}

function rerankForMode(kb: KnowledgeBase | null, mode: string) {
  if (mode === 'keyword') return !!kb?.rerank_keyword
  if (mode === 'hybrid') return !!kb?.rerank_hybrid
  return !!kb?.rerank_semantic
}

function syncSearchDefaultsFromKB(kb: KnowledgeBase | null) {
  searchTopK.value = kb?.rag_top_k && kb.rag_top_k > 0 ? kb.rag_top_k : 5
  searchMinScore.value = kb?.rag_min_score && kb.rag_min_score > 0 ? kb.rag_min_score : 0.3
  searchMode.value = normalizeSearchMode(kb?.search_mode)
  searchRerank.value = rerankForMode(kb, searchMode.value)
}

function openSearchSettings() {
  searchDraft.mode = searchMode.value
  searchDraft.rerank = searchRerank.value
  searchDraft.top_k = searchTopK.value
  searchDraft.min_score = searchMinScore.value
  searchSettingsOpen.value = true
}

function applySearchSettings() {
  searchMode.value = normalizeSearchMode(searchDraft.mode)
  searchRerank.value = !!searchDraft.rerank
  searchTopK.value = Math.min(20, Math.max(1, Number(searchDraft.top_k) || 5))
  searchMinScore.value = Math.min(1, Math.max(0, Number(searchDraft.min_score) || 0.3))
  searchSettingsOpen.value = false
}

watch(
  () => searchDraft.mode,
  (mode) => {
    if (!searchSettingsOpen.value || !selectedKB.value) return
    searchDraft.rerank = rerankForMode(selectedKB.value, mode)
  },
)

const settingsSaving = ref(false)
const settingsForm = reactive({
  search_mode: 'semantic',
  rerank_semantic: false,
  rerank_keyword: false,
  rerank_hybrid: false,
  rag_top_k: 5,
  rag_min_score: 0.3,
})

function normalizeSearchMode(mode?: string) {
  if (mode === 'keyword' || mode === 'hybrid' || mode === 'semantic') return mode
  return 'semantic'
}

function syncSettingsFromKB(kb: KnowledgeBase | null) {
  settingsForm.search_mode = normalizeSearchMode(kb?.search_mode)
  settingsForm.rerank_semantic = !!kb?.rerank_semantic
  settingsForm.rerank_keyword = !!kb?.rerank_keyword
  settingsForm.rerank_hybrid = !!kb?.rerank_hybrid
  settingsForm.rag_top_k = kb?.rag_top_k && kb.rag_top_k > 0 ? kb.rag_top_k : 5
  settingsForm.rag_min_score = kb?.rag_min_score && kb.rag_min_score > 0 ? kb.rag_min_score : 0.3
}

async function saveKBSettings() {
  if (!selectedKB.value) return
  settingsSaving.value = true
  try {
    const input: UpdateKBInput = {
      search_mode: normalizeSearchMode(settingsForm.search_mode),
      rerank_semantic: !!settingsForm.rerank_semantic,
      rerank_keyword: !!settingsForm.rerank_keyword,
      rerank_hybrid: !!settingsForm.rerank_hybrid,
      rag_top_k: Math.min(20, Math.max(1, Number(settingsForm.rag_top_k) || 5)),
      rag_min_score: Math.min(1, Math.max(0, Number(settingsForm.rag_min_score) || 0.3)),
    }
    const res = await updateKB(selectedKB.value.id, input)
    if (res.error) {
      toast.add({ title: res.error, color: 'error' })
      return
    }
    if (res.data) {
      selectedKB.value = res.data
      syncSearchDefaultsFromKB(res.data)
      syncSettingsFromKB(res.data)
    }
    toast.add({ title: t('common.saveOk'), color: 'success' })
  } finally {
    settingsSaving.value = false
  }
}

const drawerTabs = computed(() => [
  {
    label: t('kb.docsManage'),
    value: 'docs',
    slot: 'docs' as const,
    badge: documents.value.length || undefined,
  },
  {
    label: t('kb.searchTest'),
    value: 'search',
    slot: 'search' as const,
    badge: searchResults.value.length || undefined,
  },
  {
    label: t('kb.settings'),
    value: 'settings',
    slot: 'settings' as const,
  },
])

function getFileIcon(fileType: string) {
  const icons: Record<string, string> = {
    pdf: 'i-lucide-file-text',
    txt: 'i-lucide-file',
    md: 'i-lucide-file',
    docx: 'i-lucide-file',
    html: 'i-lucide-code',
  }
  return icons[fileType] || 'i-lucide-file'
}

function docStatusLabel(status: string) {
  if (status === 'pending' || status === 'processing' || status === 'completed' || status === 'failed') {
    return t(`status.${status}`)
  }
  return status
}

function docStatusColor(status: string): 'success' | 'warning' | 'error' | 'neutral' {
  const map: Record<string, 'success' | 'warning' | 'error' | 'neutral'> = {
    pending: 'neutral',
    processing: 'warning',
    completed: 'success',
    failed: 'error',
  }
  return map[status] || 'neutral'
}

function formatFileSize(bytes: number): string {
  if (!bytes) return '—'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

function getScoreColor(score: number): 'success' | 'warning' | 'neutral' {
  if (score >= 0.7) return 'success'
  if (score >= 0.5) return 'warning'
  return 'neutral'
}

const fetchDocuments = async (kbId: string) => {
  docsLoading.value = true
  try {
    const res = await listDocs(kbId)
    if (res.error) {
      toast.add({ title: res.error, color: 'error' })
      return
    }
    documents.value = res.data || []
  } catch {
    toast.add({ title: t('kb.docListFail'), color: 'error' })
  } finally {
    docsLoading.value = false
  }
}

const refreshInterval = ref<ReturnType<typeof setInterval> | null>(null)

const startDocRefresh = () => {
  stopDocRefresh()
  refreshInterval.value = setInterval(() => {
    if (
      selectedKB.value &&
      documents.value.some((d) => d.status === 'pending' || d.status === 'processing')
    ) {
      fetchDocuments(selectedKB.value.id)
    }
  }, 3000)
}

const stopDocRefresh = () => {
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value)
    refreshInterval.value = null
  }
}

function clearSearch() {
  searchQuery.value = ''
  searchResults.value = []
  hasSearched.value = false
  searchDuration.value = 0
}

function onSearchKeydown(e: KeyboardEvent) {
  if (e.key !== 'Enter' || e.shiftKey) return
  // Enter / Ctrl·Cmd+Enter 检索；Shift+Enter 换行
  e.preventDefault()
  void handleSearch()
}

const handleSearch = async () => {
  if (!selectedKB.value || !searchQuery.value.trim()) {
    toast.add({ title: t('kb.needQuery'), color: 'warning' })
    return
  }

  searchLoading.value = true
  hasSearched.value = true
  searchResults.value = []

  try {
    const topK = Math.min(20, Math.max(1, Number(searchTopK.value) || 5))
    const minScore = Math.min(1, Math.max(0, Number(searchMinScore.value) || 0.3))
    const res = await searchKB(selectedKB.value!.id, {
      query: searchQuery.value.trim(),
      top_k: topK,
      min_score: minScore,
      search_mode: searchMode.value,
      rerank: searchRerank.value,
    })

    if (res.error) {
      toast.add({ title: res.error, color: 'error' })
      return
    }

    if (res.data) {
      searchResults.value = res.data.results
      searchDuration.value = res.data.duration_ms || 0
    }
  } catch {
    toast.add({ title: t('kb.searchFail'), color: 'error' })
  } finally {
    searchLoading.value = false
  }
}

const handleUploadSubmit = async () => {
  if (!selectedKB.value) return
  if (!uploadFiles.value?.length) {
    toast.add({ title: t('kb.needFiles'), color: 'warning' })
    return
  }
  const big = oversizedFile()
  if (big) {
    chunkPreviewError.value = tooLargeMessage(big)
    toast.add({ title: chunkPreviewError.value, color: 'error' })
    return
  }

  uploadLoading.value = true
  let successCount = 0
  let failCount = 0

  const opts = currentParseOptions()
  for (const file of uploadFiles.value) {
    const res = await uploadDoc(selectedKB.value!.id, file, opts)
    if (res.error) {
      failCount++
    } else {
      successCount++
    }
  }

  uploadLoading.value = false

  if (failCount === 0) {
    toast.add({ title: t('kb.uploadOk', { n: successCount }), color: 'success' })
  } else {
    toast.add({ title: t('kb.uploadPartial', { ok: successCount, fail: failCount }), color: 'warning' })
  }

  resetUploadState()
  uploadModalVisible.value = false
  docPage.value = 1
  if (selectedKB.value) {
    await fetchDocuments(selectedKB.value.id)
    const kbRes = await getKB(selectedKB.value.id)
    if (kbRes.data) selectedKB.value = kbRes.data
    startDocRefresh()
  }
}

const askDeleteDoc = (doc: Document) => {
  deletingDoc.value = doc
  deleteDocVisible.value = true
}

const confirmDeleteDoc = async () => {
  if (!selectedKB.value || !deletingDoc.value) return

  deletingDocLoading.value = true
  try {
    const res = await deleteDoc(selectedKB.value!.id, deletingDoc.value.id)
    if (res.error) {
      toast.add({ title: res.error, color: 'error' })
      return
    }
    toast.add({ title: t('common.deleteOk'), color: 'success' })
    if (previewDoc.value?.id === deletingDoc.value.id) closeDocPreview()
    deleteDocVisible.value = false
    await fetchDocuments(selectedKB.value!.id)
    const kbRes = await getKB(selectedKB.value!.id)
    if (kbRes.data) selectedKB.value = kbRes.data
  } finally {
    deletingDocLoading.value = false
  }
}

const handleReparseDoc = async (doc: Document) => {
  if (!selectedKB.value) return

  const res = await reparseDoc(selectedKB.value!.id, doc.id)
  if (res.error) {
    toast.add({ title: res.error, color: 'error' })
    return
  }
  toast.add({ title: t('kb.reparseOk'), color: 'success' })
  await fetchDocuments(selectedKB.value!.id)
  startDocRefresh()
}


function goBack() {
  navigateTo('/knowledge')
}

function openUploadModal() {
  resetUploadState()
  uploadModalVisible.value = true
}

function onUploadModalOpen(open: boolean) {
  if (!open) resetUploadState()
}

async function loadKnowledgePage() {
  pageLoading.value = true
  stopDocRefresh()
  clearPreviewState()
  clearSearch()
  resetUploadState()
  docPage.value = 1
  drawerActiveTab.value = 'docs'
  try {
    const id = String(route.params.id || '')
    if (!id) {
      selectedKB.value = null
      return
    }
    const res = await getKB(id)
    if (res.error || !res.data) {
      selectedKB.value = null
      if (res.error) toast.add({ title: res.error, color: 'error' })
      return
    }
    selectedKB.value = res.data
    syncSearchDefaultsFromKB(res.data)
    syncSettingsFromKB(res.data)
    await fetchDocuments(res.data.id)
    const hasProcessing = documents.value.some(
      (d) => d.status === 'pending' || d.status === 'processing',
    )
    if (hasProcessing) startDocRefresh()
  } finally {
    pageLoading.value = false
  }
}

watch(
  () => String(route.params.id || ''),
  () => {
    void loadKnowledgePage()
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  stopDocRefresh()
})

</script>

<style scoped>
.cf-state--compact {
  min-height: 160px;
}

.list-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}

.kb-list-search {
  width: min(100%, 280px);
}

.list-count {
  font-size: 0.8rem;
  color: var(--cf-ink-soft);
}

.list-hint {
  font-size: 0.8rem;
  color: var(--cf-ink-soft);
}

.kb-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}


.kb-card {
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  border: 1.5px solid var(--cf-line);
  transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
}

.kb-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
  border-color: color-mix(in srgb, var(--cf-accent) 35%, var(--cf-line));
}

.kb-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  gap: 8px;
}

.kb-header .action-btns {
  flex-shrink: 0;
  opacity: 1;
  transition: opacity 0.15s ease;
}

/* 鼠标设备：悬停/焦点才显示操作图标，减少视觉噪音 */
@media (hover: hover) and (pointer: fine) {
  .kb-header .action-btns {
    opacity: 0;
    pointer-events: none;
  }

  .kb-card:hover .kb-header .action-btns,
  .kb-card:focus-within .kb-header .action-btns {
    opacity: 1;
    pointer-events: auto;
  }
}

.kb-name {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 1rem;
  color: var(--cf-ink);
  min-width: 0;
  flex: 1;
}

.kb-name > span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.kb-description {
  color: var(--cf-ink-soft);
  font-size: 0.875rem;
  margin: 0 0 12px;
  min-height: 40px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.kb-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.75rem;
  color: var(--cf-ink-soft);
  gap: 8px;
}

.meta-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.drawer-header-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--cf-line);
  margin-bottom: 12px;
}

.upload-panel {
  margin-bottom: 16px;
  padding: 14px;
  border: 1px solid var(--cf-line);
  border-radius: 12px;
  background: color-mix(in srgb, var(--cf-ink) 2.5%, transparent);
}

.upload-panel__head {
  display: flex;
  align-items: flex-start;
  margin-bottom: 14px;
}

.upload-stepper {
  flex: 1;
  min-width: 0;
}

.upload-stepper__list {
  display: flex;
  align-items: center;
  gap: 0;
  margin: 0;
  padding: 0;
  list-style: none;
}

.upload-stepper__item {
  flex: 0 1 auto;
  min-width: 0;
}

.upload-stepper__btn {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  max-width: 100%;
  margin: 0;
  padding: 6px 8px;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: var(--cf-ink-soft);
  text-align: left;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}

.upload-stepper__btn:hover:not(:disabled) {
  background: color-mix(in srgb, var(--cf-ink) 4%, transparent);
  color: var(--cf-ink);
}

.upload-stepper__btn:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--cf-accent, #0f9f8a) 55%, transparent);
  outline-offset: 2px;
}

.upload-stepper__btn:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.upload-stepper__index {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 28px;
  height: 28px;
  border-radius: 999px;
  border: 1.5px solid var(--cf-line);
  background: var(--cf-bg, #fff);
  color: var(--cf-ink-soft);
  font-size: 0.8125rem;
  font-weight: 600;
  line-height: 1;
}

.upload-stepper__text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  padding-top: 2px;
}

.upload-stepper__title {
  font-size: 0.875rem;
  font-weight: 600;
  line-height: 1.25;
  color: inherit;
}

.upload-stepper__desc {
  font-size: 0.75rem;
  line-height: 1.35;
  color: var(--cf-ink-soft);
  font-weight: 400;
}

.upload-stepper__item--on .upload-stepper__btn {
  color: var(--cf-ink);
}

.upload-stepper__item--on .upload-stepper__index {
  border-color: var(--cf-accent, #0f9f8a);
  background: var(--cf-accent, #0f9f8a);
  color: #fff;
}

.upload-stepper__item--done .upload-stepper__index {
  border-color: var(--cf-accent, #0f9f8a);
  background: color-mix(in srgb, var(--cf-accent, #0f9f8a) 16%, transparent);
  color: var(--cf-accent-ink, #087a6a);
}

.upload-stepper__item--done .upload-stepper__title {
  color: var(--cf-ink);
}

.upload-stepper__rail {
  flex: 1 1 48px;
  min-width: 24px;
  max-width: 120px;
  height: 2px;
  margin: 0 4px;
  align-self: center;
  border-radius: 999px;
  background: var(--cf-line);
}

.upload-stepper__item--done + .upload-stepper__rail {
  background: color-mix(in srgb, var(--cf-accent, #0f9f8a) 55%, var(--cf-line));
}

.upload-panel__actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 14px;
}

.upload-panel__actions-end {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}

.doc-pager {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 12px;
}

.docs-workspace {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 280px;
}

.docs-workspace--preview {
  display: grid;
  grid-template-columns: minmax(240px, 0.95fr) minmax(280px, 1.2fr);
  gap: 14px;
  align-items: stretch;
}

.docs-workspace--preview-max {
  grid-template-columns: 1fr;
}

@media (max-width: 900px) {
  .docs-workspace--preview {
    grid-template-columns: 1fr;
  }
}

.docs-list-pane {
  min-width: 0;
}

.docs-preview-pane {
  display: flex;
  flex-direction: column;
  min-height: 320px;
  max-height: min(70vh, 640px);
  border: 1px solid var(--cf-line);
  border-radius: 12px;
  background: color-mix(in srgb, var(--cf-ink) 2.5%, transparent);
  overflow: hidden;
}

.docs-preview-pane--max {
  min-height: min(78vh, 820px);
  max-height: min(82vh, 900px);
}

.preview-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 12px;
  border-bottom: 1px solid var(--cf-line);
}

.preview-toolbar__actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.preview-mode-switch {
  display: inline-flex;
  padding: 2px;
  border-radius: 8px;
  border: 1px solid var(--cf-line);
  background: color-mix(in srgb, var(--cf-ink) 4%, transparent);
}

.preview-mode-btn {
  border: 0;
  background: transparent;
  color: var(--cf-ink-soft);
  font-size: 0.75rem;
  line-height: 1;
  padding: 6px 10px;
  border-radius: 6px;
  cursor: pointer;
}

.preview-mode-btn--active {
  background: var(--cf-nav-surface, var(--ui-bg, #fff));
  color: var(--cf-ink);
  box-shadow: 0 1px 2px color-mix(in srgb, #0b1220 12%, transparent);
}

.preview-dirty {
  color: #b54708;
  font-weight: 600;
}

.preview-title-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.preview-title {
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--cf-ink);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.preview-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  font-size: 0.75rem;
  border-bottom: 1px solid var(--cf-line);
}

.preview-error {
  margin: 8px 12px 0;
  padding: 8px 10px;
  border-radius: 8px;
  font-size: 0.8rem;
  color: #b42318;
  background: color-mix(in srgb, #f04438 12%, transparent);
}

.preview-truncated {
  margin: 8px 12px 0;
  font-size: 0.75rem;
  color: var(--cf-ink-soft);
}

.preview-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 24px;
  color: var(--cf-ink-soft);
  text-align: center;
}

.preview-body {
  flex: 1;
  overflow: auto;
  padding: 14px 16px 18px;
  margin: 0;
}

.preview-body--md {
  font-size: 0.9rem;
  line-height: 1.65;
  color: var(--cf-ink);
}

.preview-body--plain {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.8rem;
  line-height: 1.55;
  white-space: pre-wrap;
  word-break: break-word;
  color: var(--cf-ink);
}

.preview-editor {
  flex: 1;
  min-height: 200px;
  width: 100%;
  border: 0;
  resize: none;
  padding: 14px 16px;
  margin: 0;
  background: transparent;
  color: var(--cf-ink);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.82rem;
  line-height: 1.55;
  outline: none;
}

.preview-edit-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border-top: 1px solid var(--cf-line);
  background: color-mix(in srgb, var(--cf-ink) 3%, transparent);
}

.preview-edit-bar__actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.cf-table-wrap {
  margin-top: 8px;
}

.doc-row {
  cursor: pointer;
}

.doc-row--active {
  background: color-mix(in srgb, var(--cf-accent) 10%, transparent);
}

.doc-name-cell {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.doc-name-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  max-width: 100%;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  text-align: left;
}

.doc-name-btn:hover .doc-name {
  color: var(--cf-accent);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.doc-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--cf-ink);
}

.action-btns {
  display: flex;
  align-items: center;
  gap: 2px;
}

.search-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 4px 0 12px;
}

.search-compose {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 12px 12px;
  border: 1px solid var(--cf-line);
  border-radius: 12px;
  background: color-mix(in srgb, var(--cf-ink) 2%, transparent);
}

.search-compose__bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.search-mode-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  padding: 5px 10px;
  border: 1px solid var(--cf-line);
  border-radius: 999px;
  background: var(--cf-bg, #fff);
  color: var(--cf-ink);
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease;
}

.search-mode-chip:hover {
  border-color: color-mix(in srgb, var(--cf-accent, #0f9f8a) 45%, var(--cf-line));
  background: color-mix(in srgb, var(--cf-accent, #0f9f8a) 8%, transparent);
}

.search-textarea {
  width: 100%;
}

.search-textarea :deep(textarea) {
  min-height: 96px;
  line-height: 1.5;
  resize: vertical;
  border: 0 !important;
  box-shadow: none !important;
  background: transparent !important;
  padding-left: 0 !important;
  padding-right: 0 !important;
}

.search-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.search-toolbar__meta {
  font-size: 0.8125rem;
}

.search-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}

.search-settings {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.search-topk-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.search-topk-input {
  width: 88px;
  flex-shrink: 0;
}

.search-topk-slider {
  flex: 1;
  min-width: 0;
  accent-color: var(--cf-accent, #0f9f8a);
}

.search-results {
  margin-top: 16px;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--cf-line);
  font-size: 0.875rem;
  color: var(--cf-ink);
}

.result-item {
  padding: 12px;
  margin-bottom: 12px;
  background: color-mix(in srgb, var(--cf-ink) 3%, transparent);
  border-radius: 8px;
  border: 1px solid var(--cf-line);
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  gap: 8px;
}

.result-doc-name {
  font-weight: 600;
  color: var(--cf-ink);
}

.result-content {
  font-size: 0.875rem;
  color: var(--cf-ink-soft);
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
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
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--cf-ink);
}

.field__help {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--cf-muted, #64748b);
  cursor: help;
  line-height: 1;
}

.field__help:hover,
.field__help:focus-visible {
  color: var(--cf-ink);
  outline: none;
}

.field__error {
  margin: 0;
  font-size: 0.75rem;
  color: var(--cf-danger);
}

.field__hint {
  margin: 0;
  font-size: 0.75rem;
  line-height: 1.45;
  color: var(--cf-muted, #64748b);
}

.detail-sheet {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.detail-hero {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 14px;
  border-radius: 10px;
  border: 1px solid var(--cf-line);
  background: color-mix(in oklab, var(--cf-accent) 6%, var(--cf-nav-surface, var(--cf-bg-elevated)));
}

.detail-hero-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: var(--cf-accent);
  background: color-mix(in oklab, var(--cf-accent) 14%, transparent);
}

.detail-hero-text {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.detail-hero-name {
  font-family: var(--font-display);
  font-size: 1.2rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--cf-ink);
  line-height: 1.2;
}

.detail-hero-sub {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}

.detail-list {
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0;
  border: 1px solid var(--cf-line);
  border-radius: 10px;
  overflow: hidden;
}

.detail-row {
  display: grid;
  grid-template-columns: 110px 1fr;
  gap: 12px;
  padding: 11px 14px;
  border-bottom: 1px solid var(--cf-line);
  align-items: start;
}

.detail-row:last-child {
  border-bottom: 0;
}

.detail-row dt {
  margin: 0;
  font-size: 0.75rem;
  font-weight: 500;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: var(--cf-ink-soft);
  padding-top: 2px;
}

.detail-row dd {
  margin: 0;
  font-size: 0.9rem;
  color: var(--cf-ink);
  min-width: 0;
  word-break: break-word;
}

.detail-row--block {
  grid-template-columns: 1fr;
  gap: 6px;
}

.modal-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.modal-actions__right {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}

.modal-actions__left {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-right: auto;
  min-height: 36px;
}

.delete-text {
  margin: 0;
  color: var(--cf-ink-soft);
  line-height: 1.5;
}

.parse-step {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.parse-step__hint {
  margin: 0;
  font-size: 0.875rem;
  color: var(--cf-ink-soft);
}

.upload-file-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.upload-file-list__item {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 0.8125rem;
  color: var(--cf-ink-soft);
}

.upload-file-list__name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--cf-ink);
}

.upload-file-list__item--bad .upload-file-list__name,
.upload-file-list__item--bad {
  color: var(--cf-danger);
}

.parse-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.parse-preview-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.chunk-preview-list {
  max-height: 280px;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
  border: 1px solid var(--cf-line);
  border-radius: 10px;
  padding: 10px;
}

.chunk-preview-item {
  padding: 8px 10px;
  border-radius: 8px;
  background: color-mix(in oklab, var(--cf-ink) 3%, transparent);
}

.chunk-preview-item__meta {
  font-size: 0.75rem;
  color: var(--cf-ink-soft);
  margin-bottom: 4px;
}

.chunk-preview-item__body {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 0.8125rem;
  line-height: 1.45;
  font-family: var(--font-mono, ui-monospace, monospace);
  color: var(--cf-ink);
}

@media (max-width: 640px) {
  .parse-grid {
    grid-template-columns: 1fr;
  }
}

.search-params {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.field--compact {
  min-width: 140px;
  flex: 0 0 auto;
}

.search-param-input {
  width: 120px;
}

.settings-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding-top: 4px;
}

.settings-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px;
  border: 1px solid var(--cf-line);
  border-radius: 10px;
}

.settings-section__title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--cf-ink);
}

.settings-section__desc,
.settings-note {
  margin: 0;
  font-size: 0.8125rem;
  color: var(--cf-ink-soft);
  line-height: 1.45;
}

.settings-actions {
  display: flex;
  justify-content: flex-end;
}

.search-mode-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.search-mode-card {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  margin: 0;
  padding: 12px 14px;
  border: 1px solid var(--cf-line);
  border-radius: 12px;
  background: color-mix(in srgb, var(--cf-ink) 2%, transparent);
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease;
}

.search-mode-card:hover {
  border-color: color-mix(in srgb, var(--cf-accent, #0f9f8a) 40%, var(--cf-line));
}

.search-mode-card--on {
  border-color: var(--cf-accent, #0f9f8a);
  background: color-mix(in srgb, var(--cf-accent, #0f9f8a) 8%, transparent);
}

.search-mode-card__radio {
  margin-top: 3px;
  flex-shrink: 0;
}

.search-mode-card__body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.search-mode-card__head {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.search-mode-card__title {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--cf-ink);
}

.search-mode-card__hint {
  font-size: 0.8125rem;
  color: var(--cf-ink-soft);
  line-height: 1.4;
}

.search-mode-card__rerank {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-top: 8px;
  border-top: 1px dashed var(--cf-line);
  font-size: 0.8125rem;
  color: var(--cf-ink);
}

.kb-detail-header {
  align-items: flex-start;
}

.kb-detail-heading {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  min-width: 0;
}

.kb-detail-titles {
  min-width: 0;
}

.docs-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.upload-panel--modal {
  margin-bottom: 0;
}
</style>
