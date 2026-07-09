import request from '@/utils/http'

export type ContractStatus = 1 | 2 | 3 | 4
export type ContractType = 1 | 2 | 3
export type ContractApprovalStatus = 0 | 1 | 2 | 3
export type ContractArchiveStatus = 0 | 1

export interface ContractProductItem {
  id: number
  contract_id: number
  product_id: number
  category_id: number
  product_name: string
  media_name: string
  ad_type: string
  unit: string
  list_price: string
  sale_price: string
  discount_rate: string
  quantity: string
  executed_quantity: string
  amount: string
  start_date: string | null
  end_date: string | null
  delivery_requirements: string
  sort: number
}

export interface ContractReceivablePlanItem {
  id: number
  contract_id: number
  customer_id: number
  owner_user_id: number
  plan_no: string
  plan_name: string
  plan_date: string | null
  plan_amount: string
  received_amount: string
  pending_amount: string
  invoice_amount: string
  status: 1 | 2 | 3 | 4
  settlement_status: number
  remark: string
}

export interface ContractCostItem {
  id: number
  contract_id: number
  contract_product_id: number
  cost_date: string | null
  cost_type: string
  product_name: string
  amount: string
  reason: string
  remark: string
}

export interface ContractItem {
  id: number
  contract_no: string
  contract_name: string
  customer_id: number
  customer_name: string
  customer_code: string
  owner_user_id: number
  owner_name: string
  contract_type: ContractType
  parent_contract_id: number
  parent_contract_name: string
  sign_date: string | null
  start_date: string | null
  end_date: string | null
  total_amount: string
  discount_amount: string
  tax_rate: string
  tax_amount: string
  final_amount: string
  received_amount: string
  pending_amount: string
  invoice_amount: string
  status: ContractStatus
  approval_status: ContractApprovalStatus
  archive_status: ContractArchiveStatus
  framework_scope: string
  remark: string
  products: ContractProductItem[]
  costs: ContractCostItem[]
  receivable_plans: ContractReceivablePlanItem[]
  created_at: number
  updated_at: number
}

export interface ContractCustomerOption {
  id: number
  customer_name: string
  customer_code: string
}

export interface ContractProductOption {
  id: number
  category_id: number
  product_name: string
  product_code: string
  media_name: string
  ad_type: string
  unit: string
  list_price: string
  sale_price: string
}

export interface ContractUserOption {
  id: number
  name: string
  mobile: string
}

export interface FrameworkContractOption {
  id: number
  contract_no: string
  contract_name: string
  customer_id: number
  customer_name: string
}

export interface ContractListParams {
  page?: number
  size?: number
  contract_no?: string
  customer_id?: number
  owner_user_id?: number
  contract_type?: ContractType
  status?: ContractStatus
  keyword?: string
}

export interface ContractProductFormParams {
  id?: number
  product_id: number
  sale_price: number | string
  quantity: number | string
  start_date?: string | null
  end_date?: string | null
  delivery_requirements?: string
  sort?: number
}

export interface ContractReceivablePlanFormParams {
  id?: number
  plan_name: string
  plan_date?: string | null
  plan_ratio?: number | string
  plan_amount: number | string
  invoice_amount?: number | string
  remark?: string
}

export interface ContractCostFormParams {
  id?: number
  contract_product_id?: number | string
  cost_date?: string | null
  cost_type: string
  product_name?: string
  amount: number | string
  reason?: string
  remark?: string
}

export interface ContractFormParams {
  id?: number
  contract_no?: string
  contract_name: string
  customer_id: number
  owner_user_id: number
  contract_type: ContractType
  parent_contract_id?: number
  sign_date?: string | null
  start_date?: string | null
  end_date?: string | null
  discount_amount?: number | string
  tax_rate?: number | string
  invoice_amount?: number | string
  status: ContractStatus
  approval_status?: ContractApprovalStatus
  archive_status?: ContractArchiveStatus
  framework_scope?: string
  remark?: string
  products: ContractProductFormParams[]
  costs?: ContractCostFormParams[]
  receivable_plans?: ContractReceivablePlanFormParams[]
}

export function fetchContractList(params: ContractListParams) {
  return request.post<Api.Common.PaginatedResponse<ContractItem>>({
    url: '/contract/index',
    params
  })
}

export function fetchContractOptions() {
  return request.post<{
    customers: ContractCustomerOption[]
    products: ContractProductOption[]
    users: ContractUserOption[]
    framework_contracts: FrameworkContractOption[]
  }>({
    url: '/contract/select-options'
  })
}

export function fetchContractDetail(params: { id: number }) {
  return request.post<ContractItem>({
    url: '/contract/view',
    params
  })
}

export function createContract(params: ContractFormParams) {
  return request.post<ContractItem>({
    url: '/contract/create',
    params,
    showSuccessMessage: true
  })
}

export function updateContract(params: ContractFormParams & { id: number }) {
  return request.post<ContractItem>({
    url: '/contract/update',
    params,
    showSuccessMessage: true
  })
}

export function deleteContract(params: { id: number }) {
  return request.post({
    url: '/contract/delete',
    params,
    showSuccessMessage: true
  })
}
