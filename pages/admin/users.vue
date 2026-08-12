<template>
  <div class="admin-users-page">
    <div class="page-header">
      <h1 class="page-title font-display">用户管理</h1>
      <UButton color="primary" icon="i-lucide-user-plus" @click="openCreateModal">
        新建用户
      </UButton>
    </div>

    <div class="panel cf-surface">
      <div class="toolbar">
        <div class="toolbar-left">
          <UInput
            v-model="searchQuery"
            class="search-input"
            placeholder="搜索用户名/邮箱"
            icon="i-lucide-search"
            @update:model-value="handleSearch"
          />
          <USelect
            v-model="filterStatus"
            class="status-filter"
            :items="statusFilterOptions"
            placeholder="筛选状态"
            @update:model-value="handleSearch"
          />
        </div>
      </div>

      <div v-if="loading" class="state-box">
        <UIcon name="i-lucide-loader-circle" class="size-6 animate-spin" />
        <span>加载中…</span>
      </div>

      <div v-else-if="pagedUsers.length === 0" class="state-box">
        <UIcon name="i-lucide-users" class="size-8 opacity-50" />
        <p>暂无用户</p>
      </div>

      <div v-else class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>姓名</th>
              <th>邮箱</th>
              <th>角色</th>
              <th>状态</th>
              <th>创建时间</th>
              <th class="col-actions">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in pagedUsers" :key="row.id">
              <td class="name">{{ row.name }}</td>
              <td class="muted">{{ row.email }}</td>
              <td>
                <UBadge
                  size="sm"
                  variant="subtle"
                  :color="row.role === 'admin' ? 'error' : 'info'"
                >
                  {{ row.role === 'admin' ? '管理员' : '用户' }}
                </UBadge>
              </td>
              <td>
                <UBadge size="sm" variant="subtle" :color="statusBadgeColor(row.status)">
                  {{ statusLabel(row.status) }}
                </UBadge>
              </td>
              <td class="muted">{{ formatDate(row.created_at) }}</td>
              <td>
                <div class="action-btns">
                  <UButton color="primary" variant="ghost" size="sm" @click="handleEdit(row)">
                    编辑
                  </UButton>
                  <template v-if="row.role !== 'admin' && row.id !== 'admin'">
                    <UButton color="error" variant="ghost" size="sm" @click="askDelete(row)">
                      删除
                    </UButton>
                    <UButton
                      :color="row.status === 'active' ? 'warning' : 'success'"
                      variant="ghost"
                      size="sm"
                      @click="handleStatusChange(row.id, row.status)"
                    >
                      {{ row.status === 'active' ? '禁用' : '启用' }}
                    </UButton>
                  </template>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="users.length > pageSize" class="pager">
        <UButton
          color="neutral"
          variant="outline"
          size="sm"
          :disabled="page <= 1"
          @click="page--"
        >
          上一页
        </UButton>
        <span class="pager-page">{{ page }} / {{ userTotalPages }}</span>
        <UButton
          color="neutral"
          variant="outline"
          size="sm"
          :disabled="page >= userTotalPages"
          @click="page++"
        >
          下一页
        </UButton>
      </div>
    </div>

    <UModal
      v-model:open="showUserModal"
      :title="isEditing ? '编辑用户' : '新建用户'"
      :ui="{ content: 'sm:max-w-lg' }"
    >
      <template #body>
        <form id="user-form" class="form-grid" @submit.prevent="handleUserSubmit">
          <div class="field">
            <label class="field__label">邮箱</label>
            <UInput
              v-model="userForm.email"
              class="w-full"
              placeholder="请输入邮箱"
              :disabled="isEditing"
              @update:model-value="errors.email = ''"
            />
            <p v-if="errors.email" class="field__error">{{ errors.email }}</p>
          </div>

          <div class="field">
            <label class="field__label">姓名</label>
            <UInput
              v-model="userForm.name"
              class="w-full"
              placeholder="请输入姓名"
              @update:model-value="errors.name = ''"
            />
            <p v-if="errors.name" class="field__error">{{ errors.name }}</p>
          </div>

          <div v-if="!isEditing" class="field">
            <label class="field__label">密码</label>
            <UInput
              v-model="userForm.password"
              class="w-full"
              type="password"
              placeholder="请输入密码（至少6位）"
              @update:model-value="errors.password = ''"
            />
            <p v-if="errors.password" class="field__error">{{ errors.password }}</p>
          </div>

          <div class="field">
            <label class="field__label">角色</label>
            <USelect
              v-model="userForm.role"
              class="w-full"
              :items="roleOptions"
              placeholder="选择角色"
            />
          </div>

          <div class="field">
            <label class="field__label">状态</label>
            <USelect
              v-model="userForm.status"
              class="w-full"
              :items="statusOptions"
              placeholder="选择状态"
            />
          </div>
        </form>
      </template>

      <template #footer>
        <div class="modal-actions">
          <UButton color="neutral" variant="outline" @click="closeUserModal">取消</UButton>
          <UButton form="user-form" type="submit" color="primary" :loading="submitting">
            保存
          </UButton>
        </div>
      </template>
    </UModal>

    <UModal v-model:open="showStatusModal" title="确认修改" :ui="{ content: 'sm:max-w-md' }">
      <template #body>
        <p class="confirm-text">确定要{{ statusActionText }}该用户吗？</p>
      </template>
      <template #footer>
        <div class="modal-actions">
          <UButton color="neutral" variant="outline" @click="showStatusModal = false">取消</UButton>
          <UButton color="primary" @click="handleStatusConfirm">确认</UButton>
        </div>
      </template>
    </UModal>

    <UModal v-model:open="deleteVisible" title="确认删除" :ui="{ content: 'sm:max-w-md' }">
      <template #body>
        <p class="confirm-text">删除用户后无法恢复，确定要继续吗？</p>
      </template>
      <template #footer>
        <div class="modal-actions">
          <UButton color="neutral" variant="outline" @click="deleteVisible = false">取消</UButton>
          <UButton color="error" :loading="deletingLoading" @click="confirmDelete">删除</UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'default',
  requiresAuth: true,
})

const toast = useToast()

const loading = ref(false)
const submitting = ref(false)
const deletingLoading = ref(false)
const users = ref<any[]>([])
const searchQuery = ref('')
const filterStatus = ref('all')
const showUserModal = ref(false)
const showStatusModal = ref(false)
const deleteVisible = ref(false)
const isEditing = ref(false)
const selectedUserId = ref('')
const deletingUserId = ref('')
const statusAction = ref<'enable' | 'disable' | 'lock'>('enable')
const page = ref(1)
const pageSize = 10

const userForm = reactive({
  id: '',
  email: '',
  name: '',
  password: '',
  role: 'user',
  status: 'active',
})

const errors = reactive({
  email: '',
  name: '',
  password: '',
})

const roleOptions = [
  { label: '普通用户', value: 'user' },
  { label: '管理员', value: 'admin' },
]

const statusOptions = [
  { label: '正常', value: 'active' },
  { label: '禁用', value: 'disabled' },
  { label: '锁定', value: 'locked' },
]

/** USelect forbids empty-string item values. */
const STATUS_ALL = 'all'
const statusFilterOptions = [
  { label: '全部状态', value: STATUS_ALL },
  ...statusOptions,
]

const userTotalPages = computed(() => Math.max(1, Math.ceil(users.value.length / pageSize)))

const pagedUsers = computed(() => {
  const start = (page.value - 1) * pageSize
  return users.value.slice(start, start + pageSize)
})

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

function formatDate(value: string) {
  return new Date(value).toLocaleString('zh-CN')
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    active: '正常',
    disabled: '禁用',
    locked: '锁定',
  }
  return map[status] || status
}

function statusBadgeColor(status: string): 'success' | 'warning' | 'error' | 'neutral' {
  const map: Record<string, 'success' | 'warning' | 'error'> = {
    active: 'success',
    disabled: 'warning',
    locked: 'error',
  }
  return map[status] || 'neutral'
}

function validateUserForm() {
  errors.email = ''
  errors.name = ''
  errors.password = ''

  if (!isEditing.value) {
    if (!userForm.email.trim()) errors.email = '请输入邮箱'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userForm.email.trim())) {
      errors.email = '邮箱格式不正确'
    }
    if (!userForm.password || userForm.password.length < 6) {
      errors.password = '密码至少 6 位'
    }
  }

  if (!userForm.name.trim()) errors.name = '请输入姓名'

  return !errors.email && !errors.name && !errors.password
}

const fetchUsers = async () => {
  loading.value = true
  try {
    const params: any = {}
    if (searchQuery.value) params.search = searchQuery.value
    if (filterStatus.value && filterStatus.value !== 'all') params.status = filterStatus.value

    const data = await $fetch('/api/v1/admin/users', {
      params,
    })
    users.value = (data as any).users || []
    page.value = 1
  } catch {
    toast.add({ title: '获取用户列表失败', color: 'error' })
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  fetchUsers()
}

const openCreateModal = () => {
  isEditing.value = false
  resetUserForm()
  showUserModal.value = true
}

const handleEdit = (row: any) => {
  isEditing.value = true
  selectedUserId.value = row.id
  userForm.id = row.id
  userForm.email = row.email
  userForm.name = row.name
  userForm.role = row.role
  userForm.status = row.status
  errors.email = ''
  errors.name = ''
  errors.password = ''
  showUserModal.value = true
}

const closeUserModal = () => {
  showUserModal.value = false
  resetUserForm()
}

const resetUserForm = () => {
  userForm.id = ''
  userForm.email = ''
  userForm.name = ''
  userForm.password = ''
  userForm.role = 'user'
  userForm.status = 'active'
  selectedUserId.value = ''
  errors.email = ''
  errors.name = ''
  errors.password = ''
}

const handleUserSubmit = async () => {
  if (!validateUserForm()) return

  submitting.value = true
  try {
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

    toast.add({ title: isEditing.value ? '用户已更新' : '用户已创建', color: 'success' })
    closeUserModal()
    await fetchUsers()
  } catch (error: any) {
    if (error?.data?.message) {
      toast.add({ title: error.data.message, color: 'error' })
    }
  } finally {
    submitting.value = false
  }
}

const askDelete = (row: any) => {
  deletingUserId.value = row.id
  deleteVisible.value = true
}

const confirmDelete = async () => {
  deletingLoading.value = true
  try {
    await $fetch(`/api/v1/admin/users/${deletingUserId.value}`, {
      method: 'DELETE',
    })
    toast.add({ title: '用户已删除', color: 'success' })
    deleteVisible.value = false
    await fetchUsers()
  } catch (error: any) {
    toast.add({ title: error.data?.message || '删除失败', color: 'error' })
  } finally {
    deletingLoading.value = false
  }
}

const handleStatusChange = (userId: string, currentStatus: string) => {
  selectedUserId.value = userId
  if (currentStatus === 'active') {
    statusAction.value = 'disable'
  } else {
    statusAction.value = 'enable'
  }
  showStatusModal.value = true
}

const handleStatusConfirm = async () => {
  try {
    const newStatus = statusAction.value === 'enable' ? 'active' : 'disabled'

    await $fetch(`/api/v1/admin/users/${selectedUserId.value}/status`, {
      method: 'PATCH',
      body: { status: newStatus },
    })

    toast.add({ title: '状态已更新', color: 'success' })
    await fetchUsers()
  } catch (error: any) {
    toast.add({ title: error.data?.message || '更新失败', color: 'error' })
  } finally {
    showStatusModal.value = false
  }
}

onMounted(() => {
  fetchUsers()
})
</script>

<style scoped>
.admin-users-page {
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px 20px 40px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.page-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--cf-ink);
}

.panel {
  border-radius: 10px;
  padding: 8px;
  min-height: 220px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 10px 14px 6px;
}

.toolbar-left {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.search-input {
  width: 280px;
}

.status-filter {
  width: 150px;
}

.state-box {
  min-height: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: var(--cf-ink-soft);
}

.table-wrap {
  width: 100%;
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.data-table th,
.data-table td {
  padding: 12px 14px;
  text-align: left;
  border-bottom: 1px solid var(--cf-line);
  vertical-align: middle;
}

.data-table th {
  color: var(--cf-ink-soft);
  font-weight: 500;
  white-space: nowrap;
}

.col-actions {
  width: 220px;
}

.name {
  font-weight: 600;
  color: var(--cf-ink);
}

.muted {
  color: var(--cf-ink-soft);
}

.action-btns {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-wrap: wrap;
}

.pager {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
  padding: 12px 14px;
}

.pager-page {
  font-size: 0.8125rem;
  color: var(--cf-ink-soft);
  min-width: 64px;
  text-align: center;
}

.form-grid {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field__label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--cf-ink);
}

.field__error {
  margin: 0;
  font-size: 0.75rem;
  color: var(--cf-danger);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.confirm-text {
  margin: 0;
  color: var(--cf-ink-soft);
  line-height: 1.5;
}
</style>
