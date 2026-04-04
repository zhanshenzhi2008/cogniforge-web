<template>
  <div class="knowledge-page">
    <div class="page-header">
      <h2>知识库</h2>
    </div>
    <n-card>
      <n-empty description="知识库功能正在开发中，敬请期待" />
    </n-card>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'default',
})
</script>

<style scoped>
.knowledge-page {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
}
</style>
