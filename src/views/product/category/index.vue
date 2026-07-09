<template>
  <div class="product-category-page art-full-height flex flex-col">
    <ElForm :inline="true" :model="searchForm" class="mb-3">
      <ElFormItem label="分类名称">
        <ElInput
          v-model="searchForm.category_name"
          clearable
          placeholder="请输入分类名称"
          @keyup.enter="handleSearch"
        />
      </ElFormItem>
      <ElFormItem label="分类编码">
        <ElInput
          v-model="searchForm.category_code"
          clearable
          placeholder="请输入分类编码"
          @keyup.enter="handleSearch"
        />
      </ElFormItem>
      <ElFormItem label="状态">
        <ElSelect v-model="searchForm.status" clearable placeholder="全部" style="width: 120px">
          <ElOption v-for="item in statusOptions" :key="item.value" v-bind="item" />
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
          <ElButton
            v-if="hasAuth('product.category.create')"
            type="primary"
            @click="openDialog('create')"
          >
            新增分类
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
      :title="dialogType === 'create' ? '新增分类' : '编辑分类'"
      width="640px"
      @closed="resetForm"
    >
      <ElForm ref="formRef" :model="form" :rules="rules" label-width="100px">
        <ElFormItem label="上级分类">
          <ElTreeSelect
            v-model="form.parent_id"
            :data="categoryTree"
            :props="{ label: 'category_name', value: 'id', children: 'children' }"
            check-strictly
            clearable
            placeholder="顶级分类"
          />
        </ElFormItem>
        <ElFormItem label="分类名称" prop="category_name">
          <ElInput v-model="form.category_name" placeholder="请输入分类名称" />
        </ElFormItem>
        <ElFormItem label="分类编码">
          <ElInput
            v-model="form.category_code"
            :disabled="dialogType === 'update'"
            placeholder="留空自动生成"
          />
        </ElFormItem>
        <ElFormItem label="排序">
          <ElInputNumber v-model="form.sort" :min="0" :precision="0" class="w-full" />
        </ElFormItem>
        <ElFormItem label="状态" prop="status">
          <ElRadioGroup v-model="form.status">
            <ElRadio :value="1">启用</ElRadio>
            <ElRadio :value="2">停用</ElRadio>
          </ElRadioGroup>
        </ElFormItem>
        <ElFormItem label="备注">
          <ElInput v-model="form.remark" type="textarea" :rows="3" placeholder="请输入备注" />
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
  import { ElMessageBox, ElTag, type FormInstance, type FormRules } from 'element-plus'
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import { useTable } from '@/hooks/core/useTable'
  import { useAuth } from '@/hooks/core/useAuth'
  import {
    createProductCategory,
    deleteProductCategory,
    fetchProductCategoryList,
    fetchProductCategoryOptions,
    updateProductCategory,
    type ProductCategoryItem,
    type ProductCategoryOption,
    type ProductStatus
  } from '@/api/product'

  defineOptions({ name: 'ProductCategory' })

  type DialogType = 'create' | 'update'
  type SearchValue<T> = '' | T

  interface CategorySearchForm {
    category_name: string
    category_code: string
    status: SearchValue<ProductStatus>
  }

  interface CategoryForm {
    id?: number
    parent_id: number | ''
    category_name: string
    category_code: string
    sort: number
    status: ProductStatus
    remark: string
  }

  const { hasAuth } = useAuth()
  const statusOptions = [
    { label: '启用', value: 1 },
    { label: '停用', value: 2 }
  ] as const

  const searchForm = reactive<CategorySearchForm>({
    category_name: '',
    category_code: '',
    status: ''
  })

  const categoryTree = ref<ProductCategoryOption[]>([])
  const dialogVisible = ref(false)
  const dialogType = ref<DialogType>('create')
  const submitLoading = ref(false)
  const formRef = ref<FormInstance>()
  const form = reactive<CategoryForm>(getDefaultForm())

  const rules: FormRules<CategoryForm> = {
    category_name: [{ required: true, message: '请输入分类名称', trigger: 'blur' }],
    status: [{ required: true, message: '请选择状态', trigger: 'change' }]
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
    replaceSearchParams,
    resetSearchParams,
    getData,
    handleSizeChange,
    handleCurrentChange
  } = useTable({
    core: {
      apiFn: fetchProductCategoryList,
      apiParams: { size: 10 },
      paginationKey: {
        current: 'page',
        size: 'size'
      },
      columnsFactory: () => [
        { prop: 'id', label: 'ID', width: 80 },
        { prop: 'category_name', label: '分类名称', minWidth: 180 },
        { prop: 'category_code', label: '分类编码', minWidth: 160 },
        { prop: 'sort', label: '排序', width: 90 },
        {
          prop: 'status',
          label: '状态',
          width: 100,
          formatter: (row: ProductCategoryItem) =>
            h(ElTag, { type: row.status === 1 ? 'success' : 'info' }, () =>
              row.status === 1 ? '启用' : '停用'
            )
        },
        { prop: 'product_count', label: '产品数', width: 100 },
        {
          prop: 'created_at',
          label: '创建时间',
          width: 170,
          formatter: (row: ProductCategoryItem) => formatDateTime(row.created_at)
        },
        {
          prop: 'operation',
          label: '操作',
          width: 130,
          fixed: 'right',
          formatter: (row: ProductCategoryItem) =>
            h('div', [
              hasAuth('product.category.update')
                ? h(ArtButtonTable, {
                    type: 'edit',
                    onClick: () => openDialog('update', row)
                  })
                : null,
              hasAuth('product.category.delete')
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

  function getDefaultForm(): CategoryForm {
    return {
      parent_id: '',
      category_name: '',
      category_code: '',
      sort: 0,
      status: 1,
      remark: ''
    }
  }

  const loadOptions = async () => {
    const res = await fetchProductCategoryOptions()
    categoryTree.value = res.tree || []
  }

  const handleSearch = () => {
    replaceSearchParams({
      ...searchForm,
      status: searchForm.status || undefined
    })
    getData()
  }

  const handleReset = () => {
    Object.assign(searchForm, {
      category_name: '',
      category_code: '',
      status: ''
    })
    resetSearchParams()
    getData()
  }

  const resetForm = () => {
    Object.assign(form, getDefaultForm())
    formRef.value?.clearValidate()
  }

  const openDialog = (type: DialogType, row?: ProductCategoryItem) => {
    dialogType.value = type
    dialogVisible.value = true
    if (row) {
      Object.assign(form, row)
    }
  }

  const handleSubmit = async () => {
    await formRef.value?.validate()
    const params = {
      ...form,
      parent_id: Number(form.parent_id || 0)
    }
    submitLoading.value = true
    try {
      if (dialogType.value === 'create') {
        await createProductCategory(params)
      } else if (form.id) {
        await updateProductCategory({ ...params, id: form.id })
      }
      dialogVisible.value = false
      refreshData()
      loadOptions()
    } finally {
      submitLoading.value = false
    }
  }

  const handleDelete = async (row: ProductCategoryItem) => {
    await ElMessageBox.confirm(`确定删除分类「${row.category_name}」吗？`, '提示', {
      type: 'warning'
    })
    await deleteProductCategory({ id: row.id })
    refreshData()
    loadOptions()
  }

  onMounted(() => {
    loadOptions()
  })
</script>
