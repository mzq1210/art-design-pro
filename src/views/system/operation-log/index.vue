<template>
  <div class="operation-log-page">
    <section class="page-panel">
      <div class="toolbar">
        <ElInput
          v-model="searchForm.keyword"
          clearable
          placeholder="用户名 / IP / 消息"
          @keyup.enter="loadData"
        />
        <ElInput
          v-model="searchForm.route"
          clearable
          placeholder="路由，如 user/create"
          @keyup.enter="loadData"
        />
        <ElSelect v-model="searchForm.status" clearable placeholder="状态">
          <ElOption label="成功" :value="1" />
          <ElOption label="失败" :value="0" />
        </ElSelect>
        <ElButton type="primary" @click="loadData">查询</ElButton>
        <ElButton @click="resetSearch">重置</ElButton>
        <ElButton v-if="hasAuth('operation-log.delete')" type="danger" @click="handleClear">
          清理30天前
        </ElButton>
      </div>

      <ElTable v-loading="loading" :data="records" row-key="id">
        <ElTableColumn label="用户" min-width="120">
          <template #default="{ row }">
            <div>{{ row.username || '-' }}</div>
            <div class="muted">ID: {{ row.user_id }}</div>
          </template>
        </ElTableColumn>
        <ElTableColumn label="路由" min-width="160">
          <template #default="{ row }">
            <ElTag effect="plain">{{ row.route }}</ElTag>
            <div v-if="row.permission" class="muted">{{ row.permission }}</div>
          </template>
        </ElTableColumn>
        <ElTableColumn label="请求" min-width="120">
          <template #default="{ row }">
            <div>{{ row.method }}</div>
            <div class="muted">{{ row.ip }}</div>
          </template>
        </ElTableColumn>
        <ElTableColumn label="状态" width="110">
          <template #default="{ row }">
            <ElTag :type="row.status === 1 ? 'success' : 'danger'">
              {{ row.status === 1 ? '成功' : '失败' }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="响应" min-width="150">
          <template #default="{ row }">
            <div>{{ row.response_code }}</div>
            <div class="muted one-line">{{ row.message }}</div>
          </template>
        </ElTableColumn>
        <ElTableColumn label="耗时" width="100">
          <template #default="{ row }">{{ row.duration }} ms</template>
        </ElTableColumn>
        <ElTableColumn label="时间" width="170">
          <template #default="{ row }">{{ formatTime(row.created_at) }}</template>
        </ElTableColumn>
        <ElTableColumn fixed="right" label="操作" width="120">
          <template #default="{ row }">
            <ArtButtonTable type="view" @click="openDetail(row)" />
            <ArtButtonTable
              v-if="hasAuth('operation-log.delete')"
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

    <ElDialog v-model="detailVisible" title="日志详情" width="760px">
      <ElDescriptions v-if="current" :column="2" border>
        <ElDescriptionsItem label="用户">{{ current.username || '-' }}</ElDescriptionsItem>
        <ElDescriptionsItem label="IP">{{ current.ip }}</ElDescriptionsItem>
        <ElDescriptionsItem label="路由">{{ current.route }}</ElDescriptionsItem>
        <ElDescriptionsItem label="权限">{{ current.permission || '-' }}</ElDescriptionsItem>
        <ElDescriptionsItem label="状态">
          {{ current.status === 1 ? '成功' : '失败' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="耗时">{{ current.duration }} ms</ElDescriptionsItem>
        <ElDescriptionsItem label="User-Agent" :span="2">
          {{ current.user_agent || '-' }}
        </ElDescriptionsItem>
      </ElDescriptions>
      <ElInput
        class="request-box"
        :model-value="prettyJson(current?.request_data)"
        :rows="10"
        readonly
        type="textarea"
      />
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
  import { ElMessageBox } from 'element-plus'
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import { useAuth } from '@/hooks/core/useAuth'
  import {
    clearOperationLogs,
    deleteOperationLog,
    fetchOperationLogs,
    type OperationLogItem
  } from '@/api/operation-log'

  defineOptions({ name: 'OperationLog' })

  const { hasAuth } = useAuth()
  const loading = ref(false)
  const detailVisible = ref(false)
  const records = ref<OperationLogItem[]>([])
  const current = ref<OperationLogItem>()
  const searchForm = reactive({
    keyword: '',
    route: '',
    status: '' as number | ''
  })
  const pagination = reactive({
    page: 1,
    size: 15,
    total: 0
  })

  onMounted(loadData)

  async function loadData() {
    try {
      loading.value = true
      const res = await fetchOperationLogs({
        page: pagination.page,
        size: pagination.size,
        keyword: searchForm.keyword || undefined,
        route: searchForm.route || undefined,
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
    searchForm.route = ''
    searchForm.status = ''
    pagination.page = 1
    loadData()
  }

  function openDetail(row: OperationLogItem) {
    current.value = row
    detailVisible.value = true
  }

  async function handleDelete(row: OperationLogItem) {
    await ElMessageBox.confirm(`确定删除日志 #${row.id} 吗？`, '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await deleteOperationLog({ id: row.id })
    await loadData()
  }

  async function handleClear() {
    await ElMessageBox.confirm('确定清理 30 天前的操作日志吗？', '清理确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await clearOperationLogs({ days: 30 })
    await loadData()
  }

  function formatTime(timestamp?: number) {
    if (!timestamp) return '-'
    return new Date(timestamp * 1000).toLocaleString()
  }

  function prettyJson(value?: string) {
    if (!value) return '{}'
    try {
      return JSON.stringify(JSON.parse(value), null, 2)
    } catch {
      return value
    }
  }
</script>

<style scoped lang="scss">
  .operation-log-page {
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
    grid-template-columns: minmax(160px, 240px) minmax(160px, 240px) 120px auto auto auto;
    gap: 8px;
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
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .request-box {
    margin-top: 16px;
  }
</style>
