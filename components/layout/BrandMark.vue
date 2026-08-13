<template>
  <NuxtLink to="/" class="brand-mark" aria-label="CogniForge Dashboard">
    <span class="brand-mark__word font-display">CogniForge</span>
  </NuxtLink>
</template>

<style scoped>
.brand-mark {
  display: inline-flex;
  align-items: center;
  color: var(--cf-ink);
  text-decoration: none;
}

.brand-mark__word {
  font-size: 1.25rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1;
}

.brand-mark:hover .brand-mark__word {
  color: var(--cf-accent-ink);
}
</style>
