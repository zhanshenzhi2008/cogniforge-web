<script setup lang="ts">
/**
 * 列表删除等二次确认：固定窄弹窗，取消 + 危险确认。
 * 基于 CfModal，关掉缩放/最大化，避免确认框被拖成大窗。
 */
withDefaults(
  defineProps<{
    title?: string
    /** 正文说明（纯文本）；需要自定义时可改用默认插槽 */
    message?: string
    /** 确认按钮文案 */
    confirmText?: string
    /** 取消按钮文案 */
    cancelText?: string
    confirmIcon?: string
    cancelIcon?: string
    /** 确认按钮 loading */
    loading?: boolean
    /** 确认按钮禁用 */
    disabled?: boolean
  }>(),
  {
    confirmIcon: 'i-lucide-trash-2',
    cancelIcon: 'i-lucide-x',
  },
)

const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{ confirm: []; cancel: [] }>()
const { t } = useLocale()

function onCancel() {
  open.value = false
  emit('cancel')
}

function onConfirm() {
  emit('confirm')
}
</script>

<template>
  <CfModal
    v-model:open="open"
    :title="title || t('common.deleteConfirm')"
    :ui="{ content: 'sm:max-w-md' }"
    :resizable="false"
    :maximizable="false"
  >
    <template #body>
      <slot>
        <p v-if="message" class="cf-confirm__msg">{{ message }}</p>
      </slot>
    </template>
    <template #footer>
      <div class="cf-confirm__actions">
        <CfButton
          tone="secondary"
          :icon="cancelIcon"
          @click="onCancel"
        >
          {{ cancelText || t('common.cancel') }}
        </CfButton>
        <CfButton
          tone="danger"
          strong
          :icon="confirmIcon"
          :loading="loading"
          :disabled="disabled"
          @click="onConfirm"
        >
          {{ confirmText || t('common.delete') }}
        </CfButton>
      </div>
    </template>
  </CfModal>
</template>

<style scoped>
.cf-confirm__msg {
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.5;
  color: var(--cf-ink);
}

.cf-confirm__actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}
</style>
