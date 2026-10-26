<template>
  <div v-if="defs.length" class="pvf">
    <p v-if="hint" class="pvf-hint">{{ hint }}</p>
    <div v-for="d in defs" :key="d.name" class="pvf-row">
      <label class="pvf-label">
        <code>{{ d.name }}</code>
        <UBadge v-if="d.required" size="sm" variant="subtle" color="warning">{{ requiredLabel }}</UBadge>
      </label>
      <UInput
        :model-value="modelValue[d.name] ?? ''"
        :placeholder="d.default || placeholder"
        size="sm"
        class="pvf-input"
        @update:model-value="(v: string) => setVal(d.name, v)"
      />
    </div>
  </div>
  <p v-else-if="emptyText" class="pvf-empty">{{ emptyText }}</p>
</template>

<script setup lang="ts">
import type { PromptVarDef } from '@/composables/usePrompts'

const props = withDefaults(
  defineProps<{
    defs: PromptVarDef[]
    modelValue: Record<string, string>
    hint?: string
    emptyText?: string
    placeholder?: string
    requiredLabel?: string
  }>(),
  {
    hint: '',
    emptyText: '',
    placeholder: '',
    requiredLabel: 'required',
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: Record<string, string>]
}>()

const setVal = (name: string, v: string) => {
  emit('update:modelValue', { ...props.modelValue, [name]: v })
}
</script>

<style scoped>
.pvf { display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px; }
.pvf-hint { margin: 0; font-size: 12px; color: var(--cf-ink-soft); }
.pvf-row { display: flex; gap: 10px; align-items: center; }
.pvf-label {
  display: flex;
  gap: 6px;
  align-items: center;
  min-width: 100px;
  font-size: 12px;
}
.pvf-label code { font-size: 12px; }
.pvf-input { flex: 1; }
.pvf-empty { margin: 0 0 12px; font-size: 12px; color: var(--cf-ink-soft); }
</style>
