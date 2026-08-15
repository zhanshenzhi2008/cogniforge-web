<template>
  <NuxtLink to="/" class="brand-mark" aria-label="CogniForge Dashboard">
    <!-- 个人标：全项目共用（√3 + orjrs） -->
    <img
      class="brand-mark__logo"
      src="/favicon.svg?v=hd1"
      width="36"
      height="36"
      alt="lonely √3"
      decoding="async"
    >
    <!-- 产品名：每个项目换这个字即可 -->
    <span class="brand-mark__word">CogniForge</span>
  </NuxtLink>
</template>

<style scoped>
.brand-mark {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  color: var(--cf-ink);
  text-decoration: none;
}

.brand-mark__logo {
  display: block;
  width: 36px;
  height: 36px;
  border-radius: 9px;
  flex-shrink: 0;
}

.brand-mark__word {
  font-family: var(--font-display);
  font-size: 1.65rem;
  font-weight: 700;
  letter-spacing: -0.04em;
  line-height: 1;
  color: inherit;
}

.brand-mark:hover .brand-mark__word {
  color: var(--cf-accent-ink);
}
</style>
