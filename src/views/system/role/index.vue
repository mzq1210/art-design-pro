<template>
  <div class="art-full-height flex flex-col">
    <ElForm :inline="true" :model="searchForm" class="mb-3">
      <ElFormItem label="关键词">
        <ElInput
          v-model="searchForm.keyword"
          clearable
          placeholder="请输入角色名或描述"
          @keyup.enter="handleSearch"
        />
      </ElFormItem>

      <ElFormItem>
        <ElButton type="primary" @click="handleSearch">查询</ElButton>
        <ElButton @click="handleReset">重置</ElButton>
      </ElFormItem>
    </ElForm>

    <ElCard class="art-table-card">
      <ArtTableHeader v-model:columns="columnChecks" :loading="loading" @refresh="refreshData">
        <template #left>
          <ElButton v-if="hasAuth('role.create')" type="primary" @click="openDialog('create')">
            新增角色
          </ElButton>
        </template>
      </ArtTableHeader>

      <ArtTable
        :loading="loading"
        :data="data"
        :columns="columns"
        :pagination="pagination"
        @pagination:size-change="handleSizeChange"
        @pagination:current-change="handleCurrentChange"
      />
    </ElCard>

    <ElDialog
      v-model="dialogVisible"
      :title="dialogType === 'create' ? '新增角色' : '修改角色'"
      width="500px"
      @closed="resetForm"
    >
      <ElForm ref="formRef" :model="form" :rules="rules" label-width="80px">
        <ElFormItem label="角色名" prop="name">
          <ElInput
            v-model="form.name"
            :disabled="dialogType === 'update'"
            placeholder="请输入角色名，如 admin"
          />
        </ElFormItem>

        <ElFormItem label="描述" prop="description">
          <ElInput
            v-model="form.description"
            :rows="3"
            placeholder="请输入角色描述"
            type="textarea"
          />
        </ElFormItem>
      </ElForm>

      <template #footer>
        <ElButton @click="dialogVisible = false">取消</ElButton>
        <ElButton type="primary" :loading="submitLoading" @click="handleSubmit">确定</ElButton>
      </template>
    </ElDialog>

    <ElDialog
      v-model="permissionDialogVisible"
      :title="`分配权限：${currentRole?.description || currentRole?.name || ''}`"
      width="720px"
      @closed="resetPermissionDialog"
    >
      <ElInput
        v-model="permissionKeyword"
        clearable
        class="mb-3"
        placeholder="搜索菜单或权限标识"
      />

      <ElScrollbar v-loading="permissionLoading" height="52vh">
        <ElTree
          ref="permissionTreeRef"
          :data="permissionTreeData"
          :props="permissionTreeProps"
          node-key="id"
          show-checkbox
          check-strictly
          default-expand-all
          :filter-node-method="filterPermissionNode"
          @check-change="handlePermissionTreeCheck"
        >
          <template #default="{ data }">
            <div class="permission-tree-node">
              <span class="permission-tree-node__title">{{ data.title }}</span>
              <ElTag v-if="data.type === 1" size="small" type="info">目录</ElTag>
              <ElTag v-else-if="data.type === 2" size="small">菜单</ElTag>
              <ElTag v-else size="small" type="success">按钮</ElTag>
              <span v-if="data.permission" class="permission-tree-node__code">
                {{ data.permission }}
              </span>
            </div>
          </template>
        </ElTree>

        <ElEmpty v-if="!permissionLoading && permissionTreeData.length === 0" />
      </ElScrollbar>

      <template #footer>
        <div class="permission-footer">
          <span>已选 {{ selectedPermissions.length }} 项</span>
          <div>
            <ElButton @click="checkAllPermissions">全选</ElButton>
            <ElButton @click="clearPermissions">清空</ElButton>
            <ElButton @click="permissionDialogVisible = false">取消</ElButton>
            <ElButton
              type="primary"
              :loading="permissionSubmitLoading"
              @click="handleAssignPermissions"
            >
              保存
            </ElButton>
          </div>
        </div>
      </template>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
  import { ElMessageBox, type FormInstance, type FormRules, type TreeInstance } from 'element-plus'
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import { useTable } from '@/hooks/core/useTable'
  import { useAuth } from '@/hooks/core/useAuth'
  import { fetchMenuTree, type MenuItem } from '@/api/menu'
  import {
    assignRolePermissions,
    createRole,
    deleteRole,
    fetchRoleList,
    fetchRolePermissions,
    updateRole,
    type RoleItem
  } from '@/api/role'

  defineOptions({ name: 'Role' })

  type DialogType = 'create' | 'update'

  interface RoleSearchForm {
    keyword: string
  }

  interface RoleForm {
    name: string
    description: string
  }

  const { hasAuth } = useAuth()

  const searchForm = reactive<RoleSearchForm>({
    keyword: ''
  })

  const dialogVisible = ref(false)
  const dialogType = ref<DialogType>('create')
  const submitLoading = ref(false)
  const formRef = ref<FormInstance>()
  const permissionDialogVisible = ref(false)
  const permissionLoading = ref(false)
  const permissionSubmitLoading = ref(false)
  const permissionKeyword = ref('')
  const permissionTreeRef = ref<TreeInstance>()
  const permissionTreeData = ref<MenuItem[]>([])
  const checkedPermissionIds = ref<number[]>([])
  const currentRole = ref<RoleItem>()

  const form = reactive<RoleForm>({
    name: '',
    description: ''
  })

  const rules: FormRules<RoleForm> = {
    name: [
      { required: true, message: '请输入角色名', trigger: 'blur' },
      { min: 2, max: 64, message: '角色名长度为 2 到 64 个字符', trigger: 'blur' }
    ],
    description: [{ max: 255, message: '描述最多 255 个字符', trigger: 'blur' }]
  }

  const permissionTreeProps = {
    children: 'children',
    label: 'title',
    disabled: (data: unknown) => (data as MenuItem).type === 1
  }

  const flattenMenuTree = (nodes: MenuItem[]) => {
    const list: MenuItem[] = []

    const walk = (items: MenuItem[]) => {
      items.forEach((item) => {
        list.push(item)
        if (item.children?.length) {
          walk(item.children)
        }
      })
    }

    walk(nodes)
    return list
  }

  const permissionNodes = computed(() =>
    flattenMenuTree(permissionTreeData.value).filter((item) => Boolean(item.permission))
  )

  const permissionNodeMap = computed(() => {
    const map = new Map<number, MenuItem>()
    flattenMenuTree(permissionTreeData.value).forEach((item) => {
      map.set(item.id, item)
    })
    return map
  })

  const allPermissionIds = computed(() => permissionNodes.value.map((item) => item.id))

  const selectedPermissions = computed(() => {
    const permissions = checkedPermissionIds.value
      .map((id) => permissionNodeMap.value.get(Number(id))?.permission)
      .filter((permission): permission is string => Boolean(permission))

    return Array.from(new Set(permissions))
  })

  watch(permissionKeyword, (keyword) => {
    permissionTreeRef.value?.filter(keyword.trim())
  })

  const formatDateTime = (timestamp?: number) => {
    if (!timestamp) return '-'

    return new Date(timestamp * 1000).toLocaleString()
  }

  const {
    columns,
    columnChecks,
    data,
    loading,
    pagination,
    refreshData,
    refreshCreate,
    refreshUpdate,
    refreshRemove,
    replaceSearchParams,
    resetSearchParams,
    getData,
    handleSizeChange,
    handleCurrentChange
  } = useTable({
    core: {
      apiFn: fetchRoleList,
      apiParams: {
        size: 10
      },
      paginationKey: {
        current: 'page',
        size: 'size'
      },
      columnsFactory: () => [
        { prop: 'name', label: '角色名', minWidth: 160 },
        {
          prop: 'description',
          label: '描述',
          minWidth: 220,
          showOverflowTooltip: true,
          formatter: (row) => row.description || '-'
        },
        {
          prop: 'created_at',
          label: '创建时间',
          width: 180,
          formatter: (row) => formatDateTime(row.created_at)
        },
        {
          prop: 'updated_at',
          label: '更新时间',
          width: 180,
          formatter: (row) => formatDateTime(row.updated_at)
        },
        {
          prop: 'operation',
          label: '操作',
          width: 190,
          fixed: 'right',
          formatter: (row) =>
            h('div', [
              hasAuth('role.permission.view')
                ? h(ArtButtonTable, {
                    type: 'view',
                    icon: 'ri:shield-keyhole-line',
                    onClick: () => openPermissionDialog(row)
                  })
                : null,
              hasAuth('role.update')
                ? h(ArtButtonTable, {
                    type: 'edit',
                    onClick: () => openDialog('update', row)
                  })
                : null,
              hasAuth('role.delete')
                ? h(ArtButtonTable, {
                    type: 'delete',
                    onClick: () => handleDelete(row)
                  })
                : null
            ])
        }
      ]
    }
  })

  const handleSearch = async () => {
    replaceSearchParams({
      keyword: searchForm.keyword || undefined
    })
    await getData()
  }

  const handleReset = async () => {
    searchForm.keyword = ''
    await resetSearchParams()
  }

  const openDialog = (type: DialogType, row?: RoleItem) => {
    dialogType.value = type

    if (type === 'create') {
      resetForm()
    } else if (row) {
      form.name = row.name
      form.description = row.description || ''
    }

    dialogVisible.value = true
  }

  const openPermissionDialog = async (row: RoleItem) => {
    currentRole.value = row
    permissionDialogVisible.value = true
    permissionKeyword.value = ''

    try {
      permissionLoading.value = true
      const [menuRes, rolePermissionRes] = await Promise.all([
        fetchMenuTree(),
        fetchRolePermissions({ name: row.name })
      ])

      permissionTreeData.value = menuRes.records
      await nextTick()

      const checkedIds = permissionNodes.value
        .filter(
          (item) => item.permission && rolePermissionRes.permissions.includes(item.permission)
        )
        .map((item) => item.id)

      permissionTreeRef.value?.setCheckedKeys(checkedIds, false)
      syncCheckedPermissionIds()
    } finally {
      permissionLoading.value = false
    }
  }

  const resetForm = () => {
    form.name = ''
    form.description = ''
    formRef.value?.clearValidate()
  }

  const handleSubmit = async () => {
    await formRef.value?.validate()

    try {
      submitLoading.value = true

      if (dialogType.value === 'create') {
        await createRole({
          name: form.name,
          description: form.description
        })
        dialogVisible.value = false
        await refreshCreate()
        return
      }

      await updateRole({
        name: form.name,
        description: form.description
      })
      dialogVisible.value = false
      await refreshUpdate()
    } finally {
      submitLoading.value = false
    }
  }

  const filterPermissionNode = (keyword: string, data: unknown) => {
    if (!keyword) return true

    const menu = data as MenuItem
    const lowerKeyword = keyword.toLowerCase()
    return [menu.title, menu.permission, menu.path, menu.component]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(lowerKeyword))
  }

  const handlePermissionTreeCheck = (data: MenuItem, checked: boolean) => {
    if (checked) {
      let parentId = data.parent_id
      while (parentId) {
        const parent = permissionNodeMap.value.get(parentId)
        if (!parent) break

        if (parent.permission) {
          permissionTreeRef.value?.setChecked(parent.id, true, false)
        }
        parentId = parent.parent_id
      }
    }

    syncCheckedPermissionIds()
  }

  const syncCheckedPermissionIds = () => {
    checkedPermissionIds.value = (permissionTreeRef.value?.getCheckedKeys(false) || []).map((id) =>
      Number(id)
    )
  }

  const checkAllPermissions = () => {
    permissionTreeRef.value?.setCheckedKeys(allPermissionIds.value, false)
    syncCheckedPermissionIds()
  }

  const clearPermissions = () => {
    permissionTreeRef.value?.setCheckedKeys([], false)
    checkedPermissionIds.value = []
  }

  const resetPermissionDialog = () => {
    currentRole.value = undefined
    permissionKeyword.value = ''
    permissionTreeData.value = []
    clearPermissions()
  }

  const handleAssignPermissions = async () => {
    if (!currentRole.value) return

    try {
      permissionSubmitLoading.value = true
      await assignRolePermissions({
        name: currentRole.value.name,
        permissions: selectedPermissions.value
      })
      permissionDialogVisible.value = false
    } finally {
      permissionSubmitLoading.value = false
    }
  }

  const handleDelete = async (row: RoleItem) => {
    await ElMessageBox.confirm(`确定删除角色「${row.name}」吗？`, '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    await deleteRole({ name: row.name })
    await refreshRemove()
  }
</script>

<style scoped lang="scss">
  .permission-tree-node {
    display: flex;
    gap: 8px;
    align-items: center;
    min-width: 0;
  }

  .permission-tree-node__title {
    font-size: 14px;
    color: var(--art-gray-900);
  }

  .permission-tree-node__code {
    max-width: 260px;
    overflow: hidden;
    font-size: 12px;
    color: var(--art-gray-600);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .permission-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
  }
</style>
