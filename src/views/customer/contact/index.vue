<template>
  <div class="customer-contact-page art-full-height flex flex-col">
    <ElForm :inline="true" :model="searchForm" class="mb-3">
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
      <ElFormItem>
        <ElButton type="primary" @click="loadData">查询</ElButton>
        <ElButton @click="handleReset">重置</ElButton>
      </ElFormItem>
    </ElForm>

    <ElCard class="art-table-card">
      <div class="mb-3">
        <ElButton
          v-if="hasAuth('customer.contact.create')"
          type="primary"
          @click="openDialog('create')"
          >新增联系人</ElButton
        >
      </div>
      <ElTable v-loading="loading" :data="records" border>
        <ElTableColumn prop="customer_name" label="客户" min-width="180" />
        <ElTableColumn prop="contact_name" label="联系人" min-width="120" />
        <ElTableColumn prop="mobile" label="手机号" min-width="130" />
        <ElTableColumn prop="wechat" label="微信" min-width="120" />
        <ElTableColumn prop="email" label="邮箱" min-width="160" />
        <ElTableColumn prop="position" label="职位" min-width="120" />
        <ElTableColumn label="主联系人" width="120">
          <template #default="{ row }">
            <ElTag v-if="row.is_primary === 1" type="warning">主联系人</ElTag>
            <ElButton
              v-else-if="hasAuth('customer.contact.update')"
              link
              type="primary"
              @click="handleSetPrimary(row)"
              >设为主联系人</ElButton
            >
          </template>
        </ElTableColumn>
        <ElTableColumn label="状态" width="90">
          <template #default="{ row }">
            <ElTag :type="row.status === 1 ? 'success' : 'info'">{{
              row.status === 1 ? '启用' : '停用'
            }}</ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="操作" width="130" fixed="right">
          <template #default="{ row }">
            <ElButton
              v-if="hasAuth('customer.contact.update')"
              link
              type="primary"
              @click="openDialog('update', row)"
              >编辑</ElButton
            >
            <ElButton
              v-if="hasAuth('customer.contact.delete')"
              link
              type="danger"
              @click="handleDelete(row)"
              >删除</ElButton
            >
          </template>
        </ElTableColumn>
      </ElTable>
    </ElCard>

    <ElDialog
      v-model="dialogVisible"
      :title="dialogType === 'create' ? '新增联系人' : '编辑联系人'"
      width="560px"
      @closed="resetForm"
    >
      <ElForm ref="formRef" :model="form" :rules="rules" label-width="100px">
        <ElFormItem label="客户" prop="customer_id">
          <ElSelect v-model="form.customer_id" filterable placeholder="请选择客户">
            <ElOption
              v-for="item in customerOptions"
              :key="item.id"
              :label="`${item.customer_name} / ${item.customer_code}`"
              :value="item.id"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="联系人" prop="contact_name">
          <ElInput v-model="form.contact_name" placeholder="请输入联系人姓名" />
        </ElFormItem>
        <ElFormItem label="手机号" prop="mobile">
          <ElInput v-model="form.mobile" placeholder="请输入手机号" />
        </ElFormItem>
        <ElFormItem label="微信">
          <ElInput v-model="form.wechat" placeholder="请输入微信号" />
        </ElFormItem>
        <ElFormItem label="邮箱">
          <ElInput v-model="form.email" placeholder="请输入邮箱" />
        </ElFormItem>
        <ElFormItem label="职位">
          <ElInput v-model="form.position" placeholder="请输入职位" />
        </ElFormItem>
        <ElFormItem label="主联系人">
          <ElSwitch v-model="form.is_primary" :active-value="1" :inactive-value="0" />
        </ElFormItem>
        <ElFormItem label="状态">
          <ElRadioGroup v-model="form.status">
            <ElRadio :value="1">启用</ElRadio>
            <ElRadio :value="0">停用</ElRadio>
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
  import { ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
  import { useAuth } from '@/hooks/core/useAuth'
  import {
    createCustomerContact,
    deleteCustomerContact,
    fetchCustomerContacts,
    fetchCustomerOptions,
    setPrimaryCustomerContact,
    updateCustomerContact,
    type ContactStatus,
    type CustomerContactItem,
    type CustomerOption
  } from '@/api/customer'

  defineOptions({ name: 'CustomerContact' })

  type DialogType = 'create' | 'update'

  interface ContactForm {
    id?: number
    customer_id: number | ''
    contact_name: string
    mobile: string
    wechat: string
    email: string
    position: string
    is_primary: 0 | 1
    status: ContactStatus
    remark: string
  }

  const { hasAuth } = useAuth()
  const loading = ref(false)
  const submitLoading = ref(false)
  const records = ref<CustomerContactItem[]>([])
  const customerOptions = ref<CustomerOption[]>([])
  const dialogVisible = ref(false)
  const dialogType = ref<DialogType>('create')
  const formRef = ref<FormInstance>()
  const searchForm = reactive({ customer_id: '' as number | '' })
  const form = reactive<ContactForm>(getDefaultForm())

  const rules: FormRules<ContactForm> = {
    customer_id: [{ required: true, message: '请选择客户', trigger: 'change' }],
    contact_name: [{ required: true, message: '请输入联系人姓名', trigger: 'blur' }],
    mobile: [{ required: true, message: '请输入手机号', trigger: 'blur' }]
  }

  function getDefaultForm(): ContactForm {
    return {
      customer_id: '',
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

  async function loadOptions() {
    const res = await fetchCustomerOptions()
    customerOptions.value = res.customers || []
  }

  async function loadData() {
    loading.value = true
    try {
      const res = await fetchCustomerContacts({
        customer_id: searchForm.customer_id ? Number(searchForm.customer_id) : undefined
      })
      records.value = res.records || []
    } finally {
      loading.value = false
    }
  }

  function handleReset() {
    searchForm.customer_id = ''
    loadData()
  }

  function openDialog(type: DialogType, row?: CustomerContactItem) {
    dialogType.value = type
    if (type === 'create') {
      Object.assign(form, getDefaultForm(), { customer_id: searchForm.customer_id || '' })
    } else if (row) {
      Object.assign(form, row)
    }
    dialogVisible.value = true
  }

  function resetForm() {
    Object.assign(form, getDefaultForm())
    formRef.value?.clearValidate()
  }

  async function handleSubmit() {
    await formRef.value?.validate()
    submitLoading.value = true
    try {
      const params = { ...form, customer_id: Number(form.customer_id || 0) }
      if (dialogType.value === 'create') {
        await createCustomerContact(params)
      } else if (form.id) {
        await updateCustomerContact({ ...params, id: form.id })
      }
      dialogVisible.value = false
      loadData()
    } finally {
      submitLoading.value = false
    }
  }

  async function handleSetPrimary(row: CustomerContactItem) {
    await setPrimaryCustomerContact({ id: row.id })
    loadData()
  }

  async function handleDelete(row: CustomerContactItem) {
    await ElMessageBox.confirm(`确定删除联系人「${row.contact_name}」吗？`, '提示', {
      type: 'warning'
    })
    await deleteCustomerContact({ id: row.id })
    loadData()
  }

  onMounted(async () => {
    await loadOptions()
    await loadData()
  })
</script>
