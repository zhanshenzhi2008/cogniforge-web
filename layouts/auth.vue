<template>
  <div class="auth-layout">
    <ParticlesBg />
    <div class="auth-layout__grid" aria-hidden="true" />
    <div class="auth-layout__lang">
      <LanguageSwitch />
    </div>
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
  background: linear-gradient(135deg, #0f0c29, #1a1a2e, #16213e);
  overflow: hidden;
}

.auth-layout__grid {
  pointer-events: none;
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(99, 102, 241, 0.15) 1px, transparent 1px),
    linear-gradient(90deg, rgba(99, 102, 241, 0.15) 1px, transparent 1px);
  background-size: 48px 48px;
  mask-image: radial-gradient(ellipse 80% 70% at 50% 50%, #000 30%, transparent 80%);
}

.auth-layout__lang {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 2;
}

.auth-layout__content {
  position: relative;
  z-index: 1;
  width: 100%;
  display: flex;
  justify-content: center;
}
</style>
