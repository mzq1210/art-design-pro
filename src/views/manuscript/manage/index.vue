<template>
  <div class="manuscript-page art-full-height flex flex-col">
    <ElForm :inline="true" :model="searchForm" class="mb-3">
      <ElFormItem label="稿件编号">
        <ElInput
          v-model="searchForm.manuscript_no"
          clearable
          placeholder="请输入稿件编号"
          @keyup.enter="handleSearch"
        />
      </ElFormItem>
      <ElFormItem label="关键词">
        <ElInput
          v-model="searchForm.keyword"
          clearable
          placeholder="标题 / 链接 / 客户 / 产品"
          @keyup.enter="handleSearch"
        />
      </ElFormItem>
      <ElFormItem label="类型">
        <ElSelect
          v-model="searchForm.manuscript_type"
          clearable
          placeholder="全部"
          style="width: 120px"
        >
          <ElOption v-for="item in typeOptions" :key="item.value" v-bind="item" />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="客户">
        <ElSelect
          v-model="searchForm.customer_id"
          clearable
          filterable
          placeholder="全部客户"
          style="width: 180px"
        >
          <ElOption
            v-for="item in customerOptions"
            :key="item.id"
            :label="`${item.customer_name} / ${item.customer_code}`"
            :value="item.id"
          />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="产品">
        <ElSelect
          v-model="searchForm.product_id"
          clearable
          filterable
          placeholder="全部产品"
          style="width: 180px"
        >
          <ElOption
            v-for="item in productOptions"
            :key="item.id"
            :label="`${item.product_name} / ${item.product_code}`"
            :value="item.id"
          />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="撰写人">
        <ElSelect
          v-model="searchForm.writer_id"
          clearable
          filterable
          placeholder="全部"
          style="width: 140px"
        >
          <ElOption
            v-for="item in writerOptions"
            :key="item.id"
            :label="item.name"
            :value="item.id"
          />
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
            v-if="hasAuth('manuscript.create')"
            type="primary"
            @click="openDialog('create')"
          >
            新增稿件
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
      :title="dialogType === 'create' ? '新增稿件' : '编辑稿件'"
      width="820px"
      @closed="resetForm"
    >
      <ElForm ref="formRef" :model="form" :rules="rules" label-width="110px">
        <ElRow :gutter="16">
          <ElCol :span="12">
            <ElFormItem label="稿件编号">
              <ElInput v-model="form.manuscript_no" placeholder="留空自动生成" />
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem label="稿件类型" prop="manuscript_type">
              <ElRadioGroup v-model="form.manuscript_type">
                <ElRadio :value="1">原创</ElRadio>
                <ElRadio :value="2">客户稿</ElRadio>
              </ElRadioGroup>
            </ElFormItem>
          </ElCol>
          <ElCol :span="24">
            <ElFormItem label="稿件标题" prop="title">
              <ElInput v-model="form.title" placeholder="请输入稿件标题" />
            </ElFormItem>
          </ElCol>
          <ElCol :span="24">
            <ElFormItem label="文章链接" prop="article_link">
              <ElInput v-model="form.article_link" placeholder="请输入文章链接" />
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem label="客户" prop="customer_id">
              <ElSelect v-model="form.customer_id" clearable filterable placeholder="请选择客户">
                <ElOption
                  v-for="item in customerOptions"
                  :key="item.id"
                  :label="`${item.customer_name} / ${item.customer_code}`"
                  :value="item.id"
                />
              </ElSelect>
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem label="合同产品">
              <ElSelect
                v-model="form.contract_product_id"
                clearable
                filterable
                placeholder="请选择合同产品"
                @change="handleContractProductChange"
              >
                <ElOption
                  v-for="item in filteredContractProductOptions"
                  :key="item.id"
                  :label="`${item.contract_no} / ${item.product_name}${item.media_name ? ` / ${item.media_name}` : ''}`"
                  :value="item.id"
                />
              </ElSelect>
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem label="合同">
              <ElSelect
                v-model="form.contract_id"
                clearable
                filterable
                placeholder="请选择合同"
                @change="handleContractChange"
              >
                <ElOption
                  v-for="item in filteredContractOptions"
                  :key="item.id"
                  :label="`${item.contract_no} / ${item.contract_name}`"
                  :value="item.id"
                />
              </ElSelect>
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem label="产品">
              <ElSelect v-model="form.product_id" clearable filterable placeholder="请选择产品">
                <ElOption
                  v-for="item in productOptions"
                  :key="item.id"
                  :label="`${item.product_name} / ${item.product_code}`"
                  :value="item.id"
                />
              </ElSelect>
            </ElFormItem>
          </ElCol>
          <ElCol :span="24">
            <ElFormItem label="撰写人" prop="writer_ids">
              <ElSelect
                v-model="form.writer_ids"
                multiple
                filterable
                collapse-tags
                collapse-tags-tooltip
                placeholder="请选择撰写人"
              >
                <ElOption
                  v-for="item in writerOptions"
                  :key="item.id"
                  :label="`${item.name}${item.mobile ? ` / ${item.mobile}` : ''}`"
                  :value="item.id"
                />
              </ElSelect>
            </ElFormItem>
          </ElCol>
          <ElCol :span="24">
            <ElFormItem label="履约任务">
              <ElSelect
                v-model="form.fulfillment_id"
                clearable
                filterable
                placeholder="请选择履约任务"
                @change="handleFulfillmentChange"
              >
                <ElOption
                  v-for="item in filteredFulfillmentOptions"
                  :key="item.id"
                  :label="`${item.fulfillment_no} / ${item.customer_name} / ${item.product_name}`"
                  :value="item.id"
                />
              </ElSelect>
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
  import { computed, h } from 'vue'
  import { ElLink, ElMessageBox, ElTag, type FormInstance, type FormRules } from 'element-plus'
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import { useAuth } from '@/hooks/core/useAuth'
  import { useTable } from '@/hooks/core/useTable'
  import {
    createManuscript,
    deleteManuscript,
    fetchManuscriptList,
    fetchManuscriptOptions,
    updateManuscript,
    type ManuscriptContractOption,
    type ManuscriptContractProductOption,
    type ManuscriptCustomerOption,
    type ManuscriptFulfillmentOption,
    type ManuscriptFormParams,
    type ManuscriptItem,
    type ManuscriptProductOption,
    type ManuscriptType,
    type ManuscriptUserOption
  } from '@/api/manuscript'

  defineOptions({ name: 'ManuscriptManage' })

  type DialogType = 'create' | 'update'
  type SearchValue<T> = '' | T

  interface ManuscriptSearchForm {
    manuscript_no: string
    manuscript_type: SearchValue<ManuscriptType>
    customer_id: SearchValue<number>
    product_id: SearchValue<number>
    writer_id: SearchValue<number>
    keyword: string
  }

  const { hasAuth } = useAuth()

  const typeOptions = [
    { label: '原创', value: 1 },
    { label: '客户稿', value: 2 }
  ] as const

  const searchForm = reactive<ManuscriptSearchForm>({
    manuscript_no: '',
    manuscript_type: '',
    customer_id: '',
    product_id: '',
    writer_id: '',
    keyword: ''
  })

  const customerOptions = ref<ManuscriptCustomerOption[]>([])
  const productOptions = ref<ManuscriptProductOption[]>([])
  const contractOptions = ref<ManuscriptContractOption[]>([])
  const contractProductOptions = ref<ManuscriptContractProductOption[]>([])
  const fulfillmentOptions = ref<ManuscriptFulfillmentOption[]>([])
  const writerOptions = ref<ManuscriptUserOption[]>([])
  const dialogVisible = ref(false)
  const dialogType = ref<DialogType>('create')
  const submitLoading = ref(false)
  const formRef = ref<FormInstance>()
  const form = reactive<ManuscriptFormParams>(getDefaultForm())

  const filteredContractOptions = computed(() => {
    if (!form.customer_id) return contractOptions.value
    return contractOptions.value.filter((item) => item.customer_id === form.customer_id)
  })

  const filteredContractProductOptions = computed(() => {
    return contractProductOptions.value.filter((item) => {
      if (form.contract_id && item.contract_id !== form.contract_id) return false
      if (form.customer_id && item.customer_id !== form.customer_id) return false
      return true
    })
  })

  const filteredFulfillmentOptions = computed(() => {
    return fulfillmentOptions.value.filter((item) => {
      if (form.contract_id && item.contract_id !== form.contract_id) return false
      if (form.contract_product_id && item.contract_product_id !== form.contract_product_id)
        return false
      if (form.customer_id && item.customer_id !== form.customer_id) return false
      return true
    })
  })

  const validateCustomer = (_rule: unknown, value: number, callback: (error?: Error) => void) => {
    if (form.manuscript_type === 2 && !value) {
      callback(new Error('客户稿必须选择客户'))
      return
    }
    callback()
  }

  const rules: FormRules<ManuscriptFormParams> = {
    manuscript_type: [{ required: true, message: '请选择稿件类型', trigger: 'change' }],
    title: [{ required: true, message: '请输入稿件标题', trigger: 'blur' }],
    article_link: [{ required: true, message: '请输入文章链接', trigger: 'blur' }],
    customer_id: [{ validator: validateCustomer, trigger: 'change' }],
    writer_ids: [
      { required: true, type: 'array', min: 1, message: '请选择撰写人', trigger: 'change' }
    ]
  }

  const formatDateTime = (timestamp: number) => {
    if (!timestamp) return '-'
    return new Date(timestamp * 1000).toLocaleString()
  }

  const formatType = (type: ManuscriptType) => (type === 1 ? '原创' : '客户稿')

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
      apiFn: fetchManuscriptList,
      apiParams: { size: 10 },
      paginationKey: {
        current: 'page',
        size: 'size'
      },
      columnsFactory: () => [
        { prop: 'id', label: 'ID', width: 80 },
        {
          prop: 'title',
          label: '稿件信息',
          minWidth: 260,
          formatter: (row: ManuscriptItem) =>
            h('div', [
              h('div', { class: 'font-medium' }, row.title),
              h('div', { class: 'text-xs text-gray-400 mt-1' }, `编号：${row.manuscript_no}`),
              row.article_link
                ? h(
                    ElLink,
                    {
                      href: row.article_link,
                      target: '_blank',
                      type: 'primary',
                      class: 'text-xs mt-1'
                    },
                    () => '打开链接'
                  )
                : null
            ])
        },
        {
          prop: 'manuscript_type',
          label: '类型',
          width: 100,
          formatter: (row: ManuscriptItem) =>
            h(ElTag, { type: row.manuscript_type === 1 ? 'success' : 'warning' }, () =>
              formatType(row.manuscript_type)
            )
        },
        {
          prop: 'customer_name',
          label: '客户',
          minWidth: 160,
          formatter: (row: ManuscriptItem) => row.customer_name || '-'
        },
        {
          prop: 'product_name',
          label: '产品',
          minWidth: 180,
          formatter: (row: ManuscriptItem) =>
            row.product_name ? `${row.product_name} / ${row.product_code}` : '-'
        },
        {
          prop: 'writer_names',
          label: '撰写人',
          minWidth: 150,
          formatter: (row: ManuscriptItem) => row.writer_names || '-'
        },
        {
          prop: 'created_at',
          label: '创建时间',
          width: 170,
          formatter: (row: ManuscriptItem) => formatDateTime(row.created_at)
        },
        {
          prop: 'operation',
          label: '操作',
          width: 130,
          fixed: 'right',
          formatter: (row: ManuscriptItem) =>
            h('div', [
              hasAuth('manuscript.update')
                ? h(ArtButtonTable, {
                    type: 'edit',
                    onClick: () => openDialog('update', row)
                  })
                : null,
              hasAuth('manuscript.delete')
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

  function getDefaultForm(): ManuscriptFormParams {
    return {
      manuscript_no: '',
      manuscript_type: 1,
      customer_id: '',
      contract_id: '',
      fulfillment_id: '',
      contract_product_id: '',
      product_id: '',
      title: '',
      article_link: '',
      writer_ids: [],
      remark: ''
    }
  }

  const loadOptions = async () => {
    const res = await fetchManuscriptOptions()
    customerOptions.value = res.customers || []
    productOptions.value = res.products || []
    contractOptions.value = res.contracts || []
    contractProductOptions.value = res.contractProducts || []
    fulfillmentOptions.value = res.fulfillments || []
    writerOptions.value = res.writers || []
  }

  const handleSearch = () => {
    replaceSearchParams({
      ...searchForm,
      manuscript_type: searchForm.manuscript_type || undefined,
      customer_id: searchForm.customer_id || undefined,
      product_id: searchForm.product_id || undefined,
      writer_id: searchForm.writer_id || undefined
    })
    getData()
  }

  const handleReset = () => {
    Object.assign(searchForm, {
      manuscript_no: '',
      manuscript_type: '',
      customer_id: '',
      product_id: '',
      writer_id: '',
      keyword: ''
    })
    resetSearchParams()
    getData()
  }

  const resetForm = () => {
    Object.assign(form, getDefaultForm())
    formRef.value?.clearValidate()
  }

  const handleContractChange = (value: number | '') => {
    const item = contractOptions.value.find((option) => option.id === value)
    if (!item) {
      form.contract_id = ''
      form.contract_product_id = ''
      form.fulfillment_id = ''
      return
    }

    form.contract_id = item.id
    form.customer_id = item.customer_id || form.customer_id

    const contractProduct = contractProductOptions.value.find(
      (option) => option.id === form.contract_product_id && option.contract_id === item.id
    )
    if (!contractProduct) {
      form.contract_product_id = ''
    }

    const fulfillment = fulfillmentOptions.value.find(
      (option) => option.id === form.fulfillment_id && option.contract_id === item.id
    )
    if (!fulfillment) {
      form.fulfillment_id = ''
    }
  }

  const handleContractProductChange = (value: number | '') => {
    const item = contractProductOptions.value.find((option) => option.id === value)
    if (!item) {
      form.contract_product_id = ''
      return
    }

    form.contract_id = item.contract_id
    form.customer_id = item.customer_id || ''
    form.product_id = item.product_id || ''

    const fulfillment = fulfillmentOptions.value.find(
      (option) => option.id === form.fulfillment_id && option.contract_product_id === item.id
    )
    if (!fulfillment) {
      form.fulfillment_id = ''
    }
  }

  const handleFulfillmentChange = (value: number | '') => {
    const item = fulfillmentOptions.value.find((option) => option.id === value)
    if (!item) {
      form.fulfillment_id = ''
      return
    }

    form.fulfillment_id = item.id
    form.contract_id = item.contract_id || ''
    form.contract_product_id = item.contract_product_id || ''
    form.customer_id = item.customer_id || ''
    form.product_id = item.product_id || ''
  }

  const openDialog = (type: DialogType, row?: ManuscriptItem) => {
    dialogType.value = type
    dialogVisible.value = true
    if (row) {
      Object.assign(form, {
        id: row.id,
        manuscript_no: row.manuscript_no,
        manuscript_type: row.manuscript_type,
        customer_id: row.customer_id || '',
        contract_id: row.contract_id || '',
        fulfillment_id: row.fulfillment_id || '',
        contract_product_id: row.contract_product_id || '',
        product_id: row.product_id || '',
        title: row.title,
        article_link: row.article_link,
        writer_ids: [...row.writer_ids],
        remark: row.remark
      })
    }
  }

  const handleSubmit = async () => {
    await formRef.value?.validate()
    const params = {
      ...form,
      customer_id: Number(form.customer_id || 0),
      contract_id: Number(form.contract_id || 0),
      fulfillment_id: Number(form.fulfillment_id || 0),
      contract_product_id: Number(form.contract_product_id || 0),
      product_id: Number(form.product_id || 0)
    }
    submitLoading.value = true
    try {
      if (dialogType.value === 'create') {
        await createManuscript(params)
      } else if (form.id) {
        await updateManuscript({ ...params, id: form.id })
      }
      dialogVisible.value = false
      refreshData()
    } finally {
      submitLoading.value = false
    }
  }

  const handleDelete = async (row: ManuscriptItem) => {
    await ElMessageBox.confirm(`确定删除稿件「${row.title}」吗？`, '提示', {
      type: 'warning'
    })
    await deleteManuscript({ id: row.id })
    refreshData()
  }

  onMounted(() => {
    loadOptions()
  })
</script>
