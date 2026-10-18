<script setup lang="ts">
/**
 * CogniForge 共用弹窗：拖动 / 缩放 / 最大化。
 * API 对齐 UModal（v-model:open、title、description、#body / #footer / #content、ui.content 宽度）。
 */
import { computed, nextTick, onBeforeUnmount, ref, watch, useSlots } from 'vue'

const props = withDefaults(
  defineProps<{
    title?: string
    description?: string
    /** 点遮罩 / Esc 关闭 */
    dismissible?: boolean
    /** 显示关闭按钮 */
    close?: boolean
    /** 允许拖动标题栏 */
    draggable?: boolean
    /** 允许四边/角缩放 */
    resizable?: boolean
    /** 允许最大化 */
    maximizable?: boolean
    /** 兼容 UModal：`{ content: 'sm:max-w-md' }` 等 */
    ui?: { content?: string; [key: string]: unknown }
  }>(),
  {
    dismissible: true,
    close: true,
    draggable: true,
    resizable: true,
    maximizable: true,
  },
)

const open = defineModel<boolean>('open', { default: false })
const slots = useSlots()
const { t } = useLocale()

const panelRef = ref<HTMLElement | null>(null)
const maximized = ref(false)
/** 用户拖角缩放后才钉死高度；打开时跟内容自适应 */
const sized = ref(false)
const x = ref(0)
const y = ref(0)
const w = ref(512)
const h = ref(360)
const minW = 320
const minH = 200

type SavedRect = { x: number; y: number; w: number; h: number }
let saved: SavedRect | null = null

const WIDTH_MAP: Record<string, number> = {
  'max-w-sm': 384,
  'max-w-md': 448,
  'max-w-lg': 512,
  'max-w-xl': 576,
  'max-w-2xl': 672,
  'max-w-3xl': 768,
  'max-w-4xl': 896,
  'max-w-5xl': 1024,
  'max-w-6xl': 1152,
  'max-w-7xl': 1280,
}

function parseDefaultWidth(uiContent?: string): number {
  if (!uiContent) return 512
  for (const [key, px] of Object.entries(WIDTH_MAP)) {
    if (uiContent.includes(key)) return px
  }
  const m = uiContent.match(/max-w-\[(\d+)px\]/)
  if (m) return Number(m[1])
  return 512
}

function viewport() {
  return {
    vw: window.innerWidth,
    vh: window.innerHeight,
  }
}

function clampPos(nx: number, ny: number, nw: number, nh: number) {
  const { vw, vh } = viewport()
  const maxX = Math.max(8, vw - Math.min(nw, vw) - 8)
  const maxY = Math.max(8, vh - Math.min(nh, vh) - 8)
  return {
    x: Math.min(Math.max(8, nx), maxX),
    y: Math.min(Math.max(8, ny), maxY),
  }
}

function centerLayout() {
  const { vw, vh } = viewport()
  const dw = Math.min(parseDefaultWidth(props.ui?.content), vw - 32)
  w.value = dw
  // 先给一个占位高，nextTick 后再按内容收缩并垂直居中
  h.value = Math.min(Math.round(vh * 0.5), vh - 48)
  x.value = Math.round((vw - dw) / 2)
  y.value = Math.round((vh - h.value) / 2)
  sized.value = false
  maximized.value = false
  saved = null
}

async function fitContentHeight() {
  await nextTick()
  const el = panelRef.value
  if (!el || sized.value || maximized.value) return
  const { vw, vh } = viewport()
  const maxH = vh - 32
  // 临时解除固定高度以测真实内容
  el.style.height = 'auto'
  el.style.maxHeight = `${maxH}px`
  const rect = el.getBoundingClientRect()
  const nh = Math.min(Math.max(minH, Math.ceil(rect.height)), maxH)
  h.value = nh
  y.value = Math.round((vh - nh) / 2)
  x.value = Math.min(Math.max(8, x.value), Math.max(8, vw - w.value - 8))
  el.style.height = ''
  el.style.maxHeight = ''
}

const panelStyle = computed(() => {
  if (maximized.value) {
    return {
      left: '8px',
      top: '8px',
      width: 'calc(100vw - 16px)',
      height: 'calc(100vh - 16px)',
    }
  }
  if (sized.value) {
    return {
      left: `${x.value}px`,
      top: `${y.value}px`,
      width: `${w.value}px`,
      height: `${h.value}px`,
    }
  }
  return {
    left: `${x.value}px`,
    top: `${y.value}px`,
    width: `${w.value}px`,
    height: 'auto',
    maxHeight: 'calc(100vh - 32px)',
  }
})

watch(open, async (v) => {
  if (v) {
    centerLayout()
    await fitContentHeight()
    document.documentElement.style.overflow = 'hidden'
  } else {
    document.documentElement.style.overflow = ''
  }
})

onBeforeUnmount(() => {
  document.documentElement.style.overflow = ''
  stopDrag()
  stopResize()
})

function close() {
  open.value = false
}

function onOverlayClick() {
  if (props.dismissible) close()
}

function onKeydown(e: KeyboardEvent) {
  if (!open.value) return
  if (e.key === 'Escape' && props.dismissible) {
    e.preventDefault()
    close()
  }
}

watch(open, (v) => {
  if (v) window.addEventListener('keydown', onKeydown)
  else window.removeEventListener('keydown', onKeydown)
})

function toggleMaximize() {
  if (!props.maximizable) return
  if (maximized.value) {
    maximized.value = false
    if (saved) {
      x.value = saved.x
      y.value = saved.y
      w.value = saved.w
      h.value = saved.h
      sized.value = true
    }
    saved = null
    return
  }
  const box = currentBox()
  saved = {
    x: x.value,
    y: y.value,
    w: Math.round(box.w),
    h: Math.round(box.h),
  }
  maximized.value = true
}

/* ── Drag ── */
let dragging = false
let dragOx = 0
let dragOy = 0

function onDragStart(e: MouseEvent) {
  if (!props.draggable || maximized.value) return
  if ((e.target as HTMLElement).closest('button, a, input, textarea, select')) return
  e.preventDefault()
  dragging = true
  dragOx = e.clientX - x.value
  dragOy = e.clientY - y.value
  window.addEventListener('mousemove', onDragMove)
  window.addEventListener('mouseup', stopDrag)
}

function currentBox() {
  const el = panelRef.value
  if (el) {
    const r = el.getBoundingClientRect()
    return { w: r.width, h: r.height }
  }
  return { w: w.value, h: h.value }
}

function onDragMove(e: MouseEvent) {
  if (!dragging) return
  const box = currentBox()
  const p = clampPos(e.clientX - dragOx, e.clientY - dragOy, box.w, box.h)
  x.value = p.x
  y.value = p.y
}

function stopDrag() {
  dragging = false
  window.removeEventListener('mousemove', onDragMove)
  window.removeEventListener('mouseup', stopDrag)
}

/* ── Resize ── */
type Edge = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'
let resizing: Edge | null = null
let startX = 0
let startY = 0
let startW = 0
let startH = 0
let startLeft = 0
let startTop = 0

function onResizeStart(edge: Edge, e: MouseEvent) {
  if (!props.resizable || maximized.value) return
  e.preventDefault()
  e.stopPropagation()
  const box = currentBox()
  // 进入钉死高度模式
  sized.value = true
  w.value = Math.round(box.w)
  h.value = Math.round(box.h)
  resizing = edge
  startX = e.clientX
  startY = e.clientY
  startW = w.value
  startH = h.value
  startLeft = x.value
  startTop = y.value
  window.addEventListener('mousemove', onResizeMove)
  window.addEventListener('mouseup', stopResize)
}

function onResizeMove(e: MouseEvent) {
  if (!resizing) return
  const { vw, vh } = viewport()
  const dx = e.clientX - startX
  const dy = e.clientY - startY
  let nw = startW
  let nh = startH
  let nx = startLeft
  let ny = startTop

  if (resizing.includes('e')) nw = startW + dx
  if (resizing.includes('s')) nh = startH + dy
  if (resizing.includes('w')) {
    nw = startW - dx
    nx = startLeft + dx
  }
  if (resizing.includes('n')) {
    nh = startH - dy
    ny = startTop + dy
  }

  nw = Math.max(minW, Math.min(nw, vw - 16))
  nh = Math.max(minH, Math.min(nh, vh - 16))

  // 左边/上边拖时修正：宽高被 min 卡住时别乱移
  if (resizing.includes('w')) nx = startLeft + (startW - nw)
  if (resizing.includes('n')) ny = startTop + (startH - nh)

  const p = clampPos(nx, ny, nw, nh)
  w.value = nw
  h.value = nh
  x.value = p.x
  y.value = p.y
}

function stopResize() {
  resizing = null
  window.removeEventListener('mousemove', onResizeMove)
  window.removeEventListener('mouseup', stopResize)
}

const hasChromeTitle = computed(() => Boolean(props.title || props.description))
const useContentSlot = computed(() => Boolean(slots.content) && !slots.body)
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="cf-modal"
      role="dialog"
      aria-modal="true"
      :aria-label="title || t('common.dialog')"
    >
      <div class="cf-modal__overlay" @click="onOverlayClick" />

      <div
        ref="panelRef"
        class="cf-modal__panel"
        :class="{
          'cf-modal__panel--max': maximized,
          'cf-modal__panel--sized': sized || maximized,
        }"
        :style="panelStyle"
      >
        <header
          class="cf-modal__bar"
          :class="{ 'cf-modal__bar--drag': draggable && !maximized }"
          @mousedown="onDragStart"
          @dblclick="toggleMaximize"
        >
          <div class="cf-modal__titles">
            <h3 v-if="title" class="cf-modal__title">{{ title }}</h3>
            <p v-if="description" class="cf-modal__desc">{{ description }}</p>
            <span v-else-if="!hasChromeTitle" class="cf-modal__drag-hint">
              {{ t('common.dragHint') }}
            </span>
          </div>
          <div class="cf-modal__chrome" @mousedown.stop>
            <button
              v-if="maximizable"
              type="button"
              class="cf-modal__icon-btn"
              :title="maximized ? t('common.restore') : t('common.maximize')"
              :aria-label="maximized ? t('common.restore') : t('common.maximize')"
              @click="toggleMaximize"
            >
              <UIcon :name="maximized ? 'i-lucide-minimize-2' : 'i-lucide-maximize-2'" class="size-4" />
            </button>
            <button
              v-if="close !== false"
              type="button"
              class="cf-modal__icon-btn"
              :title="t('common.close')"
              :aria-label="t('common.close')"
              @click="close"
            >
              <UIcon name="i-lucide-x" class="size-4" />
            </button>
          </div>
        </header>

        <div class="cf-modal__body">
          <slot v-if="useContentSlot" name="content" />
          <template v-else>
            <slot name="body" />
            <slot />
          </template>
        </div>

        <footer v-if="$slots.footer" class="cf-modal__footer">
          <slot name="footer" />
        </footer>

        <template v-if="resizable && !maximized">
          <span class="cf-modal__handle cf-modal__handle--n" @mousedown="onResizeStart('n', $event)" />
          <span class="cf-modal__handle cf-modal__handle--s" @mousedown="onResizeStart('s', $event)" />
          <span class="cf-modal__handle cf-modal__handle--e" @mousedown="onResizeStart('e', $event)" />
          <span class="cf-modal__handle cf-modal__handle--w" @mousedown="onResizeStart('w', $event)" />
          <span class="cf-modal__handle cf-modal__handle--ne" @mousedown="onResizeStart('ne', $event)" />
          <span class="cf-modal__handle cf-modal__handle--nw" @mousedown="onResizeStart('nw', $event)" />
          <span class="cf-modal__handle cf-modal__handle--se" @mousedown="onResizeStart('se', $event)" />
          <span class="cf-modal__handle cf-modal__handle--sw" @mousedown="onResizeStart('sw', $event)" />
        </template>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.cf-modal {
  position: fixed;
  inset: 0;
  z-index: 80;
}

.cf-modal__overlay {
  position: absolute;
  inset: 0;
  background: color-mix(in oklab, #0b1220 48%, transparent);
  backdrop-filter: blur(2px);
}

.cf-modal__panel {
  position: absolute;
  display: flex;
  flex-direction: column;
  min-width: 320px;
  min-height: 200px;
  border-radius: 0.85rem;
  border: 1px solid color-mix(in oklab, var(--cf-line) 90%, transparent);
  background: var(--cf-nav-surface, var(--ui-bg, #fff));
  box-shadow:
    0 18px 50px color-mix(in oklab, #0b1220 28%, transparent),
    0 0 0 1px color-mix(in oklab, var(--cf-accent) 8%, transparent);
  overflow: hidden;
  color: var(--cf-ink);
}

.cf-modal__panel--max {
  border-radius: 0.65rem;
}

.cf-modal__bar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.85rem 1rem 0.75rem;
  border-bottom: 1px solid color-mix(in oklab, var(--cf-line) 80%, transparent);
  background: color-mix(in oklab, var(--cf-accent) 4%, transparent);
  user-select: none;
  flex-shrink: 0;
}

.cf-modal__bar--drag {
  cursor: grab;
}

.cf-modal__bar--drag:active {
  cursor: grabbing;
}

.cf-modal__titles {
  min-width: 0;
  flex: 1;
  padding-right: 0.25rem;
}

.cf-modal__title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 650;
  line-height: 1.35;
  color: var(--cf-ink);
}

.cf-modal__desc {
  margin: 0.25rem 0 0;
  font-size: 0.78rem;
  line-height: 1.4;
  color: var(--cf-ink-soft);
}

.cf-modal__drag-hint {
  font-size: 0.75rem;
  color: var(--cf-ink-soft);
}

.cf-modal__chrome {
  display: flex;
  align-items: center;
  gap: 0.15rem;
  flex-shrink: 0;
}

.cf-modal__icon-btn {
  display: grid;
  place-items: center;
  width: 1.85rem;
  height: 1.85rem;
  border: 0;
  border-radius: 0.45rem;
  background: transparent;
  color: var(--cf-ink-soft);
  cursor: pointer;
}

.cf-modal__icon-btn:hover {
  background: color-mix(in oklab, var(--cf-ink) 8%, transparent);
  color: var(--cf-ink);
}

.cf-modal__body {
  padding: 1rem 1.1rem;
  flex: 0 1 auto;
}

.cf-modal__panel--sized .cf-modal__body {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
}

.cf-modal__footer {
  flex-shrink: 0;
  padding: 0.75rem 1rem;
  border-top: 1px solid color-mix(in oklab, var(--cf-line) 80%, transparent);
  background: color-mix(in oklab, var(--cf-nav-surface, var(--ui-bg)) 92%, transparent);
}

.cf-modal__handle {
  position: absolute;
  z-index: 2;
}

.cf-modal__handle--n,
.cf-modal__handle--s {
  left: 10px;
  right: 10px;
  height: 6px;
  cursor: ns-resize;
}

.cf-modal__handle--n { top: 0; }
.cf-modal__handle--s { bottom: 0; }

.cf-modal__handle--e,
.cf-modal__handle--w {
  top: 10px;
  bottom: 10px;
  width: 6px;
  cursor: ew-resize;
}

.cf-modal__handle--e { right: 0; }
.cf-modal__handle--w { left: 0; }

.cf-modal__handle--ne,
.cf-modal__handle--nw,
.cf-modal__handle--se,
.cf-modal__handle--sw {
  width: 12px;
  height: 12px;
}

.cf-modal__handle--ne { top: 0; right: 0; cursor: nesw-resize; }
.cf-modal__handle--nw { top: 0; left: 0; cursor: nwse-resize; }
.cf-modal__handle--se { bottom: 0; right: 0; cursor: nwse-resize; }
.cf-modal__handle--sw { bottom: 0; left: 0; cursor: nesw-resize; }
</style>
