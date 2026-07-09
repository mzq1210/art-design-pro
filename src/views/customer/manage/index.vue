<template>
  <div class="customer-page art-full-height flex flex-col">
    <ElForm :inline="true" :model="searchForm" class="mb-3">
      <ElFormItem label="客户名称">
        <ElInput
          v-model="searchForm.customer_name"
          clearable
          placeholder="请输入客户名称"
          @keyup.enter="handleSearch"
        />
      </ElFormItem>

      <ElFormItem label="客户编码">
        <ElInput
          v-model="searchForm.customer_code"
          clearable
          placeholder="请输入客户编码"
          @keyup.enter="handleSearch"
        />
      </ElFormItem>

      <ElFormItem label="客户类型">
        <ElSelect
          v-model="searchForm.customer_type"
          clearable
          placeholder="全部"
          style="width: 130px"
        >
          <ElOption v-for="item in customerTypeOptions" :key="item.value" v-bind="item" />
        </ElSelect>
      </ElFormItem>

      <ElFormItem label="客户等级">
        <ElSelect v-model="searchForm.level" clearable placeholder="全部" style="width: 120px">
          <ElOption v-for="item in levelOptions" :key="item.value" v-bind="item" />
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

    <div class="summary-grid mb-3">
      <div class="summary-item">
        <span>当前页客户</span>
        <strong>{{ data.length }}</strong>
      </div>
      <div class="summary-item">
        <span>合作中</span>
        <strong>{{ cooperatingCount }}</strong>
      </div>
      <div class="summary-item">
        <span>签约金额</span>
        <strong>{{ formatMoney(pageSignedAmount) }}</strong>
      </div>
      <div class="summary-item">
        <span>回款金额</span>
        <strong>{{ formatMoney(pageReceivedAmount) }}</strong>
      </div>
    </div>

    <ElCard class="art-table-card">
      <ArtTableHeader v-model:columns="columnChecks" :loading="loading" @refresh="refreshData">
        <template #left>
          <ElButton
            v-if="hasAuth('customer.create')"
            type="primary"
            @click="openCustomerDialog('create')"
          >
            新增客户
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
      v-model="customerDialogVisible"
      :title="customerDialogType === 'create' ? '新增客户' : '编辑客户'"
      width="860px"
      @closed="resetCustomerForm"
    >
      <ElForm
        ref="customerFormRef"
        :model="customerForm"
        :rules="customerRules"
        label-width="110px"
      >
        <ElDivider content-position="left">客户基础信息</ElDivider>
        <div class="form-grid">
          <ElFormItem label="客户名称" prop="customer_name">
            <ElInput v-model="customerForm.customer_name" placeholder="请输入客户名称" />
          </ElFormItem>
          <ElFormItem label="客户编码">
            <ElInput v-model="customerForm.customer_code" placeholder="留空自动生成" />
          </ElFormItem>
          <ElFormItem label="客户类型" prop="customer_type">
            <ElSelect v-model="customerForm.customer_type">
              <ElOption v-for="item in customerTypeOptions" :key="item.value" v-bind="item" />
            </ElSelect>
          </ElFormItem>
          <ElFormItem label="客户等级" prop="level">
            <ElSelect v-model="customerForm.level">
              <ElOption v-for="item in levelOptions" :key="item.value" v-bind="item" />
            </ElSelect>
          </ElFormItem>
          <ElFormItem label="合作状态" prop="status">
            <ElSelect v-model="customerForm.status">
              <ElOption v-for="item in statusOptions" :key="item.value" v-bind="item" />
            </ElSelect>
          </ElFormItem>
          <ElFormItem label="负责人" prop="owner_user_id">
            <ElSelect
              v-model="customerForm.owner_user_id"
              filterable
              clearable
              placeholder="请选择负责人"
            >
              <ElOption
                v-for="user in userOptions"
                :key="user.id"
                :label="user.mobile ? `${user.name} / ${user.mobile}` : user.name"
                :value="user.id"
              />
            </ElSelect>
          </ElFormItem>
          <ElFormItem label="所属行业">
            <ElInput v-model="customerForm.industry" placeholder="如 电商、教育、餐饮" />
          </ElFormItem>
          <ElFormItem label="合作开始日期">
            <ElDatePicker
              v-model="customerForm.cooperation_start_date"
              type="date"
              value-format="YYYY-MM-DD"
              placeholder="请选择日期"
            />
          </ElFormItem>
          <ElFormItem label="客户来源">
            <ElInput v-model="customerForm.source" placeholder="如 老客户转介绍" />
          </ElFormItem>
          <ElFormItem label="跟进状态">
            <ElSelect v-model="customerForm.follow_status">
              <ElOption v-for="item in followStatusOptions" :key="item.value" v-bind="item" />
            </ElSelect>
          </ElFormItem>
          <ElFormItem label="公司地址" class="full">
            <ElInput v-model="customerForm.company_address" placeholder="请输入公司地址" />
          </ElFormItem>
          <ElFormItem label="官网">
            <ElInput v-model="customerForm.website" placeholder="请输入官网" />
          </ElFormItem>
          <ElFormItem label="纳税人识别号">
            <ElInput v-model="customerForm.taxpayer_no" placeholder="请输入纳税人识别号" />
          </ElFormItem>
          <ElFormItem label="开户行">
            <ElInput v-model="customerForm.bank_name" placeholder="请输入开户行" />
          </ElFormItem>
          <ElFormItem label="银行账号">
            <ElInput v-model="customerForm.bank_account" placeholder="请输入银行账号" />
          </ElFormItem>
          <ElFormItem label="开票抬头" class="full">
            <ElInput v-model="customerForm.invoice_title" placeholder="请输入开票抬头" />
          </ElFormItem>
          <ElFormItem label="备注" class="full">
            <ElInput
              v-model="customerForm.remark"
              type="textarea"
              :rows="3"
              placeholder="请输入备注"
            />
          </ElFormItem>
        </div>

        <template v-if="customerDialogType === 'create'">
          <ElDivider content-position="left">首要联系人</ElDivider>
          <div class="form-grid">
            <ElFormItem label="联系人姓名">
              <ElInput v-model="customerForm.contact_name" placeholder="请输入联系人姓名" />
            </ElFormItem>
            <ElFormItem label="手机号">
              <ElInput v-model="customerForm.contact_mobile" placeholder="请输入手机号" />
            </ElFormItem>
            <ElFormItem label="微信号">
              <ElInput v-model="customerForm.contact_wechat" placeholder="请输入微信号" />
            </ElFormItem>
            <ElFormItem label="邮箱">
              <ElInput v-model="customerForm.contact_email" placeholder="请输入邮箱" />
            </ElFormItem>
            <ElFormItem label="职位">
              <ElInput v-model="customerForm.contact_position" placeholder="请输入职位" />
            </ElFormItem>
            <ElFormItem label="联系人备注">
              <ElInput v-model="customerForm.contact_remark" placeholder="请输入联系人备注" />
            </ElFormItem>
          </div>
        </template>
      </ElForm>

      <template #footer>
        <ElButton @click="customerDialogVisible = false">取消</ElButton>
        <ElButton type="primary" :loading="submitLoading" @click="handleCustomerSubmit"
          >确定</ElButton
        >
      </template>
    </ElDialog>

    <ElDrawer v-model="contactDrawerVisible" size="760px" :title="currentCustomerTitle">
      <div class="mb-3">
        <ElButton
          v-if="hasAuth('customer.contact.create')"
          type="primary"
          @click="openContactDialog('create')"
        >
          新增联系人
        </ElButton>
      </div>

      <ElTable :data="contacts" border>
        <ElTableColumn prop="contact_name" label="联系人" min-width="110" />
        <ElTableColumn prop="mobile" label="手机号" min-width="130" />
        <ElTableColumn prop="wechat" label="微信" min-width="120" />
        <ElTableColumn prop="position" label="职位" min-width="100" />
        <ElTableColumn label="状态" width="90">
          <template #default="{ row }">
            <ElTag :type="row.status === 1 ? 'success' : 'info'">
              {{ row.status === 1 ? '启用' : '停用' }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="主联系人" width="100">
          <template #default="{ row }">
            <ElTag v-if="row.is_primary === 1" type="warning">主联系人</ElTag>
            <ElButton
              v-else-if="hasAuth('customer.contact.update')"
              link
              type="primary"
              @click="handleSetPrimary(row)"
            >
              设为主联系人
            </ElButton>
          </template>
        </ElTableColumn>
        <ElTableColumn label="操作" width="110" fixed="right">
          <template #default="{ row }">
            <ArtButtonTable
              v-if="hasAuth('customer.contact.update')"
              type="edit"
              @click="openContactDialog('update', row)"
            />
            <ArtButtonTable
              v-if="hasAuth('customer.contact.delete')"
              type="delete"
              @click="handleContactDelete(row)"
            />
          </template>
        </ElTableColumn>
      </ElTable>
    </ElDrawer>

    <ElDialog
      v-model="contactDialogVisible"
      :title="contactDialogType === 'create' ? '新增联系人' : '编辑联系人'"
      width="560px"
      @closed="resetContactForm"
    >
      <ElForm ref="contactFormRef" :model="contactForm" :rules="contactRules" label-width="100px">
        <ElFormItem label="联系人姓名" prop="contact_name">
          <ElInput v-model="contactForm.contact_name" placeholder="请输入联系人姓名" />
        </ElFormItem>
        <ElFormItem label="手机号" prop="mobile">
          <ElInput v-model="contactForm.mobile" placeholder="请输入手机号" />
        </ElFormItem>
        <ElFormItem label="微信">
          <ElInput v-model="contactForm.wechat" placeholder="请输入微信号" />
        </ElFormItem>
        <ElFormItem label="邮箱">
          <ElInput v-model="contactForm.email" placeholder="请输入邮箱" />
        </ElFormItem>
        <ElFormItem label="职位">
          <ElInput v-model="contactForm.position" placeholder="请输入职位" />
        </ElFormItem>
        <ElFormItem label="主联系人">
          <ElSwitch v-model="contactForm.is_primary" :active-value="1" :inactive-value="0" />
        </ElFormItem>
        <ElFormItem label="状态">
          <ElRadioGroup v-model="contactForm.status">
            <ElRadio :value="1">启用</ElRadio>
            <ElRadio :value="0">停用</ElRadio>
          </ElRadioGroup>
        </ElFormItem>
        <ElFormItem label="备注">
          <ElInput
            v-model="contactForm.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入备注"
          />
        </ElFormItem>
      </ElForm>

      <template #footer>
        <ElButton @click="contactDialogVisible = false">取消</ElButton>
        <ElButton type="primary" :loading="submitLoading" @click="handleContactSubmit"
          >确定</ElButton
        >
      </template>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
  import { h } from 'vue'
  import { useRouter } from 'vue-router'
  import { ElMessageBox, ElTag, type FormInstance, type FormRules } from 'element-plus'
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import { useTable } from '@/hooks/core/useTable'
  import { useAuth } from '@/hooks/core/useAuth'
  import {
    createCustomer,
    createCustomerContact,
    deleteCustomer,
    deleteCustomerContact,
    fetchCustomerContacts,
    fetchCustomerList,
    fetchCustomerOptions,
    setPrimaryCustomerContact,
    updateCustomer,
    updateCustomerContact,
    type ContactStatus,
    type CustomerContactItem,
    type CustomerFollowStatus,
    type CustomerItem,
    type CustomerLevel,
    type CustomerStatus,
    type CustomerType,
    type CustomerUserOption
  } from '@/api/customer'

  defineOptions({ name: 'CustomerManage' })

  /***** 类型定义开始 *****/
  type DialogType = 'create' | 'update'
  type SearchValue<T> = '' | T

  interface CustomerSearchForm {
    customer_name: string
    customer_code: string
    customer_type: SearchValue<CustomerType>
    level: SearchValue<CustomerLevel>
    status: SearchValue<CustomerStatus>
  }

  interface CustomerForm {
    id?: number
    customer_name: string
    customer_code: string
    customer_type: CustomerType
    industry: string
    level: CustomerLevel
    status: CustomerStatus
    owner_user_id: number | ''
    company_address: string
    website: string
    taxpayer_no: string
    bank_name: string
    bank_account: string
    invoice_title: string
    cooperation_start_date: string
    source: string
    follow_status: CustomerFollowStatus
    remark: string
    contact_name: string
    contact_mobile: string
    contact_wechat: string
    contact_email: string
    contact_position: string
    contact_remark: string
  }

  interface ContactForm {
    id?: number
    customer_id: number
    contact_name: string
    mobile: string
    wechat: string
    email: string
    position: string
    is_primary: 0 | 1
    status: ContactStatus
    remark: string
  }
  /***** 类型定义结束 *****/

  /***** 基础配置开始 *****/
  const { hasAuth } = useAuth()
  const router = useRouter()

  const customerTypeOptions = [
    { label: '直客', value: 1 },
    { label: '代理商', value: 2 },
    { label: '渠道合作', value: 3 }
  ] as const

  const levelOptions = [
    { label: 'A级', value: 1 },
    { label: 'B级', value: 2 },
    { label: 'C级', value: 3 },
    { label: 'D级', value: 4 }
  ] as const

  const statusOptions = [
    { label: '合作中', value: 1 },
    { label: '待跟进', value: 2 },
    { label: '已暂停', value: 3 }
  ] as const

  const followStatusOptions = [
    { label: '初步沟通', value: 1 },
    { label: '方案沟通', value: 2 },
    { label: '商务谈判', value: 3 },
    { label: '已签约', value: 4 }
  ] as const
  /***** 基础配置结束 *****/

  /***** 查询条件开始 *****/
  const searchForm = reactive<CustomerSearchForm>({
    customer_name: '',
    customer_code: '',
    customer_type: '',
    level: '',
    status: ''
  })
  /***** 查询条件结束 *****/

  /***** 页面状态开始 *****/
  const userOptions = ref<CustomerUserOption[]>([])
  const customerDialogVisible = ref(false)
  const customerDialogType = ref<DialogType>('create')
  const contactDrawerVisible = ref(false)
  const contactDialogVisible = ref(false)
  const contactDialogType = ref<DialogType>('create')
  const submitLoading = ref(false)
  const customerFormRef = ref<FormInstance>()
  const contactFormRef = ref<FormInstance>()
  const currentCustomer = ref<CustomerItem>()
  const contacts = ref<CustomerContactItem[]>([])
  /***** 页面状态结束 *****/

  /***** 表单数据开始 *****/
  const customerForm = reactive<CustomerForm>(getDefaultCustomerForm())
  const contactForm = reactive<ContactForm>(getDefaultContactForm())

  const customerRules: FormRules<CustomerForm> = {
    customer_name: [{ required: true, message: '请输入客户名称', trigger: 'blur' }],
    customer_type: [{ required: true, message: '请选择客户类型', trigger: 'change' }],
    level: [{ required: true, message: '请选择客户等级', trigger: 'change' }],
    status: [{ required: true, message: '请选择客户状态', trigger: 'change' }],
    owner_user_id: [{ required: true, message: '请选择负责人', trigger: 'change' }]
  }

  const contactRules: FormRules<ContactForm> = {
    contact_name: [{ required: true, message: '请输入联系人姓名', trigger: 'blur' }],
    mobile: [{ required: true, message: '请输入手机号', trigger: 'blur' }]
  }
  /***** 表单数据结束 *****/

  /***** 计算属性开始 *****/
  const currentCustomerTitle = computed(() =>
    currentCustomer.value ? `${currentCustomer.value.customer_name} - 联系人` : '联系人'
  )

  const cooperatingCount = computed(() => data.value.filter((item) => item.status === 1).length)
  const pageSignedAmount = computed(() =>
    data.value.reduce((sum, item) => sum + Number(item.signed_contract_amount || 0), 0)
  )
  const pageReceivedAmount = computed(() =>
    data.value.reduce((sum, item) => sum + Number(item.received_amount || 0), 0)
  )
  /***** 计算属性结束 *****/

  /***** 工具方法开始 *****/
  const getOptionLabel = <T extends number>(
    options: readonly { label: string; value: T }[],
    value: T
  ) => options.find((item) => item.value === value)?.label || '-'

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
  /***** 工具方法结束 *****/

  /***** 列表开始 *****/
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
      apiFn: fetchCustomerList,
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
          prop: 'customer_name',
          label: '客户信息',
          minWidth: 220,
          formatter: (row: CustomerItem) =>
            h('div', [
              h('div', { class: 'font-medium' }, row.customer_name),
              h('div', { class: 'text-xs text-gray-400 mt-1' }, `编码：${row.customer_code}`),
              h('div', { class: 'text-xs text-gray-400 mt-1' }, `行业：${row.industry || '-'}`)
            ])
        },
        {
          prop: 'customer_type',
          label: '类型/等级',
          width: 130,
          formatter: (row: CustomerItem) =>
            h('div', [
              h('div', getOptionLabel(customerTypeOptions, row.customer_type)),
              h(ElTag, { class: 'mt-1', type: row.level === 1 ? 'danger' : 'info' }, () =>
                getOptionLabel(levelOptions, row.level)
              )
            ])
        },
        {
          prop: 'owner_name',
          label: '负责人',
          minWidth: 130,
          formatter: (row: CustomerItem) =>
            h('div', [
              h('div', row.owner_name || '-'),
              h('div', { class: 'text-xs text-gray-400 mt-1' }, row.owner_mobile || '')
            ])
        },
        {
          prop: 'status',
          label: '状态',
          width: 100,
          formatter: (row: CustomerItem) => {
            const typeMap = { 1: 'success', 2: 'warning', 3: 'danger' } as const
            return h(ElTag, { type: typeMap[row.status] }, () =>
              getOptionLabel(statusOptions, row.status)
            )
          }
        },
        {
          prop: 'amount',
          label: '金额概览',
          minWidth: 170,
          formatter: (row: CustomerItem) =>
            h('div', [
              h('div', `签约：${formatMoney(row.signed_contract_amount)}`),
              h(
                'div',
                { class: 'text-xs text-gray-400 mt-1' },
                `回款：${formatMoney(row.received_amount)}`
              )
            ])
        },
        {
          prop: 'created_at',
          label: '创建时间',
          width: 170,
          formatter: (row: CustomerItem) => formatDateTime(row.created_at)
        },
        {
          prop: 'operation',
          label: '操作',
          width: 190,
          fixed: 'right',
          formatter: (row: CustomerItem) =>
            h('div', [
              h(ArtButtonTable, {
                type: 'view',
                icon: 'ri:file-list-3-line',
                onClick: () => openDetailInNewTab(row.id)
              }),
              h(ArtButtonTable, {
                type: 'view',
                icon: 'ri:user-2-line',
                onClick: () => openContactDrawer(row)
              }),
              hasAuth('customer.update')
                ? h(ArtButtonTable, {
                    type: 'edit',
                    onClick: () => openCustomerDialog('update', row)
                  })
                : null,
              hasAuth('customer.delete')
                ? h(ArtButtonTable, {
                    type: 'delete',
                    onClick: () => handleCustomerDelete(row)
                  })
                : null
            ])
        }
      ]
    }
  })
  /***** 列表结束 *****/

  /***** 默认表单开始 *****/
  function getDefaultCustomerForm(): CustomerForm {
    return {
      customer_name: '',
      customer_code: '',
      customer_type: 1,
      industry: '',
      level: 1,
      status: 1,
      owner_user_id: '',
      company_address: '',
      website: '',
      taxpayer_no: '',
      bank_name: '',
      bank_account: '',
      invoice_title: '',
      cooperation_start_date: '',
      source: '',
      follow_status: 1,
      remark: '',
      contact_name: '',
      contact_mobile: '',
      contact_wechat: '',
      contact_email: '',
      contact_position: '',
      contact_remark: ''
    }
  }

  function getDefaultContactForm(): ContactForm {
    return {
      customer_id: 0,
      contact_name: '',
      mobile: '',
      wechat: '',
      email: '',
      position: '',
      is_primary: 0,
      status: 1,
      remark: ''
    }
  }
  /***** 默认表单结束 *****/

  /***** 基础数据加载开始 *****/
  const loadOptions = async () => {
    const res = await fetchCustomerOptions()
    userOptions.value = res.users
  }
  /***** 基础数据加载结束 *****/

  /***** 创建、修改客户开始 *****/
  const resetCustomerForm = () => {
    Object.assign(customerForm, getDefaultCustomerForm())
    customerFormRef.value?.clearValidate()
  }

  const openCustomerDialog = async (type: DialogType, row?: CustomerItem) => {
    await loadOptions()
    customerDialogType.value = type

    if (type === 'create') {
      resetCustomerForm()
    } else if (row) {
      Object.assign(customerForm, {
        ...getDefaultCustomerForm(),
        ...row,
        cooperation_start_date: row.cooperation_start_date || ''
      })
    }

    customerDialogVisible.value = true
  }

  const buildCustomerPayload = () => ({
    ...customerForm,
    owner_user_id: Number(customerForm.owner_user_id || 0)
  })

  const handleCustomerSubmit = async () => {
    await customerFormRef.value?.validate()

    try {
      submitLoading.value = true
      const payload = buildCustomerPayload()

      if (customerDialogType.value === 'create') {
        await createCustomer(payload)
        customerDialogVisible.value = false
        await refreshCreate()
        return
      }

      if (!customerForm.id) return
      await updateCustomer({ ...payload, id: customerForm.id })
      customerDialogVisible.value = false
      await refreshUpdate()
    } finally {
      submitLoading.value = false
    }
  }
  /***** 创建、修改客户结束 *****/

  /***** 删除客户开始 *****/
  const handleCustomerDelete = async (row: CustomerItem) => {
    await ElMessageBox.confirm(`确定删除客户「${row.customer_name}」吗？`, '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    await deleteCustomer({ id: row.id })
    await refreshRemove()
  }
  /***** 删除客户结束 *****/

  /***** 查询、重置开始 *****/
  const handleSearch = async () => {
    replaceSearchParams({
      customer_name: searchForm.customer_name || undefined,
      customer_code: searchForm.customer_code || undefined,
      customer_type: searchForm.customer_type || undefined,
      level: searchForm.level || undefined,
      status: searchForm.status || undefined
    })
    await getData()
  }

  const handleReset = async () => {
    Object.assign(searchForm, {
      customer_name: '',
      customer_code: '',
      customer_type: '',
      level: '',
      status: ''
    })
    resetSearchParams()
    await getData()
  }
  /***** 查询、重置结束 *****/

  /***** 详情页跳转开始 *****/
  const openDetailInNewTab = (id: number) => {
    const target = router.resolve({ path: '/customer/detail', query: { id } })
    window.open(target.href, '_blank', 'noopener')
  }
  /***** 详情页跳转结束 *****/

  /***** 联系人开始 *****/
  const resetContactForm = () => {
    Object.assign(contactForm, getDefaultContactForm())
    contactFormRef.value?.clearValidate()
  }

  const openContactDrawer = async (row: CustomerItem) => {
    currentCustomer.value = row
    contactDrawerVisible.value = true
    await loadContacts(row.id)
  }

  const openContactDialog = (type: DialogType, row?: CustomerContactItem) => {
    if (!currentCustomer.value) return
    contactDialogType.value = type

    if (type === 'create') {
      Object.assign(contactForm, getDefaultContactForm(), {
        customer_id: currentCustomer.value.id
      })
    } else if (row) {
      Object.assign(contactForm, row)
    }

    contactDialogVisible.value = true
  }

  const loadContacts = async (customerId: number) => {
    const res = await fetchCustomerContacts({ customer_id: customerId })
    contacts.value = res.records
  }

  const handleContactSubmit = async () => {
    await contactFormRef.value?.validate()

    try {
      submitLoading.value = true

      if (contactDialogType.value === 'create') {
        await createCustomerContact(contactForm)
      } else if (contactForm.id) {
        await updateCustomerContact({ ...contactForm, id: contactForm.id })
      }

      contactDialogVisible.value = false
      if (currentCustomer.value) {
        await loadContacts(currentCustomer.value.id)
      }
    } finally {
      submitLoading.value = false
    }
  }

  const handleSetPrimary = async (row: CustomerContactItem) => {
    await setPrimaryCustomerContact({ id: row.id })
    if (currentCustomer.value) {
      await loadContacts(currentCustomer.value.id)
    }
  }

  const handleContactDelete = async (row: CustomerContactItem) => {
    await ElMessageBox.confirm(`确定删除联系人「${row.contact_name}」吗？`, '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    await deleteCustomerContact({ id: row.id })
    if (currentCustomer.value) {
      await loadContacts(currentCustomer.value.id)
    }
  }
  /***** 联系人结束 *****/

  /***** 生命周期开始 *****/
  onMounted(loadOptions)
  /***** 生命周期结束 *****/
</script>

<style scoped lang="scss">
  .summary-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
  }

  .summary-item {
    display: flex;
    flex-direction: column;
    justify-content: center;
    min-height: 76px;
    padding: 14px 16px;
    background: var(--el-bg-color);
    border: 1px solid var(--el-border-color-light);
    border-radius: 8px;

    span {
      font-size: 13px;
      color: var(--el-text-color-secondary);
    }

    strong {
      margin-top: 8px;
      font-size: 20px;
      font-weight: 700;
      color: var(--el-text-color-primary);
    }
  }

  .form-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0 12px;

    .full {
      grid-column: 1 / -1;
    }

    :deep(.el-select),
    :deep(.el-date-editor) {
      width: 100%;
    }
  }

  @media (width <= 900px) {
    .summary-grid,
    .form-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
