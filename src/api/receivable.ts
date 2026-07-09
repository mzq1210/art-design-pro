import request from '@/utils/http'

export type ReceivablePlanStatus = 1 | 2 | 3 | 4
export type ReceivableRecordStatus = 1 | 2
export type ReceivableSettlementStatus = 0 | 1

export interface ReceivableContractOption {
  id: number
  contract_no: string
  contract_name: string
  customer_id: number
  owner_user_id: number
  final_amount: string
  pending_amount: string
}

export interface ReceivableCustomerOption {
  id: number
  customer_name: string
  customer_code: string
}

export interface ReceivableUserOption {
  id: number
  name: string
  mobile: string
}

export interface ReceivablePlanItem {
  id: number
  plan_no: string
  contract_id: number
  contract_no: string
  contract_name: string
  customer_id: number
  customer_name: string
  owner_user_id: number
  owner_name: string
  plan_name: string
  plan_date: string | null
  plan_amount: string
  received_amount: string
  pending_amount: string
  invoice_amount: string
  status: ReceivablePlanStatus
  settlement_status: ReceivableSettlementStatus
  remark: string
  created_at: number
  updated_at: number
}

export interface ReceivableRecordItem {
  id: number
  record_no: string
  contract_id: number
  contract_no: string
  contract_name: string
  receivable_plan_id: number
  plan_no: string
  plan_name: string
  customer_id: number
  customer_name: string
  owner_user_id: number
  owner_name: string
  receipt_date: string | null
  receipt_amount: string
  receipt_method: string
  receipt_account: string
  payer_name: string
  bank_serial_no: string
  status: ReceivableRecordStatus
  writeoff_status: ReceivableSettlementStatus
  remark: string
  created_at: number
  updated_at: number
}

export interface ReceivablePlanListParams {
  page?: number
  size?: number
  contract_id?: number
  customer_id?: number
  status?: ReceivablePlanStatus
  keyword?: string
}

export interface ReceivableRecordListParams {
  page?: number
  size?: number
  contract_id?: number
  receivable_plan_id?: number
  keyword?: string
}

export interface ReceivablePlanFormParams {
  id?: number
  plan_no?: string
  contract_id: number | ''
  owner_user_id: number | ''
  plan_name: string
  plan_date?: string | null
  plan_amount: number | string
  invoice_amount?: number | string
  status: ReceivablePlanStatus
  settlement_status?: ReceivableSettlementStatus
  remark?: string
}

export interface ReceivableRecordFormParams {
  id?: number
  record_no?: string
  contract_id: number | ''
  owner_user_id: number | ''
  receivable_plan_id: number | ''
  receipt_date?: string | null
  receipt_amount: number | string
  receipt_method?: string
  receipt_account?: string
  payer_name?: string
  bank_serial_no?: string
  status: ReceivableRecordStatus
  writeoff_status?: ReceivableSettlementStatus
  remark?: string
}

export function fetchReceivableOptions() {
  return request.post<{
    contracts: ReceivableContractOption[]
    customers: ReceivableCustomerOption[]
    users: ReceivableUserOption[]
  }>({
    url: '/receivable/select-options'
  })
}

export function fetchReceivablePlanList(params: ReceivablePlanListParams) {
  return request.post<Api.Common.PaginatedResponse<ReceivablePlanItem>>({
    url: '/receivable/plan-index',
    params
  })
}

export function fetchReceivableRecordList(params: ReceivableRecordListParams) {
  return request.post<Api.Common.PaginatedResponse<ReceivableRecordItem>>({
    url: '/receivable/record-index',
    params
  })
}

export function createReceivablePlan(params: ReceivablePlanFormParams) {
  return request.post<ReceivablePlanItem>({
    url: '/receivable/plan-create',
    params,
    showSuccessMessage: true
  })
}

export function updateReceivablePlan(params: ReceivablePlanFormParams & { id: number }) {
  return request.post<ReceivablePlanItem>({
    url: '/receivable/plan-update',
    params,
    showSuccessMessage: true
  })
}

export function deleteReceivablePlan(params: { id: number }) {
  return request.post({
    url: '/receivable/plan-delete',
    params,
    showSuccessMessage: true
  })
}

export function createReceivableRecord(params: ReceivableRecordFormParams) {
  return request.post<ReceivableRecordItem>({
    url: '/receivable/record-create',
    params,
    showSuccessMessage: true
  })
}

export function updateReceivableRecord(params: ReceivableRecordFormParams & { id: number }) {
  return request.post<ReceivableRecordItem>({
    url: '/receivable/record-update',
    params,
    showSuccessMessage: true
  })
}

export function deleteReceivableRecord(params: { id: number }) {
  return request.post({
    url: '/receivable/record-delete',
    params,
    showSuccessMessage: true
  })
}
