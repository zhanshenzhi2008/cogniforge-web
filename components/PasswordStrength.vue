<template>
  <div class="password-strength">
    <!-- 强度条 -->
    <div class="strength-bar">
      <div
        v-for="i in 4"
        :key="i"
        class="strength-segment"
        :class="{ filled: i <= strengthLevel }"
        :style="{ backgroundColor: i <= strengthLevel ? strengthColor : '#e2e8f0' }"
      />
    </div>

    <!-- 强度标签 -->
    <div class="strength-info">
      <div class="strength-label">
        <n-icon :component="strengthIcon" :style="{ color: strengthColor }" />
        <span :style="{ color: strengthColor }">{{ strengthText }}</span>
      </div>
      <span class="strength-hint" v-if="strengthLevel < 4">{{ remainingHint }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { CheckmarkCircle, AlertCircle, InformationCircle } from '@vicons/ionicons5'
import { NIcon } from 'naive-ui'

interface Props {
  password: string
}

const props = defineProps<Props>()

// 密码强度评分标准
const MIN_LENGTH = 8
const HAS_UPPER = /[A-Z]/
const HAS_LOWER = /[a-z]/
const HAS_DIGIT = /[0-9]/
const HAS_SPECIAL = /[^A-Za-z0-9]/

// 计算强度等级 0-4
const strengthLevel = computed(() => {
  if (!props.password) return 0
  let score = 0

  if (props.password.length >= MIN_LENGTH) score++
  if (props.password.length >= 12) score++ // 额外加分
  if (HAS_UPPER.test(props.password)) score++
  if (HAS_LOWER.test(props.password)) score++
  if (HAS_DIGIT.test(props.password)) score++
  if (HAS_SPECIAL.test(props.password)) score++

  return Math.min(Math.floor(score / 1.5), 4) // 归一化到 0-4
})

// 强度颜色
const strengthColor = computed(() => {
  switch (strengthLevel.value) {
    case 0:
    case 1:
      return '#ef4444' // 红色 - 弱
    case 2:
      return '#f97316' // 橙色 - 中
    case 3:
      return '#eab308' // 黄色 - 良
    case 4:
      return '#22c55e' // 绿色 - 强
    default:
      return '#e2e8f0'
  }
})

// 强度文本
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

// 强度图标
const strengthIcon = computed(() => {
  switch (strengthLevel.value) {
    case 0:
    case 1:
      return AlertCircle
    case 2:
    case 3:
      return InformationCircle
    case 4:
      return CheckmarkCircle
    default:
      return InformationCircle
  }
})

// 剩余提示
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

.strength-label .n-icon {
  font-size: 16px;
}

.strength-hint {
  font-size: 12px;
  color: #94a3b8;
}
</style>
