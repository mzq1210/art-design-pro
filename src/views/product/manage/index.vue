<template>
  <div class="product-page art-full-height flex flex-col">
    <ElForm :inline="true" :model="searchForm" class="mb-3">
      <ElFormItem label="产品名称">
        <ElInput
          v-model="searchForm.product_name"
          clearable
          placeholder="请输入产品名称"
          @keyup.enter="handleSearch"
        />
      </ElFormItem>
      <ElFormItem label="产品编码">
        <ElInput
          v-model="searchForm.product_code"
          clearable
          placeholder="请输入产品编码"
          @keyup.enter="handleSearch"
        />
      </ElFormItem>
      <ElFormItem label="分类">
        <ElSelect
          v-model="searchForm.category_id"
          clearable
          placeholder="全部"
          style="width: 180px"
        >
          <ElOption
            v-for="item in categoryOptions"
            :key="item.id"
            :label="`${item.category_name} / ${item.category_code}`"
            :value="item.id"
          />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="状态">
        <ElSelect v-model="searchForm.status" clearable placeholder="全部" style="width: 120px">
          <ElOption v-for="item in statusOptions" :key="item.value" v-bind="item" />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="热门">
        <ElSelect v-model="searchForm.is_hot" clearable placeholder="全部" style="width: 120px">
          <ElOption label="否" :value="0" />
          <ElOption label="是" :value="1" />
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
          <ElButton v-if="hasAuth('product.create')" type="primary" @click="openDialog('create')">
            新增产品
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
      :title="dialogType === 'create' ? '新增产品' : '编辑产品'"
      width="860px"
      @closed="resetForm"
    >
      <ElForm ref="formRef" :model="form" :rules="rules" label-width="110px">
        <ElRow :gutter="16">
          <ElCol :span="12">
            <ElFormItem label="产品名称" prop="product_name">
              <ElInput v-model="form.product_name" placeholder="请输入产品名称" />
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem label="产品编码">
              <ElInput
                v-model="form.product_code"
                :disabled="dialogType === 'update'"
                placeholder="留空自动生成"
              />
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem label="产品分类">
              <ElSelect v-model="form.category_id" clearable filterable placeholder="请选择分类">
                <ElOption label="暂不选择分类" :value="0" />
                <ElOption
                  v-for="item in categoryOptions"
                  :key="item.id"
                  :label="`${item.category_name} / ${item.category_code}`"
                  :value="item.id"
                />
              </ElSelect>
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem label="媒体名称">
              <ElInput v-model="form.media_name" placeholder="如 抖音达人矩阵" />
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem label="广告形式">
              <ElInput v-model="form.ad_type" placeholder="如 短视频、图文、直播" />
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem label="计价单位">
              <ElInput v-model="form.unit" placeholder="如 条、场、天、次" />
            </ElFormItem>
          </ElCol>
          <ElCol :span="8">
            <ElFormItem label="刊例价">
              <ElInputNumber v-model="form.list_price" :min="0" :precision="2" class="w-full" />
            </ElFormItem>
          </ElCol>
          <ElCol :span="8">
            <ElFormItem label="底价">
              <ElInputNumber v-model="form.base_price" :min="0" :precision="2" class="w-full" />
            </ElFormItem>
          </ElCol>
          <ElCol :span="8">
            <ElFormItem label="默认销售价">
              <ElInputNumber v-model="form.sale_price" :min="0" :precision="2" class="w-full" />
            </ElFormItem>
          </ElCol>
          <ElCol :span="8">
            <ElFormItem label="总库存">
              <ElInputNumber
                v-model="form.inventory_total"
                :min="0"
                :precision="0"
                class="w-full"
              />
            </ElFormItem>
          </ElCol>
          <ElCol :span="8">
            <ElFormItem label="履约周期">
              <ElInputNumber
                v-model="form.delivery_cycle_days"
                :min="0"
                :precision="0"
                class="w-full"
              />
            </ElFormItem>
          </ElCol>
          <ElCol :span="8">
            <ElFormItem label="封面附件ID">
              <ElInputNumber
                v-model="form.cover_attachment_id"
                :min="0"
                :precision="0"
                class="w-full"
              />
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem label="状态" prop="status">
              <ElRadioGroup v-model="form.status">
                <ElRadio :value="1">上架</ElRadio>
                <ElRadio :value="2">下架</ElRadio>
              </ElRadioGroup>
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem label="热门">
              <ElSwitch v-model="form.is_hot" :active-value="1" :inactive-value="0" />
            </ElFormItem>
          </ElCol>
          <ElCol :span="24">
            <ElFormItem label="规格说明">
              <ElInput
                v-model="form.specification"
                type="textarea"
                :rows="3"
                placeholder="请输入投放说明、规格要求、交付标准"
              />
            </ElFormItem>
          </ElCol>
          <ElCol :span="24">
            <ElFormItem label="备注">
              <ElInput v-model="form.remark" type="textarea" :rows="3" placeholder="请输入备注" />
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
  import { h } from 'vue'
  import { ElMessageBox, ElTag, type FormInstance, type FormRules } from 'element-plus'
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import { useTable } from '@/hooks/core/useTable'
  import { useAuth } from '@/hooks/core/useAuth'
  import {
    createProduct,
    deleteProduct,
    fetchProductList,
    fetchProductOptions,
    updateProduct,
    type ProductCategoryOption,
    type ProductHot,
    type ProductItem,
    type ProductStatus
  } from '@/api/product'

  defineOptions({ name: 'ProductManage' })

  type DialogType = 'create' | 'update'
  type SearchValue<T> = '' | T

  interface ProductSearchForm {
    product_name: string
    product_code: string
    category_id: SearchValue<number>
    status: SearchValue<ProductStatus>
    is_hot: SearchValue<ProductHot>
  }

  interface ProductForm {
    id?: number
    category_id: number | ''
    product_name: string
    product_code: string
    media_name: string
    ad_type: string
    unit: string
    list_price: number
    base_price: number
    sale_price: number
    inventory_total: number
    delivery_cycle_days: number
    status: ProductStatus
    is_hot: ProductHot
    cover_attachment_id: number
    specification: string
    remark: string
  }

  const { hasAuth } = useAuth()
  const statusOptions = [
    { label: '上架', value: 1 },
    { label: '下架', value: 2 }
  ] as const

  const searchForm = reactive<ProductSearchForm>({
    product_name: '',
    product_code: '',
    category_id: '',
    status: '',
    is_hot: ''
  })

  const categoryOptions = ref<ProductCategoryOption[]>([])
  const dialogVisible = ref(false)
  const dialogType = ref<DialogType>('create')
  const submitLoading = ref(false)
  const formRef = ref<FormInstance>()
  const form = reactive<ProductForm>(getDefaultForm())

  const rules: FormRules<ProductForm> = {
    product_name: [{ required: true, message: '请输入产品名称', trigger: 'blur' }],
    status: [{ required: true, message: '请选择状态', trigger: 'change' }]
  }

  const formatMoney = (value: number | string) =>
    Number(value || 0).toLocaleString('zh-CN', {
      style: 'currency',
      currency: 'CNY',
      minimumFractionDigits: 2
    })

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
      apiFn: fetchProductList,
      apiParams: { size: 10 },
      paginationKey: {
        current: 'page',
        size: 'size'
      },
      columnsFactory: () => [
        { prop: 'id', label: 'ID', width: 80 },
        {
          prop: 'product_name',
          label: '产品信息',
          minWidth: 230,
          formatter: (row: ProductItem) =>
            h('div', [
              h('div', { class: 'font-medium' }, row.product_name),
              h('div', { class: 'text-xs text-gray-400 mt-1' }, `编码：${row.product_code}`),
              h('div', { class: 'text-xs text-gray-400 mt-1' }, `媒体：${row.media_name || '-'}`)
            ])
        },
        {
          prop: 'category_name',
          label: '分类',
          minWidth: 150,
          formatter: (row: ProductItem) => row.category_name || '-'
        },
        {
          prop: 'price',
          label: '价格',
          minWidth: 180,
          formatter: (row: ProductItem) =>
            h('div', [
              h('div', `销售：${formatMoney(row.sale_price)}`),
              h(
                'div',
                { class: 'text-xs text-gray-400 mt-1' },
                `刊例：${formatMoney(row.list_price)}`
              )
            ])
        },
        {
          prop: 'inventory',
          label: '库存',
          width: 120,
          formatter: (row: ProductItem) => `${row.inventory_available}/${row.inventory_total}`
        },
        {
          prop: 'status',
          label: '状态',
          width: 100,
          formatter: (row: ProductItem) =>
            h(ElTag, { type: row.status === 1 ? 'success' : 'info' }, () =>
              row.status === 1 ? '上架' : '下架'
            )
        },
        {
          prop: 'is_hot',
          label: '热门',
          width: 90,
          formatter: (row: ProductItem) =>
            h(ElTag, { type: row.is_hot === 1 ? 'danger' : 'info' }, () =>
              row.is_hot === 1 ? '是' : '否'
            )
        },
        {
          prop: 'created_at',
          label: '创建时间',
          width: 170,
          formatter: (row: ProductItem) => formatDateTime(row.created_at)
        },
        {
          prop: 'operation',
          label: '操作',
          width: 130,
          fixed: 'right',
          formatter: (row: ProductItem) =>
            h('div', [
              hasAuth('product.update')
                ? h(ArtButtonTable, {
                    type: 'edit',
                    onClick: () => openDialog('update', row)
                  })
                : null,
              hasAuth('product.delete')
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

  function getDefaultForm(): ProductForm {
    return {
      category_id: '',
      product_name: '',
      product_code: '',
      media_name: '',
      ad_type: '',
      unit: '',
      list_price: 0,
      base_price: 0,
      sale_price: 0,
      inventory_total: 0,
      delivery_cycle_days: 0,
      status: 1,
      is_hot: 0,
      cover_attachment_id: 0,
      specification: '',
      remark: ''
    }
  }

  const loadOptions = async () => {
    const res = await fetchProductOptions()
    categoryOptions.value = res.categories || []
  }

  const handleSearch = () => {
    replaceSearchParams({
      ...searchForm,
      category_id: searchForm.category_id || undefined,
      status: searchForm.status || undefined,
      is_hot: searchForm.is_hot === '' ? undefined : searchForm.is_hot
    })
    getData()
  }

  const handleReset = () => {
    Object.assign(searchForm, {
      product_name: '',
      product_code: '',
      category_id: '',
      status: '',
      is_hot: ''
    })
    resetSearchParams()
    getData()
  }

  const resetForm = () => {
    Object.assign(form, getDefaultForm())
    formRef.value?.clearValidate()
  }

  const openDialog = (type: DialogType, row?: ProductItem) => {
    dialogType.value = type
    dialogVisible.value = true
    if (row) {
      Object.assign(form, {
        ...row,
        list_price: Number(row.list_price || 0),
        base_price: Number(row.base_price || 0),
        sale_price: Number(row.sale_price || 0)
      })
    }
  }

  const handleSubmit = async () => {
    await formRef.value?.validate()
    const params = {
      ...form,
      category_id: Number(form.category_id || 0)
    }
    submitLoading.value = true
    try {
      if (dialogType.value === 'create') {
        await createProduct(params)
      } else if (form.id) {
        await updateProduct({ ...params, id: form.id })
      }
      dialogVisible.value = false
      refreshData()
    } finally {
      submitLoading.value = false
    }
  }

  const handleDelete = async (row: ProductItem) => {
    await ElMessageBox.confirm(`确定删除产品「${row.product_name}」吗？`, '提示', {
      type: 'warning'
    })
    await deleteProduct({ id: row.id })
    refreshData()
  }

  onMounted(() => {
    loadOptions()
  })
</script>
