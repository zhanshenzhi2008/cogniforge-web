<template>
  <NuxtLink to="/" class="brand-mark" aria-label="CogniForge Dashboard">
    <span class="brand-mark__mark" aria-hidden="true" />
    <span class="brand-mark__word">CogniForge</span>
  </NuxtLink>
</template>

<style scoped>
.brand-mark {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: var(--cf-ink);
  text-decoration: none;
}

.brand-mark__mark {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--cf-accent);
  box-shadow: 0 0 0 3px color-mix(in oklab, var(--cf-accent) 22%, transparent);
  flex-shrink: 0;
}

.brand-mark__word {
  font-family: var(--font-display);
  font-size: 1.45rem;
  font-weight: 700;
  letter-spacing: -0.035em;
  line-height: 1;
}

.brand-mark:hover .brand-mark__word {
  color: var(--cf-accent-ink);
}
</style>
