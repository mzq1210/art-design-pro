<template>
  <div class="user-page art-full-height flex flex-col">
    <ElForm :inline="true" :model="searchForm" class="mb-3">
      <ElFormItem label="用户名">
        <ElInput
          v-model="searchForm.username"
          clearable
          placeholder="请输入用户名"
          @keyup.enter="handleSearch"
        />
      </ElFormItem>

      <ElFormItem label="邮箱">
        <ElInput
          v-model="searchForm.email"
          clearable
          placeholder="请输入邮箱"
          @keyup.enter="handleSearch"
        />
      </ElFormItem>

      <ElFormItem label="状态">
        <ElSelect v-model="searchForm.status" clearable placeholder="全部" style="width: 120px">
          <ElOption label="启用" :value="10" />
          <ElOption label="未激活" :value="9" />
          <ElOption label="已删除" :value="0" />
        </ElSelect>
      </ElFormItem>

      <ElFormItem>
        <ElButton type="primary" @click="handleSearch">查询</ElButton>
        <ElButton @click="handleReset">重置</ElButton>
      </ElFormItem>
    </ElForm>

    <ElCard class="art-table-card">
      <ArtTableHeader v-model:columns="columnChecks" :loading="loading" @refresh="refreshData">
        <template #left>
          <ElButton v-if="hasAuth('user.create')" type="primary" @click="openDialog('create')">
            新增用户
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
      :title="dialogType === 'create' ? '新增用户' : '修改用户'"
      width="560px"
      @closed="resetForm"
    >
      <ElForm ref="formRef" :model="form" :rules="rules" label-width="80px">
        <ElFormItem label="头像">
          <ElUpload
            class="avatar-uploader"
            :action="uploadAction"
            :headers="uploadHeaders"
            :data="{ scene: 'avatar' }"
            name="file"
            :show-file-list="false"
            :before-upload="beforeAvatarUpload"
            :on-success="handleAvatarSuccess"
            :on-error="handleAvatarError"
          >
            <img v-if="form.avatar" :src="form.avatar" class="avatar-preview" alt="avatar" />
            <div v-else class="avatar-placeholder">上传</div>
          </ElUpload>
          <ElButton v-if="form.avatar" class="ml-3" text type="danger" @click="form.avatar = ''">
            移除
          </ElButton>
        </ElFormItem>

        <ElFormItem label="用户名" prop="username">
          <ElInput v-model="form.username" placeholder="请输入用户名" />
        </ElFormItem>

        <ElFormItem label="邮箱" prop="email">
          <ElInput v-model="form.email" placeholder="请输入邮箱" />
        </ElFormItem>

        <ElFormItem label="密码" prop="password">
          <ElInput
            v-model="form.password"
            :placeholder="dialogType === 'create' ? '请输入密码' : '不修改密码可留空'"
            show-password
            type="password"
          />
        </ElFormItem>

        <ElFormItem label="状态" prop="status">
          <ElRadioGroup v-model="form.status">
            <ElRadio :value="10">启用</ElRadio>
            <ElRadio :value="9">未激活</ElRadio>
          </ElRadioGroup>
        </ElFormItem>

        <ElFormItem label="角色">
          <ElSelect
            v-model="form.roles"
            multiple
            filterable
            :loading="roleLoading"
            placeholder="请选择角色"
          >
            <ElOption
              v-for="role in roleOptions"
              :key="role.name"
              :label="role.description || role.name"
              :value="role.name"
            />
          </ElSelect>
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
  import { h } from 'vue'
  import {
    ElAvatar,
    ElMessage,
    ElMessageBox,
    ElTag,
    type FormInstance,
    type FormRules,
    type UploadProps,
    type UploadRawFile
  } from 'element-plus'
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import { useTable } from '@/hooks/core/useTable'
  import { useAuth } from '@/hooks/core/useAuth'
  import { useUserStore } from '@/store/modules/user'
  import { fetchRoleList, type RoleItem } from '@/api/role'
  import {
    assignUserRoles,
    createUser,
    deleteUser,
    fetchUserList,
    updateUser,
    type UserItem,
    type UserStatus
  } from '@/api/user'

  defineOptions({ name: 'User' })

  type DialogType = 'create' | 'update'
  type SearchStatus = '' | UserStatus

  interface UserSearchForm {
    username: string
    email: string
    status: SearchStatus
  }

  interface UserForm {
    id?: number
    username: string
    email: string
    avatar: string
    password: string
    status: 9 | 10
    roles: string[]
  }

  interface UploadSuccessResponse {
    code: number
    message?: string
    data?: {
      url: string
    }
  }

  const { hasAuth } = useAuth()
  const userStore = useUserStore()

  const searchForm = reactive<UserSearchForm>({
    username: '',
    email: '',
    status: ''
  })

  const dialogVisible = ref(false)
  const dialogType = ref<DialogType>('create')
  const submitLoading = ref(false)
  const formRef = ref<FormInstance>()
  const roleLoading = ref(false)
  const roleOptions = ref<RoleItem[]>([])

  const uploadAction = computed(() => `${import.meta.env.VITE_API_URL}/common/upload`)
  const uploadHeaders = computed(() =>
    userStore.accessToken ? { Authorization: `Bearer ${userStore.accessToken}` } : {}
  )

  const form = reactive<UserForm>({
    username: '',
    email: '',
    avatar: '',
    password: '',
    status: 10,
    roles: []
  })

  const validatePassword = (_rule: unknown, value: string, callback: (error?: Error) => void) => {
    if (dialogType.value === 'create' && !value) {
      callback(new Error('请输入密码'))
      return
    }

    if (value && value.length < 6) {
      callback(new Error('密码至少 6 个字符'))
      return
    }

    callback()
  }

  const rules: FormRules<UserForm> = {
    username: [
      { required: true, message: '请输入用户名', trigger: 'blur' },
      { min: 2, max: 30, message: '用户名长度为 2 到 30 个字符', trigger: 'blur' }
    ],
    email: [
      { required: true, message: '请输入邮箱', trigger: 'blur' },
      { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
    ],
    password: [{ validator: validatePassword, trigger: 'blur' }],
    status: [{ required: true, message: '请选择状态', trigger: 'change' }]
  }

  const getStatusConfig = (status: UserStatus) => {
    const statusMap = {
      10: { type: 'success' as const, text: '启用' },
      9: { type: 'warning' as const, text: '未激活' },
      0: { type: 'danger' as const, text: '已删除' }
    }

    return statusMap[status] || { type: 'info' as const, text: '未知' }
  }

  const formatDateTime = (timestamp: number) => {
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
      apiFn: fetchUserList,
      apiParams: {
        size: 10
      },
      paginationKey: {
        current: 'page',
        size: 'size'
      },
      columnsFactory: () => [
        { prop: 'id', label: 'ID', width: 80 },
        {
          prop: 'avatar',
          label: '头像',
          width: 90,
          formatter: (row) =>
            h(ElAvatar, {
              size: 36,
              src: row.avatar || undefined
            })
        },
        { prop: 'username', label: '用户名', minWidth: 140 },
        { prop: 'email', label: '邮箱', minWidth: 200 },
        {
          prop: 'status',
          label: '状态',
          width: 100,
          formatter: (row) => {
            const status = getStatusConfig(row.status)
            return h(ElTag, { type: status.type }, () => status.text)
          }
        },
        {
          prop: 'roles',
          label: '角色',
          minWidth: 180,
          formatter: (row) =>
            row.roles.length
              ? h(
                  'div',
                  { class: 'flex flex-wrap gap-1' },
                  row.roles.map((role) => h(ElTag, { type: 'info' }, () => role))
                )
              : '-'
        },
        {
          prop: 'created_at',
          label: '创建时间',
          width: 180,
          formatter: (row) => formatDateTime(row.created_at)
        },
        {
          prop: 'operation',
          label: '操作',
          width: 120,
          fixed: 'right',
          formatter: (row) =>
            h('div', [
              hasAuth('user.update')
                ? h(ArtButtonTable, {
                    type: 'edit',
                    onClick: () => openDialog('update', row)
                  })
                : null,
              hasAuth('user.delete')
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

  const loadRoleOptions = async () => {
    if (roleOptions.value.length > 0) return

    try {
      roleLoading.value = true
      const res = await fetchRoleList({
        page: 1,
        size: 100
      })
      roleOptions.value = res.records
    } finally {
      roleLoading.value = false
    }
  }

  const beforeAvatarUpload = (rawFile: UploadRawFile) => {
    const isImage = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(rawFile.type)
    const isLt2M = rawFile.size / 1024 / 1024 < 2

    if (!isImage) {
      ElMessage.error('头像只能上传 jpg、png、gif、webp 图片')
      return false
    }

    if (!isLt2M) {
      ElMessage.error('头像大小不能超过 2MB')
      return false
    }

    return true
  }

  const handleAvatarSuccess: UploadProps['onSuccess'] = (response: UploadSuccessResponse) => {
    if (response.code !== 0 || !response.data?.url) {
      ElMessage.error(response.message || '头像上传失败')
      return
    }

    form.avatar = response.data.url
  }

  const handleAvatarError: UploadProps['onError'] = () => {
    ElMessage.error('头像上传失败')
  }

  const handleSearch = async () => {
    replaceSearchParams({
      username: searchForm.username || undefined,
      email: searchForm.email || undefined,
      status: searchForm.status === '' ? undefined : searchForm.status
    })
    await getData()
  }

  const handleReset = async () => {
    searchForm.username = ''
    searchForm.email = ''
    searchForm.status = ''
    await resetSearchParams()
  }

  const openDialog = async (type: DialogType, row?: UserItem) => {
    dialogType.value = type
    await loadRoleOptions()

    if (type === 'create') {
      resetForm()
    } else if (row) {
      form.id = row.id
      form.username = row.username
      form.email = row.email
      form.avatar = row.avatar || ''
      form.password = ''
      form.status = row.status === 9 ? 9 : 10
      form.roles = [...row.roles]
    }

    dialogVisible.value = true
  }

  const resetForm = () => {
    form.id = undefined
    form.username = ''
    form.email = ''
    form.avatar = ''
    form.password = ''
    form.status = 10
    form.roles = []
    formRef.value?.clearValidate()
  }

  const handleSubmit = async () => {
    await formRef.value?.validate()

    try {
      submitLoading.value = true

      if (dialogType.value === 'create') {
        await createUser({
          username: form.username,
          email: form.email,
          avatar: form.avatar,
          password: form.password,
          status: form.status,
          roles: form.roles
        })
        dialogVisible.value = false
        await refreshCreate()
        return
      }

      if (!form.id) return

      await updateUser({
        id: form.id,
        username: form.username,
        email: form.email,
        avatar: form.avatar,
        password: form.password || undefined,
        status: form.status
      })

      await assignUserRoles({
        id: form.id,
        roles: form.roles
      })

      dialogVisible.value = false
      await refreshUpdate()
    } finally {
      submitLoading.value = false
    }
  }

  const handleDelete = async (row: UserItem) => {
    await ElMessageBox.confirm(`确定删除用户「${row.username}」吗？`, '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    await deleteUser({ id: row.id })
    await refreshRemove()
  }
</script>

<style scoped lang="scss">
  .avatar-uploader {
    display: inline-flex;

    :deep(.el-upload) {
      width: 72px;
      height: 72px;
      overflow: hidden;
      cursor: pointer;
      border: 1px dashed var(--el-border-color);
      border-radius: 8px;
      transition: border-color 0.2s;

      &:hover {
        border-color: var(--el-color-primary);
      }
    }
  }

  .avatar-preview {
    display: block;
    width: 72px;
    height: 72px;
    object-fit: cover;
  }

  .avatar-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 72px;
    height: 72px;
    font-size: 13px;
    color: var(--el-text-color-secondary);
  }
</style>
