<template>
  <div class="receivable-record-page art-full-height flex flex-col">
    <ElForm :inline="true" :model="searchForm" class="mb-3">
      <ElFormItem label="关键字">
        <ElInput
          v-model="searchForm.keyword"
          clearable
          placeholder="记录 / 合同 / 客户 / 流水"
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
      <ElFormItem>
        <ElButton type="primary" @click="handleSearch">查询</ElButton>
        <ElButton @click="handleReset">重置</ElButton>
      </ElFormItem>
    </ElForm>

    <ElCard class="art-table-card">
      <ArtTableHeader v-model:columns="columnChecks" :loading="loading" @refresh="refreshData">
        <template #left>
          <ElButton
            v-if="hasAuth('receivable.record.create')"
            type="primary"
            @click="openDialog('create')"
            >新增回款记录</ElButton
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
      :title="dialogType === 'create' ? '新增回款记录' : '编辑回款记录'"
      width="760px"
      @closed="resetForm"
    >
      <ElForm ref="formRef" :model="form" :rules="rules" label-width="110px">
        <ElRow :gutter="16">
          <ElCol :span="12">
            <ElFormItem label="记录编号">
              <ElInput v-model="form.record_no" placeholder="留空自动生成" />
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem label="回款计划" prop="receivable_plan_id">
              <ElSelect
                v-model="form.receivable_plan_id"
                filterable
                placeholder="请选择回款计划"
                @change="handlePlanChange"
              >
                <ElOption
                  v-for="item in filteredPlanOptions"
                  :key="item.id"
                  :label="`${item.plan_no} / ${item.plan_name}`"
                  :value="item.id"
                />
              </ElSelect>
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem label="合同" prop="contract_id">
              <ElSelect
                v-model="form.contract_id"
                filterable
                placeholder="请选择合同"
                @change="handleContractChange"
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
                v-model="form.owner_user_id"
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
            <ElFormItem label="到账日期" prop="receipt_date">
              <ElDatePicker
                v-model="form.receipt_date"
                type="date"
                value-format="YYYY-MM-DD"
                class="w-full"
              />
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem label="回款金额" prop="receipt_amount">
              <ElInputNumber v-model="form.receipt_amount" :min="0" :precision="2" class="w-full" />
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem label="回款方式">
              <ElInput v-model="form.receipt_method" placeholder="银行转账 / 现金等" />
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem label="付款方">
              <ElInput v-model="form.payer_name" placeholder="请输入付款方" />
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem label="回款账户">
              <ElInput v-model="form.receipt_account" placeholder="请输入回款账户" />
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem label="银行流水">
              <ElInput v-model="form.bank_serial_no" placeholder="请输入银行流水号" />
            </ElFormItem>
          </ElCol>
          <ElCol :span="24">
            <ElFormItem label="状态">
              <ElRadioGroup v-model="form.status">
                <ElRadio :value="1">有效</ElRadio>
                <ElRadio :value="2">作废</ElRadio>
              </ElRadioGroup>
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
  import { useAuth } from '@/hooks/core/useAuth'
  import { useTable } from '@/hooks/core/useTable'
  import {
    createReceivableRecord,
    deleteReceivableRecord,
    fetchReceivableOptions,
    fetchReceivablePlanList,
    fetchReceivableRecordList,
    updateReceivableRecord,
    type ReceivableContractOption,
    type ReceivablePlanItem,
    type ReceivableRecordFormParams,
    type ReceivableRecordItem,
    type ReceivableUserOption
  } from '@/api/receivable'

  defineOptions({ name: 'ReceivableRecord' })

  type DialogType = 'create' | 'update'
  type SearchValue<T> = '' | T

  const { hasAuth } = useAuth()
  const searchForm = reactive({
    contract_id: '' as SearchValue<number>,
    keyword: ''
  })
  const contractOptions = ref<ReceivableContractOption[]>([])
  const userOptions = ref<ReceivableUserOption[]>([])
  const planOptions = ref<ReceivablePlanItem[]>([])
  const dialogVisible = ref(false)
  const dialogType = ref<DialogType>('create')
  const submitLoading = ref(false)
  const formRef = ref<FormInstance>()
  const form = reactive<ReceivableRecordFormParams>(getDefaultForm())

  const rules: FormRules<ReceivableRecordFormParams> = {
    contract_id: [{ required: true, message: '请选择合同', trigger: 'change' }],
    owner_user_id: [{ required: true, message: '请选择负责人', trigger: 'change' }],
    receivable_plan_id: [{ required: true, message: '请选择回款计划', trigger: 'change' }],
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
  const filteredPlanOptions = computed(() => {
    if (!form.contract_id) return planOptions.value
    return planOptions.value.filter((item) => item.contract_id === form.contract_id)
  })

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
      apiFn: fetchReceivableRecordList,
      apiParams: { size: 10 },
      paginationKey: { current: 'page', size: 'size' },
      columnsFactory: () => [
        { prop: 'id', label: 'ID', width: 80 },
        {
          prop: 'record_no',
          label: '回款记录',
          minWidth: 220,
          formatter: (row: ReceivableRecordItem) =>
            h('div', [
              h('div', { class: 'font-medium' }, row.record_no),
              h(
                'div',
                { class: 'text-xs text-gray-400 mt-1' },
                `到账日期：${row.receipt_date || '-'}`
              )
            ])
        },
        {
          prop: 'contract_no',
          label: '合同 / 计划',
          minWidth: 260,
          formatter: (row: ReceivableRecordItem) =>
            h('div', [
              h('div', `${row.contract_no} / ${row.contract_name}`),
              h('div', { class: 'text-xs text-gray-400 mt-1' }, `${row.plan_no} / ${row.plan_name}`)
            ])
        },
        { prop: 'customer_name', label: '客户', minWidth: 150 },
        {
          prop: 'receipt_amount',
          label: '回款金额',
          width: 140,
          formatter: (row: ReceivableRecordItem) => formatMoney(row.receipt_amount)
        },
        { prop: 'receipt_method', label: '方式', width: 120 },
        { prop: 'payer_name', label: '付款方', minWidth: 150 },
        {
          prop: 'status',
          label: '状态',
          width: 90,
          formatter: (row: ReceivableRecordItem) =>
            h(ElTag, { type: row.status === 1 ? 'success' : 'danger' }, () =>
              row.status === 1 ? '有效' : '作废'
            )
        },
        {
          prop: 'created_at',
          label: '创建时间',
          width: 170,
          formatter: (row: ReceivableRecordItem) => formatDateTime(row.created_at)
        },
        {
          prop: 'operation',
          label: '操作',
          width: 140,
          fixed: 'right',
          formatter: (row: ReceivableRecordItem) =>
            h('div', { class: 'flex items-center gap-1' }, [
              hasAuth('receivable.record.update')
                ? h(ArtButtonTable, { type: 'edit', onClick: () => openDialog('update', row) })
                : null,
              hasAuth('receivable.record.delete')
                ? h(ArtButtonTable, { type: 'delete', onClick: () => handleDelete(row) })
                : null
            ])
        }
      ]
    }
  })

  function getDefaultForm(): ReceivableRecordFormParams {
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
    const [options, plans] = await Promise.all([
      fetchReceivableOptions(),
      fetchReceivablePlanList({ page: 1, size: 500 })
    ])
    contractOptions.value = options.contracts || []
    userOptions.value = options.users || []
    planOptions.value = plans.records || []
  }

  const handleSearch = () => {
    replaceSearchParams({ ...searchForm, contract_id: searchForm.contract_id || undefined })
    getData()
  }

  const handleReset = () => {
    Object.assign(searchForm, { contract_id: '', keyword: '' })
    resetSearchParams()
    getData()
  }

  const resetForm = () => {
    Object.assign(form, getDefaultForm())
    formRef.value?.clearValidate()
  }

  const handleContractChange = (contractId: number) => {
    const contract = contractOptions.value.find((item) => item.id === contractId)
    form.owner_user_id = contract?.owner_user_id || ''
    if (form.receivable_plan_id) {
      const plan = planOptions.value.find((item) => item.id === form.receivable_plan_id)
      if (plan && plan.contract_id !== contractId) {
        form.receivable_plan_id = ''
      }
    }
  }

  const handlePlanChange = (planId: number) => {
    const plan = planOptions.value.find((item) => item.id === planId)
    if (!plan) return
    form.contract_id = plan.contract_id
    form.owner_user_id = plan.owner_user_id || ''
    form.receipt_amount = Number(plan.pending_amount || plan.plan_amount || 0)
  }

  const openDialog = (type: DialogType, row?: ReceivableRecordItem) => {
    dialogType.value = type
    dialogVisible.value = true
    if (row) {
      Object.assign(form, {
        id: row.id,
        record_no: row.record_no,
        contract_id: row.contract_id,
        owner_user_id: row.owner_user_id,
        receivable_plan_id: row.receivable_plan_id,
        receipt_date: row.receipt_date,
        receipt_amount: Number(row.receipt_amount || 0),
        receipt_method: row.receipt_method,
        receipt_account: row.receipt_account,
        payer_name: row.payer_name,
        bank_serial_no: row.bank_serial_no,
        status: row.status,
        writeoff_status: row.writeoff_status,
        remark: row.remark
      })
    }
  }

  const handleSubmit = async () => {
    await formRef.value?.validate()
    const params = {
      ...form,
      contract_id: Number(form.contract_id || 0),
      owner_user_id: Number(form.owner_user_id || 0),
      receivable_plan_id: Number(form.receivable_plan_id || 0)
    }
    submitLoading.value = true
    try {
      if (dialogType.value === 'create') {
        await createReceivableRecord(params)
      } else if (form.id) {
        await updateReceivableRecord({ ...params, id: form.id })
      }
      dialogVisible.value = false
      await loadOptions()
      refreshData()
    } finally {
      submitLoading.value = false
    }
  }

  const handleDelete = async (row: ReceivableRecordItem) => {
    await ElMessageBox.confirm(`确定删除回款记录「${row.record_no}」吗？`, '提示', {
      type: 'warning'
    })
    await deleteReceivableRecord({ id: row.id })
    await loadOptions()
    refreshData()
  }

  onMounted(() => {
    loadOptions()
  })
</script>
