<template>
  <div class="admin-roles-page">
    <div class="page-header">
      <h1 class="page-title font-display">角色权限管理</h1>
      <UButton color="primary" icon="i-lucide-user-plus" @click="openCreateModal">
        新建角色
      </UButton>
    </div>

    <div class="panel cf-surface">
      <div v-if="loading" class="state-box">
        <UIcon name="i-lucide-loader-circle" class="size-6 animate-spin" />
        <span>加载中…</span>
      </div>

      <div v-else-if="pagedRoles.length === 0" class="state-box">
        <UIcon name="i-lucide-shield" class="size-8 opacity-50" />
        <p>暂无角色</p>
      </div>

      <div v-else class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>角色名称</th>
              <th>角色代码</th>
              <th>描述</th>
              <th>系统角色</th>
              <th>默认角色</th>
              <th>权限数</th>
              <th>创建时间</th>
              <th class="col-actions">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in pagedRoles" :key="row.id">
              <td class="name">{{ row.name }}</td>
              <td><code class="role-code">{{ row.code }}</code></td>
              <td class="muted desc-cell" :title="row.description">{{ row.description || '—' }}</td>
              <td>
                <UBadge
                  size="sm"
                  variant="subtle"
                  :color="row.is_system ? 'error' : 'neutral'"
                >
                  {{ row.is_system ? '是' : '否' }}
                </UBadge>
              </td>
              <td>
                <UBadge
                  size="sm"
                  variant="subtle"
                  :color="row.is_default ? 'success' : 'neutral'"
                >
                  {{ row.is_default ? '是' : '否' }}
                </UBadge>
              </td>
              <td class="muted">{{ row.permissions?.length || 0 }}</td>
              <td class="muted">{{ formatDate(row.created_at) }}</td>
              <td>
                <div class="action-btns">
                  <UButton color="primary" variant="ghost" size="sm" @click="handleEdit(row)">
                    编辑
                  </UButton>
                  <UButton
                    v-if="!row.is_system"
                    color="error"
                    variant="ghost"
                    size="sm"
                    @click="askDelete(row.id)"
                  >
                    删除
                  </UButton>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="roles.length > pageSize" class="pager">
        <UButton
          color="neutral"
          variant="outline"
          size="sm"
          :disabled="page <= 1"
          @click="page--"
        >
          上一页
        </UButton>
        <span class="pager-page">{{ page }} / {{ roleTotalPages }}</span>
        <UButton
          color="neutral"
          variant="outline"
          size="sm"
          :disabled="page >= roleTotalPages"
          @click="page++"
        >
          下一页
        </UButton>
      </div>
    </div>

    <UModal
      v-model:open="showRoleModal"
      :title="isEditing ? '编辑角色' : '新建角色'"
      :ui="{ content: 'sm:max-w-xl' }"
    >
      <template #body>
        <form id="role-form" class="form-grid" @submit.prevent="handleRoleSubmit">
          <div class="field">
            <label class="field__label">角色名称</label>
            <UInput
              v-model="roleForm.name"
              class="w-full"
              placeholder="请输入角色名称"
              @update:model-value="errors.name = ''"
            />
            <p v-if="errors.name" class="field__error">{{ errors.name }}</p>
          </div>

          <div class="field">
            <label class="field__label">角色代码</label>
            <UInput
              v-model="roleForm.code"
              class="w-full"
              placeholder="如：admin, editor, viewer"
              :disabled="isEditing"
              @update:model-value="errors.code = ''"
            />
            <p class="field__hint">角色代码用于程序判断，只允许小写字母，创建后不可修改</p>
            <p v-if="errors.code" class="field__error">{{ errors.code }}</p>
          </div>

          <div class="field">
            <label class="field__label">描述</label>
            <UTextarea
              v-model="roleForm.description"
              class="w-full"
              :rows="3"
              placeholder="角色描述"
            />
          </div>

          <div class="field">
            <label class="field__label">权限配置</label>
            <div class="perm-groups">
              <details
                v-for="group in groupedPermissions"
                :key="group.name"
                class="perm-group"
                open
              >
                <summary class="perm-group__title">{{ group.name }}</summary>
                <div class="perm-grid">
                  <UCheckbox
                    v-for="perm in group.permissions"
                    :key="perm.id"
                    v-model="roleForm.permission_ids"
                    :value="perm.id"
                    :label="perm.name"
                  />
                </div>
              </details>
            </div>
          </div>
        </form>
      </template>

      <template #footer>
        <div class="modal-actions">
          <UButton color="neutral" variant="outline" @click="closeRoleModal">取消</UButton>
          <UButton form="role-form" type="submit" color="primary" :loading="submitting">
            保存
          </UButton>
        </div>
      </template>
    </UModal>

    <UModal v-model:open="showDeleteModal" title="确认删除" :ui="{ content: 'sm:max-w-md' }">
      <template #body>
        <p class="confirm-text">
          删除角色后，该角色的用户将失去所有权限。确定要删除吗？
        </p>
      </template>
      <template #footer>
        <div class="modal-actions">
          <UButton color="neutral" variant="outline" @click="showDeleteModal = false">取消</UButton>
          <UButton color="error" :loading="deletingLoading" @click="handleDeleteConfirm">
            删除
          </UButton>
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
const roles = ref<any[]>([])
const permissions = ref<any[]>([])
const showRoleModal = ref(false)
const showDeleteModal = ref(false)
const isEditing = ref(false)
const selectedRoleId = ref('')
const page = ref(1)
const pageSize = 10

const roleForm = reactive({
  id: '',
  name: '',
  code: '',
  description: '',
  permission_ids: [] as string[],
})

const errors = reactive({
  name: '',
  code: '',
})

const roleTotalPages = computed(() => Math.max(1, Math.ceil(roles.value.length / pageSize)))

const pagedRoles = computed(() => {
  const start = (page.value - 1) * pageSize
  return roles.value.slice(start, start + pageSize)
})

const groupedPermissions = computed(() => {
  const groups: Record<string, any[]> = {}

  permissions.value.forEach((perm) => {
    const groupName = perm.group || '其他'
    if (!groups[groupName]) {
      groups[groupName] = []
    }
    groups[groupName].push({
      id: perm.id,
      name: `${perm.name} (${perm.code})`,
    })
  })

  return Object.entries(groups).map(([name, perms]) => ({
    name,
    permissions: perms,
  }))
})

function formatDate(value: string) {
  return new Date(value).toLocaleString('zh-CN')
}

function validateRoleForm() {
  errors.name = ''
  errors.code = ''

  if (!roleForm.name.trim()) {
    errors.name = '请输入角色名称'
  } else if (roleForm.name.trim().length < 2 || roleForm.name.trim().length > 100) {
    errors.name = '长度在 2-100 个字符'
  }

  if (!isEditing.value) {
    if (!roleForm.code.trim()) {
      errors.code = '请输入角色代码'
    } else if (!/^[a-z][a-z0-9_]*$/.test(roleForm.code.trim())) {
      errors.code = '只允许小写字母、数字和下划线，且必须以字母开头'
    }
  }

  return !errors.name && !errors.code
}

const fetchRoles = async () => {
  loading.value = true
  try {
    const data = await $fetch('/api/v1/admin/roles')
    roles.value = (data as any) || []
    page.value = 1
  } catch {
    toast.add({ title: '获取角色列表失败', color: 'error' })
  } finally {
    loading.value = false
  }
}

const fetchPermissions = async () => {
  try {
    const data = await $fetch('/api/v1/permissions')
    permissions.value = (data as any) || []
  } catch {
    toast.add({ title: '获取权限列表失败', color: 'error' })
  }
}

const openCreateModal = () => {
  isEditing.value = false
  resetRoleForm()
  showRoleModal.value = true
}

const handleEdit = (row: any) => {
  isEditing.value = true
  selectedRoleId.value = row.id
  roleForm.id = row.id
  roleForm.name = row.name
  roleForm.code = row.code
  roleForm.description = row.description || ''
  roleForm.permission_ids = row.permissions?.map((p: any) => p.id) || []
  errors.name = ''
  errors.code = ''
  showRoleModal.value = true
}

const closeRoleModal = () => {
  showRoleModal.value = false
  resetRoleForm()
}

const resetRoleForm = () => {
  roleForm.id = ''
  roleForm.name = ''
  roleForm.code = ''
  roleForm.description = ''
  roleForm.permission_ids = []
  selectedRoleId.value = ''
  errors.name = ''
  errors.code = ''
}

const handleRoleSubmit = async () => {
  if (!validateRoleForm()) return

  submitting.value = true
  try {
    const payload: any = {
      name: roleForm.name,
      description: roleForm.description,
      permission_ids: roleForm.permission_ids,
    }

    if (!isEditing.value) {
      payload.code = roleForm.code
    }

    const url = isEditing.value
      ? `/api/v1/admin/roles/${roleForm.id}`
      : '/api/v1/admin/roles'

    await $fetch(url, {
      method: isEditing.value ? 'PUT' : 'POST',
      body: payload,
    })

    toast.add({ title: isEditing.value ? '角色已更新' : '角色已创建', color: 'success' })
    closeRoleModal()
    await fetchRoles()
  } catch (error: any) {
    if (error?.data?.message) {
      toast.add({ title: error.data.message, color: 'error' })
    }
  } finally {
    submitting.value = false
  }
}

const askDelete = (roleId: string) => {
  selectedRoleId.value = roleId
  showDeleteModal.value = true
}

const handleDeleteConfirm = async () => {
  deletingLoading.value = true
  try {
    await $fetch(`/api/v1/admin/roles/${selectedRoleId.value}`, {
      method: 'DELETE',
    })
    toast.add({ title: '角色已删除', color: 'success' })
    showDeleteModal.value = false
    await fetchRoles()
  } catch (error: any) {
    toast.add({ title: error.data?.message || '删除失败', color: 'error' })
  } finally {
    deletingLoading.value = false
  }
}

onMounted(async () => {
  await Promise.all([fetchRoles(), fetchPermissions()])
})
</script>

<style scoped>
.admin-roles-page {
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
  width: 140px;
}

.name {
  font-weight: 600;
  color: var(--cf-ink);
}

.muted {
  color: var(--cf-ink-soft);
}

.desc-cell {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.role-code {
  font-family: var(--font-mono);
  font-size: 0.8125rem;
  color: var(--cf-ink);
  background: color-mix(in oklab, var(--cf-ink) 5%, transparent);
  padding: 2px 6px;
  border-radius: 4px;
}

.action-btns {
  display: flex;
  align-items: center;
  gap: 2px;
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

.field__hint {
  margin: 0;
  font-size: 0.75rem;
  color: var(--cf-ink-soft);
}

.field__error {
  margin: 0;
  font-size: 0.75rem;
  color: var(--cf-danger);
}

.perm-groups {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 280px;
  overflow-y: auto;
}

.perm-group {
  border: 1px solid var(--cf-line);
  border-radius: 8px;
  padding: 8px 12px;
}

.perm-group__title {
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--cf-ink);
  list-style: none;
}

.perm-group__title::-webkit-details-marker {
  display: none;
}

.perm-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin-top: 10px;
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
