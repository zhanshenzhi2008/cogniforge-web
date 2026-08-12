<template>
  <div class="password-strength">
    <div class="strength-bar">
      <div
        v-for="i in 4"
        :key="i"
        class="strength-segment"
        :class="{ filled: i <= strengthLevel }"
        :style="{ backgroundColor: i <= strengthLevel ? strengthColor : 'var(--cf-line)' }"
      />
    </div>

    <div class="strength-info">
      <div class="strength-label">
        <UIcon :name="strengthIcon" class="size-4" :style="{ color: strengthColor }" />
        <span :style="{ color: strengthColor }">{{ strengthText }}</span>
      </div>
      <span v-if="strengthLevel < 4" class="strength-hint">{{ remainingHint }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  password: string
}

const props = defineProps<Props>()

const MIN_LENGTH = 8
const HAS_UPPER = /[A-Z]/
const HAS_LOWER = /[a-z]/
const HAS_DIGIT = /[0-9]/
const HAS_SPECIAL = /[^A-Za-z0-9]/

const strengthLevel = computed(() => {
  if (!props.password) return 0
  let score = 0

  if (props.password.length >= MIN_LENGTH) score++
  if (props.password.length >= 12) score++
  if (HAS_UPPER.test(props.password)) score++
  if (HAS_LOWER.test(props.password)) score++
  if (HAS_DIGIT.test(props.password)) score++
  if (HAS_SPECIAL.test(props.password)) score++

  return Math.min(Math.floor(score / 1.5), 4)
})

const strengthColor = computed(() => {
  switch (strengthLevel.value) {
    case 0:
    case 1:
      return 'var(--cf-danger)'
    case 2:
      return 'var(--cf-warn)'
    case 3:
      return '#c9a227'
    case 4:
      return 'var(--cf-ok)'
    default:
      return 'var(--cf-line)'
  }
})

const strengthText = computed(() => {
  switch (strengthLevel.value) {
    case 0:
      return '未输入'
    case 1:
      return '很弱'
    case 2:
      return '较弱'
    case 3:
      return '良好'
    case 4:
      return '强'
    default:
      return '未输入'
  }
})

const strengthIcon = computed(() => {
  switch (strengthLevel.value) {
    case 0:
    case 1:
      return 'i-lucide-alert-circle'
    case 2:
    case 3:
      return 'i-lucide-info'
    case 4:
      return 'i-lucide-check-circle'
    default:
      return 'i-lucide-info'
  }
})

const remainingHint = computed(() => {
  const unmet: string[] = []

  if (props.password.length < MIN_LENGTH) {
    unmet.push(`至少${MIN_LENGTH}位`)
  }
  if (!HAS_UPPER.test(props.password)) {
    unmet.push('大写字母')
  }
  if (!HAS_LOWER.test(props.password)) {
    unmet.push('小写字母')
  }
  if (!HAS_DIGIT.test(props.password)) {
    unmet.push('数字')
  }
  if (!HAS_SPECIAL.test(props.password)) {
    unmet.push('特殊字符')
  }

  if (unmet.length === 0) {
    return ''
  }
  return `缺少：${unmet.slice(0, 2).join('、')}${unmet.length > 2 ? '...' : ''}`
})
</script>

<style scoped>
.password-strength {
  margin-top: 12px;
}

.strength-bar {
  display: flex;
  gap: 4px;
  margin-bottom: 8px;
}

.strength-segment {
  height: 4px;
  flex: 1;
  border-radius: 2px;
  transition: background-color 0.3s ease;
}

.strength-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.strength-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 500;
}

.strength-hint {
  font-size: 12px;
  color: var(--cf-ink-soft);
}
</style>
