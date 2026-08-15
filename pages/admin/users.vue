<template>
  <div class="cf-page">
    <div class="cf-page-header">
      <div class="cf-page-heading">
        <h1 class="cf-page-title">{{ t('users.title') }}</h1>
        <p class="cf-page-sub">{{ t('users.sub') }}</p>
      </div>
      <CfButton tone="primary" icon="i-lucide-user-plus" @click="openCreateModal">
        {{ t('users.new') }}
      </CfButton>
    </div>

    <div class="list-toolbar">
      <span class="list-count">{{ t('users.count', { n: users.length }) }}</span>
      <span class="list-hint">{{ t('common.hintDblclickEdit') }}</span>
    </div>

    <div class="cf-panel">
      <div class="toolbar">
        <div class="toolbar-left">
          <UInput
            v-model="searchQuery"
            class="search-input"
            :placeholder="t('users.searchPh')"
            icon="i-lucide-search"
            @update:model-value="handleSearch"
          />
          <USelect
            v-model="filterStatus"
            class="status-filter"
            :items="statusFilterOptions"
            :placeholder="t('users.filterStatus')"
            @update:model-value="handleSearch"
          />
        </div>
      </div>

      <div v-if="loading" class="cf-state">
        <UIcon name="i-lucide-loader-circle" class="size-6 animate-spin" />
        <span>{{ t('common.loading') }}</span>
      </div>

      <div v-else-if="pagedUsers.length === 0" class="cf-state">
        <UIcon name="i-lucide-users" class="size-8 opacity-50" />
        <p>{{ t('users.empty') }}</p>
      </div>

      <div v-else class="cf-table-wrap">
        <table class="cf-data-table">
          <thead>
            <tr>
              <th>{{ t('users.name') }}</th>
              <th>{{ t('common.email') }}</th>
              <th>{{ t('users.role') }}</th>
              <th>{{ t('common.status') }}</th>
              <th>{{ t('common.createdAt') }}</th>
              <th class="cf-col-actions">{{ t('common.actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in pagedUsers"
              :key="row.id"
              class="list-row"
              @dblclick="handleEdit(row)"
            >
              <td class="name">{{ row.name }}</td>
              <td class="cf-muted">{{ row.email }}</td>
              <td>
                <UBadge
                  size="sm"
                  variant="subtle"
                  :color="row.role === 'admin' ? 'error' : 'info'"
                >
                  {{ row.role === 'admin' ? t('role.admin') : t('role.user') }}
                </UBadge>
              </td>
              <td>
                <UBadge size="sm" variant="subtle" :color="statusBadgeColor(row.status)">
                  {{ statusLabel(row.status) }}
                </UBadge>
              </td>
              <td class="cf-muted">{{ d(row.created_at) }}</td>
              <td @dblclick.stop>
                <div class="action-btns">
                  <CfButton
                    tone="icon-accent"
                    icon="i-lucide-pencil"
                    :tip="t('common.edit')"
                    @click="handleEdit(row)"
                  />
                  <template v-if="row.role !== 'admin' && row.id !== 'admin'">
                    <CfButton
                      :tone="row.status === 'active' ? 'icon' : 'icon-accent'"
                      :icon="row.status === 'active' ? 'i-lucide-ban' : 'i-lucide-check'"
                      :tip="row.status === 'active' ? t('users.actionDisable') : t('users.actionEnable')"
                      @click="handleStatusChange(row.id, row.status)"
                    />
                    <CfButton
                      tone="icon-danger"
                      icon="i-lucide-trash-2"
                      :tip="t('common.delete')"
                      @click="askDelete(row)"
                    />
                  </template>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="users.length > pageSize" class="pager">
        <CfButton
          tone="secondary"
          icon="i-lucide-chevron-left"
          :disabled="page <= 1"
          @click="page--"
        >
          {{ t('common.prev') }}
        </CfButton>
        <span class="pager-page">{{ page }} / {{ userTotalPages }}</span>
        <CfButton
          tone="secondary"
          icon="i-lucide-chevron-right"
          :disabled="page >= userTotalPages"
          @click="page++"
        >
          {{ t('common.next') }}
        </CfButton>
      </div>
    </div>

    <UModal
      v-model:open="showUserModal"
      :title="isEditing ? t('users.editTitle') : t('users.createTitle')"
      :ui="{ content: 'sm:max-w-lg' }"
    >
      <template #body>
        <form id="user-form" class="form-grid" @submit.prevent="handleUserSubmit">
          <div class="field">
            <label class="field__label">{{ t('common.email') }}</label>
            <UInput
              v-model="userForm.email"
              class="w-full"
              :placeholder="t('users.emailPh')"
              :disabled="isEditing"
              @update:model-value="errors.email = ''"
            />
            <p v-if="errors.email" class="field__error">{{ errors.email }}</p>
          </div>

          <div class="field">
            <label class="field__label">{{ t('users.name') }}</label>
            <UInput
              v-model="userForm.name"
              class="w-full"
              :placeholder="t('users.namePh')"
              @update:model-value="errors.name = ''"
            />
            <p v-if="errors.name" class="field__error">{{ errors.name }}</p>
          </div>

          <div v-if="!isEditing" class="field">
            <label class="field__label">{{ t('common.password') }}</label>
            <UInput
              v-model="userForm.password"
              class="w-full"
              type="password"
              :placeholder="t('users.passwordPh')"
              @update:model-value="errors.password = ''"
            />
            <p v-if="errors.password" class="field__error">{{ errors.password }}</p>
          </div>

          <div class="field">
            <label class="field__label">{{ t('users.role') }}</label>
            <USelect
              v-model="userForm.role"
              class="w-full"
              :items="roleOptions"
              :placeholder="t('users.pickRole')"
            />
          </div>

          <div class="field">
            <label class="field__label">{{ t('common.status') }}</label>
            <USelect
              v-model="userForm.status"
              class="w-full"
              :items="statusOptions"
              :placeholder="t('users.pickStatus')"
            />
          </div>
        </form>
      </template>

      <template #footer>
        <div class="modal-actions">
          <div class="modal-actions__right">
            <CfButton tone="secondary" icon="i-lucide-x" @click="closeUserModal">{{ t('common.cancel') }}</CfButton>
            <CfButton
              form="user-form"
              type="submit"
              tone="primary"
              :icon="isEditing ? 'i-lucide-check' : 'i-lucide-user-plus'"
              :loading="submitting"
            >
              {{ isEditing ? t('common.save') : t('common.create') }}
            </CfButton>
          </div>
        </div>
      </template>
    </UModal>

    <UModal v-model:open="showStatusModal" :title="t('users.confirmStatusTitle')" :ui="{ content: 'sm:max-w-md' }">
      <template #body>
        <p class="confirm-text">{{ t('users.confirmStatus', { action: statusActionText }) }}</p>
      </template>
      <template #footer>
        <div class="modal-actions">
          <div class="modal-actions__right">
            <CfButton tone="secondary" icon="i-lucide-x" @click="showStatusModal = false">{{ t('common.cancel') }}</CfButton>
            <CfButton tone="primary" icon="i-lucide-check" @click="handleStatusConfirm">{{ t('common.confirm') }}</CfButton>
          </div>
        </div>
      </template>
    </UModal>

    <UModal v-model:open="deleteVisible" :title="t('users.deleteTitle')" :ui="{ content: 'sm:max-w-md' }">
      <template #body>
        <p class="confirm-text">{{ t('users.deleteText') }}</p>
      </template>
      <template #footer>
        <div class="modal-actions">
          <div class="modal-actions__right">
            <CfButton tone="secondary" icon="i-lucide-x" @click="deleteVisible = false">{{ t('common.cancel') }}</CfButton>
            <CfButton
              tone="danger"
              strong
              icon="i-lucide-trash-2"
              :loading="deletingLoading"
              @click="confirmDelete"
            >
              {{ t('common.delete') }}
            </CfButton>
          </div>
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
const { t, d } = useLocale()

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

const roleOptions = computed(() => [
  { label: t('role.user'), value: 'user' },
  { label: t('role.admin'), value: 'admin' },
])

const statusOptions = computed(() => [
  { label: t('status.active'), value: 'active' },
  { label: t('status.disabled'), value: 'disabled' },
  { label: t('status.locked'), value: 'locked' },
])

/** USelect forbids empty-string item values. */
const STATUS_ALL = 'all'
const statusFilterOptions = computed(() => [
  { label: t('status.all'), value: STATUS_ALL },
  ...statusOptions.value,
])

const userTotalPages = computed(() => Math.max(1, Math.ceil(users.value.length / pageSize)))

const pagedUsers = computed(() => {
  const start = (page.value - 1) * pageSize
  return users.value.slice(start, start + pageSize)
})

const statusActionText = computed(() => {
  switch (statusAction.value) {
    case 'enable':
      return t('users.actionEnable')
    case 'disable':
      return t('users.actionDisable')
    case 'lock':
      return t('users.actionLock')
    default:
      return t('users.actionChange')
  }
})

function statusLabel(status: string) {
  const map: Record<string, string> = {
    active: t('status.active'),
    disabled: t('status.disabled'),
    locked: t('status.locked'),
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
    if (!userForm.email.trim()) errors.email = t('users.needEmail')
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userForm.email.trim())) {
      errors.email = t('users.badEmail')
    }
    if (!userForm.password || userForm.password.length < 6) {
      errors.password = t('auth.passwordMin')
    }
  }

  if (!userForm.name.trim()) errors.name = t('users.needName')

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
    toast.add({ title: t('users.listFail'), color: 'error' })
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

    toast.add({ title: isEditing.value ? t('users.updated') : t('users.created'), color: 'success' })
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
    toast.add({ title: t('users.deleted'), color: 'success' })
    deleteVisible.value = false
    await fetchUsers()
  } catch (error: any) {
    toast.add({ title: error.data?.message || t('common.deleteFail'), color: 'error' })
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

    toast.add({ title: t('users.statusUpdated'), color: 'success' })
    await fetchUsers()
  } catch (error: any) {
    toast.add({ title: error.data?.message || t('common.updateFail'), color: 'error' })
  } finally {
    showStatusModal.value = false
  }
}

onMounted(() => {
  fetchUsers()
})
</script>

<style scoped>
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

.cf-col-actions {
  width: 220px;
}

.name {
  font-weight: 600;
  color: var(--cf-ink);
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

.modal-actions__right {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}

.confirm-text {
  margin: 0;
  color: var(--cf-ink-soft);
  line-height: 1.5;
}
</style>
