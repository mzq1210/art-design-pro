<template>
  <div class="customer-follow-page art-full-height flex flex-col">
    <ElForm :inline="true" :model="searchForm" class="mb-3">
      <ElFormItem label="关键字">
        <ElInput
          v-model="searchForm.keyword"
          clearable
          placeholder="客户 / 联系人 / 内容"
          @keyup.enter="loadData"
        />
      </ElFormItem>
      <ElFormItem label="客户">
        <ElSelect
          v-model="searchForm.customer_id"
          clearable
          filterable
          placeholder="全部客户"
          style="width: 220px"
        >
          <ElOption
            v-for="item in customerOptions"
            :key="item.id"
            :label="`${item.customer_name} / ${item.customer_code}`"
            :value="item.id"
          />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="阶段">
        <ElSelect
          v-model="searchForm.follow_status"
          clearable
          placeholder="全部"
          style="width: 130px"
        >
          <ElOption v-for="item in followStatusOptions" :key="item.value" v-bind="item" />
        </ElSelect>
      </ElFormItem>
      <ElFormItem>
        <ElButton type="primary" @click="loadData">查询</ElButton>
        <ElButton @click="handleReset">重置</ElButton>
      </ElFormItem>
    </ElForm>

    <ElCard class="art-table-card">
      <div class="mb-3">
        <ElButton
          v-if="hasAuth('customer.follow.create')"
          type="primary"
          @click="openDialog('create')"
          >新增跟进</ElButton
        >
      </div>
      <ElTable v-loading="loading" :data="records" border>
        <ElTableColumn prop="customer_name" label="客户" min-width="170" />
        <ElTableColumn prop="contact_name" label="联系人" min-width="120" />
        <ElTableColumn label="跟进方式" width="100">
          <template #default="{ row }">{{
            getOptionLabel(followTypeOptions, row.follow_type)
          }}</template>
        </ElTableColumn>
        <ElTableColumn label="阶段" width="120">
          <template #default="{ row }">
            <ElTag>{{ getOptionLabel(followStatusOptions, row.follow_status) }}</ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="跟进时间" width="170">
          <template #default="{ row }">{{ formatDateTime(row.follow_time) }}</template>
        </ElTableColumn>
        <ElTableColumn prop="content" label="跟进内容" min-width="220" show-overflow-tooltip />
        <ElTableColumn prop="result" label="结果" min-width="160" show-overflow-tooltip />
        <ElTableColumn label="下次跟进" width="170">
          <template #default="{ row }">{{ formatDateTime(row.next_follow_time) }}</template>
        </ElTableColumn>
        <ElTableColumn prop="owner_name" label="负责人" width="120" />
        <ElTableColumn label="操作" width="130" fixed="right">
          <template #default="{ row }">
            <ElButton
              v-if="hasAuth('customer.follow.update')"
              link
              type="primary"
              @click="openDialog('update', row)"
              >编辑</ElButton
            >
            <ElButton
              v-if="hasAuth('customer.follow.delete')"
              link
              type="danger"
              @click="handleDelete(row)"
              >删除</ElButton
            >
          </template>
        </ElTableColumn>
      </ElTable>
      <div class="mt-3 flex justify-end">
        <ElPagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.size"
          :total="pagination.total"
          background
          layout="total, sizes, prev, pager, next"
          @size-change="loadData"
          @current-change="loadData"
        />
      </div>
    </ElCard>

    <ElDialog
      v-model="dialogVisible"
      :title="dialogType === 'create' ? '新增跟进' : '编辑跟进'"
      width="720px"
      @closed="resetForm"
    >
      <ElForm ref="formRef" :model="form" :rules="rules" label-width="100px">
        <ElRow :gutter="16">
          <ElCol :span="12">
            <ElFormItem label="客户" prop="customer_id">
              <ElSelect
                v-model="form.customer_id"
                filterable
                placeholder="请选择客户"
                @change="handleCustomerChange"
              >
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
            <ElFormItem label="联系人">
              <ElSelect v-model="form.contact_id" clearable filterable placeholder="请选择联系人">
                <ElOption
                  v-for="item in contactOptions"
                  :key="item.id"
                  :label="`${item.contact_name}${item.mobile ? ` / ${item.mobile}` : ''}`"
                  :value="item.id"
                />
              </ElSelect>
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem label="负责人" prop="owner_user_id">
              <ElSelect
                v-model="form.owner_user_id"
                clearable
                filterable
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
            <ElFormItem label="跟进时间">
              <ElDatePicker
                v-model="form.follow_time"
                type="datetime"
                value-format="YYYY-MM-DD HH:mm:ss"
                class="w-full"
              />
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem label="跟进方式">
              <ElSelect v-model="form.follow_type">
                <ElOption v-for="item in followTypeOptions" :key="item.value" v-bind="item" />
              </ElSelect>
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem label="阶段">
              <ElSelect v-model="form.follow_status">
                <ElOption v-for="item in followStatusOptions" :key="item.value" v-bind="item" />
              </ElSelect>
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem label="下次跟进">
              <ElDatePicker
                v-model="form.next_follow_time"
                type="datetime"
                value-format="YYYY-MM-DD HH:mm:ss"
                class="w-full"
              />
            </ElFormItem>
          </ElCol>
          <ElCol :span="24">
            <ElFormItem label="跟进内容" prop="content">
              <ElInput
                v-model="form.content"
                type="textarea"
                :rows="4"
                placeholder="请输入跟进内容"
              />
            </ElFormItem>
          </ElCol>
          <ElCol :span="24">
            <ElFormItem label="跟进结果">
              <ElInput
                v-model="form.result"
                type="textarea"
                :rows="2"
                placeholder="请输入跟进结果"
              />
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
  import { ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
  import { useAuth } from '@/hooks/core/useAuth'
  import {
    createCustomerFollow,
    deleteCustomerFollow,
    fetchCustomerContacts,
    fetchCustomerFollows,
    fetchCustomerOptions,
    updateCustomerFollow,
    type CustomerContactItem,
    type CustomerFollowItem,
    type CustomerFollowStatus,
    type CustomerOption,
    type CustomerUserOption
  } from '@/api/customer'

  defineOptions({ name: 'CustomerFollow' })

  type DialogType = 'create' | 'update'
  type SelectValue = number | ''

  interface FollowForm {
    id?: number
    customer_id: SelectValue
    contact_id: SelectValue
    owner_user_id: SelectValue
    follow_time: string
    follow_type: 1 | 2 | 3 | 4
    follow_status: CustomerFollowStatus
    next_follow_time: string
    content: string
    result: string
  }

  const { hasAuth } = useAuth()
  const loading = ref(false)
  const submitLoading = ref(false)
  const records = ref<CustomerFollowItem[]>([])
  const customerOptions = ref<CustomerOption[]>([])
  const userOptions = ref<CustomerUserOption[]>([])
  const contactOptions = ref<CustomerContactItem[]>([])
  const dialogVisible = ref(false)
  const dialogType = ref<DialogType>('create')
  const formRef = ref<FormInstance>()
  const pagination = reactive({ page: 1, size: 10, total: 0 })
  const searchForm = reactive({
    keyword: '',
    customer_id: '' as SelectValue,
    follow_status: '' as CustomerFollowStatus | ''
  })
  const form = reactive<FollowForm>(getDefaultForm())

  const followTypeOptions = [
    { label: '电话', value: 1 },
    { label: '微信', value: 2 },
    { label: '拜访', value: 3 },
    { label: '其他', value: 4 }
  ] as const

  const followStatusOptions = [
    { label: '初步沟通', value: 1 },
    { label: '方案沟通', value: 2 },
    { label: '商务谈判', value: 3 },
    { label: '已签约', value: 4 }
  ] as const

  const rules: FormRules<FollowForm> = {
    customer_id: [{ required: true, message: '请选择客户', trigger: 'change' }],
    owner_user_id: [{ required: true, message: '请选择负责人', trigger: 'change' }],
    content: [{ required: true, message: '请输入跟进内容', trigger: 'blur' }]
  }

  function getDefaultForm(): FollowForm {
    return {
      customer_id: '',
      contact_id: '',
      owner_user_id: '',
      follow_time: '',
      follow_type: 1,
      follow_status: 1,
      next_follow_time: '',
      content: '',
      result: ''
    }
  }

  function getOptionLabel<T extends number>(
    options: readonly { label: string; value: T }[],
    value: T
  ) {
    return options.find((item) => item.value === value)?.label || '-'
  }

  function formatDateTime(timestamp: number) {
    return timestamp ? new Date(timestamp * 1000).toLocaleString() : '-'
  }

  async function loadOptions() {
    const res = await fetchCustomerOptions()
    customerOptions.value = res.customers || []
    userOptions.value = res.users || []
  }

  async function loadData() {
    loading.value = true
    try {
      const res = await fetchCustomerFollows({
        page: pagination.page,
        size: pagination.size,
        keyword: searchForm.keyword || undefined,
        customer_id: searchForm.customer_id ? Number(searchForm.customer_id) : undefined,
        follow_status: searchForm.follow_status || undefined
      })
      records.value = res.records || []
      pagination.total = res.total || 0
    } finally {
      loading.value = false
    }
  }

  async function loadContacts(customerId: number) {
    const res = await fetchCustomerContacts({ customer_id: customerId })
    contactOptions.value = res.records || []
  }

  function handleReset() {
    Object.assign(searchForm, { keyword: '', customer_id: '', follow_status: '' })
    pagination.page = 1
    loadData()
  }

  async function handleCustomerChange(customerId: SelectValue) {
    form.contact_id = ''
    contactOptions.value = []
    const customer = customerOptions.value.find((item) => item.id === customerId)
    form.owner_user_id = customer?.owner_user_id || ''
    if (customerId) await loadContacts(Number(customerId))
  }

  async function openDialog(type: DialogType, row?: CustomerFollowItem) {
    dialogType.value = type
    if (type === 'create') {
      Object.assign(form, getDefaultForm(), { customer_id: searchForm.customer_id || '' })
      if (form.customer_id) await handleCustomerChange(form.customer_id)
    } else if (row) {
      Object.assign(form, {
        id: row.id,
        customer_id: row.customer_id,
        contact_id: row.contact_id || '',
        owner_user_id: row.owner_user_id,
        follow_time: row.follow_time
          ? new Date(row.follow_time * 1000).toLocaleString('sv-SE')
          : '',
        follow_type: row.follow_type,
        follow_status: row.follow_status,
        next_follow_time: row.next_follow_time
          ? new Date(row.next_follow_time * 1000).toLocaleString('sv-SE')
          : '',
        content: row.content,
        result: row.result
      })
      await loadContacts(row.customer_id)
    }
    dialogVisible.value = true
  }

  function resetForm() {
    Object.assign(form, getDefaultForm())
    contactOptions.value = []
    formRef.value?.clearValidate()
  }

  async function handleSubmit() {
    await formRef.value?.validate()
    submitLoading.value = true
    try {
      const params = {
        ...form,
        customer_id: Number(form.customer_id || 0),
        contact_id: form.contact_id ? Number(form.contact_id) : ('' as const),
        owner_user_id: form.owner_user_id ? Number(form.owner_user_id) : ('' as const)
      }
      if (dialogType.value === 'create') {
        await createCustomerFollow(params)
      } else if (form.id) {
        await updateCustomerFollow({ ...params, id: form.id })
      }
      dialogVisible.value = false
      loadData()
    } finally {
      submitLoading.value = false
    }
  }

  async function handleDelete(row: CustomerFollowItem) {
    await ElMessageBox.confirm('确定删除该跟进记录吗？', '提示', { type: 'warning' })
    await deleteCustomerFollow({ id: row.id })
    loadData()
  }

  onMounted(async () => {
    await loadOptions()
    await loadData()
  })
</script>
