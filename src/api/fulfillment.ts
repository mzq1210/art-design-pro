import request from '@/utils/http'

export type FulfillmentStatus = 1 | 2 | 3 | 4
export type SettlementStatus = 0 | 1

export interface FulfillmentItem {
  id: number
  fulfillment_no: string
  contract_id: number
  contract_product_id: number
  customer_id: number
  customer_name: string
  product_id: number
  product_name: string
  product_code: string
  owner_user_id: number
  owner_name: string
  completed_by: number
  completed_by_name: string
  plan_date: string | null
  fulfillment_date: string | null
  execute_quantity: string
  unit_price: string
  execute_amount: string
  executed_quantity: string
  executed_amount: string
  remaining_quantity: string
  status: FulfillmentStatus
  settlement_status: SettlementStatus
  external_ref: string
  content_summary: string
  result_summary: string
  remark: string
  created_at: number
  updated_at: number
}

export interface FulfillmentExecutionItem {
  id: number
  fulfillment_id: number
  executor_id: number
  executor_name: string
  execute_date: string | null
  execute_quantity: string
  unit_price: string
  execute_amount: string
  external_ref: string
  content_summary: string
  result_summary: string
  remark: string
  created_at: number
  updated_at: number
}

export interface FulfillmentCustomerOption {
  id: number
  customer_name: string
  customer_code: string
}

export interface FulfillmentProductOption {
  id: number
  product_name: string
  product_code: string
  sale_price: string
}

export interface FulfillmentContractOption {
  id: number
  contract_no: string
  contract_name: string
  customer_id: number
  owner_user_id: number
}

export interface FulfillmentContractProductOption {
  id: number
  contract_id: number
  contract_no: string
  contract_name: string
  customer_id: number
  customer_name: string
  owner_user_id: number
  product_id: number
  product_name: string
  product_code: string
  media_name: string
  ad_type: string
  unit: string
  sale_price: string
  quantity: string
  executed_quantity: string
  remaining_quantity: string
}

export interface FulfillmentUserOption {
  id: number
  name: string
  mobile: string
}

export interface FulfillmentListParams {
  page?: number
  size?: number
  fulfillment_no?: string
  customer_id?: number
  product_id?: number
  owner_user_id?: number
  status?: FulfillmentStatus
  settlement_status?: SettlementStatus
  keyword?: string
}

export interface FulfillmentFormParams {
  id?: number
  fulfillment_no?: string
  contract_id: number | ''
  contract_product_id: number | ''
  customer_id: number | ''
  product_id: number | ''
  owner_user_id: number | ''
  plan_date?: string | null
  fulfillment_date?: string | null
  execute_quantity: number | string
  unit_price: number | string
  status: FulfillmentStatus
  settlement_status: SettlementStatus
  external_ref?: string
  content_summary?: string
  result_summary?: string
  remark?: string
}

export interface FulfillmentExecutionFormParams {
  fulfillment_id: number
  executor_id: number | ''
  execute_date?: string | null
  execute_quantity: number | string
  unit_price: number | string
  external_ref?: string
  content_summary?: string
  result_summary?: string
  remark?: string
}

export function fetchFulfillmentList(params: FulfillmentListParams) {
  return request.post<Api.Common.PaginatedResponse<FulfillmentItem>>({
    url: '/fulfillment/index',
    params
  })
}

export function fetchFulfillmentOptions() {
  return request.post<{
    customers: FulfillmentCustomerOption[]
    products: FulfillmentProductOption[]
    contracts: FulfillmentContractOption[]
    contractProducts: FulfillmentContractProductOption[]
    users: FulfillmentUserOption[]
  }>({
    url: '/fulfillment/select-options'
  })
}

export function fetchFulfillmentExecutions(params: { fulfillment_id: number }) {
  return request.post<FulfillmentExecutionItem[]>({
    url: '/fulfillment/executions',
    params
  })
}

export function createFulfillment(params: FulfillmentFormParams) {
  return request.post<FulfillmentItem>({
    url: '/fulfillment/create',
    params,
    showSuccessMessage: true
  })
}

export function updateFulfillment(params: FulfillmentFormParams & { id: number }) {
  return request.post<FulfillmentItem>({
    url: '/fulfillment/update',
    params,
    showSuccessMessage: true
  })
}

export function deleteFulfillment(params: { id: number }) {
  return request.post({
    url: '/fulfillment/delete',
    params,
    showSuccessMessage: true
  })
}

export function createFulfillmentExecution(params: FulfillmentExecutionFormParams) {
  return request.post<FulfillmentItem>({
    url: '/fulfillment/create-execution',
    params,
    showSuccessMessage: true
  })
}
