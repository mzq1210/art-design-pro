<template>
  <div class="customer-detail-page art-full-height px-5">
    <div class="detail-toolbar">
      <div class="toolbar-title">客户详情</div>
    </div>

    <ElSkeleton v-if="loading" :rows="10" animated class="mt-4" />
    <template v-else-if="detail">
      <section class="detail-hero">
        <div class="hero-main">
          <div class="hero-title-row">
            <h1>{{ detail.customer.customer_name }}</h1>
            <div class="hero-tags">
              <ElTag :type="statusTypeMap[detail.customer.status]">
                {{ getOptionLabel(statusOptions, detail.customer.status) }}
              </ElTag>
              <ElTag type="primary">
                {{ getOptionLabel(followStatusOptions, detail.customer.follow_status) }}
              </ElTag>
            </div>
          </div>
          <div class="hero-meta">
            <span>{{ detail.customer.customer_code || '无客户编码' }}</span>
            <span>{{ detail.customer.owner_name || '未设置负责人' }}</span>
            <span>{{ detail.customer.industry || '未设置行业' }}</span>
            <span>{{ getOptionLabel(levelOptions, detail.customer.level) }}</span>
          </div>
        </div>

        <div class="summary-grid">
          <div class="summary-item">
            <div class="summary-label">合同数</div>
            <div class="summary-value">{{ detail.stats.contract_count }}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">联系人</div>
            <div class="summary-value">{{ detail.stats.contact_count }}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">跟进数</div>
            <div class="summary-value">{{ detail.stats.follow_count }}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">合同金额</div>
            <div class="summary-value money">{{ formatMoney(detail.stats.contract_amount) }}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">已回款</div>
            <div class="summary-value money success">{{
              formatMoney(detail.stats.received_amount)
            }}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">待回款</div>
            <div class="summary-value money warning">{{
              formatMoney(detail.stats.pending_amount)
            }}</div>
          </div>
        </div>
      </section>

      <div class="detail-layout">
        <section class="min-w-0">
          <ElTabs class="detail-tabs">
            <ElTabPane>
              <template #label>
                <span class="tab-label">基本资料</span>
              </template>
              <div class="content-panel">
                <ElDescriptions :column="3" border>
                  <ElDescriptionsItem label="客户名称">{{
                    detail.customer.customer_name
                  }}</ElDescriptionsItem>
                  <ElDescriptionsItem label="客户编码">{{
                    detail.customer.customer_code || '-'
                  }}</ElDescriptionsItem>
                  <ElDescriptionsItem label="客户类型">{{
                    getOptionLabel(typeOptions, detail.customer.customer_type)
                  }}</ElDescriptionsItem>
                  <ElDescriptionsItem label="客户等级">{{
                    getOptionLabel(levelOptions, detail.customer.level)
                  }}</ElDescriptionsItem>
                  <ElDescriptionsItem label="客户来源">{{
                    detail.customer.source || '-'
                  }}</ElDescriptionsItem>
                  <ElDescriptionsItem label="合作开始">{{
                    detail.customer.cooperation_start_date || '-'
                  }}</ElDescriptionsItem>
                  <ElDescriptionsItem label="负责人">{{
                    detail.customer.owner_name || '-'
                  }}</ElDescriptionsItem>
                  <ElDescriptionsItem label="负责人手机">{{
                    detail.customer.owner_mobile || '-'
                  }}</ElDescriptionsItem>
                  <ElDescriptionsItem label="最近跟进">{{
                    formatDateTime(detail.customer.latest_follow_time)
                  }}</ElDescriptionsItem>
                  <ElDescriptionsItem label="网站" :span="3">{{
                    detail.customer.website || '-'
                  }}</ElDescriptionsItem>
                  <ElDescriptionsItem label="地址" :span="3">{{
                    detail.customer.company_address || '-'
                  }}</ElDescriptionsItem>
                  <ElDescriptionsItem label="发票抬头">{{
                    detail.customer.invoice_title || '-'
                  }}</ElDescriptionsItem>
                  <ElDescriptionsItem label="税号">{{
                    detail.customer.taxpayer_no || '-'
                  }}</ElDescriptionsItem>
                  <ElDescriptionsItem label="开户行">{{
                    detail.customer.bank_name || '-'
                  }}</ElDescriptionsItem>
                  <ElDescriptionsItem label="银行账号" :span="3">{{
                    detail.customer.bank_account || '-'
                  }}</ElDescriptionsItem>
                  <ElDescriptionsItem label="备注" :span="3">{{
                    detail.customer.remark || '-'
                  }}</ElDescriptionsItem>
                </ElDescriptions>
              </div>
            </ElTabPane>

            <ElTabPane>
              <template #label>
                <span class="tab-label"
                  >联系人 <em>{{ detail.contacts.length }}</em></span
                >
              </template>
              <ElTable :data="detail.contacts" border>
                <ElTableColumn prop="contact_name" label="联系人" min-width="120" />
                <ElTableColumn prop="mobile" label="手机号" min-width="130" />
                <ElTableColumn prop="wechat" label="微信" min-width="130" />
                <ElTableColumn prop="email" label="邮箱" min-width="170" />
                <ElTableColumn prop="position" label="职位" min-width="120" />
                <ElTableColumn label="主联系人" width="100">
                  <template #default="{ row }">
                    <ElTag v-if="row.is_primary === 1" type="warning">是</ElTag>
                    <span v-else>-</span>
                  </template>
                </ElTableColumn>
                <ElTableColumn prop="remark" label="备注" min-width="180" />
              </ElTable>
            </ElTabPane>

            <ElTabPane>
              <template #label>
                <span class="tab-label"
                  >跟进记录 <em>{{ detail.follows.length }}</em></span
                >
              </template>
              <ElTable :data="detail.follows" border>
                <ElTableColumn label="跟进时间" width="170">
                  <template #default="{ row }">{{ formatDateTime(row.follow_time) }}</template>
                </ElTableColumn>
                <ElTableColumn prop="contact_name" label="联系人" width="120" />
                <ElTableColumn prop="owner_name" label="负责人" width="120" />
                <ElTableColumn label="阶段" width="120">
                  <template #default="{ row }">
                    {{ getOptionLabel(followStatusOptions, row.follow_status) }}
                  </template>
                </ElTableColumn>
                <ElTableColumn prop="content" label="内容" min-width="240" show-overflow-tooltip />
                <ElTableColumn prop="result" label="结果" min-width="200" show-overflow-tooltip />
                <ElTableColumn label="下次跟进" width="170">
                  <template #default="{ row }">{{ formatDateTime(row.next_follow_time) }}</template>
                </ElTableColumn>
              </ElTable>
            </ElTabPane>

            <ElTabPane>
              <template #label>
                <span class="tab-label"
                  >合同 <em>{{ detail.contracts.length }}</em></span
                >
              </template>
              <ElTable :data="detail.contracts" border>
                <ElTableColumn prop="contract_no" label="合同编号" min-width="150" />
                <ElTableColumn
                  prop="contract_name"
                  label="合同名称"
                  min-width="220"
                  show-overflow-tooltip
                />
                <ElTableColumn label="类型" width="110">
                  <template #default="{ row }">
                    <ElTag :type="contractTypeTagMap[row.contract_type] || 'primary'">
                      {{ contractTypeMap[row.contract_type] || '-' }}
                    </ElTag>
                  </template>
                </ElTableColumn>
                <ElTableColumn label="金额" width="130">
                  <template #default="{ row }">{{ formatMoney(row.final_amount) }}</template>
                </ElTableColumn>
                <ElTableColumn label="已回款" width="130">
                  <template #default="{ row }">{{ formatMoney(row.received_amount) }}</template>
                </ElTableColumn>
                <ElTableColumn label="待回款" width="130">
                  <template #default="{ row }">{{ formatMoney(row.pending_amount) }}</template>
                </ElTableColumn>
                <ElTableColumn label="周期" min-width="180">
                  <template #default="{ row }"
                    >{{ row.start_date || '-' }} 至 {{ row.end_date || '-' }}</template
                  >
                </ElTableColumn>
                <ElTableColumn label="状态" width="100">
                  <template #default="{ row }">
                    <ElTag :type="contractStatusMap[row.status]?.type || 'info'">
                      {{ contractStatusMap[row.status]?.label || '-' }}
                    </ElTag>
                  </template>
                </ElTableColumn>
                <ElTableColumn label="操作" width="90" fixed="right">
                  <template #default="{ row }">
                    <ArtButtonTable
                      type="view"
                      @click="router.push({ path: '/contract/detail', query: { id: row.id } })"
                    />
                  </template>
                </ElTableColumn>
              </ElTable>
            </ElTabPane>

            <ElTabPane>
              <template #label>
                <span class="tab-label"
                  >合同产品 <em>{{ detail.contract_products.length }}</em></span
                >
              </template>
              <ElTable :data="detail.contract_products" border>
                <ElTableColumn
                  prop="product_name"
                  label="产品"
                  min-width="180"
                  show-overflow-tooltip
                />
                <ElTableColumn
                  prop="media_name"
                  label="媒体"
                  min-width="130"
                  show-overflow-tooltip
                />
                <ElTableColumn prop="ad_type" label="广告形式" min-width="120" />
                <ElTableColumn prop="unit" label="单位" width="90" />
                <ElTableColumn label="单价" width="120">
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

            <ElTabPane>
              <template #label>
                <span class="tab-label">资金</span>
              </template>
              <div class="space-y-4">
                <ElCard shadow="never">
                  <template #header>回款计划</template>
                  <ElTable :data="detail.receivable_plans" border>
                    <ElTableColumn prop="plan_no" label="计划编号" min-width="150" />
                    <ElTableColumn
                      prop="plan_name"
                      label="计划名称"
                      min-width="180"
                      show-overflow-tooltip
                    />
                    <ElTableColumn prop="contract_no" label="合同编号" min-width="150" />
                    <ElTableColumn prop="owner_name" label="负责人" width="120" />
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
                  </ElTable>
                </ElCard>
                <ElCard shadow="never">
                  <template #header>回款记录</template>
                  <ElTable :data="detail.receivable_records" border>
                    <ElTableColumn prop="record_no" label="记录编号" min-width="150" />
                    <ElTableColumn prop="contract_no" label="合同编号" min-width="150" />
                    <ElTableColumn
                      prop="plan_name"
                      label="计划名称"
                      min-width="180"
                      show-overflow-tooltip
                    />
                    <ElTableColumn prop="owner_name" label="负责人" width="120" />
                    <ElTableColumn prop="receipt_date" label="回款日期" width="120" />
                    <ElTableColumn label="回款金额" width="130">
                      <template #default="{ row }">{{ formatMoney(row.receipt_amount) }}</template>
                    </ElTableColumn>
                    <ElTableColumn prop="receipt_method" label="回款方式" width="120" />
                    <ElTableColumn
                      prop="payer_name"
                      label="付款方"
                      min-width="160"
                      show-overflow-tooltip
                    />
                  </ElTable>
                </ElCard>
              </div>
            </ElTabPane>

            <ElTabPane>
              <template #label>
                <span class="tab-label"
                  >履约 <em>{{ detail.fulfillments.length }}</em></span
                >
              </template>
              <ElTable :data="detail.fulfillments" border>
                <ElTableColumn prop="fulfillment_no" label="履约单号" min-width="150" />
                <ElTableColumn prop="contract_no" label="合同编号" min-width="150" />
                <ElTableColumn
                  prop="product_name"
                  label="产品"
                  min-width="180"
                  show-overflow-tooltip
                />
                <ElTableColumn prop="owner_name" label="负责人" width="120" />
                <ElTableColumn prop="plan_date" label="计划日期" width="120" />
                <ElTableColumn prop="fulfillment_date" label="完成日期" width="120" />
                <ElTableColumn prop="execute_quantity" label="计划数量" width="100" />
                <ElTableColumn prop="executed_quantity" label="已执行" width="100" />
                <ElTableColumn label="金额" width="130">
                  <template #default="{ row }">{{ formatMoney(row.execute_amount) }}</template>
                </ElTableColumn>
                <ElTableColumn label="状态" width="100">
                  <template #default="{ row }">
                    <ElTag :type="fulfillmentStatusMap[row.status]?.type || 'info'">
                      {{ fulfillmentStatusMap[row.status]?.label || '-' }}
                    </ElTag>
                  </template>
                </ElTableColumn>
              </ElTable>
            </ElTabPane>

            <ElTabPane>
              <template #label>
                <span class="tab-label"
                  >稿件 <em>{{ detail.manuscripts.length }}</em></span
                >
              </template>
              <ElTable :data="detail.manuscripts" border>
                <ElTableColumn prop="manuscript_no" label="稿件编号" min-width="150" />
                <ElTableColumn prop="title" label="标题" min-width="220" show-overflow-tooltip />
                <ElTableColumn
                  prop="product_name"
                  label="产品"
                  min-width="160"
                  show-overflow-tooltip
                />
                <ElTableColumn label="类型" width="100">
                  <template #default="{ row }">{{
                    row.manuscript_type === 2 ? '客户稿' : '原创稿'
                  }}</template>
                </ElTableColumn>
                <ElTableColumn
                  prop="article_link"
                  label="链接"
                  min-width="220"
                  show-overflow-tooltip
                />
                <ElTableColumn label="创建时间" width="170">
                  <template #default="{ row }">{{ formatDateTime(row.created_at) }}</template>
                </ElTableColumn>
              </ElTable>
            </ElTabPane>
          </ElTabs>
        </section>

        <aside class="min-w-0">
          <ElCard shadow="never" class="detail-card timeline-card">
            <template #header>
              <div class="flex items-center justify-between">
                <span class="font-medium">动态</span>
                <ElTag type="info">{{ detail.timeline.length }}</ElTag>
              </div>
            </template>
            <ElEmpty v-if="detail.timeline.length === 0" description="暂无动态" :image-size="90" />
            <ElTimeline v-else>
              <ElTimelineItem
                v-for="item in detail.timeline"
                :key="`${item.type}-${item.link_id}-${item.time}`"
                :timestamp="formatDateTime(item.time)"
                :type="timelineTypeMap[item.type]"
                placement="top"
              >
                <div class="timeline-item">
                  <div class="flex items-start justify-between gap-3">
                    <div class="font-medium text-gray-900">{{ item.title }}</div>
                    <ElTag size="small" effect="plain">{{ timelineLabelMap[item.type] }}</ElTag>
                  </div>
                  <div class="mt-1 text-sm text-gray-600">{{ item.content || '-' }}</div>
                  <div v-if="item.amount" class="mt-2 text-sm text-gray-500">
                    金额：{{ formatMoney(item.amount) }}
                  </div>
                  <div v-if="item.operator" class="mt-1 text-xs text-gray-400">
                    操作人：{{ item.operator }}
                  </div>
                </div>
              </ElTimelineItem>
            </ElTimeline>
          </ElCard>
        </aside>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
  import { useRoute, useRouter } from 'vue-router'
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import { fetchCustomerDetail, type CustomerDetailResponse } from '@/api/customer'

  defineOptions({ name: 'CustomerDetail' })

  const route = useRoute()
  const router = useRouter()
  const loading = ref(false)
  const detail = ref<CustomerDetailResponse>()

  const typeOptions = [
    { label: '企业客户', value: 1 },
    { label: '个人客户', value: 2 },
    { label: '渠道客户', value: 3 }
  ] as const

  const levelOptions = [
    { label: '潜在客户', value: 1 },
    { label: '普通客户', value: 2 },
    { label: '重点客户', value: 3 },
    { label: '核心客户', value: 4 }
  ] as const

  const statusOptions = [
    { label: '正常', value: 1 },
    { label: '暂缓', value: 2 },
    { label: '停用', value: 3 }
  ] as const

  const followStatusOptions = [
    { label: '初步沟通', value: 1 },
    { label: '方案沟通', value: 2 },
    { label: '商务谈判', value: 3 },
    { label: '已签约', value: 4 }
  ] as const

  const statusTypeMap: Record<number, 'success' | 'warning' | 'danger'> = {
    1: 'success',
    2: 'warning',
    3: 'danger'
  }

  const contractStatusMap: Record<
    number,
    { label: string; type: 'success' | 'warning' | 'primary' | 'danger' }
  > = {
    1: { label: '草稿', type: 'warning' },
    2: { label: '执行中', type: 'primary' },
    3: { label: '已完成', type: 'success' },
    4: { label: '已作废', type: 'danger' }
  }

  const contractTypeMap: Record<number, string> = {
    1: '销售合同',
    2: '框架协议',
    3: '补充协议'
  }

  const contractTypeTagMap: Record<number, 'primary' | 'success' | 'warning'> = {
    1: 'primary',
    2: 'success',
    3: 'warning'
  }

  const fulfillmentStatusMap: Record<
    number,
    { label: string; type: 'success' | 'warning' | 'primary' | 'danger' }
  > = {
    1: { label: '待执行', type: 'warning' },
    2: { label: '执行中', type: 'primary' },
    3: { label: '已完成', type: 'success' },
    4: { label: '已作废', type: 'danger' }
  }

  const timelineLabelMap = {
    follow: '跟进',
    contract: '合同',
    receivable_plan: '计划',
    receivable_record: '回款',
    fulfillment: '履约',
    manuscript: '稿件'
  }

  const timelineTypeMap: Record<string, 'primary' | 'success' | 'warning' | 'danger' | 'info'> = {
    follow: 'primary',
    contract: 'success',
    receivable_plan: 'warning',
    receivable_record: 'success',
    fulfillment: 'primary',
    manuscript: 'info'
  }

  function getOptionLabel<T extends number>(
    options: readonly { label: string; value: T }[],
    value: number
  ) {
    return options.find((item) => item.value === value)?.label || '-'
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
      detail.value = await fetchCustomerDetail({ id })
    } finally {
      loading.value = false
    }
  }

  onMounted(loadDetail)
  watch(() => route.query.id, loadDetail)
</script>

<style scoped lang="scss">
  .customer-detail-page {
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
    gap: 0;
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

  .detail-layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 440px;
    gap: 16px;
    align-items: start;
    min-width: 0;
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

  .detail-tabs {
    min-width: 0;
    padding: 0 20px 20px;
    overflow: hidden;
    background: var(--el-bg-color);
    border: 1px solid var(--el-border-color-light);
    border-radius: 8px;

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

  .timeline-card {
    position: sticky;
    top: 16px;
    min-width: 0;
    max-height: calc(100vh - 150px);
    overflow: auto;
    border-radius: 8px;

    :deep(.el-card__header) {
      position: sticky;
      top: 0;
      z-index: 1;
      background: var(--el-bg-color);
    }

    :deep(.el-card__body) {
      padding-right: 18px;
    }
  }

  .timeline-item {
    padding: 12px;
    background: var(--el-bg-color);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 8px;
  }

  @media (width <= 1280px) {
    .detail-layout {
      grid-template-columns: 1fr;
    }

    .timeline-card {
      position: static;
      max-height: none;
    }
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
