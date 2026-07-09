<template>
  <div class="fulfillment-page art-full-height flex flex-col">
    <ElForm :inline="true" :model="searchForm" class="mb-3">
      <ElFormItem label="履约单号">
        <ElInput
          v-model="searchForm.fulfillment_no"
          clearable
          placeholder="请输入履约单号"
          @keyup.enter="handleSearch"
        />
      </ElFormItem>
      <ElFormItem label="关键字">
        <ElInput
          v-model="searchForm.keyword"
          clearable
          placeholder="客户 / 产品 / 外部单号"
          @keyup.enter="handleSearch"
        />
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
      <ElFormItem label="负责人">
        <ElSelect
          v-model="searchForm.owner_user_id"
          clearable
          filterable
          placeholder="全部"
          style="width: 140px"
        >
          <ElOption
            v-for="item in userOptions"
            :key="item.id"
            :label="item.name"
            :value="item.id"
          />
        </ElSelect>
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
            v-if="hasAuth('fulfillment.create')"
            type="primary"
            @click="openDialog('create')"
            >新增履约</ElButton
          >
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
      :title="dialogType === 'create' ? '新增履约' : '编辑履约'"
      width="920px"
      @closed="resetForm"
    >
      <ElForm ref="formRef" :model="form" :rules="rules" label-width="110px">
        <ElRow :gutter="16">
          <ElCol :span="12">
            <ElFormItem label="履约单号">
              <ElInput v-model="form.fulfillment_no" placeholder="留空自动生成" />
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem label="负责人" prop="owner_user_id">
              <ElSelect v-model="form.owner_user_id" filterable placeholder="请选择负责人">
                <ElOption
                  v-for="item in userOptions"
                  :key="item.id"
                  :label="`${item.name}${item.mobile ? ` / ${item.mobile}` : ''}`"
                  :value="item.id"
                />
              </ElSelect>
            </ElFormItem>
          </ElCol>
          <ElCol :span="24">
            <ElFormItem label="合同产品" prop="contract_product_id">
              <ElSelect
                v-model="form.contract_product_id"
                filterable
                placeholder="请选择合同产品"
                @change="handleContractProductChange"
              >
                <ElOption
                  v-for="item in availableContractProducts"
                  :key="item.id"
                  :label="`${item.contract_no} / ${item.customer_name} / ${item.product_name} / 剩余 ${item.remaining_quantity}${item.unit || ''}`"
                  :value="item.id"
                />
              </ElSelect>
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem label="合同">
              <ElInput
                :model-value="
                  selectedContractProduct
                    ? `${selectedContractProduct.contract_no} / ${selectedContractProduct.contract_name}`
                    : '-'
                "
                disabled
              />
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem label="客户 / 产品">
              <ElInput
                :model-value="
                  selectedContractProduct
                    ? `${selectedContractProduct.customer_name} / ${selectedContractProduct.product_name}`
                    : '-'
                "
                disabled
              />
            </ElFormItem>
          </ElCol>
          <ElCol :span="8">
            <ElFormItem label="计划日期">
              <ElDatePicker
                v-model="form.plan_date"
                type="date"
                value-format="YYYY-MM-DD"
                placeholder="请选择"
                class="w-full"
              />
            </ElFormItem>
          </ElCol>
          <ElCol :span="8">
            <ElFormItem label="计划数量" prop="execute_quantity">
              <ElInputNumber
                v-model="form.execute_quantity"
                :min="0"
                :precision="2"
                class="w-full"
              />
            </ElFormItem>
          </ElCol>
          <ElCol :span="8">
            <ElFormItem label="单价" prop="unit_price">
              <ElInputNumber v-model="form.unit_price" :min="0" :precision="2" class="w-full" />
            </ElFormItem>
          </ElCol>
          <ElCol :span="8">
            <ElFormItem label="计划金额">
              <ElInput
                :model-value="formatMoney(Number(form.execute_quantity) * Number(form.unit_price))"
                disabled
              />
            </ElFormItem>
          </ElCol>
          <ElCol :span="8">
            <ElFormItem label="状态" prop="status">
              <ElSelect v-model="form.status" class="w-full">
                <ElOption v-for="item in statusOptions" :key="item.value" v-bind="item" />
              </ElSelect>
            </ElFormItem>
          </ElCol>
          <ElCol :span="8">
            <ElFormItem label="核销">
              <ElSwitch
                v-model="form.settlement_status"
                :active-value="1"
                :inactive-value="0"
                active-text="已核销"
                inactive-text="未核销"
              />
            </ElFormItem>
          </ElCol>
          <ElCol :span="24">
            <ElFormItem label="外部单号">
              <ElInput v-model="form.external_ref" placeholder="请输入外部投放单号 / 流水号" />
            </ElFormItem>
          </ElCol>
          <ElCol :span="24">
            <ElFormItem label="内容说明">
              <ElInput
                v-model="form.content_summary"
                type="textarea"
                :rows="3"
                placeholder="请输入投放内容说明"
              />
            </ElFormItem>
          </ElCol>
          <ElCol :span="24">
            <ElFormItem label="结果说明">
              <ElInput
                v-model="form.result_summary"
                type="textarea"
                :rows="3"
                placeholder="请输入履约结果说明"
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

    <ElDialog
      v-model="executionVisible"
      title="登记执行"
      width="760px"
      @closed="resetExecutionForm"
    >
      <ElForm
        ref="executionFormRef"
        :model="executionForm"
        :rules="executionRules"
        label-width="110px"
      >
        <ElRow :gutter="16">
          <ElCol :span="12">
            <ElFormItem label="执行人" prop="executor_id">
              <ElSelect v-model="executionForm.executor_id" filterable placeholder="请选择执行人">
                <ElOption
                  v-for="item in userOptions"
                  :key="item.id"
                  :label="`${item.name}${item.mobile ? ` / ${item.mobile}` : ''}`"
                  :value="item.id"
                />
              </ElSelect>
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem label="执行日期" prop="execute_date">
              <ElDatePicker
                v-model="executionForm.execute_date"
                type="date"
                value-format="YYYY-MM-DD"
                placeholder="请选择"
                class="w-full"
              />
            </ElFormItem>
          </ElCol>
          <ElCol :span="8">
            <ElFormItem label="执行数量" prop="execute_quantity">
              <ElInputNumber
                v-model="executionForm.execute_quantity"
                :min="0"
                :precision="2"
                class="w-full"
              />
            </ElFormItem>
          </ElCol>
          <ElCol :span="8">
            <ElFormItem label="单价" prop="unit_price">
              <ElInputNumber
                v-model="executionForm.unit_price"
                :min="0"
                :precision="2"
                class="w-full"
              />
            </ElFormItem>
          </ElCol>
          <ElCol :span="8">
            <ElFormItem label="执行金额">
              <ElInput
                :model-value="
                  formatMoney(
                    Number(executionForm.execute_quantity) * Number(executionForm.unit_price)
                  )
                "
                disabled
              />
            </ElFormItem>
          </ElCol>
          <ElCol :span="24">
            <ElFormItem label="外部单号">
              <ElInput v-model="executionForm.external_ref" placeholder="请输入外部流水号" />
            </ElFormItem>
          </ElCol>
          <ElCol :span="24">
            <ElFormItem label="执行内容">
              <ElInput
                v-model="executionForm.content_summary"
                type="textarea"
                :rows="3"
                placeholder="请输入执行内容"
              />
            </ElFormItem>
          </ElCol>
          <ElCol :span="24">
            <ElFormItem label="执行结果">
              <ElInput
                v-model="executionForm.result_summary"
                type="textarea"
                :rows="3"
                placeholder="请输入执行结果"
              />
            </ElFormItem>
          </ElCol>
          <ElCol :span="24">
            <ElFormItem label="备注">
              <ElInput
                v-model="executionForm.remark"
                type="textarea"
                :rows="3"
                placeholder="请输入备注"
              />
            </ElFormItem>
          </ElCol>
        </ElRow>
      </ElForm>

      <template #footer>
        <ElButton @click="executionVisible = false">取消</ElButton>
        <ElButton type="primary" :loading="submitLoading" @click="handleExecutionSubmit"
          >确定</ElButton
        >
      </template>
    </ElDialog>

    <ElDrawer v-model="executionDrawerVisible" title="执行记录" size="720px">
      <ElTable :data="executionRows" border>
        <ElTableColumn prop="execute_date" label="执行日期" width="120" />
        <ElTableColumn prop="executor_name" label="执行人" width="120" />
        <ElTableColumn prop="execute_quantity" label="数量" width="100" />
        <ElTableColumn label="金额" width="130">
          <template #default="{ row }">{{ formatMoney(row.execute_amount) }}</template>
        </ElTableColumn>
        <ElTableColumn prop="external_ref" label="外部单号" min-width="140" />
        <ElTableColumn prop="result_summary" label="结果说明" min-width="180" />
      </ElTable>
    </ElDrawer>
  </div>
</template>

<script setup lang="ts">
  import { h } from 'vue'
  import {
    ElButton,
    ElMessageBox,
    ElProgress,
    ElTag,
    type FormInstance,
    type FormRules
  } from 'element-plus'
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import { useAuth } from '@/hooks/core/useAuth'
  import { useTable } from '@/hooks/core/useTable'
  import {
    createFulfillment,
    createFulfillmentExecution,
    deleteFulfillment,
    fetchFulfillmentExecutions,
    fetchFulfillmentList,
    fetchFulfillmentOptions,
    updateFulfillment,
    type FulfillmentContractProductOption,
    type FulfillmentCustomerOption,
    type FulfillmentExecutionFormParams,
    type FulfillmentExecutionItem,
    type FulfillmentFormParams,
    type FulfillmentItem,
    type FulfillmentProductOption,
    type FulfillmentStatus,
    type FulfillmentUserOption,
    type SettlementStatus
  } from '@/api/fulfillment'

  defineOptions({ name: 'FulfillmentManage' })

  type DialogType = 'create' | 'update'
  type SearchValue<T> = '' | T

  interface FulfillmentSearchForm {
    fulfillment_no: string
    customer_id: SearchValue<number>
    product_id: SearchValue<number>
    owner_user_id: SearchValue<number>
    status: SearchValue<FulfillmentStatus>
    settlement_status: SearchValue<SettlementStatus>
    keyword: string
  }

  const { hasAuth } = useAuth()
  const statusOptions = [
    { label: '待执行', value: 1 },
    { label: '执行中', value: 2 },
    { label: '已完成', value: 3 },
    { label: '已作废', value: 4 }
  ] as const
  const statusMap: Record<
    FulfillmentStatus,
    { label: string; type: 'success' | 'warning' | 'primary' | 'danger' }
  > = {
    1: { label: '待执行', type: 'warning' },
    2: { label: '执行中', type: 'primary' },
    3: { label: '已完成', type: 'success' },
    4: { label: '已作废', type: 'danger' }
  }

  const searchForm = reactive<FulfillmentSearchForm>({
    fulfillment_no: '',
    customer_id: '',
    product_id: '',
    owner_user_id: '',
    status: '',
    settlement_status: '',
    keyword: ''
  })

  const customerOptions = ref<FulfillmentCustomerOption[]>([])
  const productOptions = ref<FulfillmentProductOption[]>([])
  const contractProductOptions = ref<FulfillmentContractProductOption[]>([])
  const userOptions = ref<FulfillmentUserOption[]>([])
  const dialogVisible = ref(false)
  const dialogType = ref<DialogType>('create')
  const executionVisible = ref(false)
  const executionDrawerVisible = ref(false)
  const submitLoading = ref(false)
  const formRef = ref<FormInstance>()
  const executionFormRef = ref<FormInstance>()
  const form = reactive<FulfillmentFormParams>(getDefaultForm())
  const executionForm = reactive<FulfillmentExecutionFormParams>(getDefaultExecutionForm())
  const executionRows = ref<FulfillmentExecutionItem[]>([])

  const selectedContractProduct = computed(() =>
    contractProductOptions.value.find((item) => item.id === form.contract_product_id)
  )
  const availableContractProducts = computed(() => {
    if (dialogType.value === 'update') return contractProductOptions.value
    return contractProductOptions.value.filter((item) => Number(item.remaining_quantity || 0) > 0)
  })

  const rules: FormRules<FulfillmentFormParams> = {
    contract_product_id: [{ required: true, message: '请选择合同产品', trigger: 'change' }],
    owner_user_id: [{ required: true, message: '请选择负责人', trigger: 'change' }],
    execute_quantity: [{ required: true, message: '请输入计划数量', trigger: 'blur' }],
    unit_price: [{ required: true, message: '请输入单价', trigger: 'blur' }],
    status: [{ required: true, message: '请选择状态', trigger: 'change' }]
  }

  const executionRules: FormRules<FulfillmentExecutionFormParams> = {
    executor_id: [{ required: true, message: '请选择执行人', trigger: 'change' }],
    execute_date: [{ required: true, message: '请选择执行日期', trigger: 'change' }],
    execute_quantity: [{ required: true, message: '请输入执行数量', trigger: 'blur' }],
    unit_price: [{ required: true, message: '请输入单价', trigger: 'blur' }]
  }

  function getToday() {
    return new Date().toISOString().slice(0, 10)
  }

  const formatMoney = (value: number | string) =>
    Number(value || 0).toLocaleString('zh-CN', {
      style: 'currency',
      currency: 'CNY',
      minimumFractionDigits: 2
    })
  const formatDateTime = (timestamp: number) =>
    timestamp ? new Date(timestamp * 1000).toLocaleString() : '-'

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
      apiFn: fetchFulfillmentList,
      apiParams: { size: 10 },
      paginationKey: { current: 'page', size: 'size' },
      columnsFactory: () => [
        { prop: 'id', label: 'ID', width: 80 },
        {
          prop: 'fulfillment_no',
          label: '履约信息',
          minWidth: 230,
          formatter: (row: FulfillmentItem) =>
            h('div', [
              h('div', { class: 'font-medium' }, row.fulfillment_no),
              h('div', { class: 'text-xs text-gray-400 mt-1' }, `负责人：${row.owner_name || '-'}`),
              h('div', { class: 'text-xs text-gray-400 mt-1' }, `计划日期：${row.plan_date || '-'}`)
            ])
        },
        {
          prop: 'customer_name',
          label: '客户 / 产品',
          minWidth: 220,
          formatter: (row: FulfillmentItem) =>
            h('div', [
              h('div', row.customer_name || '-'),
              h(
                'div',
                { class: 'text-xs text-gray-400 mt-1' },
                row.product_name ? `${row.product_name} / ${row.product_code}` : '-'
              )
            ])
        },
        {
          prop: 'progress',
          label: '进度',
          minWidth: 180,
          formatter: (row: FulfillmentItem) => {
            const total = Number(row.execute_quantity || 0)
            const done = Number(row.executed_quantity || 0)
            const percentage = total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0
            return h('div', [
              h(ElProgress, { percentage, strokeWidth: 8 }),
              h('div', { class: 'text-xs text-gray-400 mt-1' }, `已执行 ${done} / 计划 ${total}`)
            ])
          }
        },
        {
          prop: 'amount',
          label: '金额',
          minWidth: 160,
          formatter: (row: FulfillmentItem) =>
            h('div', [
              h('div', `计划：${formatMoney(row.execute_amount)}`),
              h(
                'div',
                { class: 'text-xs text-gray-400 mt-1' },
                `已执行：${formatMoney(row.executed_amount)}`
              )
            ])
        },
        {
          prop: 'status',
          label: '状态',
          width: 110,
          formatter: (row: FulfillmentItem) =>
            h(
              ElTag,
              { type: statusMap[row.status]?.type || 'warning' },
              () => statusMap[row.status]?.label || '-'
            )
        },
        {
          prop: 'settlement_status',
          label: '核销',
          width: 100,
          formatter: (row: FulfillmentItem) =>
            h(ElTag, { type: row.settlement_status === 1 ? 'success' : 'info' }, () =>
              row.settlement_status === 1 ? '已核销' : '未核销'
            )
        },
        {
          prop: 'created_at',
          label: '创建时间',
          width: 170,
          formatter: (row: FulfillmentItem) => formatDateTime(row.created_at)
        },
        {
          prop: 'operation',
          label: '操作',
          width: 210,
          fixed: 'right',
          formatter: (row: FulfillmentItem) =>
            h('div', { class: 'flex items-center gap-1 flex-wrap' }, [
              h(
                ElButton,
                {
                  size: 'small',
                  link: true,
                  type: 'primary',
                  onClick: () => openExecutionDrawer(row)
                },
                () => '记录'
              ),
              hasAuth('fulfillment.execute')
                ? h(
                    ElButton,
                    {
                      size: 'small',
                      link: true,
                      type: 'success',
                      onClick: () => openExecutionDialog(row)
                    },
                    () => '登记'
                  )
                : null,
              hasAuth('fulfillment.update')
                ? h(ArtButtonTable, { type: 'edit', onClick: () => openDialog('update', row) })
                : null,
              hasAuth('fulfillment.delete')
                ? h(ArtButtonTable, { type: 'delete', onClick: () => handleDelete(row) })
                : null
            ])
        }
      ]
    }
  })

  function getDefaultForm(): FulfillmentFormParams {
    return {
      fulfillment_no: '',
      contract_id: '',
      contract_product_id: '',
      customer_id: '',
      product_id: '',
      owner_user_id: '',
      plan_date: null,
      fulfillment_date: null,
      execute_quantity: 1,
      unit_price: 0,
      status: 1,
      settlement_status: 0,
      external_ref: '',
      content_summary: '',
      result_summary: '',
      remark: ''
    }
  }

  function getDefaultExecutionForm(): FulfillmentExecutionFormParams {
    return {
      fulfillment_id: 0,
      executor_id: '',
      execute_date: getToday(),
      execute_quantity: 1,
      unit_price: 0,
      external_ref: '',
      content_summary: '',
      result_summary: '',
      remark: ''
    }
  }

  const loadOptions = async () => {
    const res = await fetchFulfillmentOptions()
    customerOptions.value = res.customers || []
    productOptions.value = res.products || []
    contractProductOptions.value = res.contractProducts || []
    userOptions.value = res.users || []
  }

  const handleSearch = () => {
    replaceSearchParams({
      ...searchForm,
      customer_id: searchForm.customer_id || undefined,
      product_id: searchForm.product_id || undefined,
      owner_user_id: searchForm.owner_user_id || undefined,
      status: searchForm.status || undefined,
      settlement_status:
        searchForm.settlement_status === '' ? undefined : searchForm.settlement_status
    })
    getData()
  }

  const handleReset = () => {
    Object.assign(searchForm, {
      fulfillment_no: '',
      customer_id: '',
      product_id: '',
      owner_user_id: '',
      status: '',
      settlement_status: '',
      keyword: ''
    })
    resetSearchParams()
    getData()
  }

  const resetForm = () => {
    Object.assign(form, getDefaultForm())
    formRef.value?.clearValidate()
  }

  const resetExecutionForm = () => {
    Object.assign(executionForm, getDefaultExecutionForm())
    executionFormRef.value?.clearValidate()
  }

  const handleContractProductChange = (contractProductId: number) => {
    const item = contractProductOptions.value.find((option) => option.id === contractProductId)
    if (!item) return
    form.contract_id = item.contract_id
    form.customer_id = item.customer_id
    form.product_id = item.product_id
    form.owner_user_id = form.owner_user_id || item.owner_user_id
    form.unit_price = Number(item.sale_price || 0)
    form.execute_quantity = Math.max(1, Number(item.remaining_quantity || item.quantity || 1))
  }

  const openDialog = (type: DialogType, row?: FulfillmentItem) => {
    dialogType.value = type
    dialogVisible.value = true
    if (row) {
      Object.assign(form, {
        id: row.id,
        fulfillment_no: row.fulfillment_no,
        contract_id: row.contract_id,
        contract_product_id: row.contract_product_id,
        customer_id: row.customer_id,
        product_id: row.product_id,
        owner_user_id: row.owner_user_id,
        plan_date: row.plan_date,
        fulfillment_date: row.fulfillment_date,
        execute_quantity: Number(row.execute_quantity || 0),
        unit_price: Number(row.unit_price || 0),
        status: row.status,
        settlement_status: row.settlement_status,
        external_ref: row.external_ref,
        content_summary: row.content_summary,
        result_summary: row.result_summary,
        remark: row.remark
      })
    }
  }

  const openExecutionDialog = (row: FulfillmentItem) => {
    executionVisible.value = true
    Object.assign(executionForm, {
      fulfillment_id: row.id,
      executor_id: userOptions.value[0]?.id || '',
      execute_date: getToday(),
      execute_quantity: Math.max(1, Number(row.remaining_quantity || 1)),
      unit_price: Number(row.unit_price || 0),
      external_ref: row.external_ref,
      content_summary: row.content_summary,
      result_summary: '',
      remark: ''
    })
  }

  const openExecutionDrawer = async (row: FulfillmentItem) => {
    executionDrawerVisible.value = true
    executionRows.value = await fetchFulfillmentExecutions({ fulfillment_id: row.id })
  }

  const handleSubmit = async () => {
    await formRef.value?.validate()
    const params = {
      ...form,
      contract_id: Number(form.contract_id || 0),
      contract_product_id: Number(form.contract_product_id || 0),
      customer_id: Number(form.customer_id || 0),
      product_id: Number(form.product_id || 0),
      owner_user_id: Number(form.owner_user_id || 0)
    }
    submitLoading.value = true
    try {
      if (dialogType.value === 'create') {
        await createFulfillment(params)
      } else if (form.id) {
        await updateFulfillment({ ...params, id: form.id })
      }
      dialogVisible.value = false
      await loadOptions()
      refreshData()
    } finally {
      submitLoading.value = false
    }
  }

  const handleExecutionSubmit = async () => {
    await executionFormRef.value?.validate()
    const params = {
      ...executionForm,
      executor_id: Number(executionForm.executor_id || 0)
    }
    submitLoading.value = true
    try {
      await createFulfillmentExecution(params)
      executionVisible.value = false
      await loadOptions()
      refreshData()
    } finally {
      submitLoading.value = false
    }
  }

  const handleDelete = async (row: FulfillmentItem) => {
    await ElMessageBox.confirm(`确定删除履约任务「${row.fulfillment_no}」吗？`, '提示', {
      type: 'warning'
    })
    await deleteFulfillment({ id: row.id })
    await loadOptions()
    refreshData()
  }

  onMounted(() => {
    loadOptions()
  })
</script>
