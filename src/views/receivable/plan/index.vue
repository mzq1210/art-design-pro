<template>
  <div class="receivable-plan-page art-full-height flex flex-col">
    <ElForm :inline="true" :model="searchForm" class="mb-3">
      <ElFormItem label="关键字">
        <ElInput
          v-model="searchForm.keyword"
          clearable
          placeholder="计划 / 合同 / 客户"
          @keyup.enter="handleSearch"
        />
      </ElFormItem>
      <ElFormItem label="合同">
        <ElSelect
          v-model="searchForm.contract_id"
          clearable
          filterable
          placeholder="全部合同"
          style="width: 220px"
        >
          <ElOption
            v-for="item in contractOptions"
            :key="item.id"
            :label="`${item.contract_no} / ${item.contract_name}`"
            :value="item.id"
          />
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
      <ElFormItem label="状态">
        <ElSelect v-model="searchForm.status" clearable placeholder="全部" style="width: 120px">
          <ElOption v-for="item in planStatusOptions" :key="item.value" v-bind="item" />
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
            v-if="hasAuth('receivable.plan.create')"
            type="primary"
            @click="openPlanDialog('create')"
            >新增计划</ElButton
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
      v-model="planDialogVisible"
      :title="planDialogType === 'create' ? '新增回款计划' : '编辑回款计划'"
      width="760px"
      @closed="resetPlanForm"
    >
      <ElForm ref="planFormRef" :model="planForm" :rules="planRules" label-width="110px">
        <ElRow :gutter="16">
          <ElCol :span="12">
            <ElFormItem label="计划编号">
              <ElInput v-model="planForm.plan_no" placeholder="留空自动生成" />
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem label="合同" prop="contract_id">
              <ElSelect
                v-model="planForm.contract_id"
                filterable
                placeholder="请选择合同"
                @change="handlePlanContractChange"
              >
                <ElOption
                  v-for="item in contractOptions"
                  :key="item.id"
                  :label="`${item.contract_no} / ${item.contract_name}`"
                  :value="item.id"
                />
              </ElSelect>
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem label="负责人" prop="owner_user_id">
              <ElSelect
                v-model="planForm.owner_user_id"
                filterable
                clearable
                placeholder="请选择负责人"
              >
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
            <ElFormItem label="计划名称" prop="plan_name">
              <ElInput v-model="planForm.plan_name" placeholder="请输入计划名称" />
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem label="计划日期">
              <ElDatePicker
                v-model="planForm.plan_date"
                type="date"
                value-format="YYYY-MM-DD"
                class="w-full"
              />
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem label="计划金额" prop="plan_amount">
              <ElInputNumber
                v-model="planForm.plan_amount"
                :min="0"
                :precision="2"
                class="w-full"
              />
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem label="开票金额">
              <ElInputNumber
                v-model="planForm.invoice_amount"
                :min="0"
                :precision="2"
                class="w-full"
              />
            </ElFormItem>
          </ElCol>
          <ElCol :span="24">
            <ElFormItem label="状态" prop="status">
              <ElRadioGroup v-model="planForm.status">
                <ElRadio :value="1">待回款</ElRadio>
                <ElRadio :value="2">部分回款</ElRadio>
                <ElRadio :value="3">已回款</ElRadio>
                <ElRadio :value="4">已作废</ElRadio>
              </ElRadioGroup>
            </ElFormItem>
          </ElCol>
          <ElCol :span="24">
            <ElFormItem label="备注">
              <ElInput
                v-model="planForm.remark"
                type="textarea"
                :rows="3"
                placeholder="请输入备注"
              />
            </ElFormItem>
          </ElCol>
        </ElRow>
      </ElForm>
      <template #footer>
        <ElButton @click="planDialogVisible = false">取消</ElButton>
        <ElButton type="primary" :loading="submitLoading" @click="handlePlanSubmit">确定</ElButton>
      </template>
    </ElDialog>

    <ElDialog
      v-model="recordDialogVisible"
      title="登记回款"
      width="760px"
      @closed="resetRecordForm"
    >
      <ElForm ref="recordFormRef" :model="recordForm" :rules="recordRules" label-width="110px">
        <ElRow :gutter="16">
          <ElCol :span="12">
            <ElFormItem label="回款编号">
              <ElInput v-model="recordForm.record_no" placeholder="留空自动生成" />
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem label="到账日期" prop="receipt_date">
              <ElDatePicker
                v-model="recordForm.receipt_date"
                type="date"
                value-format="YYYY-MM-DD"
                class="w-full"
              />
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem label="回款金额" prop="receipt_amount">
              <ElInputNumber
                v-model="recordForm.receipt_amount"
                :min="0"
                :precision="2"
                class="w-full"
              />
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem label="回款方式">
              <ElInput v-model="recordForm.receipt_method" placeholder="银行转账 / 现金等" />
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem label="付款方">
              <ElInput v-model="recordForm.payer_name" placeholder="请输入付款方" />
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem label="银行流水">
              <ElInput v-model="recordForm.bank_serial_no" placeholder="请输入银行流水号" />
            </ElFormItem>
          </ElCol>
          <ElCol :span="24">
            <ElFormItem label="备注">
              <ElInput
                v-model="recordForm.remark"
                type="textarea"
                :rows="3"
                placeholder="请输入备注"
              />
            </ElFormItem>
          </ElCol>
        </ElRow>
      </ElForm>
      <template #footer>
        <ElButton @click="recordDialogVisible = false">取消</ElButton>
        <ElButton type="primary" :loading="submitLoading" @click="handleRecordSubmit"
          >确定</ElButton
        >
      </template>
    </ElDialog>
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
    createReceivablePlan,
    createReceivableRecord,
    deleteReceivablePlan,
    fetchReceivableOptions,
    fetchReceivablePlanList,
    updateReceivablePlan,
    type ReceivableContractOption,
    type ReceivableCustomerOption,
    type ReceivablePlanFormParams,
    type ReceivablePlanItem,
    type ReceivablePlanStatus,
    type ReceivableRecordFormParams,
    type ReceivableUserOption
  } from '@/api/receivable'

  defineOptions({ name: 'ReceivablePlan' })

  type DialogType = 'create' | 'update'
  type SearchValue<T> = '' | T

  const { hasAuth } = useAuth()
  const planStatusOptions = [
    { label: '待回款', value: 1 },
    { label: '部分回款', value: 2 },
    { label: '已回款', value: 3 },
    { label: '已作废', value: 4 }
  ] as const
  const planStatusMap: Record<
    ReceivablePlanStatus,
    { label: string; type: 'success' | 'warning' | 'primary' | 'danger' }
  > = {
    1: { label: '待回款', type: 'warning' },
    2: { label: '部分回款', type: 'primary' },
    3: { label: '已回款', type: 'success' },
    4: { label: '已作废', type: 'danger' }
  }

  const searchForm = reactive({
    contract_id: '' as SearchValue<number>,
    customer_id: '' as SearchValue<number>,
    status: '' as SearchValue<ReceivablePlanStatus>,
    keyword: ''
  })
  const contractOptions = ref<ReceivableContractOption[]>([])
  const customerOptions = ref<ReceivableCustomerOption[]>([])
  const userOptions = ref<ReceivableUserOption[]>([])
  const planDialogVisible = ref(false)
  const planDialogType = ref<DialogType>('create')
  const recordDialogVisible = ref(false)
  const submitLoading = ref(false)
  const planFormRef = ref<FormInstance>()
  const recordFormRef = ref<FormInstance>()
  const planForm = reactive<ReceivablePlanFormParams>(getDefaultPlanForm())
  const recordForm = reactive<ReceivableRecordFormParams>(getDefaultRecordForm())

  const planRules: FormRules<ReceivablePlanFormParams> = {
    contract_id: [{ required: true, message: '请选择合同', trigger: 'change' }],
    owner_user_id: [{ required: true, message: '请选择负责人', trigger: 'change' }],
    plan_name: [{ required: true, message: '请输入计划名称', trigger: 'blur' }],
    plan_amount: [{ required: true, message: '请输入计划金额', trigger: 'blur' }],
    status: [{ required: true, message: '请选择状态', trigger: 'change' }]
  }
  const recordRules: FormRules<ReceivableRecordFormParams> = {
    receipt_date: [{ required: true, message: '请选择到账日期', trigger: 'change' }],
    receipt_amount: [{ required: true, message: '请输入回款金额', trigger: 'blur' }]
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
      apiFn: fetchReceivablePlanList,
      apiParams: { size: 10 },
      paginationKey: { current: 'page', size: 'size' },
      columnsFactory: () => [
        { prop: 'id', label: 'ID', width: 80 },
        {
          prop: 'plan_no',
          label: '计划信息',
          minWidth: 240,
          formatter: (row: ReceivablePlanItem) =>
            h('div', [
              h('div', { class: 'font-medium' }, row.plan_no),
              h('div', { class: 'text-xs text-gray-400 mt-1' }, row.plan_name),
              h('div', { class: 'text-xs text-gray-400 mt-1' }, `计划日期：${row.plan_date || '-'}`)
            ])
        },
        {
          prop: 'contract_no',
          label: '合同 / 客户',
          minWidth: 240,
          formatter: (row: ReceivablePlanItem) =>
            h('div', [
              h('div', `${row.contract_no} / ${row.contract_name}`),
              h('div', { class: 'text-xs text-gray-400 mt-1' }, row.customer_name || '-')
            ])
        },
        {
          prop: 'progress',
          label: '回款进度',
          minWidth: 180,
          formatter: (row: ReceivablePlanItem) => {
            const total = Number(row.plan_amount || 0)
            const received = Number(row.received_amount || 0)
            const percentage = total > 0 ? Math.min(100, Math.round((received / total) * 100)) : 0
            return h('div', [
              h(ElProgress, { percentage, strokeWidth: 8 }),
              h(
                'div',
                { class: 'text-xs text-gray-400 mt-1' },
                `已收 ${formatMoney(received)} / ${formatMoney(total)}`
              )
            ])
          }
        },
        {
          prop: 'pending_amount',
          label: '待收金额',
          width: 140,
          formatter: (row: ReceivablePlanItem) => formatMoney(row.pending_amount)
        },
        {
          prop: 'status',
          label: '状态',
          width: 110,
          formatter: (row: ReceivablePlanItem) =>
            h(
              ElTag,
              { type: planStatusMap[row.status]?.type || 'warning' },
              () => planStatusMap[row.status]?.label || '-'
            )
        },
        {
          prop: 'created_at',
          label: '创建时间',
          width: 170,
          formatter: (row: ReceivablePlanItem) => formatDateTime(row.created_at)
        },
        {
          prop: 'operation',
          label: '操作',
          width: 220,
          fixed: 'right',
          formatter: (row: ReceivablePlanItem) =>
            h('div', { class: 'flex items-center gap-1 flex-wrap' }, [
              hasAuth('receivable.record.create')
                ? h(
                    ElButton,
                    {
                      size: 'small',
                      link: true,
                      type: 'success',
                      onClick: () => openRecordDialog(row)
                    },
                    () => '登记回款'
                  )
                : null,
              hasAuth('receivable.plan.update')
                ? h(ArtButtonTable, { type: 'edit', onClick: () => openPlanDialog('update', row) })
                : null,
              hasAuth('receivable.plan.delete')
                ? h(ArtButtonTable, { type: 'delete', onClick: () => handlePlanDelete(row) })
                : null
            ])
        }
      ]
    }
  })

  function getDefaultPlanForm(): ReceivablePlanFormParams {
    return {
      plan_no: '',
      contract_id: '',
      owner_user_id: '',
      plan_name: '',
      plan_date: null,
      plan_amount: 0,
      invoice_amount: 0,
      status: 1,
      settlement_status: 0,
      remark: ''
    }
  }

  function getDefaultRecordForm(): ReceivableRecordFormParams {
    return {
      record_no: '',
      contract_id: '',
      owner_user_id: '',
      receivable_plan_id: '',
      receipt_date: getToday(),
      receipt_amount: 0,
      receipt_method: '',
      receipt_account: '',
      payer_name: '',
      bank_serial_no: '',
      status: 1,
      writeoff_status: 1,
      remark: ''
    }
  }

  const loadOptions = async () => {
    const res = await fetchReceivableOptions()
    contractOptions.value = res.contracts || []
    customerOptions.value = res.customers || []
    userOptions.value = res.users || []
  }

  const handleSearch = () => {
    replaceSearchParams({
      ...searchForm,
      contract_id: searchForm.contract_id || undefined,
      customer_id: searchForm.customer_id || undefined,
      status: searchForm.status || undefined
    })
    getData()
  }

  const handleReset = () => {
    Object.assign(searchForm, { contract_id: '', customer_id: '', status: '', keyword: '' })
    resetSearchParams()
    getData()
  }

  const resetPlanForm = () => {
    Object.assign(planForm, getDefaultPlanForm())
    planFormRef.value?.clearValidate()
  }

  const resetRecordForm = () => {
    Object.assign(recordForm, getDefaultRecordForm())
    recordFormRef.value?.clearValidate()
  }

  const handlePlanContractChange = (contractId: number) => {
    const contract = contractOptions.value.find((item) => item.id === contractId)
    if (contract) {
      planForm.owner_user_id = contract.owner_user_id || ''
      planForm.plan_name = planForm.plan_name || `${contract.contract_name}-回款计划`
      planForm.plan_amount = Number(contract.pending_amount || contract.final_amount || 0)
    }
  }

  const openPlanDialog = (type: DialogType, row?: ReceivablePlanItem) => {
    planDialogType.value = type
    planDialogVisible.value = true
    if (row) {
      Object.assign(planForm, {
        id: row.id,
        plan_no: row.plan_no,
        contract_id: row.contract_id,
        owner_user_id: row.owner_user_id,
        plan_name: row.plan_name,
        plan_date: row.plan_date,
        plan_amount: Number(row.plan_amount || 0),
        invoice_amount: Number(row.invoice_amount || 0),
        status: row.status,
        settlement_status: row.settlement_status,
        remark: row.remark
      })
    }
  }

  const openRecordDialog = (row: ReceivablePlanItem) => {
    recordDialogVisible.value = true
    Object.assign(recordForm, getDefaultRecordForm(), {
      receivable_plan_id: row.id,
      receipt_amount: Number(row.pending_amount || row.plan_amount || 0)
    })
  }

  const handlePlanSubmit = async () => {
    await planFormRef.value?.validate()
    const params = {
      ...planForm,
      contract_id: Number(planForm.contract_id || 0),
      owner_user_id: Number(planForm.owner_user_id || 0)
    }
    submitLoading.value = true
    try {
      if (planDialogType.value === 'create') {
        await createReceivablePlan(params)
      } else if (planForm.id) {
        await updateReceivablePlan({ ...params, id: planForm.id })
      }
      planDialogVisible.value = false
      await loadOptions()
      refreshData()
    } finally {
      submitLoading.value = false
    }
  }

  const handleRecordSubmit = async () => {
    await recordFormRef.value?.validate()
    const params = {
      ...recordForm,
      receivable_plan_id: Number(recordForm.receivable_plan_id || 0)
    }
    submitLoading.value = true
    try {
      await createReceivableRecord(params)
      recordDialogVisible.value = false
      await loadOptions()
      refreshData()
    } finally {
      submitLoading.value = false
    }
  }

  const handlePlanDelete = async (row: ReceivablePlanItem) => {
    await ElMessageBox.confirm(`确定删除回款计划「${row.plan_no}」吗？`, '提示', {
      type: 'warning'
    })
    await deleteReceivablePlan({ id: row.id })
    refreshData()
  }

  onMounted(() => {
    loadOptions()
  })
</script>
