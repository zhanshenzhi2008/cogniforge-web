<template>
  <div class="cf-page">
    <div class="cf-page-header">
      <div class="cf-page-heading">
        <h1 class="cf-page-title">{{ t('roles.title') }}</h1>
        <p class="cf-page-sub">{{ t('roles.sub') }}</p>
      </div>
      <CfButton tone="primary" icon="i-lucide-shield-plus" @click="openCreateModal">
        {{ t('roles.new') }}
      </CfButton>
    </div>

    <div class="list-toolbar">
      <span class="list-count">{{ t('roles.count', { n: roles.length }) }}</span>
      <span class="list-hint">{{ t('common.hintDblclickEdit') }}</span>
    </div>

    <div class="cf-panel">
      <div v-if="loading" class="cf-state">
        <UIcon name="i-lucide-loader-circle" class="size-6 animate-spin" />
        <span>{{ t('common.loading') }}</span>
      </div>

      <div v-else-if="pagedRoles.length === 0" class="cf-state">
        <UIcon name="i-lucide-shield" class="size-8 opacity-50" />
        <p>{{ t('roles.empty') }}</p>
      </div>

      <div v-else class="cf-table-wrap">
        <table class="cf-data-table">
          <thead>
            <tr>
              <th>{{ t('roles.name') }}</th>
              <th>{{ t('roles.code') }}</th>
              <th>{{ t('common.description') }}</th>
              <th>{{ t('roles.system') }}</th>
              <th>{{ t('roles.default') }}</th>
              <th>{{ t('roles.permCount') }}</th>
              <th>{{ t('common.createdAt') }}</th>
              <th class="cf-col-actions">{{ t('common.actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in pagedRoles"
              :key="row.id"
              class="list-row"
              @dblclick="handleEdit(row)"
            >
              <td class="name">{{ row.name }}</td>
              <td><code class="role-code">{{ row.code }}</code></td>
              <td class="cf-muted desc-cell" :title="row.description">{{ row.description || '—' }}</td>
              <td>
                <UBadge
                  size="sm"
                  variant="subtle"
                  :color="row.is_system ? 'error' : 'neutral'"
                >
                  {{ row.is_system ? t('common.yes') : t('common.no') }}
                </UBadge>
              </td>
              <td>
                <UBadge
                  size="sm"
                  variant="subtle"
                  :color="row.is_default ? 'success' : 'neutral'"
                >
                  {{ row.is_default ? t('common.yes') : t('common.no') }}
                </UBadge>
              </td>
              <td class="cf-muted">{{ row.permissions?.length || 0 }}</td>
              <td class="cf-muted">{{ d(row.created_at) }}</td>
              <td @dblclick.stop>
                <div class="action-btns">
                  <CfButton
                    tone="icon-accent"
                    icon="i-lucide-pencil"
                    :tip="t('common.edit')"
                    @click="handleEdit(row)"
                  />
                  <CfButton
                    v-if="!row.is_system"
                    tone="icon-danger"
                    icon="i-lucide-trash-2"
                    :tip="t('common.delete')"
                    @click="askDelete(row.id)"
                  />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="roles.length > pageSize" class="pager">
        <CfButton
          tone="secondary"
          icon="i-lucide-chevron-left"
          :disabled="page <= 1"
          @click="page--"
        >
          {{ t('common.prev') }}
        </CfButton>
        <span class="pager-page">{{ page }} / {{ roleTotalPages }}</span>
        <CfButton
          tone="secondary"
          icon="i-lucide-chevron-right"
          :disabled="page >= roleTotalPages"
          @click="page++"
        >
          {{ t('common.next') }}
        </CfButton>
      </div>
    </div>

    <UModal
      v-model:open="showRoleModal"
      :title="isEditing ? t('roles.editTitle') : t('roles.createTitle')"
      :ui="{ content: 'sm:max-w-xl' }"
    >
      <template #body>
        <form id="role-form" class="form-grid" @submit.prevent="handleRoleSubmit">
          <div class="field">
            <label class="field__label">{{ t('roles.name') }}</label>
            <UInput
              v-model="roleForm.name"
              class="w-full"
              :placeholder="t('roles.namePh')"
              @update:model-value="errors.name = ''"
            />
            <p v-if="errors.name" class="field__error">{{ errors.name }}</p>
          </div>

          <div class="field">
            <label class="field__label">{{ t('roles.code') }}</label>
            <UInput
              v-model="roleForm.code"
              class="w-full"
              :placeholder="t('roles.codePh')"
              :disabled="isEditing"
              @update:model-value="errors.code = ''"
            />
            <p class="field__hint">{{ t('roles.codeHint') }}</p>
            <p v-if="errors.code" class="field__error">{{ errors.code }}</p>
          </div>

          <div class="field">
            <label class="field__label">{{ t('common.description') }}</label>
            <UTextarea
              v-model="roleForm.description"
              class="w-full"
              :rows="3"
              :placeholder="t('roles.descPh')"
            />
          </div>

          <div class="field">
            <label class="field__label">{{ t('roles.perms') }}</label>
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
          <div class="modal-actions__right">
            <CfButton tone="secondary" icon="i-lucide-x" @click="closeRoleModal">{{ t('common.cancel') }}</CfButton>
            <CfButton
              form="role-form"
              type="submit"
              tone="primary"
              :icon="isEditing ? 'i-lucide-check' : 'i-lucide-plus'"
              :loading="submitting"
            >
              {{ isEditing ? t('common.save') : t('common.create') }}
            </CfButton>
          </div>
        </div>
      </template>
    </UModal>

    <UModal v-model:open="showDeleteModal" :title="t('roles.deleteTitle')" :ui="{ content: 'sm:max-w-md' }">
      <template #body>
        <p class="confirm-text">
          {{ t('roles.deleteText') }}
        </p>
      </template>
      <template #footer>
        <div class="modal-actions">
          <div class="modal-actions__right">
            <CfButton tone="secondary" icon="i-lucide-x" @click="showDeleteModal = false">{{ t('common.cancel') }}</CfButton>
            <CfButton
              tone="danger"
              strong
              icon="i-lucide-trash-2"
              :loading="deletingLoading"
              @click="handleDeleteConfirm"
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
    const groupName = perm.group || t('roles.otherGroup')
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

function validateRoleForm() {
  errors.name = ''
  errors.code = ''

  if (!roleForm.name.trim()) {
    errors.name = t('roles.needName')
  } else if (roleForm.name.trim().length < 2 || roleForm.name.trim().length > 100) {
    errors.name = t('roles.nameLen')
  }

  if (!isEditing.value) {
    if (!roleForm.code.trim()) {
      errors.code = t('roles.needCode')
    } else if (!/^[a-z][a-z0-9_]*$/.test(roleForm.code.trim())) {
      errors.code = t('roles.badCode')
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
    toast.add({ title: t('roles.listFail'), color: 'error' })
  } finally {
    loading.value = false
  }
}

const fetchPermissions = async () => {
  try {
    const data = await $fetch('/api/v1/permissions')
    permissions.value = (data as any) || []
  } catch {
    toast.add({ title: t('roles.permFail'), color: 'error' })
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

    toast.add({ title: isEditing.value ? t('roles.updated') : t('roles.created'), color: 'success' })
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
    toast.add({ title: t('roles.deleted'), color: 'success' })
    showDeleteModal.value = false
    await fetchRoles()
  } catch (error: any) {
    toast.add({ title: error.data?.message || t('common.deleteFail'), color: 'error' })
  } finally {
    deletingLoading.value = false
  }
}

onMounted(async () => {
  await Promise.all([fetchRoles(), fetchPermissions()])
})
</script>

<style scoped>
.name {
  font-weight: 600;
  color: var(--cf-ink);
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
