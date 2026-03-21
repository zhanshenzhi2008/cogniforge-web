<template>
  <div class="keys-page">
    <div class="page-header">
      <h2>API 密钥</h2>
      <el-button type="primary" @click="handleCreateKey">
        <el-icon><Plus /></el-icon>
        创建密钥
      </el-button>
    </div>

    <el-card>
      <el-table :data="keys" v-loading="loading">
        <el-table-column prop="name" label="名称" />
        <el-table-column prop="key" label="密钥">
          <template #default="{ row }">
            <span v-if="!row.show">{{ row.maskedKey }}</span>
            <span v-else>{{ row.key }}</span>
            <el-button link type="primary" size="small" @click="toggleShow(row)">
              {{ row.show ? '隐藏' : '显示' }}
            </el-button>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button link type="danger" size="small" @click="handleDelete(row.id)">
              撤销
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="!loading && keys.length === 0" description="暂无 API 密钥" />
    </el-card>

    <el-dialog v-model="dialogVisible" title="创建 API 密钥" width="500px">
      <div v-if="newKey" class="new-key-box">
        <p class="tip">请妥善保存以下密钥，它只会显示一次：</p>
        <el-input v-model="newKey" readonly>
          <template #append>
            <el-button @click="copyKey">复制</el-button>
          </template>
        </el-input>
      </div>
      <el-form v-else ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入密钥名称" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">关闭</el-button>
        <el-button v-if="!newKey" type="primary" :loading="creating" @click="submitCreate">
          创建
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { Plus } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'

interface ApiKey {
  id: string
  name: string
  key: string
  maskedKey: string
  created_at: string
  show?: boolean
}

const { get, post, del } = useApi()
const loading = ref(false)
const creating = ref(false)
const keys = ref<ApiKey[]>([])
const dialogVisible = ref(false)
const newKey = ref('')
const formRef = ref<FormInstance>()

const form = reactive({
  name: ''
})

const rules: FormRules = {
  name: [{ required: true, message: '请输入密钥名称', trigger: 'blur' }]
}

const fetchKeys = async () => {
  loading.value = true
  try {
    const res = await get<{ keys: any[] }>('/api/v1/keys/')
    if (res.error) {
      ElMessage.error(res.error)
      return
    }
    const keyList = res.data?.keys || []
    keys.value = keyList.map((k: any) => ({
      ...k,
      maskedKey: k.key ? k.key.slice(0, 10) + '****' + k.key.slice(-4) : '',
      show: false
    }))
  } catch (error) {
    ElMessage.error('获取密钥列表失败')
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
  await formRef.value.validate(async (valid) => {
    if (valid) {
      creating.value = true
      try {
        const res = await post<{ key: string }>('/api/v1/keys/', form)
        newKey.value = res.key
        await fetchKeys()
      } catch (error) {
        ElMessage.error('创建失败')
      } finally {
        creating.value = false
      }
    }
  })
}

const handleDelete = async (id: string) => {
  try {
    await del(`/api/v1/keys/${id}`)
    ElMessage.success('撤销成功')
    await fetchKeys()
  } catch (error) {
    ElMessage.error('撤销失败')
  }
}

const toggleShow = (row: ApiKey) => {
  row.show = !row.show
}

const copyKey = () => {
  navigator.clipboard.writeText(newKey.value)
  ElMessage.success('已复制到剪贴板')
}

const formatTime = (time: string) => {
  return new Date(time).toLocaleString('zh-CN')
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
  padding: 20px;
  background: #f5f7fa;
  border-radius: 8px;
}
.new-key-box .tip {
  color: #909399;
  margin-bottom: 16px;
}
</style>
