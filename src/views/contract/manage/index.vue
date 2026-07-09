<template>
  <div class="contract-page art-full-height flex flex-col">
    <ElForm :inline="true" :model="searchForm" class="mb-3">
      <ElFormItem label="合同编号">
        <ElInput
          v-model="searchForm.contract_no"
          clearable
          placeholder="请输入合同编号"
          @keyup.enter="handleSearch"
        />
      </ElFormItem>
      <ElFormItem label="关键字">
        <ElInput
          v-model="searchForm.keyword"
          clearable
          placeholder="合同名称 / 客户"
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
      <ElFormItem label="合同类型">
        <ElSelect
          v-model="searchForm.contract_type"
          clearable
          placeholder="全部"
          style="width: 130px"
        >
          <ElOption v-for="item in contractTypeOptions" :key="item.value" v-bind="item" />
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
          <ElButton v-if="hasAuth('contract.create')" type="primary" @click="openDialog('create')"
            >新增合同</ElButton
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
      :title="dialogType === 'create' ? '新增合同' : '编辑合同'"
      width="1120px"
      @closed="resetForm"
    >
      <ElForm ref="formRef" :model="form" :rules="rules" label-width="100px">
        <ElRow :gutter="16">
          <ElCol :span="8">
            <ElFormItem label="合同类型" prop="contract_type">
              <ElSelect v-model="form.contract_type" @change="handleContractTypeChange">
                <ElOption v-for="item in contractTypeOptions" :key="item.value" v-bind="item" />
              </ElSelect>
            </ElFormItem>
          </ElCol>
          <ElCol :span="8">
            <ElFormItem label="合同名称" prop="contract_name">
              <ElInput v-model="form.contract_name" placeholder="请输入合同名称" />
            </ElFormItem>
          </ElCol>
          <ElCol :span="8">
            <ElFormItem label="合同编号">
              <ElInput v-model="form.contract_no" placeholder="留空自动生成" />
            </ElFormItem>
          </ElCol>
          <ElCol :span="8">
            <ElFormItem label="客户" prop="customer_id">
              <ElSelect v-model="form.customer_id" filterable clearable placeholder="请选择客户">
                <ElOption
                  v-for="item in customerOptions"
                  :key="item.id"
                  :label="`${item.customer_name} / ${item.customer_code}`"
                  :value="item.id"
                />
              </ElSelect>
            </ElFormItem>
          </ElCol>
          <ElCol :span="8">
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
          <ElCol v-if="!isFrameworkContract" :span="8">
            <ElFormItem label="框架协议">
              <ElSelect
                v-model="form.parent_contract_id"
                filterable
                clearable
                placeholder="可选，选择客户后筛选"
              >
                <ElOption
                  v-for="item in availableFrameworkContracts"
                  :key="item.id"
                  :label="`${item.contract_name} / ${item.contract_no}`"
                  :value="item.id"
                />
              </ElSelect>
            </ElFormItem>
          </ElCol>
          <ElCol :span="8">
            <ElFormItem label="签订日期">
              <ElDatePicker
                v-model="form.sign_date"
                type="date"
                value-format="YYYY-MM-DD"
                class="w-full"
              />
            </ElFormItem>
          </ElCol>
          <ElCol :span="8">
            <ElFormItem :label="isFrameworkContract ? '协议有效期' : '投放周期'">
              <ElDatePicker
                v-model="dateRange"
                type="daterange"
                value-format="YYYY-MM-DD"
                start-placeholder="开始"
                end-placeholder="结束"
                class="w-full"
              />
            </ElFormItem>
          </ElCol>
          <ElCol v-if="!isFrameworkContract" :span="8">
            <ElFormItem label="优惠金额">
              <ElInputNumber
                v-model="form.discount_amount"
                :min="0"
                :precision="2"
                controls-position="right"
                class="number-input"
              />
            </ElFormItem>
          </ElCol>
          <ElCol v-if="!isFrameworkContract" :span="8">
            <ElFormItem label="税率(%)">
              <ElInputNumber
                v-model="form.tax_rate"
                :min="0"
                :precision="2"
                controls-position="right"
                class="number-input"
              />
            </ElFormItem>
          </ElCol>
          <ElCol :span="8">
            <ElFormItem label="状态" prop="status">
              <ElRadioGroup v-model="form.status">
                <ElRadio :value="1">草稿</ElRadio>
                <ElRadio :value="2">执行中</ElRadio>
                <ElRadio :value="3">已完成</ElRadio>
                <ElRadio :value="4">已作废</ElRadio>
              </ElRadioGroup>
            </ElFormItem>
          </ElCol>
          <ElCol v-if="isFrameworkContract" :span="24">
            <ElFormItem label="合作范围">
              <ElInput
                v-model="form.framework_scope"
                type="textarea"
                :rows="4"
                placeholder="请输入框架协议约定的合作范围、价格规则、结算规则等"
              />
            </ElFormItem>
          </ElCol>
          <ElCol v-if="!isFrameworkContract" :span="24">
            <ElFormItem label="产品明细" prop="products">
              <div class="w-full">
                <ElButton type="primary" plain class="mb-2" @click="addProductRow"
                  >添加产品</ElButton
                >
                <ElTable :data="form.products" border>
                  <ElTableColumn label="产品" min-width="240">
                    <template #default="{ row }">
                      <ElSelect
                        v-model="row.product_id"
                        filterable
                        clearable
                        placeholder="请选择产品"
                        @change="handleProductChange(row)"
                      >
                        <ElOption
                          v-for="item in productOptions"
                          :key="item.id"
                          :label="`${item.product_name} / ${item.product_code}`"
                          :value="item.id"
                        />
                      </ElSelect>
                    </template>
                  </ElTableColumn>
                  <ElTableColumn label="单价" width="190">
                    <template #default="{ row }">
                      <ElInputNumber
                        v-model="row.sale_price"
                        :min="0"
                        :precision="2"
                        controls-position="right"
                        class="table-number-input"
                      />
                    </template>
                  </ElTableColumn>
                  <ElTableColumn label="数量" width="190">
                    <template #default="{ row }">
                      <ElInputNumber
                        v-model="row.quantity"
                        :min="0"
                        :precision="2"
                        controls-position="right"
                        class="table-number-input"
                      />
                    </template>
                  </ElTableColumn>
                  <ElTableColumn label="金额" width="140">
                    <template #default="{ row }">{{
                      formatMoney(Number(row.sale_price || 0) * Number(row.quantity || 0))
                    }}</template>
                  </ElTableColumn>
                  <ElTableColumn label="开始" width="245">
                    <template #default="{ row }">
                      <ElDatePicker
                        v-model="row.start_date"
                        type="date"
                        value-format="YYYY-MM-DD"
                        class="w-full"
                      />
                    </template>
                  </ElTableColumn>
                  <ElTableColumn label="结束" width="245">
                    <template #default="{ row }">
                      <ElDatePicker
                        v-model="row.end_date"
                        type="date"
                        value-format="YYYY-MM-DD"
                        class="w-full"
                      />
                    </template>
                  </ElTableColumn>
                  <ElTableColumn label="要求" min-width="200">
                    <template #default="{ row }">
                      <ElInput v-model="row.delivery_requirements" placeholder="履约要求" />
                    </template>
                  </ElTableColumn>
                  <ElTableColumn label="操作" width="80">
                    <template #default="{ $index }">
                      <ElButton link type="danger" @click="removeProductRow($index)">删除</ElButton>
                    </template>
                  </ElTableColumn>
                </ElTable>
              </div>
            </ElFormItem>
          </ElCol>
          <ElCol v-if="!isFrameworkContract" :span="24">
            <ElFormItem label="合同成本">
              <div class="w-full">
                <div class="mb-2 flex items-center justify-between gap-3">
                  <ElButton type="primary" plain @click="addCostRow">添加合同成本</ElButton>
                  <div class="text-sm text-gray-500">
                    成本合计：{{ formatMoney(contractCostTotal) }}
                  </div>
                </div>
                <ElTable :data="form.costs" border>
                  <ElTableColumn label="成本日期" width="245">
                    <template #default="{ row }">
                      <ElDatePicker
                        v-model="row.cost_date"
                        type="date"
                        value-format="YYYY-MM-DD"
                        class="w-full"
                      />
                    </template>
                  </ElTableColumn>
                  <ElTableColumn label="成本类型" width="150">
                    <template #default="{ row }">
                      <ElSelect v-model="row.cost_type" clearable placeholder="请选择">
                        <ElOption v-for="item in costTypeOptions" :key="item.value" v-bind="item" />
                      </ElSelect>
                    </template>
                  </ElTableColumn>
                  <ElTableColumn label="产品名称" min-width="190">
                    <template #default="{ row }">
                      <ElSelect
                        v-model="row.product_name"
                        filterable
                        allow-create
                        clearable
                        placeholder="请选择或输入"
                      >
                        <ElOption
                          v-for="item in productOptions"
                          :key="item.id"
                          :label="item.product_name"
                          :value="item.product_name"
                        />
                      </ElSelect>
                    </template>
                  </ElTableColumn>
                  <ElTableColumn label="成本金额" width="190">
                    <template #default="{ row }">
                      <ElInputNumber
                        v-model="row.amount"
                        :min="0"
                        :precision="2"
                        controls-position="right"
                        class="table-number-input"
                      />
                    </template>
                  </ElTableColumn>
                  <ElTableColumn label="事由" min-width="200">
                    <template #default="{ row }">
                      <ElInput v-model="row.reason" placeholder="请输入事由" />
                    </template>
                  </ElTableColumn>
                  <ElTableColumn label="操作" width="80">
                    <template #default="{ $index }">
                      <ElButton link type="danger" @click="removeCostRow($index)">删除</ElButton>
                    </template>
                  </ElTableColumn>
                </ElTable>
              </div>
            </ElFormItem>
          </ElCol>
          <ElCol v-if="!isFrameworkContract" :span="24">
            <ElFormItem label="回款计划" prop="receivable_plans">
              <div class="w-full">
                <div class="mb-2 flex items-center justify-between gap-3">
                  <ElButton type="primary" plain @click="addReceivablePlanRow"
                    >新增一期回款计划</ElButton
                  >
                  <div class="text-sm text-gray-500">
                    合同最终金额：{{ formatMoney(contractFinalAmount) }}，计划合计：{{
                      formatMoney(receivablePlanTotal)
                    }}，剩余：{{ formatMoney(receivablePlanRemain) }}
                  </div>
                </div>
                <ElTable :data="form.receivable_plans" border>
                  <ElTableColumn label="计划名称" min-width="180">
                    <template #default="{ row, $index }">
                      <ElInput v-model="row.plan_name" :placeholder="`第${$index + 1}期回款`" />
                    </template>
                  </ElTableColumn>
                  <ElTableColumn label="计划日期" width="245">
                    <template #default="{ row }">
                      <ElDatePicker
                        v-model="row.plan_date"
                        type="date"
                        value-format="YYYY-MM-DD"
                        class="w-full"
                      />
                    </template>
                  </ElTableColumn>
                  <ElTableColumn label="比例(%)" width="190">
                    <template #default="{ row }">
                      <ElInputNumber
                        v-model="row.plan_ratio"
                        :min="0"
                        :precision="2"
                        controls-position="right"
                        class="plan-number-input"
                        @change="handlePlanRatioChange(row)"
                      />
                    </template>
                  </ElTableColumn>
                  <ElTableColumn label="回款金额" width="190">
                    <template #default="{ row }">
                      <ElInputNumber
                        v-model="row.plan_amount"
                        :min="0"
                        :precision="2"
                        controls-position="right"
                        class="table-number-input"
                        @change="handlePlanAmountChange(row)"
                      />
                    </template>
                  </ElTableColumn>
                  <ElTableColumn label="开票金额" width="190">
                    <template #default="{ row }">
                      <ElInputNumber
                        v-model="row.invoice_amount"
                        :min="0"
                        :precision="2"
                        controls-position="right"
                        class="table-number-input"
                      />
                    </template>
                  </ElTableColumn>
                  <ElTableColumn label="备注" min-width="180">
                    <template #default="{ row }">
                      <ElInput v-model="row.remark" placeholder="备注" />
                    </template>
                  </ElTableColumn>
                  <ElTableColumn label="操作" width="80">
                    <template #default="{ $index }">
                      <ElButton link type="danger" @click="removeReceivablePlanRow($index)"
                        >删除</ElButton
                      >
                    </template>
                  </ElTableColumn>
                </ElTable>
              </div>
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

    <ElDrawer v-model="productDrawerVisible" title="合同产品明细" size="900px">
      <ElTable :data="currentProducts" border>
        <ElTableColumn prop="product_name" label="产品名称" min-width="160" />
        <ElTableColumn prop="media_name" label="媒体" width="120" />
        <ElTableColumn prop="ad_type" label="广告形式" width="120" />
        <ElTableColumn prop="quantity" label="数量" width="100" />
        <ElTableColumn prop="sale_price" label="单价" width="120" />
        <ElTableColumn label="金额" width="130">
          <template #default="{ row }">{{ formatMoney(row.amount) }}</template>
        </ElTableColumn>
        <ElTableColumn prop="delivery_requirements" label="履约要求" min-width="180" />
      </ElTable>
    </ElDrawer>
  </div>
</template>

<script setup lang="ts">
  import { h } from 'vue'
  import { useRouter } from 'vue-router'
  import {
    ElButton,
    ElMessage,
    ElMessageBox,
    ElTag,
    type FormInstance,
    type FormRules
  } from 'element-plus'
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import { useAuth } from '@/hooks/core/useAuth'
  import { useTable } from '@/hooks/core/useTable'
  import {
    createContract,
    deleteContract,
    fetchContractDetail,
    fetchContractList,
    fetchContractOptions,
    updateContract,
    type ContractCostFormParams,
    type ContractCustomerOption,
    type ContractFormParams,
    type ContractItem,
    type ContractProductFormParams,
    type ContractProductItem,
    type ContractProductOption,
    type ContractReceivablePlanFormParams,
    type ContractStatus,
    type ContractType,
    type ContractUserOption,
    type FrameworkContractOption
  } from '@/api/contract'

  defineOptions({ name: 'ContractManage' })

  type DialogType = 'create' | 'update'
  type SearchValue<T> = '' | T
  type FormSelectValue = '' | number

  interface ContractFormState
    extends Omit<
      ContractFormParams,
      | 'customer_id'
      | 'owner_user_id'
      | 'parent_contract_id'
      | 'products'
      | 'costs'
      | 'receivable_plans'
    > {
    customer_id: FormSelectValue
    owner_user_id: FormSelectValue
    parent_contract_id: FormSelectValue
    products: ContractProductFormState[]
    costs: ContractCostFormState[]
    receivable_plans: ContractReceivablePlanFormParams[]
  }

  interface ContractProductFormState extends Omit<ContractProductFormParams, 'product_id'> {
    product_id: FormSelectValue
  }

  interface ContractCostFormState extends Omit<ContractCostFormParams, 'contract_product_id'> {
    contract_product_id: FormSelectValue
  }

  const { hasAuth } = useAuth()
  const router = useRouter()
  const contractTypeOptions = [
    { label: '销售合同', value: 1 },
    { label: '框架协议', value: 2 },
    { label: '补充协议', value: 3 }
  ] as const
  const contractTypeMap: Record<ContractType, string> = {
    1: '销售合同',
    2: '框架协议',
    3: '补充协议'
  }
  const contractTypeTagMap: Record<ContractType, 'primary' | 'success' | 'warning'> = {
    1: 'primary',
    2: 'success',
    3: 'warning'
  }
  const statusOptions = [
    { label: '草稿', value: 1 },
    { label: '执行中', value: 2 },
    { label: '已完成', value: 3 },
    { label: '已作废', value: 4 }
  ] as const
  const statusMap: Record<
    ContractStatus,
    { label: string; type: 'success' | 'warning' | 'primary' | 'danger' }
  > = {
    1: { label: '草稿', type: 'warning' },
    2: { label: '执行中', type: 'primary' },
    3: { label: '已完成', type: 'success' },
    4: { label: '已作废', type: 'danger' }
  }

  const costTypeOptions = [
    { label: '餐饮费', value: '餐饮费' },
    { label: '采购费', value: '采购费' },
    { label: '制作费', value: '制作费' },
    { label: '服务费', value: '服务费' },
    { label: '其他', value: '其他' }
  ]

  const searchForm = reactive({
    contract_no: '',
    customer_id: '' as SearchValue<number>,
    owner_user_id: '' as SearchValue<number>,
    contract_type: '' as SearchValue<ContractType>,
    status: '' as SearchValue<ContractStatus>,
    keyword: ''
  })
  const customerOptions = ref<ContractCustomerOption[]>([])
  const productOptions = ref<ContractProductOption[]>([])
  const userOptions = ref<ContractUserOption[]>([])
  const frameworkContractOptions = ref<FrameworkContractOption[]>([])
  const dialogVisible = ref(false)
  const dialogType = ref<DialogType>('create')
  const submitLoading = ref(false)
  const formRef = ref<FormInstance>()
  const form = reactive<ContractFormState>(getDefaultForm())
  const dateRange = ref<[string, string] | null>(null)
  const productDrawerVisible = ref(false)
  const currentProducts = ref<ContractProductItem[]>([])

  const rules: FormRules<ContractFormState> = {
    contract_name: [{ required: true, message: '请输入合同名称', trigger: 'blur' }],
    contract_type: [{ required: true, message: '请选择合同类型', trigger: 'change' }],
    customer_id: [{ required: true, message: '请选择客户', trigger: 'change' }],
    owner_user_id: [{ required: true, message: '请选择负责人', trigger: 'change' }],
    status: [{ required: true, message: '请选择状态', trigger: 'change' }],
    products: [{ required: true, message: '请添加产品明细', trigger: 'change' }]
  }

  const formatMoney = (value: number | string) =>
    Number(value || 0).toLocaleString('zh-CN', {
      style: 'currency',
      currency: 'CNY',
      minimumFractionDigits: 2
    })
  const formatDateTime = (timestamp: number) =>
    timestamp ? new Date(timestamp * 1000).toLocaleString() : '-'
  const roundMoney = (value: number) => Math.round(value * 100) / 100
  const isFrameworkContract = computed(() => form.contract_type === 2)
  const availableFrameworkContracts = computed(() =>
    frameworkContractOptions.value.filter(
      (item) =>
        (!form.customer_id || item.customer_id === Number(form.customer_id)) &&
        item.id !== Number(form.id || 0)
    )
  )
  const contractProductAmount = computed(() =>
    roundMoney(
      form.products.reduce(
        (total, item) => total + Number(item.sale_price || 0) * Number(item.quantity || 0),
        0
      )
    )
  )
  const contractFinalAmount = computed(() => {
    const discounted = Math.max(0, contractProductAmount.value - Number(form.discount_amount || 0))
    return roundMoney(discounted + (discounted * Number(form.tax_rate || 0)) / 100)
  })
  const receivablePlanTotal = computed(() =>
    roundMoney(
      form.receivable_plans.reduce((total, item) => total + Number(item.plan_amount || 0), 0)
    )
  )
  const contractCostTotal = computed(() =>
    roundMoney(form.costs.reduce((total, item) => total + Number(item.amount || 0), 0))
  )
  const receivablePlanRemain = computed(() =>
    roundMoney(contractFinalAmount.value - receivablePlanTotal.value)
  )

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
      apiFn: fetchContractList,
      apiParams: { size: 10 },
      paginationKey: { current: 'page', size: 'size' },
      columnsFactory: () => [
        { prop: 'id', label: 'ID', width: 80 },
        {
          prop: 'contract_no',
          label: '合同信息',
          minWidth: 240,
          formatter: (row: ContractItem) =>
            h('div', [
              h('div', { class: 'font-medium' }, row.contract_no),
              h('div', { class: 'text-xs text-gray-400 mt-1' }, row.contract_name),
              h('div', { class: 'text-xs text-gray-400 mt-1' }, `负责人：${row.owner_name || '-'}`)
            ])
        },
        {
          prop: 'customer_name',
          label: '客户',
          minWidth: 180,
          formatter: (row: ContractItem) =>
            h('div', [
              h('div', row.customer_name || '-'),
              h('div', { class: 'text-xs text-gray-400 mt-1' }, row.customer_code || '-')
            ])
        },
        {
          prop: 'contract_type',
          label: '类型',
          width: 110,
          formatter: (row: ContractItem) =>
            h(
              ElTag,
              { type: contractTypeTagMap[row.contract_type] || 'primary' },
              () => contractTypeMap[row.contract_type] || '-'
            )
        },
        {
          prop: 'amount',
          label: '金额',
          minWidth: 190,
          formatter: (row: ContractItem) =>
            h('div', [
              h('div', `合同：${formatMoney(row.final_amount)}`),
              h(
                'div',
                { class: 'text-xs text-gray-400 mt-1' },
                `已回款：${formatMoney(row.received_amount)}`
              ),
              h(
                'div',
                { class: 'text-xs text-gray-400 mt-1' },
                `待回款：${formatMoney(row.pending_amount)}`
              )
            ])
        },
        {
          prop: 'date',
          label: '周期',
          minWidth: 170,
          formatter: (row: ContractItem) => `${row.start_date || '-'} 至 ${row.end_date || '-'}`
        },
        {
          prop: 'status',
          label: '状态',
          width: 100,
          formatter: (row: ContractItem) =>
            h(
              ElTag,
              { type: statusMap[row.status]?.type || 'warning' },
              () => statusMap[row.status]?.label || '-'
            )
        },
        {
          prop: 'created_at',
          label: '创建时间',
          width: 170,
          formatter: (row: ContractItem) => formatDateTime(row.created_at)
        },
        {
          prop: 'operation',
          label: '操作',
          width: 190,
          fixed: 'right',
          formatter: (row: ContractItem) =>
            h('div', { class: 'flex items-center gap-1 flex-wrap' }, [
              h(ArtButtonTable, {
                type: 'view',
                icon: 'ri:file-list-3-line',
                onClick: () => openDetailInNewTab(row.id)
              }),
              h(ArtButtonTable, {
                type: 'view',
                icon: 'ri:archive-stack-line',
                onClick: () => openProductDrawer(row)
              }),
              hasAuth('contract.update')
                ? h(ArtButtonTable, { type: 'edit', onClick: () => openDialog('update', row) })
                : null,
              hasAuth('contract.delete')
                ? h(ArtButtonTable, { type: 'delete', onClick: () => handleDelete(row) })
                : null
            ])
        }
      ]
    }
  })

  function getDefaultForm(): ContractFormState {
    return {
      contract_no: '',
      contract_name: '',
      customer_id: '',
      owner_user_id: '',
      contract_type: 1,
      parent_contract_id: '',
      sign_date: null,
      start_date: null,
      end_date: null,
      discount_amount: 0,
      tax_rate: 0,
      invoice_amount: 0,
      status: 1,
      approval_status: 0,
      archive_status: 0,
      framework_scope: '',
      remark: '',
      products: [],
      costs: [],
      receivable_plans: []
    }
  }

  function getDefaultProduct(): ContractProductFormState {
    return {
      product_id: '',
      sale_price: 0,
      quantity: 1,
      start_date: null,
      end_date: null,
      delivery_requirements: '',
      sort: 0
    }
  }

  function getDefaultCost(): ContractCostFormState {
    return {
      contract_product_id: '',
      cost_date: null,
      cost_type: '',
      product_name: '',
      amount: 0,
      reason: '',
      remark: ''
    }
  }

  function getDefaultReceivablePlan(
    index = form.receivable_plans.length
  ): ContractReceivablePlanFormParams {
    const amount = index === 0 ? contractFinalAmount.value : Math.max(0, receivablePlanRemain.value)
    const ratio =
      contractFinalAmount.value > 0 ? roundMoney((amount / contractFinalAmount.value) * 100) : 100
    return {
      plan_name: `第${index + 1}期回款`,
      plan_date: null,
      plan_ratio: ratio,
      plan_amount: amount,
      invoice_amount: 0,
      remark: ''
    }
  }

  const buildSubmitParams = (): ContractFormParams => ({
    ...form,
    customer_id: Number(form.customer_id || 0),
    owner_user_id: Number(form.owner_user_id || 0),
    parent_contract_id: isFrameworkContract.value ? 0 : Number(form.parent_contract_id || 0),
    products: isFrameworkContract.value
      ? []
      : form.products.map((item) => ({ ...item, product_id: Number(item.product_id || 0) })),
    costs: isFrameworkContract.value
      ? []
      : form.costs.map((item) => ({
          ...item,
          contract_product_id: Number(item.contract_product_id || 0),
          amount: Number(item.amount || 0)
        })),
    receivable_plans: isFrameworkContract.value
      ? []
      : form.receivable_plans.map((item) => ({
          ...item,
          plan_amount: Number(item.plan_amount || 0),
          plan_ratio: Number(item.plan_ratio || 0),
          invoice_amount: Number(item.invoice_amount || 0)
        }))
  })

  const loadOptions = async () => {
    const res = await fetchContractOptions()
    customerOptions.value = res.customers || []
    productOptions.value = res.products || []
    userOptions.value = res.users || []
    frameworkContractOptions.value = res.framework_contracts || []
  }

  const handleSearch = () => {
    replaceSearchParams({
      ...searchForm,
      customer_id: searchForm.customer_id || undefined,
      owner_user_id: searchForm.owner_user_id || undefined,
      contract_type: searchForm.contract_type || undefined,
      status: searchForm.status || undefined
    })
    getData()
  }

  const handleReset = () => {
    Object.assign(searchForm, {
      contract_no: '',
      customer_id: '',
      owner_user_id: '',
      contract_type: '',
      status: '',
      keyword: ''
    })
    resetSearchParams()
    getData()
  }

  const resetForm = () => {
    Object.assign(form, getDefaultForm())
    dateRange.value = null
    formRef.value?.clearValidate()
  }

  const addProductRow = () => form.products.push(getDefaultProduct())
  const removeProductRow = (index: number) => form.products.splice(index, 1)
  const addCostRow = () => form.costs.push(getDefaultCost())
  const removeCostRow = (index: number) => form.costs.splice(index, 1)
  const addReceivablePlanRow = () => form.receivable_plans.push(getDefaultReceivablePlan())
  const removeReceivablePlanRow = (index: number) => form.receivable_plans.splice(index, 1)

  const handleProductChange = (row: ContractProductFormState) => {
    const product = productOptions.value.find((item) => item.id === row.product_id)
    if (product) {
      row.sale_price = Number(product.sale_price || 0)
    }
  }

  const handlePlanRatioChange = (row: ContractReceivablePlanFormParams) => {
    row.plan_amount = roundMoney((contractFinalAmount.value * Number(row.plan_ratio || 0)) / 100)
  }

  const handlePlanAmountChange = (row: ContractReceivablePlanFormParams) => {
    row.plan_ratio =
      contractFinalAmount.value > 0
        ? roundMoney((Number(row.plan_amount || 0) / contractFinalAmount.value) * 100)
        : 0
  }

  const handleContractTypeChange = () => {
    if (isFrameworkContract.value) {
      form.parent_contract_id = ''
      form.discount_amount = 0
      form.tax_rate = 0
      form.invoice_amount = 0
      form.products = []
      form.costs = []
      form.receivable_plans = []
      return
    }
    if (form.products.length === 0) addProductRow()
    if (form.receivable_plans.length === 0) addReceivablePlanRow()
  }

  const syncSinglePlanWithFinalAmount = () => {
    if (isFrameworkContract.value) return
    if (form.receivable_plans.length !== 1) return
    const row = form.receivable_plans[0]
    if (Number(row.plan_ratio || 0) === 100 || Number(row.plan_amount || 0) === 0) {
      row.plan_ratio = 100
      row.plan_amount = contractFinalAmount.value
    }
  }

  const openDialog = async (type: DialogType, row?: ContractItem) => {
    dialogType.value = type
    dialogVisible.value = true
    if (type === 'create') {
      handleContractTypeChange()
      return
    }
    if (row) {
      const detail = await fetchContractDetail({ id: row.id })
      Object.assign(form, {
        id: detail.id,
        contract_no: detail.contract_no,
        contract_name: detail.contract_name,
        customer_id: detail.customer_id,
        owner_user_id: detail.owner_user_id,
        contract_type: detail.contract_type,
        parent_contract_id: detail.parent_contract_id || '',
        sign_date: detail.sign_date,
        start_date: detail.start_date,
        end_date: detail.end_date,
        discount_amount: Number(detail.discount_amount || 0),
        tax_rate: Number(detail.tax_rate || 0),
        invoice_amount: Number(detail.invoice_amount || 0),
        status: detail.status,
        approval_status: detail.approval_status,
        archive_status: detail.archive_status,
        framework_scope: detail.framework_scope,
        remark: detail.remark,
        products: detail.products.map((item) => ({
          id: item.id,
          product_id: item.product_id,
          sale_price: Number(item.sale_price || 0),
          quantity: Number(item.quantity || 0),
          start_date: item.start_date,
          end_date: item.end_date,
          delivery_requirements: item.delivery_requirements,
          sort: item.sort
        })),
        costs: detail.costs.map((item) => ({
          id: item.id,
          contract_product_id: item.contract_product_id || '',
          cost_date: item.cost_date,
          cost_type: item.cost_type,
          product_name: item.product_name,
          amount: Number(item.amount || 0),
          reason: item.reason,
          remark: item.remark
        })),
        receivable_plans: detail.receivable_plans.map((item) => ({
          id: item.id,
          plan_name: item.plan_name,
          plan_date: item.plan_date,
          plan_ratio:
            Number(detail.final_amount || 0) > 0
              ? roundMoney((Number(item.plan_amount || 0) / Number(detail.final_amount || 0)) * 100)
              : 0,
          plan_amount: Number(item.plan_amount || 0),
          invoice_amount: Number(item.invoice_amount || 0),
          remark: item.remark
        }))
      })
      dateRange.value =
        detail.start_date && detail.end_date ? [detail.start_date, detail.end_date] : null
      if (!isFrameworkContract.value && form.receivable_plans.length === 0) addReceivablePlanRow()
    }
  }

  const openProductDrawer = async (row: ContractItem) => {
    const detail = await fetchContractDetail({ id: row.id })
    currentProducts.value = detail.products || []
    productDrawerVisible.value = true
  }

  const openDetailInNewTab = (id: number) => {
    const target = router.resolve({ path: '/contract/detail', query: { id } })
    window.open(target.href, '_blank', 'noopener')
  }

  const handleSubmit = async () => {
    await formRef.value?.validate()
    if (!isFrameworkContract.value) {
      if (
        form.products.length === 0 ||
        form.products.some((item) => !item.product_id || Number(item.quantity) <= 0)
      )
        return
      if (form.costs.some((item) => !item.cost_type || Number(item.amount || 0) <= 0)) {
        ElMessage.warning('请完善合同成本类型和金额')
        return
      }
      if (form.receivable_plans.length === 0) {
        ElMessage.warning('请至少添加一期回款计划')
        return
      }
      if (
        form.receivable_plans.some(
          (item) => !item.plan_name || !item.plan_date || Number(item.plan_amount || 0) <= 0
        )
      ) {
        ElMessage.warning('请完善回款计划名称、日期和金额')
        return
      }
      if (
        form.receivable_plans.some(
          (item) => Number(item.invoice_amount || 0) > Number(item.plan_amount || 0)
        )
      ) {
        ElMessage.warning('开票金额不能大于本期回款金额')
        return
      }
      if (Math.abs(receivablePlanRemain.value) > 0.01) {
        ElMessage.warning('回款计划总金额必须等于合同最终金额')
        return
      }
    }
    form.start_date = dateRange.value?.[0] || null
    form.end_date = dateRange.value?.[1] || null
    const params = buildSubmitParams()
    submitLoading.value = true
    try {
      if (dialogType.value === 'create') {
        await createContract(params)
      } else if (form.id) {
        await updateContract({ ...params, id: form.id })
      }
      dialogVisible.value = false
      refreshData()
    } finally {
      submitLoading.value = false
    }
  }

  const handleDelete = async (row: ContractItem) => {
    await ElMessageBox.confirm(`确定删除合同「${row.contract_no}」吗？`, '提示', {
      type: 'warning'
    })
    await deleteContract({ id: row.id })
    refreshData()
  }

  onMounted(() => {
    loadOptions()
  })

  watch(contractFinalAmount, syncSinglePlanWithFinalAmount)
  watch(
    () => form.customer_id,
    () => {
      if (
        form.parent_contract_id &&
        !availableFrameworkContracts.value.some(
          (item) => item.id === Number(form.parent_contract_id)
        )
      ) {
        form.parent_contract_id = ''
      }
    }
  )
</script>

<style scoped lang="scss">
  .number-input {
    width: 170px;
  }

  .table-number-input {
    width: 160px;
  }

  .plan-number-input {
    width: 140px;
  }
</style>
