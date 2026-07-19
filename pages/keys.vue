<template>
  <div class="keys-page">
    <div class="page-header">
      <h2>API 密钥</h2>
      <n-button type="primary" @click="handleCreateKey">
        <template #icon>
          <n-icon :component="AddOutline" />
        </template>
        创建密钥
      </n-button>
    </div>

    <n-card>
      <n-spin :show="loading">
        <n-data-table
          :columns="columns"
          :data="keys"
          :pagination="false"
          :row-key="(row: ApiKey) => row.id"
          size="large"
        />
        <n-empty v-if="!loading && keys.length === 0" description="暂无 API 密钥" style="margin-top: 40px" />
      </n-spin>
    </n-card>

    <n-modal
      v-model:show="dialogVisible"
      preset="card"
      title="创建 API 密钥"
      style="width: 500px; max-width: 90vw"
    >
      <div v-if="newKey" class="new-key-box">
        <n-alert type="warning" :show-icon="false" style="margin-bottom: 16px">
          请妥善保存以下密钥，它只会显示一次。
        </n-alert>
        <n-input v-model:value="newKey" readonly>
          <template #suffix>
            <n-button size="tiny" @click="copyKey">复制</n-button>
          </template>
        </n-input>
      </div>

      <n-form
        v-else
        ref="formRef"
        :model="form"
        :rules="rules"
        label-placement="top"
      >
        <n-form-item label="名称" path="name">
          <n-input v-model:value="form.name" placeholder="请输入密钥名称" @keyup.enter.prevent="submitCreate" />
        </n-form-item>
      </n-form>

      <template #footer>
        <n-space justify="end">
          <n-button @click="dialogVisible = false">关闭</n-button>
          <n-button v-if="!newKey" type="primary" :loading="creating" @click="submitCreate">
            创建
          </n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import type { Component } from 'vue'
import { AddOutline, TrashOutline, EyeOutline, EyeOffOutline } from '@vicons/ionicons5'
import { useMessage, useDialog, NButton, NIcon, NTooltip } from 'naive-ui'

interface ApiKey {
  id: string
  name: string
  key: string
  maskedKey: string
  created_at: string
  show?: boolean
}

definePageMeta({
  layout: 'default',
})

const message = useMessage()
const dialog = useDialog()
const { get, post, del } = useApi()

const loading = ref(false)
const creating = ref(false)
const keys = ref<ApiKey[]>([])
const dialogVisible = ref(false)
const newKey = ref('')
const formRef = ref()

const form = reactive({
  name: ''
})

const rules = {
  name: [{ required: true, message: '请输入密钥名称', trigger: 'blur' }]
}

function renderIconAction(
  label: string,
  type: 'default' | 'info' | 'error',
  onClick: () => void,
  Icon: Component,
) {
  return h(NTooltip, { placement: 'top' }, {
    trigger: () => h(NButton, {
      quaternary: true,
      circle: true,
      size: 'small',
      depth: 3,
      onClick,
    }, {
      icon: () => h(NIcon, { component: Icon, size: 20 }),
    }),
    default: () => label,
  })
}

const columns = [
  {
    title: '名称',
    key: 'name',
    width: 200,
  },
  {
    title: '密钥',
    key: 'key',
    render(row: ApiKey) {
      const ShowIcon = row.show ? EyeOffOutline : EyeOutline
      const showLabel = row.show ? '隐藏' : '显示'
      return h('div', { class: 'key-secret-row' }, [
        h('span', { class: 'key-secret-text' }, row.show ? row.key : row.maskedKey),
        h(NTooltip, { placement: 'top' }, {
          trigger: () => h(NButton, {
            quaternary: true,
            circle: true,
            size: 'small',
            type: 'default',
            onClick: () => { row.show = !row.show },
          }, {
            icon: () => h(NIcon, { component: ShowIcon, size: 18 }),
          }),
          default: () => showLabel,
        }),
      ])
    },
  },
  {
    title: '创建时间',
    key: 'created_at',
    width: 180,
    render(row: ApiKey) {
      return new Date(row.created_at).toLocaleString('zh-CN')
    },
  },
  {
    title: '操作',
    key: 'actions',
    width: 56,
    render(row: ApiKey) {
      return renderIconAction('撤销', 'error', () => handleDelete(row.id), TrashOutline)
    },
  },
]

const fetchKeys = async () => {
  loading.value = true
  try {
    const res = await get<{ keys: any[] }>('/api/v1/keys')
    if (res.error) {
      message.error(res.error)
      return
    }
    const keyList = res.data?.keys || []
    keys.value = keyList.map((k: any) => ({
      ...k,
      maskedKey: k.key ? k.key.slice(0, 10) + '****' + k.key.slice(-4) : '',
      show: false
    }))
  } catch {
    message.error('获取密钥列表失败')
  } finally {
    loading.value = false
  }
}

const handleCreateKey = () => {
  form.name = ''
  newKey.value = ''
  dialogVisible.value = true
}

const submitCreate = async () => {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch {
    return
  }

  creating.value = true
  try {
    const res = await post<{ key: string }>('/api/v1/keys', form)
    if (res.error) {
      message.error(res.error)
      return
    }
    newKey.value = res.data?.key || ''
    await fetchKeys()
  } catch {
    message.error('创建失败')
  } finally {
    creating.value = false
  }
}

const handleDelete = async (id: string) => {
  dialog.warning({
    title: '撤销确认',
    content: '确定要撤销此 API 密钥吗？此操作不可恢复。',
    positiveText: '撤销',
    negativeText: '取消',
    onPositiveClick: async () => {
      const res = await del<{ message?: string }>(`/api/v1/keys/${id}`)
      if (res.error) {
        message.error(res.error)
        return
      }
      message.success(res.data?.message || '撤销成功')
      await fetchKeys()
    },
  })
}

const copyKey = () => {
  navigator.clipboard.writeText(newKey.value)
  message.success('已复制到剪贴板')
}

onMounted(() => {
  fetchKeys()
})
</script>

<style scoped>
.keys-page {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
}

.new-key-box {
  padding: 16px;
  background: #f8fafc;
  border-radius: 8px;
}

.key-secret-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.key-secret-row :deep(.n-button) {
  opacity: 0.75;
  transition: opacity 0.2s, transform 0.15s;
}

.key-secret-row :deep(.n-button:hover) {
  opacity: 1;
  transform: scale(1.1);
}

.key-secret-text {
  font-family: ui-monospace, monospace;
  font-size: 13px;
}
</style>
