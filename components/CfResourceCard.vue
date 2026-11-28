<script setup lang="ts">
/**
 * 资源列表卡片壳：图标 + 标题/徽章 + 操作 + 描述 + 页脚。
 * 点击整卡由页面决定；操作区默认 @click.stop。
 */
defineProps<{
  icon?: string
  title?: string
  description?: string
  meta?: string
  /** native title tooltip on the card */
  tip?: string
}>()

defineEmits<{
  click: [e: MouseEvent]
}>()
</script>

<template>
  <div
    class="cf-resource-card cf-surface"
    :title="tip"
    @click="$emit('click', $event)"
  >
    <div class="cf-resource-card__head">
      <div class="cf-resource-card__identity">
        <span v-if="icon || $slots.icon" class="cf-resource-card__icon">
          <slot name="icon">
            <UIcon v-if="icon" :name="icon" class="size-5" />
          </slot>
        </span>
        <div class="cf-resource-card__titles">
          <div class="cf-resource-card__name-row">
            <span v-if="title || $slots.title" class="cf-resource-card__name">
              <slot name="title">{{ title }}</slot>
            </span>
            <slot name="badges" />
          </div>
          <slot name="sub" />
        </div>
      </div>
      <div v-if="$slots.actions" class="cf-resource-card__actions" @click.stop>
        <slot name="actions" />
      </div>
    </div>

    <p v-if="description || $slots.description" class="cf-resource-card__desc">
      <slot name="description">{{ description }}</slot>
    </p>

    <div v-if="meta || $slots.meta" class="cf-resource-card__meta">
      <slot name="meta">{{ meta }}</slot>
    </div>

    <slot />
  </div>
</template>

<style scoped>
.cf-resource-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px;
  border-radius: 12px;
  border: 1px solid var(--cf-line);
  cursor: pointer;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.cf-resource-card:hover {
  border-color: color-mix(in srgb, var(--cf-accent, #0f9f8a) 45%, var(--cf-line));
  box-shadow: 0 8px 24px rgb(15 23 42 / 6%);
}

.cf-resource-card__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}

.cf-resource-card__identity {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  min-width: 0;
}

.cf-resource-card__icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: var(--cf-accent);
  background: color-mix(in oklab, var(--cf-accent) 12%, transparent);
}

.cf-resource-card__titles {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.cf-resource-card__name-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}

.cf-resource-card__name {
  font-weight: 600;
  color: var(--cf-ink);
  line-height: 1.3;
}

.cf-resource-card__actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.cf-resource-card__desc {
  margin: 0;
  font-size: 0.85rem;
  line-height: 1.5;
  color: var(--cf-ink-soft);
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.cf-resource-card__meta {
  font-size: 0.75rem;
  color: var(--cf-muted, #64748b);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
}
</style>
