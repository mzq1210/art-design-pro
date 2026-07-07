<template>
  <div class="dict-page art-full-height">
    <ElRow :gutter="12" class="h-full">
      <ElCol :lg="9" :md="10" :sm="24">
        <section class="panel">
          <div class="toolbar">
            <ElInput
              v-model="typeKeyword"
              clearable
              placeholder="字典名称或编码"
              @keyup.enter="loadTypes"
            />
            <ElButton type="primary" @click="loadTypes">查询</ElButton>
            <ElButton v-if="hasAuth('dict.create')" @click="openTypeDialog('create')">
              新增
            </ElButton>
          </div>

          <ElTable
            v-loading="typeLoading"
            :data="types"
            highlight-current-row
            row-key="id"
            @current-change="handleTypeChange"
          >
            <ElTableColumn label="字典名称" min-width="130">
              <template #default="{ row }">
                <div class="dict-type-name">
                  <span>{{ row.name }}</span>
                  <span>{{ row.code }}</span>
                </div>
              </template>
            </ElTableColumn>
            <ElTableColumn label="状态" width="76">
              <template #default="{ row }">
                <ElTag :type="row.status === 1 ? 'success' : 'info'">
                  {{ row.status === 1 ? '启用' : '禁用' }}
                </ElTag>
              </template>
            </ElTableColumn>
            <ElTableColumn fixed="right" label="操作" width="92">
              <template #default="{ row }">
                <ArtButtonTable
                  v-if="hasAuth('dict.update')"
                  type="edit"
                  @click.stop="openTypeDialog('update', row)"
                />
                <ArtButtonTable
                  v-if="hasAuth('dict.delete')"
                  type="delete"
                  @click.stop="handleDeleteType(row)"
                />
              </template>
            </ElTableColumn>
          </ElTable>
        </section>
      </ElCol>

      <ElCol :lg="15" :md="14" :sm="24">
        <section class="panel">
          <div class="toolbar">
            <ElInput
              v-model="itemKeyword"
              clearable
              :disabled="!currentType"
              placeholder="字典项名称或值"
              @keyup.enter="loadItems"
            />
            <ElButton :disabled="!currentType" type="primary" @click="loadItems">查询</ElButton>
            <ElButton
              v-if="hasAuth('dict.create')"
              :disabled="!currentType"
              @click="openItemDialog('create')"
            >
              新增字典项
            </ElButton>
          </div>

          <ElAlert
            v-if="!currentType"
            :closable="false"
            show-icon
            title="请选择左侧字典类型"
            type="info"
          />

          <ElTable v-else v-loading="itemLoading" :data="items" row-key="id">
            <ElTableColumn label="显示文本" min-width="140" prop="label" />
            <ElTableColumn label="字典值" min-width="140" prop="value" />
            <ElTableColumn label="状态" width="90">
              <template #default="{ row }">
                <ElTag :type="row.status === 1 ? 'success' : 'info'">
                  {{ row.status === 1 ? '启用' : '禁用' }}
                </ElTag>
              </template>
            </ElTableColumn>
            <ElTableColumn label="排序" width="80" prop="sort" />
            <ElTableColumn label="备注" min-width="140" prop="remark" />
            <ElTableColumn fixed="right" label="操作" width="110">
              <template #default="{ row }">
                <ArtButtonTable
                  v-if="hasAuth('dict.update')"
                  type="edit"
                  @click="openItemDialog('update', row)"
                />
                <ArtButtonTable
                  v-if="hasAuth('dict.delete')"
                  type="delete"
                  @click="handleDeleteItem(row)"
                />
              </template>
            </ElTableColumn>
          </ElTable>
        </section>
      </ElCol>
    </ElRow>

    <ElDialog
      v-model="typeDialogVisible"
      :title="typeDialogType === 'create' ? '新增字典类型' : '修改字典类型'"
      width="520px"
      @closed="resetTypeForm"
    >
      <ElForm ref="typeFormRef" :model="typeForm" :rules="typeRules" label-width="86px">
        <ElFormItem label="名称" prop="name">
          <ElInput v-model="typeForm.name" placeholder="如 用户状态" />
        </ElFormItem>
        <ElFormItem label="编码" prop="code">
          <ElInput v-model="typeForm.code" placeholder="如 user_status" />
        </ElFormItem>
        <ElFormItem label="状态">
          <ElRadioGroup v-model="typeForm.status">
            <ElRadio :value="1">启用</ElRadio>
            <ElRadio :value="0">禁用</ElRadio>
          </ElRadioGroup>
        </ElFormItem>
        <ElFormItem label="排序">
          <ElInputNumber v-model="typeForm.sort" :min="0" controls-position="right" />
        </ElFormItem>
        <ElFormItem label="备注">
          <ElInput v-model="typeForm.remark" :rows="2" type="textarea" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="typeDialogVisible = false">取消</ElButton>
        <ElButton type="primary" :loading="submitLoading" @click="handleSubmitType">确定</ElButton>
      </template>
    </ElDialog>

    <ElDialog
      v-model="itemDialogVisible"
      :title="itemDialogType === 'create' ? '新增字典项' : '修改字典项'"
      width="520px"
      @closed="resetItemForm"
    >
      <ElForm ref="itemFormRef" :model="itemForm" :rules="itemRules" label-width="86px">
        <ElFormItem label="显示文本" prop="label">
          <ElInput v-model="itemForm.label" placeholder="如 启用" />
        </ElFormItem>
        <ElFormItem label="字典值" prop="value">
          <ElInput v-model="itemForm.value" placeholder="如 1" />
        </ElFormItem>
        <ElFormItem label="状态">
          <ElRadioGroup v-model="itemForm.status">
            <ElRadio :value="1">启用</ElRadio>
            <ElRadio :value="0">禁用</ElRadio>
          </ElRadioGroup>
        </ElFormItem>
        <ElFormItem label="排序">
          <ElInputNumber v-model="itemForm.sort" :min="0" controls-position="right" />
        </ElFormItem>
        <ElFormItem label="备注">
          <ElInput v-model="itemForm.remark" :rows="2" type="textarea" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="itemDialogVisible = false">取消</ElButton>
        <ElButton type="primary" :loading="submitLoading" @click="handleSubmitItem">确定</ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
  import { ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import { useAuth } from '@/hooks/core/useAuth'
  import {
    createDictItem,
    createDictType,
    deleteDictItem,
    deleteDictType,
    fetchDictItems,
    fetchDictTypes,
    updateDictItem,
    updateDictType,
    type DictItem,
    type DictTypeItem,
    type SwitchValue
  } from '@/api/dict'

  defineOptions({ name: 'Dict' })

  type DialogType = 'create' | 'update'

  const { hasAuth } = useAuth()
  const typeLoading = ref(false)
  const itemLoading = ref(false)
  const submitLoading = ref(false)
  const typeKeyword = ref('')
  const itemKeyword = ref('')
  const types = ref<DictTypeItem[]>([])
  const items = ref<DictItem[]>([])
  const currentType = ref<DictTypeItem>()
  const typeDialogVisible = ref(false)
  const itemDialogVisible = ref(false)
  const typeDialogType = ref<DialogType>('create')
  const itemDialogType = ref<DialogType>('create')
  const typeFormRef = ref<FormInstance>()
  const itemFormRef = ref<FormInstance>()

  const typeForm = reactive({
    id: 0,
    name: '',
    code: '',
    status: 1 as SwitchValue,
    sort: 0,
    remark: ''
  })

  const itemForm = reactive({
    id: 0,
    type_id: 0,
    label: '',
    value: '',
    status: 1 as SwitchValue,
    sort: 0,
    remark: ''
  })

  const typeRules: FormRules = {
    name: [{ required: true, message: '请输入字典名称', trigger: 'blur' }],
    code: [{ required: true, message: '请输入字典编码', trigger: 'blur' }]
  }

  const itemRules: FormRules = {
    label: [{ required: true, message: '请输入显示文本', trigger: 'blur' }],
    value: [{ required: true, message: '请输入字典值', trigger: 'blur' }]
  }

  onMounted(async () => {
    await loadTypes()
  })

  const loadTypes = async () => {
    try {
      typeLoading.value = true
      const res = await fetchDictTypes({ keyword: typeKeyword.value || undefined })
      types.value = res.records

      if (!currentType.value && types.value.length > 0) {
        currentType.value = types.value[0]
        await loadItems()
      }
    } finally {
      typeLoading.value = false
    }
  }

  const loadItems = async () => {
    if (!currentType.value) {
      items.value = []
      return
    }

    try {
      itemLoading.value = true
      const res = await fetchDictItems({
        type_id: currentType.value.id,
        keyword: itemKeyword.value || undefined
      })
      items.value = res.records
    } finally {
      itemLoading.value = false
    }
  }

  const handleTypeChange = async (row?: DictTypeItem) => {
    currentType.value = row
    itemKeyword.value = ''
    await loadItems()
  }

  const openTypeDialog = (type: DialogType, row?: DictTypeItem) => {
    typeDialogType.value = type
    if (type === 'create') {
      resetTypeForm()
    } else if (row) {
      Object.assign(typeForm, row)
    }
    typeDialogVisible.value = true
  }

  const openItemDialog = (type: DialogType, row?: DictItem) => {
    if (!currentType.value) return

    itemDialogType.value = type
    if (type === 'create') {
      resetItemForm()
      itemForm.type_id = currentType.value.id
    } else if (row) {
      Object.assign(itemForm, row)
    }
    itemDialogVisible.value = true
  }

  const resetTypeForm = () => {
    Object.assign(typeForm, { id: 0, name: '', code: '', status: 1, sort: 0, remark: '' })
    typeFormRef.value?.clearValidate()
  }

  const resetItemForm = () => {
    Object.assign(itemForm, {
      id: 0,
      type_id: currentType.value?.id || 0,
      label: '',
      value: '',
      status: 1,
      sort: 0,
      remark: ''
    })
    itemFormRef.value?.clearValidate()
  }

  const handleSubmitType = async () => {
    await typeFormRef.value?.validate()
    try {
      submitLoading.value = true
      if (typeDialogType.value === 'create') {
        await createDictType(typeForm)
      } else {
        await updateDictType({ ...typeForm, id: typeForm.id })
      }
      typeDialogVisible.value = false
      currentType.value = undefined
      await loadTypes()
    } finally {
      submitLoading.value = false
    }
  }

  const handleSubmitItem = async () => {
    await itemFormRef.value?.validate()
    try {
      submitLoading.value = true
      if (itemDialogType.value === 'create') {
        await createDictItem(itemForm)
      } else {
        await updateDictItem({ ...itemForm, id: itemForm.id })
      }
      itemDialogVisible.value = false
      await loadItems()
    } finally {
      submitLoading.value = false
    }
  }

  const handleDeleteType = async (row: DictTypeItem) => {
    await ElMessageBox.confirm(`确定删除字典「${row.name}」吗？`, '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await deleteDictType({ id: row.id })
    currentType.value = undefined
    await loadTypes()
  }

  const handleDeleteItem = async (row: DictItem) => {
    await ElMessageBox.confirm(`确定删除字典项「${row.label}」吗？`, '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await deleteDictItem({ id: row.id })
    await loadItems()
  }
</script>

<style scoped lang="scss">
  .dict-page {
    min-height: 0;
  }

  .panel {
    height: 100%;
    min-height: 420px;
    padding: 16px;
    overflow: hidden;
    background: var(--el-bg-color);
    border: 1px solid var(--el-border-color-light);
    border-radius: 6px;
  }

  .toolbar {
    display: flex;
    gap: 8px;
    margin-bottom: 12px;
  }

  .dict-type-name {
    display: flex;
    flex-direction: column;
    gap: 3px;

    span:last-child {
      font-size: 12px;
      color: var(--el-text-color-secondary);
    }
  }
</style>
