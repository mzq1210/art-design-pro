<template>
  <div class="art-full-height flex flex-col">
    <ElForm :inline="true" :model="searchForm" class="mb-3">
      <ElFormItem label="状态">
        <ElRadioGroup v-model="searchForm.status" @change="handleSearch">
          <ElRadioButton value="">全部</ElRadioButton>
          <ElRadioButton :value="1">启用</ElRadioButton>
          <ElRadioButton :value="0">禁用</ElRadioButton>
        </ElRadioGroup>
      </ElFormItem>
    </ElForm>

    <ElCard class="art-table-card">
      <ArtTableHeader v-model:columns="columnChecks" :loading="loading" @refresh="refreshData">
        <template #left>
          <ElButton v-if="hasAuth('notice.create')" type="primary" @click="openDialog('create')">
            新增公告
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
      :title="dialogType === 'create' ? '新增公告' : '编辑公告'"
      width="500px"
      @closed="resetForm"
    >
      <ElForm ref="formRef" :model="form" :rules="rules" label-width="80px">
        <ElFormItem label="标题" prop="title">
          <ElInput v-model="form.title" placeholder="请输入公告标题" />
        </ElFormItem>

        <ElFormItem label="状态" prop="status">
          <ElRadioGroup v-model="form.status">
            <ElRadio :value="1">启用</ElRadio>
            <ElRadio :value="0">禁用</ElRadio>
          </ElRadioGroup>
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
  import { ElMessageBox, ElTag, type FormInstance, type FormRules } from 'element-plus'
  import { useTable } from '@/hooks/core/useTable'
  import { useAuth } from '@/hooks/core/useAuth'
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import {
    createNotice,
    deleteNotice,
    fetchNoticeList,
    updateNotice,
    type NoticeItem,
    type NoticeStatus
  } from '@/api/notice'

  type DialogType = 'create' | 'update'
  type SearchStatus = '' | NoticeStatus

  interface NoticeForm {
    id?: number
    title: string
    status: NoticeStatus
  }

  const { hasAuth } = useAuth()

  const searchForm = reactive<{ status: SearchStatus }>({
    status: ''
  })

  const dialogVisible = ref(false)
  const dialogType = ref<DialogType>('create')
  const submitLoading = ref(false)
  const formRef = ref<FormInstance>()

  const form = reactive<NoticeForm>({
    title: '',
    status: 1
  })

  const rules: FormRules<NoticeForm> = {
    title: [{ required: true, message: '请输入公告标题', trigger: 'blur' }],
    status: [{ required: true, message: '请选择状态', trigger: 'change' }]
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
    getData,
    handleSizeChange,
    handleCurrentChange
  } = useTable({
    core: {
      apiFn: fetchNoticeList,
      apiParams: {
        size: 10
      },
      paginationKey: {
        current: 'page',
        size: 'size'
      },
      columnsFactory: () => [
        { prop: 'id', label: 'ID', width: 80 },
        { prop: 'title', label: '公告标题', minWidth: 180 },
        {
          prop: 'status',
          label: '状态',
          width: 100,
          formatter: (row) =>
            h(ElTag, { type: row.status === 1 ? 'success' : 'info' }, () =>
              row.status === 1 ? '启用' : '禁用'
            )
        },
        { prop: 'created_at', label: '创建时间', width: 180 },
        {
          prop: 'operation',
          label: '操作',
          width: 140,
          fixed: 'right',
          formatter: (row) =>
            h('div', [
              hasAuth('notice.update')
                ? h(ArtButtonTable, {
                    type: 'edit',
                    onClick: () => openDialog('update', row)
                  })
                : null,
              hasAuth('notice.delete')
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

  const resetForm = () => {
    form.id = undefined
    form.title = ''
    form.status = 1
    formRef.value?.clearValidate()
  }

  const openDialog = (type: DialogType, row?: NoticeItem) => {
    dialogType.value = type

    if (type === 'create') {
      resetForm()
    } else if (row) {
      form.id = row.id
      form.title = row.title
      form.status = row.status
    }

    dialogVisible.value = true
  }

  const handleSearch = async () => {
    replaceSearchParams({
      status: searchForm.status === '' ? undefined : searchForm.status
    })
    await getData()
  }

  const handleSubmit = async () => {
    await formRef.value?.validate()

    try {
      submitLoading.value = true

      if (dialogType.value === 'create') {
        await createNotice({
          title: form.title,
          status: form.status
        })
        dialogVisible.value = false
        await refreshCreate()
        return
      }

      if (!form.id) return

      await updateNotice({
        id: form.id,
        title: form.title,
        status: form.status
      })
      dialogVisible.value = false
      await refreshUpdate()
    } finally {
      submitLoading.value = false
    }
  }

  const handleDelete = async (row: NoticeItem) => {
    await ElMessageBox.confirm(`确定删除公告「${row.title}」吗？`, '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    await deleteNotice({ id: row.id })
    await refreshRemove()
  }
</script>
