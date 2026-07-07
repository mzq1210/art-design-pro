<template>
  <div class="permission-page art-full-height flex flex-col">
    <ElForm :inline="true" :model="searchForm" class="mb-3">
      <ElFormItem label="关键词">
        <ElInput
          v-model="searchForm.keyword"
          clearable
          placeholder="权限标识或描述"
          @keyup.enter="handleSearch"
        />
      </ElFormItem>

      <ElFormItem>
        <ElButton type="primary" @click="handleSearch">查询</ElButton>
        <ElButton @click="handleReset">重置</ElButton>
      </ElFormItem>
    </ElForm>

    <ElRow :gutter="12" class="mb-3">
      <ElCol :lg="8" :md="12" :sm="24">
        <ElCard shadow="never">
          <ElStatistic title="菜单权限数" :value="diagnoseInfo?.menu_total ?? 0" />
        </ElCard>
      </ElCol>
      <ElCol :lg="8" :md="12" :sm="24">
        <ElCard shadow="never">
          <ElStatistic title="RBAC 权限数" :value="diagnoseInfo?.rbac_total ?? data.length" />
        </ElCard>
      </ElCol>
      <ElCol :lg="8" :md="24" :sm="24">
        <ElCard shadow="never">
          <ElStatistic title="待处理问题" :value="issueCount" />
        </ElCard>
      </ElCol>
    </ElRow>

    <ElCard v-if="diagnoseInfo && issueCount > 0" class="mb-3" shadow="never">
      <ElAlert :closable="false" show-icon title="菜单表和 RBAC 权限存在不一致" type="warning" />

      <ElTabs class="mt-3">
        <ElTabPane :label="`菜单缺失权限 ${diagnoseInfo.missing.length}`">
          <ElSpace wrap>
            <ElTag v-for="item in diagnoseInfo.missing" :key="item.name" type="warning">
              {{ item.name }} - {{ item.description || '未填写描述' }}
            </ElTag>
          </ElSpace>
          <ElEmpty v-if="diagnoseInfo.missing.length === 0" description="没有缺失权限" />
        </ElTabPane>

        <ElTabPane :label="`孤立 RBAC 权限 ${diagnoseInfo.orphan.length}`">
          <ElSpace wrap>
            <ElTag v-for="item in diagnoseInfo.orphan" :key="item.name" type="info">
              {{ item.name }} - {{ item.description || '未填写描述' }}
            </ElTag>
          </ElSpace>
          <ElEmpty v-if="diagnoseInfo.orphan.length === 0" description="没有孤立权限" />
        </ElTabPane>
      </ElTabs>
    </ElCard>

    <ElCard class="art-table-card">
      <ArtTableHeader :loading="loading" layout="refresh,fullscreen" @refresh="refreshData">
        <template #left>
          <ElButton
            v-if="hasAuth('permission.create')"
            type="primary"
            @click="openDialog('create')"
          >
            新增权限
          </ElButton>
          <ElButton
            v-if="hasAuth('permission.create')"
            :loading="syncLoading"
            type="success"
            @click="handleSync"
          >
            从菜单同步权限
          </ElButton>
          <ElButton :loading="diagnoseLoading" @click="loadDiagnose">检查权限一致性</ElButton>
        </template>
      </ArtTableHeader>

      <ElCollapse v-model="activeModules" class="permission-collapse">
        <ElCollapseItem
          v-for="group in moduleGroups"
          :key="group.module"
          :name="group.module"
          :title="`${group.title}（${group.permissions.length}）`"
        >
          <ElTable v-loading="loading" :data="group.permissions" row-key="name">
            <ElTableColumn label="权限标识" min-width="220" prop="name">
              <template #default="{ row }">
                <div class="permission-name">
                  <span>{{ row.name }}</span>
                  <ElTag v-if="isDangerPermission(row.name)" size="small" type="danger">
                    高危
                  </ElTag>
                </div>
              </template>
            </ElTableColumn>

            <ElTableColumn label="描述" min-width="160">
              <template #default="{ row }">
                {{ row.description || '-' }}
              </template>
            </ElTableColumn>

            <ElTableColumn label="规则" min-width="130">
              <template #default="{ row }">
                {{ row.rule_name || '-' }}
              </template>
            </ElTableColumn>

            <ElTableColumn label="创建时间" width="180">
              <template #default="{ row }">
                {{ formatTime(row.created_at) }}
              </template>
            </ElTableColumn>

            <ElTableColumn fixed="right" label="操作" width="150">
              <template #default="{ row }">
                <ArtButtonTable
                  v-if="hasAuth('permission.update')"
                  type="edit"
                  @click="openDialog('update', row)"
                />
                <ArtButtonTable
                  v-if="hasAuth('permission.delete')"
                  type="delete"
                  @click="handleDelete(row)"
                />
              </template>
            </ElTableColumn>
          </ElTable>
        </ElCollapseItem>
      </ElCollapse>

      <ElEmpty v-if="!loading && moduleGroups.length === 0" description="暂无权限" />
    </ElCard>

    <ElDialog
      v-model="dialogVisible"
      :title="dialogType === 'create' ? '新增权限' : '修改权限'"
      width="520px"
      @closed="resetForm"
    >
      <ElForm ref="formRef" :model="form" :rules="rules" label-width="86px">
        <ElFormItem label="权限标识" prop="name">
          <ElInput
            v-model="form.name"
            :disabled="dialogType === 'update'"
            placeholder="如 product.view"
          />
        </ElFormItem>

        <ElFormItem label="描述">
          <ElInput v-model="form.description" placeholder="如 查看商品" />
        </ElFormItem>

        <ElFormItem label="规则">
          <ElInput v-model="form.rule_name" placeholder="可选，Yii2 RBAC rule name" />
        </ElFormItem>
      </ElForm>

      <template #footer>
        <ElButton @click="dialogVisible = false">取消</ElButton>
        <ElButton type="primary" :loading="submitLoading" @click="handleSubmit">确定</ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
  import { ElMessage, ElMessageBox, ElTag, type FormInstance, type FormRules } from 'element-plus'
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import { useAuth } from '@/hooks/core/useAuth'
  import {
    createPermission,
    deletePermission,
    diagnosePermissionFromMenu,
    fetchPermissionList,
    syncPermissionFromMenu,
    updatePermission,
    type PermissionDiagnoseResponse,
    type PermissionItem,
    type PermissionSaveParams
  } from '@/api/permission'

  defineOptions({ name: 'Permission' })

  type DialogType = 'create' | 'update'

  interface PermissionSearchForm {
    keyword: string
  }

  const { hasAuth } = useAuth()
  const loading = ref(false)
  const submitLoading = ref(false)
  const syncLoading = ref(false)
  const diagnoseLoading = ref(false)
  const dialogVisible = ref(false)
  const dialogType = ref<DialogType>('create')
  const formRef = ref<FormInstance>()
  const data = ref<PermissionItem[]>([])
  const diagnoseInfo = ref<PermissionDiagnoseResponse>()
  const activeModules = ref<string[]>([])

  const searchForm = reactive<PermissionSearchForm>({
    keyword: ''
  })

  const form = reactive<PermissionSaveParams>({
    name: '',
    description: '',
    rule_name: ''
  })

  const rules: FormRules<PermissionSaveParams> = {
    name: [
      { required: true, message: '请输入权限标识', trigger: 'blur' },
      {
        pattern: /^[a-z][a-z0-9]*(\.[a-z][a-z0-9-]*)+$/,
        message: '建议使用模块.动作格式，如 user.view',
        trigger: 'blur'
      }
    ]
  }

  const issueCount = computed(
    () => (diagnoseInfo.value?.missing.length || 0) + (diagnoseInfo.value?.orphan.length || 0)
  )

  const dangerPermissionSet = new Set([
    'permission.create',
    'permission.update',
    'permission.delete',
    'role.permission.assign',
    'user.role.assign',
    'menu.update',
    'menu.delete',
    'role.delete',
    'user.delete'
  ])

  const moduleGroups = computed(() => {
    const groups = new Map<string, PermissionItem[]>()

    data.value.forEach((item) => {
      const module = getModuleName(item.name)
      const permissions = groups.get(module) || []
      permissions.push(item)
      groups.set(module, permissions)
    })

    return Array.from(groups.entries())
      .map(([module, permissions]) => ({
        module,
        title: getModuleTitle(module),
        permissions: permissions.sort((a, b) => a.name.localeCompare(b.name))
      }))
      .sort((a, b) => a.module.localeCompare(b.module))
  })

  watch(
    moduleGroups,
    (groups) => {
      const moduleNames = groups.map((group) => group.module)
      activeModules.value = activeModules.value.filter((name) => moduleNames.includes(name))

      if (activeModules.value.length === 0) {
        activeModules.value = moduleNames
      }
    },
    { immediate: true }
  )

  onMounted(async () => {
    await Promise.all([loadPermissions(), loadDiagnose()])
  })

  const loadPermissions = async () => {
    try {
      loading.value = true
      const res = await fetchPermissionList({
        keyword: searchForm.keyword || undefined
      })
      data.value = res.records
    } finally {
      loading.value = false
    }
  }

  const loadDiagnose = async () => {
    try {
      diagnoseLoading.value = true
      diagnoseInfo.value = await diagnosePermissionFromMenu()
    } finally {
      diagnoseLoading.value = false
    }
  }

  const refreshData = async () => {
    await Promise.all([loadPermissions(), loadDiagnose()])
  }

  const handleSearch = async () => {
    await loadPermissions()
  }

  const handleReset = async () => {
    searchForm.keyword = ''
    await loadPermissions()
  }

  const handleSync = async () => {
    try {
      syncLoading.value = true
      const res = await syncPermissionFromMenu()
      ElMessage.success(`新增 ${res.created.length} 个，补充描述 ${res.updated.length} 个`)
      await refreshData()
    } finally {
      syncLoading.value = false
    }
  }

  const openDialog = (type: DialogType, row?: PermissionItem) => {
    dialogType.value = type

    if (type === 'create') {
      resetForm()
    } else if (row) {
      form.name = row.name
      form.description = row.description || ''
      form.rule_name = row.rule_name || ''
    }

    dialogVisible.value = true
  }

  const resetForm = () => {
    form.name = ''
    form.description = ''
    form.rule_name = ''
    formRef.value?.clearValidate()
  }

  const handleSubmit = async () => {
    await formRef.value?.validate()

    try {
      submitLoading.value = true
      const params = {
        name: form.name.trim(),
        description: form.description?.trim() || undefined,
        rule_name: form.rule_name?.trim() || undefined
      }

      if (dialogType.value === 'create') {
        await createPermission(params)
      } else {
        await updatePermission(params)
      }

      dialogVisible.value = false
      await refreshData()
    } finally {
      submitLoading.value = false
    }
  }

  const handleDelete = async (row: PermissionItem) => {
    await ElMessageBox.confirm(`确定删除权限「${row.name}」吗？`, '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    await deletePermission({ name: row.name })
    await refreshData()
  }

  const getModuleName = (name: string) => name.split('.')[0] || '-'

  const getModuleTitle = (module: string) => {
    const titles: Record<string, string> = {
      menu: '菜单管理',
      notice: '公告管理',
      permission: '权限管理',
      role: '角色管理',
      rule: '规则管理',
      user: '用户管理'
    }

    return titles[module] ? `${titles[module]} / ${module}` : module
  }

  const isDangerPermission = (name: string) => dangerPermissionSet.has(name)

  const formatTime = (time?: number | null) => {
    if (!time) {
      return '-'
    }

    return new Date(time * 1000).toLocaleString()
  }
</script>

<style scoped lang="scss">
  .permission-collapse {
    border-top: 0;
  }

  .permission-name {
    display: flex;
    gap: 8px;
    align-items: center;
  }
</style>
