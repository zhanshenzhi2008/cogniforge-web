<template>
  <div class="auth-layout">
    <div class="auth-layout__grid" aria-hidden="true" />
    <div class="auth-layout__content">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.auth-layout {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
  background: var(--cf-bg-aura);
  background-attachment: fixed;
  overflow: hidden;
}

.auth-layout__grid {
  pointer-events: none;
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(color-mix(in oklab, var(--cf-line) 55%, transparent) 1px, transparent 1px),
    linear-gradient(90deg, color-mix(in oklab, var(--cf-line) 55%, transparent) 1px, transparent 1px);
  background-size: 48px 48px;
  mask-image: radial-gradient(ellipse 70% 60% at 50% 45%, #000 20%, transparent 75%);
  opacity: 0.55;
}

.auth-layout__content {
  position: relative;
  z-index: 1;
  width: 100%;
  display: flex;
  justify-content: center;
}
</style>
