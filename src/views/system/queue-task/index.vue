<template>
  <div class="queue-task-page">
    <section class="page-panel">
      <div class="toolbar">
        <ElInput
          v-model="searchForm.keyword"
          clearable
          placeholder="任务名称"
          @keyup.enter="loadData"
        />
        <ElSelect v-model="searchForm.status" clearable placeholder="状态">
          <ElOption label="等待" :value="0" />
          <ElOption label="执行中" :value="1" />
          <ElOption label="成功" :value="2" />
          <ElOption label="失败" :value="3" />
        </ElSelect>
        <ElButton type="primary" @click="loadData">查询</ElButton>
        <ElButton @click="resetSearch">重置</ElButton>
        <ElButton v-if="hasAuth('queue.create')" type="primary" @click="openCreateDialog">
          创建示例任务
        </ElButton>
      </div>

      <ElAlert
        :closable="false"
        class="worker-tip"
        show-icon
        title="队列任务需要在后端启动 worker：php yii queue/listen"
        type="info"
      />

      <ElTable v-loading="loading" :data="records" row-key="id">
        <ElTableColumn label="任务" min-width="180">
          <template #default="{ row }">
            <div>{{ row.name }}</div>
            <div class="muted">Job: {{ row.job_id || '-' }}</div>
          </template>
        </ElTableColumn>
        <ElTableColumn label="状态" width="110">
          <template #default="{ row }">
            <ElTag :type="getStatus(row.status).type">{{ getStatus(row.status).label }}</ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="次数" width="80" prop="attempts" />
        <ElTableColumn label="参数" min-width="140">
          <template #default="{ row }">
            <span class="one-line">{{ row.payload }}</span>
          </template>
        </ElTableColumn>
        <ElTableColumn label="结果 / 错误" min-width="180">
          <template #default="{ row }">
            <div class="one-line">{{ row.result || row.error || '-' }}</div>
          </template>
        </ElTableColumn>
        <ElTableColumn label="创建时间" width="170">
          <template #default="{ row }">{{ formatTime(row.created_at) }}</template>
        </ElTableColumn>
        <ElTableColumn fixed="right" label="操作" width="140">
          <template #default="{ row }">
            <ArtButtonTable
              v-if="hasAuth('queue.create') && row.status === 3"
              icon="ri:refresh-line"
              icon-class="bg-warning/12 text-warning"
              @click="handleRetry(row)"
            />
            <ArtButtonTable
              v-if="hasAuth('queue.delete')"
              type="delete"
              @click="handleDelete(row)"
            />
          </template>
        </ElTableColumn>
      </ElTable>

      <div class="pagination">
        <ElPagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.size"
          :page-sizes="[10, 15, 30, 50]"
          :total="pagination.total"
          background
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadData"
          @current-change="loadData"
        />
      </div>
    </section>

    <ElDialog v-model="dialogVisible" title="创建队列示例任务" width="480px" @closed="resetForm">
      <ElForm ref="formRef" :model="form" :rules="rules" label-width="90px">
        <ElFormItem label="任务名称" prop="name">
          <ElInput v-model="form.name" />
        </ElFormItem>
        <ElFormItem label="模拟耗时">
          <ElInputNumber v-model="form.seconds" :min="1" :max="10" controls-position="right" />
          <span class="seconds-unit">秒</span>
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
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import { useAuth } from '@/hooks/core/useAuth'
  import {
    createDemoQueueTask,
    deleteQueueTask,
    fetchQueueTasks,
    retryQueueTask,
    type QueueTaskItem,
    type QueueTaskStatus
  } from '@/api/queue-task'

  defineOptions({ name: 'QueueTask' })

  const { hasAuth } = useAuth()
  const loading = ref(false)
  const submitLoading = ref(false)
  const dialogVisible = ref(false)
  const records = ref<QueueTaskItem[]>([])
  const formRef = ref<FormInstance>()
  const searchForm = reactive({
    keyword: '',
    status: '' as number | ''
  })
  const pagination = reactive({
    page: 1,
    size: 15,
    total: 0
  })
  const form = reactive({
    name: 'Demo queue task',
    seconds: 3
  })
  const rules: FormRules = {
    name: [{ required: true, message: '请输入任务名称', trigger: 'blur' }]
  }
  const statusMap: Record<
    QueueTaskStatus,
    { label: string; type: 'info' | 'warning' | 'success' | 'danger' }
  > = {
    0: { label: '等待', type: 'info' },
    1: { label: '执行中', type: 'warning' },
    2: { label: '成功', type: 'success' },
    3: { label: '失败', type: 'danger' }
  }

  onMounted(loadData)

  async function loadData() {
    try {
      loading.value = true
      const res = await fetchQueueTasks({
        page: pagination.page,
        size: pagination.size,
        keyword: searchForm.keyword || undefined,
        status: searchForm.status
      })
      records.value = res.records
      pagination.total = res.total
    } finally {
      loading.value = false
    }
  }

  function resetSearch() {
    searchForm.keyword = ''
    searchForm.status = ''
    pagination.page = 1
    loadData()
  }

  function openCreateDialog() {
    dialogVisible.value = true
  }

  function resetForm() {
    Object.assign(form, { name: 'Demo queue task', seconds: 3 })
    formRef.value?.clearValidate()
  }

  async function handleSubmit() {
    await formRef.value?.validate()
    try {
      submitLoading.value = true
      await createDemoQueueTask(form)
      dialogVisible.value = false
      await loadData()
    } finally {
      submitLoading.value = false
    }
  }

  async function handleRetry(row: QueueTaskItem) {
    await retryQueueTask({ id: row.id })
    await loadData()
  }

  async function handleDelete(row: QueueTaskItem) {
    await ElMessageBox.confirm(`确定删除任务「${row.name}」吗？`, '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await deleteQueueTask({ id: row.id })
    await loadData()
  }

  function formatTime(timestamp?: number | null) {
    if (!timestamp) return '-'
    return new Date(timestamp * 1000).toLocaleString()
  }

  function getStatus(status: QueueTaskStatus) {
    return statusMap[status] || statusMap[0]
  }
</script>

<style scoped lang="scss">
  .queue-task-page {
    min-height: 0;
  }

  .page-panel {
    padding: 16px;
    background: var(--el-bg-color);
    border: 1px solid var(--el-border-color-light);
    border-radius: 6px;
  }

  .toolbar {
    display: grid;
    grid-template-columns: minmax(180px, 260px) 120px auto auto auto;
    gap: 8px;
    margin-bottom: 12px;
  }

  .worker-tip {
    margin-bottom: 12px;
  }

  .pagination {
    display: flex;
    justify-content: flex-end;
    margin-top: 14px;
  }

  .muted {
    margin-top: 4px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  .one-line {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .seconds-unit {
    margin-left: 8px;
    color: var(--el-text-color-secondary);
  }
</style>
