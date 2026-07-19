<template>
  <div class="admin-roles-page">
    <n-card title="角色权限管理" class="content-card">
      <!-- 操作栏 -->
      <n-space class="mb-4" justify="space-between">
        <n-space>
          <n-button type="primary" @click="openCreateModal">
            <template #icon>
              <n-icon><PersonAddOutline /></n-icon>
            </template>
            新建角色
          </n-button>
        </n-space>
      </n-space>

      <!-- 角色列表 -->
      <n-data-table
        :columns="columns"
        :data="roles"
        :bordered="false"
        :loading="loading"
        :pagination="pagination"
        :row-key="(row: any) => row.id"
      />

      <!-- 创建/编辑角色模态框 -->
      <n-modal
        v-model:show="showRoleModal"
        preset="card"
        :title="isEditing ? '编辑角色' : '新建角色'"
        style="width: 600px"
        :segmented="{ content: 'soft', footer: 'soft' }"
      >
        <n-form
          ref="roleFormRef"
          :model="roleForm"
          :rules="roleRules"
          label-placement="left"
          label-width="100"
        >
          <n-form-item label="角色名称" path="name">
            <n-input
              v-model:value="roleForm.name"
              placeholder="请输入角色名称"
            />
          </n-form-item>

          <n-form-item label="角色代码" path="code">
            <n-input
              v-model:value="roleForm.code"
              placeholder="如：admin, editor, viewer"
              :disabled="isEditing"
            />
            <template #help>
              角色代码用于程序判断，只允许小写字母，创建后不可修改
            </template>
          </n-form-item>

          <n-form-item label="描述" path="description">
            <n-input
              v-model:value="roleForm.description"
              type="textarea"
              placeholder="角色描述"
              :rows="3"
            />
          </n-form-item>

          <n-form-item label="权限配置" path="permission_ids">
            <n-space vertical style="width: 100%">
              <!-- 权限分组选择器 -->
              <n-collapse>
                <n-collapse-item
                  v-for="group in groupedPermissions"
                  :key="group.name"
                  :title="group.name"
                  :name="group.name"
                >
                  <n-checkbox-group
                    v-model:value="roleForm.permission_ids"
                    style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px"
                  >
                    <n-checkbox
                      v-for="perm in group.permissions"
                      :key="perm.id"
                      :value="perm.id"
                      :label="perm.name"
                    />
                  </n-checkbox-group>
                </n-collapse-item>
              </n-collapse>
            </n-space>
          </n-form-item>
        </n-form>

        <template #footer>
          <n-space justify="end">
            <n-button @click="closeRoleModal">取消</n-button>
            <n-button
              type="primary"
              @click="handleRoleSubmit"
              :loading="submitting"
            >
              保存
            </n-button>
          </n-space>
        </template>
      </n-modal>

      <!-- 删除确认模态框 -->
      <n-modal
        v-model:show="showDeleteModal"
        preset="dialog"
        title="确认删除"
        content="删除角色后，该角色的用户将失去所有权限。确定要删除吗？"
        positive-text="删除"
        negative-text="取消"
        @positive="handleDeleteConfirm"
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
const roleFormRef = ref()

// 状态定义
const loading = ref(false)
const submitting = ref(false)
const roles = ref<any[]>([])
const permissions = ref<any[]>([])
const showRoleModal = ref(false)
const showDeleteModal = ref(false)
const isEditing = ref(false)
const selectedRoleId = ref('')

// 角色表单
const roleForm = reactive({
  id: '',
  name: '',
  code: '',
  description: '',
  permission_ids: [] as string[],
})

// 分页配置
const pagination = {
  pageSize: 10,
}

// 表格列定义
const columns = [
  {
    title: '角色名称',
    key: 'name',
  },
  {
    title: '角色代码',
    key: 'code',
    render(row: any) {
      return h(NCode, { code: row.code, language: 'bash' })
    },
  },
  {
    title: '描述',
    key: 'description',
    ellipsis: true,
  },
  {
    title: '系统角色',
    key: 'is_system',
    render(row: any) {
      return row.is_system
        ? h(NTag, { type: 'error' }, { default: () => '是' })
        : h(NTag, { type: 'default' }, { default: () => '否' })
    },
  },
  {
    title: '默认角色',
    key: 'is_default',
    render(row: any) {
      return row.is_default
        ? h(NTag, { type: 'success' }, { default: () => '是' })
        : h(NTag, { type: 'default' }, { default: () => '否' })
    },
  },
  {
    title: '权限数',
    key: 'permission_count',
    render(row: any) {
      return row.permissions?.length || 0
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

      // 系统角色不可删除
      if (!row.is_system) {
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

      return h(NSpace, {}, { default: () => actions })
    },
  },
]

// 表单验证规则
const roleRules = {
  name: [
    { required: true, message: '请输入角色名称', trigger: 'blur' },
    { min: 2, max: 100, message: '长度在 2-100 个字符', trigger: 'blur' },
  ],
  code: [
    { required: true, message: '请输入角色代码', trigger: 'blur' },
    {
      pattern: /^[a-z][a-z0-9_]*$/,
      message: '只允许小写字母、数字和下划线，且必须以字母开头',
      trigger: 'blur',
    },
  ],
}

// 按分组整理权限
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

// 加载角色列表
const fetchRoles = async () => {
  loading.value = true
  try {
    const data = await $fetch('/api/v1/admin/roles')
    roles.value = data || []
  } catch (error: any) {
    message.error('获取角色列表失败')
  } finally {
    loading.value = false
  }
}

// 加载权限列表（用于选择器）
const fetchPermissions = async () => {
  try {
    const data = await $fetch('/api/v1/permissions')
    permissions.value = data || []
  } catch (error: any) {
    message.error('获取权限列表失败')
  }
}

// 打开创建模态框
const openCreateModal = () => {
  isEditing.value = false
  resetRoleForm()
  showRoleModal.value = true
}

// 打开编辑模态框
const handleEdit = (row: any) => {
  isEditing.value = true
  selectedRoleId.value = row.id
  roleForm.id = row.id
  roleForm.name = row.name
  roleForm.code = row.code
  roleForm.description = row.description || ''
  roleForm.permission_ids = row.permissions?.map((p: any) => p.id) || []
  showRoleModal.value = true
}

// 关闭模态框
const closeRoleModal = () => {
  showRoleModal.value = false
  resetRoleForm()
}

// 重置表单
const resetRoleForm = () => {
  roleForm.id = ''
  roleForm.name = ''
  roleForm.code = ''
  roleForm.description = ''
  roleForm.permission_ids = []
  selectedRoleId.value = ''
  nextTick(() => {
    roleFormRef.value?.restoreValidation()
  })
}

// 提交角色表单
const handleRoleSubmit = async () => {
  try {
    await roleFormRef.value?.validate()
    submitting.value = true

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

    message.success(isEditing.value ? '角色已更新' : '角色已创建')
    closeRoleModal()
    await fetchRoles()
  } catch (error: any) {
    if (error?.data?.message) {
      message.error(error.data.message)
    }
  } finally {
    submitting.value = false
  }
}

// 删除角色
const handleDelete = (roleId: string) => {
  dialog.warning({
    title: '确认删除',
    content: '删除角色后，��角色的用户将失去所有权限。确定要继续吗？',
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await $fetch(`/api/v1/admin/roles/${roleId}`, {
          method: 'DELETE',
        })
        message.success('角色已删除')
        await fetchRoles()
      } catch (error: any) {
        message.error(error.data?.message || '删除失败')
      }
    },
  })
}

// 初始化
onMounted(async () => {
  await Promise.all([fetchRoles(), fetchPermissions()])
})
</script>

<style scoped>
.admin-roles-page {
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
