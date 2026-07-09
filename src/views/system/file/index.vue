<template>
  <div class="file-page art-full-height">
    <ElRow :gutter="12" class="h-full">
      <ElCol :lg="7" :md="8" :sm="24">
        <section class="panel">
          <div class="toolbar">
            <ElInput
              v-model="groupKeyword"
              clearable
              placeholder="分组名称或编码"
              @keyup.enter="loadGroups"
            />
            <ElButton type="primary" @click="loadGroups">查询</ElButton>
          </div>

          <div class="toolbar">
            <ElButton
              v-if="hasAuth('file.group.create')"
              type="primary"
              @click="openGroupDialog('create')"
            >
              新增分组
            </ElButton>
            <ElButton @click="selectGroup(undefined)">全部文件</ElButton>
          </div>

          <ElTable
            v-loading="groupLoading"
            :data="groups"
            highlight-current-row
            row-key="id"
            @current-change="selectGroup"
          >
            <ElTableColumn label="分组" min-width="150">
              <template #default="{ row }">
                <div class="group-name">
                  <span>{{ row.name }}</span>
                  <span>{{ row.code }}</span>
                </div>
              </template>
            </ElTableColumn>
            <ElTableColumn fixed="right" label="操作" width="92">
              <template #default="{ row }">
                <ArtButtonTable
                  v-if="hasAuth('file.group.update')"
                  type="edit"
                  @click.stop="openGroupDialog('update', row)"
                />
                <ArtButtonTable
                  v-if="hasAuth('file.group.delete')"
                  type="delete"
                  @click.stop="handleDeleteGroup(row)"
                />
              </template>
            </ElTableColumn>
          </ElTable>
        </section>
      </ElCol>

      <ElCol :lg="17" :md="16" :sm="24">
        <section class="panel">
          <div class="toolbar">
            <ElInput
              v-model="fileKeyword"
              clearable
              placeholder="文件名或场景"
              @keyup.enter="loadFiles"
            />
            <ElButton type="primary" @click="loadFiles">查询</ElButton>
            <ElUpload
              v-if="hasAuth('file.upload')"
              :auto-upload="false"
              :show-file-list="false"
              :on-change="handleUploadChange"
            >
              <ElButton type="success">上传文件</ElButton>
            </ElUpload>
          </div>

          <div class="current-group"> 当前分组：{{ currentGroup?.name || '全部文件' }} </div>

          <ElScrollbar v-loading="fileLoading" height="calc(100vh - 280px)">
            <div class="file-grid">
              <article v-for="file in files" :key="file.id" class="file-item">
                <div class="file-icon">
                  <img v-if="isImage(file)" :src="file.url" :alt="file.name" />
                  <span v-else>{{ file.extension.toUpperCase() }}</span>
                </div>
                <div class="file-meta">
                  <a :href="file.url" target="_blank" rel="noreferrer">{{ file.name }}</a>
                  <span>{{ formatSize(file.size) }} · {{ file.scene }}</span>
                </div>
                <div class="file-actions">
                  <ElButton
                    v-if="hasAuth('file.update')"
                    size="small"
                    @click="openFileDialog(file)"
                  >
                    移动
                  </ElButton>
                  <ElButton
                    v-if="hasAuth('file.delete')"
                    size="small"
                    type="danger"
                    @click="handleDeleteFile(file)"
                  >
                    删除
                  </ElButton>
                </div>
              </article>
            </div>
            <ElEmpty v-if="!fileLoading && files.length === 0" description="暂无文件" />
          </ElScrollbar>

          <div class="pagination">
            <ElPagination
              v-model:current-page="pagination.page"
              v-model:page-size="pagination.size"
              :total="pagination.total"
              layout="total, sizes, prev, pager, next"
              @current-change="loadFiles"
              @size-change="loadFiles"
            />
          </div>
        </section>
      </ElCol>
    </ElRow>

    <ElDialog
      v-model="groupDialogVisible"
      :title="groupDialogType === 'create' ? '新增文件分组' : '修改文件分组'"
      width="520px"
      @closed="resetGroupForm"
    >
      <ElForm ref="groupFormRef" :model="groupForm" :rules="groupRules" label-width="86px">
        <ElFormItem label="名称" prop="name">
          <ElInput v-model="groupForm.name" placeholder="如 商品图片" />
        </ElFormItem>
        <ElFormItem label="编码" prop="code">
          <ElInput v-model="groupForm.code" placeholder="如 product" />
        </ElFormItem>
        <ElFormItem label="排序">
          <ElInputNumber v-model="groupForm.sort" :min="0" controls-position="right" />
        </ElFormItem>
        <ElFormItem label="备注">
          <ElInput v-model="groupForm.remark" :rows="2" type="textarea" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="groupDialogVisible = false">取消</ElButton>
        <ElButton type="primary" :loading="submitLoading" @click="handleSubmitGroup">确定</ElButton>
      </template>
    </ElDialog>

    <ElDialog v-model="fileDialogVisible" title="移动文件" width="460px">
      <ElForm label-width="86px">
        <ElFormItem label="文件分组">
          <ElSelect v-model="fileForm.group_id" class="w-full" clearable placeholder="未分组">
            <ElOption
              v-for="group in groups"
              :key="group.id"
              :label="group.name"
              :value="group.id"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="备注">
          <ElInput v-model="fileForm.remark" :rows="2" type="textarea" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="fileDialogVisible = false">取消</ElButton>
        <ElButton type="primary" :loading="submitLoading" @click="handleSubmitFile">确定</ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
  import {
    ElMessage,
    ElMessageBox,
    type FormInstance,
    type FormRules,
    type UploadFile
  } from 'element-plus'
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import { useAuth } from '@/hooks/core/useAuth'
  import {
    createFileGroup,
    deleteFile,
    deleteFileGroup,
    fetchFileGroups,
    fetchFiles,
    updateFile,
    updateFileGroup,
    uploadManagedFile,
    type FileAttachmentItem,
    type FileGroupItem
  } from '@/api/file'

  defineOptions({ name: 'File' })

  type DialogType = 'create' | 'update'

  const { hasAuth } = useAuth()
  const groupLoading = ref(false)
  const fileLoading = ref(false)
  const submitLoading = ref(false)
  const groupKeyword = ref('')
  const fileKeyword = ref('')
  const groups = ref<FileGroupItem[]>([])
  const files = ref<FileAttachmentItem[]>([])
  const currentGroup = ref<FileGroupItem>()
  const groupDialogVisible = ref(false)
  const fileDialogVisible = ref(false)
  const groupDialogType = ref<DialogType>('create')
  const groupFormRef = ref<FormInstance>()
  const currentFile = ref<FileAttachmentItem>()

  const pagination = reactive({
    page: 1,
    size: 12,
    total: 0
  })

  const groupForm = reactive({
    id: 0,
    name: '',
    code: '',
    sort: 0,
    remark: ''
  })

  const fileForm = reactive({
    group_id: '' as number | '',
    remark: ''
  })

  const groupRules: FormRules = {
    name: [{ required: true, message: '请输入分组名称', trigger: 'blur' }],
    code: [{ required: true, message: '请输入分组编码', trigger: 'blur' }]
  }

  onMounted(async () => {
    await Promise.all([loadGroups(), loadFiles()])
  })

  const loadGroups = async () => {
    try {
      groupLoading.value = true
      const res = await fetchFileGroups({ keyword: groupKeyword.value || undefined })
      groups.value = res.records
    } finally {
      groupLoading.value = false
    }
  }

  const loadFiles = async () => {
    try {
      fileLoading.value = true
      const res = await fetchFiles({
        page: pagination.page,
        size: pagination.size,
        group_id: currentGroup.value?.id ?? '',
        keyword: fileKeyword.value || undefined
      })
      files.value = res.records
      pagination.total = res.total
    } finally {
      fileLoading.value = false
    }
  }

  const selectGroup = async (row?: FileGroupItem) => {
    currentGroup.value = row
    pagination.page = 1
    await loadFiles()
  }

  const openGroupDialog = (type: DialogType, row?: FileGroupItem) => {
    groupDialogType.value = type
    if (type === 'create') {
      resetGroupForm()
    } else if (row) {
      Object.assign(groupForm, row)
    }
    groupDialogVisible.value = true
  }

  const resetGroupForm = () => {
    Object.assign(groupForm, { id: 0, name: '', code: '', sort: 0, remark: '' })
    groupFormRef.value?.clearValidate()
  }

  const handleSubmitGroup = async () => {
    await groupFormRef.value?.validate()
    try {
      submitLoading.value = true
      if (groupDialogType.value === 'create') {
        await createFileGroup(groupForm)
      } else {
        await updateFileGroup({ ...groupForm, id: groupForm.id })
      }
      groupDialogVisible.value = false
      await loadGroups()
    } finally {
      submitLoading.value = false
    }
  }

  const handleDeleteGroup = async (row: FileGroupItem) => {
    await ElMessageBox.confirm(`确定删除分组「${row.name}」吗？`, '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await deleteFileGroup({ id: row.id })
    if (currentGroup.value?.id === row.id) {
      currentGroup.value = undefined
    }
    await Promise.all([loadGroups(), loadFiles()])
  }

  const handleUploadChange = async (uploadFile: UploadFile) => {
    if (!uploadFile.raw) return

    try {
      fileLoading.value = true
      await uploadManagedFile(uploadFile.raw, currentGroup.value?.id || 0)
      ElMessage.success('上传成功')
      await loadFiles()
    } finally {
      fileLoading.value = false
    }
  }

  const openFileDialog = (file: FileAttachmentItem) => {
    currentFile.value = file
    fileForm.group_id = file.group_id || ''
    fileForm.remark = file.remark || ''
    fileDialogVisible.value = true
  }

  const handleSubmitFile = async () => {
    if (!currentFile.value) return

    try {
      submitLoading.value = true
      await updateFile({
        id: currentFile.value.id,
        group_id: fileForm.group_id || 0,
        remark: fileForm.remark
      })
      fileDialogVisible.value = false
      await loadFiles()
    } finally {
      submitLoading.value = false
    }
  }

  const handleDeleteFile = async (file: FileAttachmentItem) => {
    await ElMessageBox.confirm(`确定删除文件「${file.name}」吗？`, '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await deleteFile({ id: file.id })
    await loadFiles()
  }

  const isImage = (file: FileAttachmentItem) =>
    ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(file.extension.toLowerCase())

  const formatSize = (size: number) => {
    if (size < 1024) return `${size} B`
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
    return `${(size / 1024 / 1024).toFixed(1)} MB`
  }
</script>

<style scoped lang="scss">
  .file-page {
    min-height: 0;
  }

  .panel {
    height: 100%;
    min-height: 460px;
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

  .current-group {
    margin-bottom: 12px;
    color: var(--el-text-color-secondary);
  }

  .group-name {
    display: flex;
    flex-direction: column;
    gap: 3px;

    span:last-child {
      font-size: 12px;
      color: var(--el-text-color-secondary);
    }
  }

  .file-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 12px;
  }

  .file-item {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 12px;
    border: 1px solid var(--el-border-color-light);
    border-radius: 6px;
  }

  .file-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 112px;
    overflow: hidden;
    color: var(--el-color-primary);
    background: var(--el-fill-color-light);
    border-radius: 4px;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    span {
      font-weight: 600;
    }
  }

  .file-meta {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;

    a {
      overflow: hidden;
      color: var(--el-text-color-primary);
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    span {
      font-size: 12px;
      color: var(--el-text-color-secondary);
    }
  }

  .file-actions {
    display: flex;
    gap: 8px;
  }

  .pagination {
    display: flex;
    justify-content: flex-end;
    margin-top: 12px;
  }
</style>
