<template>
  <div class="admin-users-page">
    <n-card title="用户管理" class="content-card">
      <!-- 搜索和筛选栏 -->
      <n-space class="mb-4" justify="space-between">
        <n-space>
          <n-input
            v-model:value="searchQuery"
            placeholder="搜索用户名/邮箱"
            clearable
            style="width: 300px"
            @update:value="handleSearch"
          >
            <template #prefix>
              <n-icon size="16">
                <SearchOutline />
              </n-icon>
            </template>
          </n-input>

          <n-select
            v-model:value="filterStatus"
            :options="statusOptions"
            placeholder="筛选状态"
            clearable
            style="width: 150px"
            @update:value="handleSearch"
          />
        </n-space>

        <n-button type="primary" @click="showCreateModal = true">
          <template #icon>
            <n-icon><PersonAddOutline /></n-icon>
          </template>
          新建用户
        </n-button>
      </n-space>

      <!-- 用户列表 -->
      <n-data-table
        :columns="columns"
        :data="users"
        :bordered="false"
        :loading="loading"
        :pagination="pagination"
        :row-key="(row: any) => row.id"
      />

      <!-- 创建/编辑用户模态框 -->
      <n-modal
        v-model:show="showUserModal"
        preset="card"
        :title="isEditing ? '编辑用户' : '新建用户'"
        style="width: 500px"
        :segmented="{ content: 'soft', footer: 'soft' }"
      >
        <n-form
          ref="userFormRef"
          :model="userForm"
          :rules="userRules"
          label-placement="left"
          label-width="100"
        >
          <n-form-item label="邮箱" path="email">
            <n-input
              v-model:value="userForm.email"
              placeholder="请输入邮箱"
              :disabled="isEditing"
            />
          </n-form-item>

          <n-form-item label="姓名" path="name">
            <n-input v-model:value="userForm.name" placeholder="请输入姓名" />
          </n-form-item>

          <n-form-item
            v-if="!isEditing"
            label="密码"
            path="password"
          >
            <n-input
              v-model:value="userForm.password"
              type="password"
              placeholder="请输入密码（至少6位）"
              show-password-on="click"
            />
          </n-form-item>

          <n-form-item label="角色" path="role">
            <n-select
              v-model:value="userForm.role"
              :options="roleOptions"
              placeholder="选择角色"
            />
          </n-form-item>

          <n-form-item label="状态" path="status">
            <n-select
              v-model:value="userForm.status"
              :options="statusOptions"
              placeholder="选择状态"
            />
          </n-form-item>
        </n-form>

        <template #footer>
          <n-space justify="end">
            <n-button @click="closeUserModal">取消</n-button>
            <n-button
              type="primary"
              @click="handleUserSubmit"
              :loading="submitting"
            >
              保存
            </n-button>
          </n-space>
        </template>
      </n-modal>

      <!-- 状态更新确认模态框 -->
      <n-modal
        v-model:show="showStatusModal"
        preset="dialog"
        title="确认修改"
        :content="`确定要${statusActionText}该用户吗？`"
        positive-text="确认"
        negative-text="取消"
        @positive="handleStatusConfirm"
      />
    </n-card>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'default',
  requiresAuth: true,
})

const message = useMessage()
const userFormRef = ref()

// 状态定义
const loading = ref(false)
const submitting = ref(false)
const users = ref<any[]>([])
const searchQuery = ref('')
const filterStatus = ref('')
const showUserModal = ref(false)
const showStatusModal = ref(false)
const isEditing = ref(false)
const selectedUserId = ref('')
const statusAction = ref<'enable' | 'disable' | 'lock'>('enable')

// 用户表单
const userForm = reactive({
  id: '',
  email: '',
  name: '',
  password: '',
  role: 'user',
  status: 'active',
})

// 选项配置
const roleOptions = [
  { label: '普通用户', value: 'user' },
  { label: '管理员', value: 'admin' },
]

const statusOptions = [
  { label: '正常', value: 'active' },
  { label: '禁用', value: 'disabled' },
  { label: '锁定', value: 'locked' },
]

// 分页配置
const pagination = {
  pageSize: 10,
}

// 表格列定义
const columns = [
  {
    title: '姓名',
    key: 'name',
    render(row: any) {
      return row.name
    },
  },
  {
    title: '邮箱',
    key: 'email',
  },
  {
    title: '角色',
    key: 'role',
    render(row: any) {
      const type = row.role === 'admin' ? 'error' : 'info'
      const label = row.role === 'admin' ? '管理员' : '用户'
      return h(NTag, { type }, { default: () => label })
    },
  },
  {
    title: '状态',
    key: 'status',
    render(row: any) {
      const statusMap: Record<string, { type: any; label: string }> = {
        active: { type: 'success', label: '正常' },
        disabled: { type: 'warning', label: '禁用' },
        locked: { type: 'error', label: '锁定' },
      }
      const status = statusMap[row.status] || { type: 'default', label: row.status }
      return h(NTag, { type: status.type }, { default: () => status.label })
    },
  },
  {
    title: '创建时间',
    key: 'created_at',
    render(row: any) {
      return new Date(row.created_at).toLocaleString('zh-CN')
    },
  },
  {
    title: '操作',
    key: 'actions',
    render(row: any) {
      const actions: any[] = [
        h(
          NButton,
          {
            size: 'small',
            type: 'primary',
            ghost: true,
            onClick: () => handleEdit(row),
          },
          { default: () => '编辑' }
        ),
      ]

      // 不是管理员且不是默认管理员才能删除
      if (row.role !== 'admin' && row.id !== 'admin') {
        actions.push(
          h(
            NButton,
            {
              size: 'small',
              type: 'error',
              ghost: true,
              style: 'margin-left: 8px',
              onClick: () => handleDelete(row.id),
            },
            { default: () => '删除' }
          )
        )
      }

      // 状态切换按钮
      if (row.role !== 'admin' && row.id !== 'admin') {
        const statusAction = row.status === 'active' ? '禁用' : '启用'
        const statusType = row.status === 'active' ? 'warning' : 'success'
        actions.push(
          h(
            NButton,
            {
              size: 'small',
              type: statusType,
              ghost: true,
              style: 'margin-left: 8px',
              onClick: () => handleStatusChange(row.id, row.status),
            },
            { default: () => statusAction }
          )
        )
      }

      return h(NSpace, {}, { default: () => actions })
    },
  },
]

// 状态变更文本
const statusActionText = computed(() => {
  switch (statusAction.value) {
    case 'enable':
      return '启用'
    case 'disable':
      return '禁用'
    case 'lock':
      return '锁定'
    default:
      return '修改'
  }
})

// 加载用户列表
const fetchUsers = async () => {
  loading.value = true
  try {
    const params: any = {}
    if (searchQuery.value) params.search = searchQuery.value
    if (filterStatus.value) params.status = filterStatus.value

    const data = await $fetch('/api/v1/admin/users', {
      params,
    })
    users.value = data.users || []
  } catch (error: any) {
    message.error('获取用户列表失败')
  } finally {
    loading.value = false
  }
}

// 搜索处理
const handleSearch = () => {
  fetchUsers()
}

// 打开创建模态框
const openCreateModal = () => {
  isEditing.value = false
  resetUserForm()
  showUserModal.value = true
}

// 打开编辑模态框
const handleEdit = (row: any) => {
  isEditing.value = true
  selectedUserId.value = row.id
  userForm.id = row.id
  userForm.email = row.email
  userForm.name = row.name
  userForm.role = row.role
  userForm.status = row.status
  showUserModal.value = true
}

// 关闭用户模态框
const closeUserModal = () => {
  showUserModal.value = false
  resetUserForm()
}

// 重置表单
const resetUserForm = () => {
  userForm.id = ''
  userForm.email = ''
  userForm.name = ''
  userForm.password = ''
  userForm.role = 'user'
  userForm.status = 'active'
  selectedUserId.value = ''
  nextTick(() => {
    userFormRef.value?.restoreValidation()
  })
}

// 提交用户表单
const handleUserSubmit = async () => {
  try {
    await userFormRef.value?.validate()
    submitting.value = true

    const payload: any = {
      name: userForm.name,
      role: userForm.role,
      status: userForm.status,
    }

    if (!isEditing.value) {
      payload.email = userForm.email
      payload.password = userForm.password
    }

    const url = isEditing.value
      ? `/api/v1/admin/users/${userForm.id}`
      : '/api/v1/admin/users'

    await $fetch(url, {
      method: isEditing.value ? 'PUT' : 'POST',
      body: payload,
    })

    message.success(isEditing.value ? '用户已更新' : '用户已创建')
    closeUserModal()
    await fetchUsers()
  } catch (error: any) {
    if (error?.data?.message) {
      message.error(error.data.message)
    }
  } finally {
    submitting.value = false
  }
}

// 删除用户
const handleDelete = (userId: string) => {
  dialog.warning({
    title: '确认删除',
    content: '删除用户后无法恢复，确定要继续吗？',
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await $fetch(`/api/v1/admin/users/${userId}`, {
          method: 'DELETE',
        })
        message.success('用户已删除')
        await fetchUsers()
      } catch (error: any) {
        message.error(error.data?.message || '删除失败')
      }
    },
  })
}

// 状态变更
const handleStatusChange = (userId: string, currentStatus: string) => {
  selectedUserId.value = userId
  if (currentStatus === 'active') {
    statusAction.value = 'disable'
  } else {
    statusAction.value = 'enable'
  }
  showStatusModal.value = true
}

// 确认状态变更
const handleStatusConfirm = async () => {
  try {
    const newStatus =
      statusAction.value === 'enable' ? 'active' : 'disabled'

    await $fetch(`/api/v1/admin/users/${selectedUserId.value}/status`, {
      method: 'PATCH',
      body: { status: newStatus },
    })

    message.success('状态已更新')
    await fetchUsers()
  } catch (error: any) {
    message.error(error.data?.message || '更新失败')
  } finally {
    showStatusModal.value = false
  }
}

// 初始化
onMounted(() => {
  fetchUsers()
})
</script>

<style scoped>
.admin-users-page {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

.content-card {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.mb-4 {
  margin-bottom: 16px;
}
</style>
