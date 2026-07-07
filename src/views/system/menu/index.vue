<template>
  <div class="menu-page art-full-height flex flex-col">
    <ElForm :inline="true" :model="searchForm" class="mb-3">
      <ElFormItem label="关键词">
        <ElInput
          v-model="searchForm.keyword"
          clearable
          placeholder="菜单名称、路由或权限"
          @keyup.enter="handleSearch"
        />
      </ElFormItem>

      <ElFormItem>
        <ElButton type="primary" @click="handleSearch">查询</ElButton>
        <ElButton @click="handleReset">重置</ElButton>
      </ElFormItem>
    </ElForm>

    <ElCard class="art-table-card">
      <ArtTableHeader v-model:columns="columnChecks" :loading="loading" @refresh="loadMenus">
        <template #left>
          <ElButton v-if="hasAuth('menu.create')" type="primary" @click="openDialog('create')">
            新增菜单
          </ElButton>
        </template>
      </ArtTableHeader>

      <ArtTable
        row-key="id"
        :loading="loading"
        :columns="columns"
        :data="menuTree"
        :tree-props="{ children: 'children' }"
        :default-expand-all="true"
      />
    </ElCard>

    <ElDialog
      v-model="dialogVisible"
      :title="dialogType === 'create' ? '新增菜单' : '修改菜单'"
      width="680px"
      @closed="resetForm"
    >
      <ElForm ref="formRef" :model="form" :rules="rules" label-width="96px">
        <ElRow :gutter="16">
          <ElCol :span="12">
            <ElFormItem label="类型" prop="type">
              <ElRadioGroup v-model="form.type">
                <ElRadioButton :value="1">目录</ElRadioButton>
                <ElRadioButton :value="2">菜单</ElRadioButton>
                <ElRadioButton :value="3">按钮</ElRadioButton>
              </ElRadioGroup>
            </ElFormItem>
          </ElCol>

          <ElCol :span="12">
            <ElFormItem label="父级菜单" prop="parent_id">
              <ElTreeSelect
                v-model="form.parent_id"
                check-strictly
                clearable
                :data="parentOptions"
                :props="{ label: 'title', value: 'id', children: 'children' }"
                :placeholder="parentPlaceholder"
                value-key="id"
              />
            </ElFormItem>
          </ElCol>

          <ElCol :span="24">
            <ElAlert :closable="false" :title="typeTip" class="mb-4" show-icon type="info" />
          </ElCol>

          <ElCol :span="12">
            <ElFormItem label="标题" prop="title">
              <ElInput v-model="form.title" :placeholder="titlePlaceholder" />
            </ElFormItem>
          </ElCol>

          <ElCol :span="12">
            <ElFormItem label="排序" prop="sort">
              <ElInputNumber
                v-model="form.sort"
                :min="0"
                controls-position="right"
                class="w-full"
              />
            </ElFormItem>
          </ElCol>

          <ElCol v-if="isMenu" :span="12">
            <ElFormItem label="路由名称" prop="name">
              <ElInput v-model="form.name" placeholder="如 User" />
            </ElFormItem>
          </ElCol>

          <ElCol v-if="isDirectory || isMenu" :span="12">
            <ElFormItem label="路由路径" prop="path">
              <ElInput v-model="form.path" :placeholder="pathPlaceholder" />
            </ElFormItem>
          </ElCol>

          <ElCol v-if="isMenu && form.is_external === 0" :span="12">
            <ElFormItem label="组件路径" prop="component">
              <ElInput v-model="form.component" placeholder="如 /system/user" />
            </ElFormItem>
          </ElCol>

          <ElCol v-if="isDirectory || isMenu" :span="12">
            <ElFormItem label="图标">
              <ElInput v-model="form.icon" placeholder="如 ri:user-line" />
            </ElFormItem>
          </ElCol>

          <ElCol v-if="isMenu || isButton" :span="12">
            <ElFormItem label="权限标识" prop="permission">
              <ElInput v-model="form.permission" :placeholder="permissionPlaceholder" />
            </ElFormItem>
          </ElCol>

          <ElCol v-if="isMenu && form.is_external === 1" :span="12">
            <ElFormItem label="外链地址" prop="external_url">
              <ElInput v-model="form.external_url" placeholder="https://..." />
            </ElFormItem>
          </ElCol>

          <ElCol v-if="isDirectory || isMenu" :span="8">
            <ElFormItem label="显示">
              <ElSwitch v-model="form.visible" :active-value="1" :inactive-value="0" />
            </ElFormItem>
          </ElCol>

          <ElCol v-if="isMenu" :span="8">
            <ElFormItem label="缓存">
              <ElSwitch v-model="form.keep_alive" :active-value="1" :inactive-value="0" />
            </ElFormItem>
          </ElCol>

          <ElCol v-if="isMenu" :span="8">
            <ElFormItem label="外链">
              <ElSwitch v-model="form.is_external" :active-value="1" :inactive-value="0" />
            </ElFormItem>
          </ElCol>

          <ElCol :span="24">
            <ElFormItem label="备注">
              <ElInput v-model="form.remark" :rows="2" type="textarea" />
            </ElFormItem>
          </ElCol>
        </ElRow>
      </ElForm>

      <template #footer>
        <ElButton @click="dialogVisible = false">取消</ElButton>
        <ElButton type="primary" :loading="submitLoading" @click="handleSubmit">确定</ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
  import { ElMessageBox, ElTag, type FormInstance, type FormRules } from 'element-plus'
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import { useTableColumns } from '@/hooks/core/useTableColumns'
  import { useAuth } from '@/hooks/core/useAuth'
  import {
    createMenu,
    deleteMenu,
    fetchMenuList,
    updateMenu,
    type MenuItem,
    type MenuSaveParams,
    type MenuType,
    type SwitchValue
  } from '@/api/menu'

  defineOptions({ name: 'Menus' })

  type DialogType = 'create' | 'update'

  interface MenuSearchForm {
    keyword: string
  }

  interface MenuForm {
    id?: number
    parent_id: number
    type: MenuType
    title: string
    name: string
    path: string
    component: string
    icon: string
    permission: string
    sort: number
    visible: SwitchValue
    keep_alive: SwitchValue
    is_external: SwitchValue
    external_url: string
    remark: string
  }

  const { hasAuth } = useAuth()
  const loading = ref(false)
  const submitLoading = ref(false)
  const dialogVisible = ref(false)
  const dialogType = ref<DialogType>('create')
  const formRef = ref<FormInstance>()
  const menuList = ref<MenuItem[]>([])

  const searchForm = reactive<MenuSearchForm>({
    keyword: ''
  })

  const form = reactive<MenuForm>({
    parent_id: 0,
    type: 2,
    title: '',
    name: '',
    path: '',
    component: '',
    icon: '',
    permission: '',
    sort: 0,
    visible: 1,
    keep_alive: 1,
    is_external: 0,
    external_url: '',
    remark: ''
  })

  const isDirectory = computed(() => form.type === 1)
  const isMenu = computed(() => form.type === 2)
  const isButton = computed(() => form.type === 3)

  const typeTip = computed(() => {
    if (isDirectory.value) {
      return '目录只用于左侧菜单分组，通常填写标题、路由路径和图标，不需要组件路径和权限标识。'
    }

    if (isMenu.value) {
      return '菜单是可以点击打开的页面，需要填写路由路径、组件路径和权限标识；如果是外链菜单，则填写外链地址。'
    }

    return '按钮是页面内的操作权限，比如新增、修改、删除；必须挂在某个菜单下面，并填写权限标识。'
  })

  const parentPlaceholder = computed(() => (isButton.value ? '请选择所属菜单' : '顶级菜单'))
  const titlePlaceholder = computed(() => {
    if (isDirectory.value) return '如 系统管理'
    if (isMenu.value) return '如 用户管理'
    return '如 新增用户'
  })
  const pathPlaceholder = computed(() => (isDirectory.value ? '如 /system' : '如 /system/user'))
  const permissionPlaceholder = computed(() => (isButton.value ? '如 user.create' : '如 user.view'))

  const requiredWhen = (condition: () => boolean, message: string) => ({
    validator: (_rule: unknown, value: string, callback: (error?: Error) => void) => {
      if (!condition() || String(value || '').trim()) {
        callback()
        return
      }

      callback(new Error(message))
    },
    trigger: 'blur'
  })

  const rules: FormRules<MenuForm> = {
    title: [{ required: true, message: '请输入菜单标题', trigger: 'blur' }],
    type: [{ required: true, message: '请选择菜单类型', trigger: 'change' }],
    parent_id: [
      {
        validator: (_rule: unknown, value: number, callback: (error?: Error) => void) => {
          if (!isButton.value || Number(value) > 0) {
            callback()
            return
          }

          callback(new Error('按钮必须选择所属菜单'))
        },
        trigger: 'change'
      }
    ],
    name: [requiredWhen(() => isMenu.value, '请输入路由名称')],
    path: [requiredWhen(() => isDirectory.value || isMenu.value, '请输入路由路径')],
    component: [requiredWhen(() => isMenu.value && form.is_external === 0, '请输入组件路径')],
    permission: [requiredWhen(() => isMenu.value || isButton.value, '请输入权限标识')],
    external_url: [requiredWhen(() => isMenu.value && form.is_external === 1, '请输入外链地址')],
    sort: [{ required: true, message: '请输入排序', trigger: 'blur' }]
  }

  const menuTree = computed(() => buildTree(menuList.value))

  const parentOptions = computed(() => [
    { id: 0, title: '顶级菜单', children: [] },
    ...buildTree(menuList.value.filter((item) => item.id !== form.id && item.type !== 3))
  ])

  const { columnChecks, columns } = useTableColumns<MenuItem>(() => [
    { prop: 'title', label: '菜单名称', minWidth: 180 },
    {
      prop: 'type',
      label: '类型',
      width: 90,
      formatter: (row) => {
        const config = {
          1: { type: 'info' as const, text: '目录' },
          2: { type: 'primary' as const, text: '菜单' },
          3: { type: 'warning' as const, text: '按钮' }
        }[row.type]
        return h(ElTag, { type: config.type }, () => config.text)
      }
    },
    { prop: 'path', label: '路由路径', minWidth: 160, formatter: (row) => row.path || '-' },
    {
      prop: 'component',
      label: '组件路径',
      minWidth: 160,
      formatter: (row) => row.component || '-'
    },
    {
      prop: 'permission',
      label: '权限标识',
      minWidth: 150,
      formatter: (row) => row.permission || '-'
    },
    { prop: 'sort', label: '排序', width: 80 },
    {
      prop: 'visible',
      label: '显示',
      width: 90,
      formatter: (row) =>
        h(ElTag, { type: row.visible === 1 ? 'success' : 'info' }, () =>
          row.visible === 1 ? '显示' : '隐藏'
        )
    },
    {
      prop: 'operation',
      label: '操作',
      width: 150,
      fixed: 'right',
      formatter: (row) =>
        h('div', [
          hasAuth('menu.update')
            ? h(ArtButtonTable, {
                type: 'edit',
                onClick: () => openDialog('update', row)
              })
            : null,
          hasAuth('menu.delete')
            ? h(ArtButtonTable, {
                type: 'delete',
                onClick: () => handleDelete(row)
              })
            : null
        ])
    }
  ])

  onMounted(() => {
    loadMenus()
  })

  watch(
    () => form.type,
    () => {
      formRef.value?.clearValidate()
    }
  )

  watch(
    () => form.is_external,
    () => {
      formRef.value?.clearValidate(['component', 'external_url'])
    }
  )

  const loadMenus = async () => {
    try {
      loading.value = true
      const res = await fetchMenuList({
        keyword: searchForm.keyword || undefined
      })
      menuList.value = res.records
    } finally {
      loading.value = false
    }
  }

  const handleSearch = async () => {
    await loadMenus()
  }

  const handleReset = async () => {
    searchForm.keyword = ''
    await loadMenus()
  }

  const openDialog = (type: DialogType, row?: MenuItem) => {
    dialogType.value = type

    if (type === 'create') {
      resetForm()
    } else if (row) {
      form.id = row.id
      form.parent_id = row.parent_id
      form.type = row.type
      form.title = row.title
      form.name = row.name || ''
      form.path = row.path || ''
      form.component = row.component || ''
      form.icon = row.icon || ''
      form.permission = row.permission || ''
      form.sort = row.sort
      form.visible = row.visible
      form.keep_alive = row.keep_alive
      form.is_external = row.is_external
      form.external_url = row.external_url || ''
      form.remark = row.remark || ''
    }

    dialogVisible.value = true
  }

  const resetForm = () => {
    form.id = undefined
    form.parent_id = 0
    form.type = 2
    form.title = ''
    form.name = ''
    form.path = ''
    form.component = ''
    form.icon = ''
    form.permission = ''
    form.sort = 0
    form.visible = 1
    form.keep_alive = 1
    form.is_external = 0
    form.external_url = ''
    form.remark = ''
    formRef.value?.clearValidate()
  }

  const handleSubmit = async () => {
    await formRef.value?.validate()

    const params = buildSubmitParams()

    try {
      submitLoading.value = true
      if (dialogType.value === 'create') {
        await createMenu(params)
      } else {
        await updateMenu(params)
      }

      dialogVisible.value = false
      await loadMenus()
    } finally {
      submitLoading.value = false
    }
  }

  const buildSubmitParams = (): MenuSaveParams => {
    const cleanString = (value: string) => value.trim() || undefined
    const baseParams: MenuSaveParams = {
      id: form.id,
      parent_id: form.parent_id || 0,
      type: form.type,
      title: form.title.trim(),
      sort: form.sort,
      visible: form.visible,
      keep_alive: form.keep_alive,
      is_external: form.is_external,
      remark: cleanString(form.remark)
    }

    if (isDirectory.value) {
      return {
        ...baseParams,
        name: undefined,
        path: cleanString(form.path),
        component: undefined,
        icon: cleanString(form.icon),
        permission: undefined,
        keep_alive: 0,
        is_external: 0,
        external_url: undefined
      }
    }

    if (isButton.value) {
      return {
        ...baseParams,
        name: undefined,
        path: undefined,
        component: undefined,
        icon: undefined,
        permission: cleanString(form.permission),
        visible: 0,
        keep_alive: 0,
        is_external: 0,
        external_url: undefined
      }
    }

    return {
      ...baseParams,
      name: cleanString(form.name),
      path: cleanString(form.path),
      component: form.is_external === 1 ? undefined : cleanString(form.component),
      icon: cleanString(form.icon),
      permission: cleanString(form.permission),
      external_url: form.is_external === 1 ? cleanString(form.external_url) : undefined
    }
  }

  const handleDelete = async (row: MenuItem) => {
    await ElMessageBox.confirm(`确定删除菜单「${row.title}」吗？`, '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    await deleteMenu({ id: row.id })
    await loadMenus()
  }

  function buildTree(records: MenuItem[], parentId = 0): MenuItem[] {
    return records
      .filter((item) => item.parent_id === parentId)
      .map((item) => {
        const children = buildTree(records, item.id)
        return children.length > 0 ? { ...item, children } : { ...item }
      })
  }
</script>
