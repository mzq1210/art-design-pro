<template>
  <div class="dingtalk-employee-page">
    <section class="page-panel">
      <div class="toolbar">
        <ElInput
          v-model="searchForm.keyword"
          clearable
          placeholder="姓名 / 手机 / 邮箱 / userid"
          @keyup.enter="loadData"
        />
        <ElInputNumber
          v-model="syncForm.department_id"
          :min="0"
          controls-position="right"
          placeholder="部门ID"
        />
        <ElSwitch
          v-model="syncForm.recursive"
          active-text="递归"
          inactive-text="当前部门"
          inline-prompt
        />
        <ElButton type="primary" @click="loadData">查询</ElButton>
        <ElButton @click="resetSearch">重置</ElButton>
        <ElButton
          v-if="hasAuth('dingtalk.employee.sync')"
          type="primary"
          :loading="syncLoading"
          @click="handleSync"
        >
          同步员工
        </ElButton>
      </div>

      <ElAlert
        :closable="false"
        class="sync-tip"
        show-icon
        title="同步只读取钉钉通讯录，不会修改钉钉数据；本地只新增或更新 user、oa_employee。"
        type="info"
      />

      <ElTable v-loading="loading" :data="records" row-key="id">
        <ElTableColumn label="员工" min-width="180">
          <template #default="{ row }">
            <div class="employee-cell">
              <ElAvatar :size="32" :src="row.avatar">
                {{ row.name.slice(0, 1) }}
              </ElAvatar>
              <div>
                <div>{{ row.name }}</div>
                <div class="muted">{{ row.position || '-' }}</div>
              </div>
            </div>
          </template>
        </ElTableColumn>
        <ElTableColumn label="钉钉 UserId" min-width="180" prop="dingtalk_userid" />
        <ElTableColumn label="绑定用户" min-width="130">
          <template #default="{ row }">
            <div>{{ row.username || '-' }}</div>
            <div class="muted">ID: {{ row.user_id || '-' }}</div>
          </template>
        </ElTableColumn>
        <ElTableColumn label="手机" width="130" prop="mobile" />
        <ElTableColumn label="邮箱" min-width="180" prop="email" />
        <ElTableColumn label="部门ID" min-width="150">
          <template #default="{ row }">
            <span class="one-line">{{ row.department_ids.join('、') || '-' }}</span>
          </template>
        </ElTableColumn>
        <ElTableColumn label="状态" width="90">
          <template #default="{ row }">
            <ElTag :type="row.status === 1 ? 'success' : 'info'">
              {{ row.status === 1 ? '在职' : '禁用' }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="同步时间" width="170">
          <template #default="{ row }">{{ formatTime(row.synced_at) }}</template>
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
  </div>
</template>

<script setup lang="ts">
  import { ElMessage, ElMessageBox } from 'element-plus'
  import {
    fetchDingTalkEmployees,
    syncDingTalkEmployees,
    type DingTalkEmployeeItem
  } from '@/api/dingtalk'
  import { useAuth } from '@/hooks/core/useAuth'

  defineOptions({ name: 'DingTalkEmployee' })

  const { hasAuth } = useAuth()
  const loading = ref(false)
  const syncLoading = ref(false)
  const records = ref<DingTalkEmployeeItem[]>([])
  const searchForm = reactive({
    keyword: ''
  })
  const syncForm = reactive({
    department_id: 0,
    recursive: true
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
      const res = await fetchDingTalkEmployees({
        page: pagination.page,
        size: pagination.size,
        keyword: searchForm.keyword || undefined
      })
      records.value = res.records
      pagination.total = res.total
    } finally {
      loading.value = false
    }
  }

  function resetSearch() {
    searchForm.keyword = ''
    pagination.page = 1
    loadData()
  }

  async function handleSync() {
    await ElMessageBox.confirm(
      '同步会读取钉钉通讯录并写入本地用户和员工映射，确定继续吗？',
      '同步员工',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    try {
      syncLoading.value = true
      const result = await syncDingTalkEmployees({
        department_id: syncForm.department_id,
        recursive: syncForm.recursive
      })
      ElMessage.success(`同步任务已提交，任务ID：${result.task_id}`)
      await loadData()
    } finally {
      syncLoading.value = false
    }
  }

  function formatTime(timestamp?: number | null) {
    if (!timestamp) return '-'
    return new Date(timestamp * 1000).toLocaleString()
  }
</script>

<style scoped lang="scss">
  .dingtalk-employee-page {
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
    grid-template-columns: minmax(220px, 300px) 150px 140px auto auto auto;
    gap: 8px;
    margin-bottom: 12px;
  }

  .sync-tip {
    margin-bottom: 12px;
  }

  .employee-cell {
    display: flex;
    gap: 10px;
    align-items: center;
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

  .pagination {
    display: flex;
    justify-content: flex-end;
    margin-top: 14px;
  }
</style>
