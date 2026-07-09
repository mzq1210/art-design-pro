<template>
  <div class="contract-detail-page art-full-height px-5">
    <div class="detail-toolbar">
      <div class="toolbar-title">合同详情</div>
    </div>

    <ElSkeleton v-if="loading" :rows="10" animated />
    <template v-else-if="detail">
      <section class="detail-hero">
        <div class="hero-main">
          <div class="hero-title-row">
            <h1>{{ detail.contract_name }}</h1>
            <div class="hero-tags">
              <ElTag :type="statusMap[detail.status]?.type || 'info'">
                {{ statusMap[detail.status]?.label || '-' }}
              </ElTag>
              <ElTag :type="approvalStatusMap[detail.approval_status]?.type || 'info'">
                {{ approvalStatusMap[detail.approval_status]?.label || '未提交审批' }}
              </ElTag>
            </div>
          </div>
          <div class="hero-meta">
            <span>{{ detail.contract_no || '无合同编号' }}</span>
            <span>{{ contractTypeMap[detail.contract_type] || '-' }}</span>
            <span>{{ detail.customer_name || '未选择客户' }}</span>
            <span>{{ detail.owner_name || '未设置负责人' }}</span>
            <span>{{ detail.sign_date || '未签订' }}</span>
          </div>
        </div>

        <div class="summary-grid">
          <div class="summary-item">
            <div class="summary-label">产品数</div>
            <div class="summary-value">{{ detail.products.length }}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">回款计划</div>
            <div class="summary-value">{{ detail.receivable_plans.length }}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">产品金额</div>
            <div class="summary-value money">{{ formatMoney(detail.total_amount) }}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">合同金额</div>
            <div class="summary-value money">{{ formatMoney(detail.final_amount) }}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">已回款</div>
            <div class="summary-value money success">{{ formatMoney(detail.received_amount) }}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">待回款</div>
            <div class="summary-value money warning">{{ formatMoney(detail.pending_amount) }}</div>
          </div>
        </div>
      </section>

      <section class="detail-tabs-wrap">
        <ElTabs class="detail-tabs">
          <ElTabPane>
            <template #label>
              <span class="tab-label">基本资料</span>
            </template>
            <div class="content-panel">
              <ElDescriptions :column="3" border>
                <ElDescriptionsItem label="合同编号">{{
                  detail.contract_no || '-'
                }}</ElDescriptionsItem>
                <ElDescriptionsItem label="合同名称">{{
                  detail.contract_name || '-'
                }}</ElDescriptionsItem>
                <ElDescriptionsItem label="客户">{{
                  detail.customer_name || '-'
                }}</ElDescriptionsItem>
                <ElDescriptionsItem label="负责人">{{
                  detail.owner_name || '-'
                }}</ElDescriptionsItem>
                <ElDescriptionsItem label="合同类型">{{
                  contractTypeMap[detail.contract_type] || '-'
                }}</ElDescriptionsItem>
                <ElDescriptionsItem v-if="!isFrameworkContract" label="关联框架协议">{{
                  detail.parent_contract_name || '-'
                }}</ElDescriptionsItem>
                <ElDescriptionsItem label="签订日期">{{
                  detail.sign_date || '-'
                }}</ElDescriptionsItem>
                <ElDescriptionsItem label="开始日期">{{
                  detail.start_date || '-'
                }}</ElDescriptionsItem>
                <ElDescriptionsItem label="结束日期">{{
                  detail.end_date || '-'
                }}</ElDescriptionsItem>
                <ElDescriptionsItem label="归档状态">
                  {{ detail.archive_status === 1 ? '已归档' : '未归档' }}
                </ElDescriptionsItem>
                <ElDescriptionsItem label="产品金额">{{
                  formatMoney(detail.total_amount)
                }}</ElDescriptionsItem>
                <ElDescriptionsItem label="优惠金额">{{
                  formatMoney(detail.discount_amount)
                }}</ElDescriptionsItem>
                <ElDescriptionsItem label="税率"
                  >{{ Number(detail.tax_rate || 0).toFixed(2) }}%</ElDescriptionsItem
                >
                <ElDescriptionsItem label="税额">{{
                  formatMoney(detail.tax_amount)
                }}</ElDescriptionsItem>
                <ElDescriptionsItem label="最终金额">{{
                  formatMoney(detail.final_amount)
                }}</ElDescriptionsItem>
                <ElDescriptionsItem label="开票金额">{{
                  formatMoney(detail.invoice_amount)
                }}</ElDescriptionsItem>
                <ElDescriptionsItem v-if="isFrameworkContract" label="合作范围" :span="3">{{
                  detail.framework_scope || '-'
                }}</ElDescriptionsItem>
                <ElDescriptionsItem v-if="!isFrameworkContract" label="已回款">{{
                  formatMoney(detail.received_amount)
                }}</ElDescriptionsItem>
                <ElDescriptionsItem v-if="!isFrameworkContract" label="待回款">{{
                  formatMoney(detail.pending_amount)
                }}</ElDescriptionsItem>
                <ElDescriptionsItem label="创建时间">{{
                  formatDateTime(detail.created_at)
                }}</ElDescriptionsItem>
                <ElDescriptionsItem label="备注" :span="3">{{
                  detail.remark || '-'
                }}</ElDescriptionsItem>
              </ElDescriptions>
            </div>
          </ElTabPane>

          <ElTabPane v-if="!isFrameworkContract">
            <template #label>
              <span class="tab-label"
                >合同产品 <em>{{ detail.products.length }}</em></span
              >
            </template>
            <ElTable :data="detail.products" border>
              <ElTableColumn
                prop="product_name"
                label="产品"
                min-width="180"
                show-overflow-tooltip
              />
              <ElTableColumn prop="media_name" label="媒体" min-width="130" show-overflow-tooltip />
              <ElTableColumn prop="ad_type" label="广告形式" min-width="120" />
              <ElTableColumn prop="unit" label="单位" width="90" />
              <ElTableColumn label="刊例价" width="120">
                <template #default="{ row }">{{ formatMoney(row.list_price) }}</template>
              </ElTableColumn>
              <ElTableColumn label="销售价" width="120">
                <template #default="{ row }">{{ formatMoney(row.sale_price) }}</template>
              </ElTableColumn>
              <ElTableColumn prop="quantity" label="数量" width="100" />
              <ElTableColumn prop="executed_quantity" label="已履约" width="100" />
              <ElTableColumn label="金额" width="130">
                <template #default="{ row }">{{ formatMoney(row.amount) }}</template>
              </ElTableColumn>
              <ElTableColumn label="周期" min-width="180">
                <template #default="{ row }"
                  >{{ row.start_date || '-' }} 至 {{ row.end_date || '-' }}</template
                >
              </ElTableColumn>
              <ElTableColumn
                prop="delivery_requirements"
                label="履约要求"
                min-width="220"
                show-overflow-tooltip
              />
            </ElTable>
          </ElTabPane>

          <ElTabPane v-if="!isFrameworkContract">
            <template #label>
              <span class="tab-label"
                >合同成本 <em>{{ detail.costs.length }}</em></span
              >
            </template>
            <ElTable :data="detail.costs" border>
              <ElTableColumn prop="cost_date" label="成本日期" width="120" />
              <ElTableColumn prop="cost_type" label="成本类型" width="120" />
              <ElTableColumn
                prop="product_name"
                label="产品名称"
                min-width="180"
                show-overflow-tooltip
              />
              <ElTableColumn label="成本金额" width="130">
                <template #default="{ row }">{{ formatMoney(row.amount) }}</template>
              </ElTableColumn>
              <ElTableColumn prop="reason" label="事由" min-width="220" show-overflow-tooltip />
              <ElTableColumn prop="remark" label="备注" min-width="180" show-overflow-tooltip />
            </ElTable>
            <div class="cost-total">成本合计：{{ formatMoney(contractCostTotal) }}</div>
          </ElTabPane>

          <ElTabPane v-if="!isFrameworkContract">
            <template #label>
              <span class="tab-label"
                >回款计划 <em>{{ detail.receivable_plans.length }}</em></span
              >
            </template>
            <ElTable :data="detail.receivable_plans" border>
              <ElTableColumn prop="plan_no" label="计划编号" min-width="150" />
              <ElTableColumn
                prop="plan_name"
                label="计划名称"
                min-width="180"
                show-overflow-tooltip
              />
              <ElTableColumn prop="plan_date" label="计划日期" width="120" />
              <ElTableColumn label="计划金额" width="130">
                <template #default="{ row }">{{ formatMoney(row.plan_amount) }}</template>
              </ElTableColumn>
              <ElTableColumn label="已回款" width="130">
                <template #default="{ row }">{{ formatMoney(row.received_amount) }}</template>
              </ElTableColumn>
              <ElTableColumn label="待回款" width="130">
                <template #default="{ row }">{{ formatMoney(row.pending_amount) }}</template>
              </ElTableColumn>
              <ElTableColumn label="开票金额" width="130">
                <template #default="{ row }">{{ formatMoney(row.invoice_amount) }}</template>
              </ElTableColumn>
              <ElTableColumn label="状态" width="100">
                <template #default="{ row }">
                  <ElTag :type="planStatusMap[row.status]?.type || 'info'">
                    {{ planStatusMap[row.status]?.label || '-' }}
                  </ElTag>
                </template>
              </ElTableColumn>
              <ElTableColumn prop="remark" label="备注" min-width="180" show-overflow-tooltip />
            </ElTable>
          </ElTabPane>
        </ElTabs>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
  import { useRoute } from 'vue-router'
  import { fetchContractDetail, type ContractItem, type ContractStatus } from '@/api/contract'

  defineOptions({ name: 'ContractDetail' })

  const route = useRoute()
  const loading = ref(false)
  const detail = ref<ContractItem>()
  const isFrameworkContract = computed(() => detail.value?.contract_type === 2)
  const contractCostTotal = computed(() =>
    (detail.value?.costs || []).reduce((total, item) => total + Number(item.amount || 0), 0)
  )

  const contractTypeMap: Record<number, string> = {
    1: '销售合同',
    2: '框架协议',
    3: '补充协议'
  }

  const statusMap: Record<
    ContractStatus,
    { label: string; type: 'success' | 'warning' | 'primary' | 'danger' }
  > = {
    1: { label: '草稿', type: 'warning' },
    2: { label: '执行中', type: 'primary' },
    3: { label: '已完成', type: 'success' },
    4: { label: '已作废', type: 'danger' }
  }

  const approvalStatusMap: Record<
    number,
    { label: string; type: 'success' | 'warning' | 'primary' | 'danger' | 'info' }
  > = {
    0: { label: '未提交审批', type: 'info' },
    1: { label: '审批中', type: 'warning' },
    2: { label: '审批通过', type: 'success' },
    3: { label: '审批驳回', type: 'danger' }
  }

  const planStatusMap: Record<
    number,
    { label: string; type: 'success' | 'warning' | 'primary' | 'danger' | 'info' }
  > = {
    1: { label: '待回款', type: 'warning' },
    2: { label: '部分回款', type: 'primary' },
    3: { label: '已回款', type: 'success' },
    4: { label: '已作废', type: 'danger' }
  }

  function formatMoney(value: number | string) {
    return Number(value || 0).toLocaleString('zh-CN', {
      style: 'currency',
      currency: 'CNY',
      minimumFractionDigits: 2
    })
  }

  function formatDateTime(timestamp: number) {
    return timestamp ? new Date(timestamp * 1000).toLocaleString() : '-'
  }

  async function loadDetail() {
    const id = Number(route.query.id || 0)
    if (!id) return
    loading.value = true
    try {
      detail.value = await fetchContractDetail({ id })
    } finally {
      loading.value = false
    }
  }

  onMounted(loadDetail)
  watch(() => route.query.id, loadDetail)
</script>

<style scoped lang="scss">
  .contract-detail-page {
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-width: 0;
    padding-top: 10px;
    padding-bottom: 20px;
  }

  .detail-toolbar {
    display: flex;
    align-items: center;
    height: 36px;
    color: var(--el-text-color-primary);
  }

  .back-button {
    display: inline-flex;
    align-items: center;
    height: 32px;
    padding: 0 10px 0 6px;
    color: var(--el-text-color-regular);
    cursor: pointer;
    background: transparent;
    border: 0;
    border-radius: 6px;
    transition:
      background-color 0.2s,
      color 0.2s;

    span {
      margin-left: 4px;
      font-size: 14px;
    }

    &:hover {
      color: var(--el-color-primary);
      background: var(--el-fill-color-light);
    }
  }

  .toolbar-divider {
    width: 1px;
    height: 18px;
    margin: 0 14px;
    background: var(--el-border-color);
  }

  .toolbar-title {
    font-size: 16px;
    font-weight: 600;
  }

  .detail-hero {
    min-width: 0;
    padding: 20px 22px;
    overflow: hidden;
    background: var(--el-bg-color);
    border: 1px solid var(--el-border-color-light);
    border-radius: 8px;
  }

  .hero-main {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding-bottom: 18px;
    margin-bottom: 18px;
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  .hero-title-row {
    display: flex;
    gap: 16px;
    align-items: flex-start;
    justify-content: space-between;

    h1 {
      min-width: 0;
      margin: 0;
      overflow: hidden;
      font-size: 22px;
      font-weight: 700;
      line-height: 32px;
      color: var(--el-text-color-primary);
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .hero-tags {
    display: flex;
    flex-shrink: 0;
    gap: 8px;
    align-items: center;
  }

  .hero-meta {
    display: flex;
    flex-wrap: wrap;
    color: var(--el-text-color-secondary);

    span {
      position: relative;
      padding-right: 14px;
      margin-right: 14px;
      font-size: 13px;
      line-height: 20px;

      &::after {
        position: absolute;
        top: 4px;
        right: 0;
        width: 1px;
        height: 12px;
        content: '';
        background: var(--el-border-color);
      }

      &:last-child {
        padding-right: 0;
        margin-right: 0;

        &::after {
          display: none;
        }
      }
    }
  }

  .summary-grid {
    display: grid;
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: 12px;
  }

  .summary-item {
    min-width: 0;
    min-height: 94px;
    padding: 15px 16px;
    background: var(--el-fill-color-extra-light);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 8px;
  }

  .summary-label {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  .summary-value {
    margin-top: 8px;
    overflow: hidden;
    font-size: 22px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .summary-value.money {
    font-size: 18px;
  }

  .summary-value.success {
    color: var(--el-color-success);
  }

  .summary-value.warning {
    color: var(--el-color-warning);
  }

  .detail-tabs-wrap {
    min-width: 0;
    padding: 0 20px 20px;
    overflow: hidden;
    background: var(--el-bg-color);
    border: 1px solid var(--el-border-color-light);
    border-radius: 8px;
  }

  .detail-tabs {
    :deep(.el-tabs__header) {
      margin: 0 0 18px;
    }

    :deep(.el-tabs__nav-wrap::after) {
      height: 1px;
      background: var(--el-border-color-lighter);
    }

    :deep(.el-tabs__item) {
      height: 52px;
      padding: 0 16px;
      font-weight: 500;
      color: var(--el-text-color-regular);
    }

    :deep(.el-tabs__item.is-active) {
      color: var(--el-color-primary);
    }

    :deep(.el-tabs__content) {
      min-height: 240px;
    }
  }

  .tab-label {
    display: inline-flex;
    gap: 6px;
    align-items: center;

    em {
      min-width: 18px;
      height: 18px;
      padding: 0 6px;
      font-size: 12px;
      font-style: normal;
      line-height: 18px;
      color: var(--el-text-color-secondary);
      text-align: center;
      background: var(--el-fill-color-light);
      border-radius: 9px;
    }
  }

  .content-panel {
    overflow: hidden;
    border-radius: 6px;
  }

  .cost-total {
    padding-top: 12px;
    font-size: 14px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    text-align: right;
  }

  @media (width <= 900px) {
    .detail-hero {
      padding: 18px;
    }

    .hero-title-row {
      flex-direction: column;
      gap: 10px;
    }

    .hero-title-row h1 {
      white-space: normal;
    }

    .summary-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
</style>
