import request from '@/utils/http'

export type CustomerType = 1 | 2 | 3
export type CustomerLevel = 1 | 2 | 3 | 4
export type CustomerStatus = 1 | 2 | 3
export type CustomerFollowStatus = 1 | 2 | 3 | 4
export type ContactStatus = 0 | 1

export interface CustomerItem {
  id: number
  customer_name: string
  customer_code: string
  customer_type: CustomerType
  industry: string
  level: CustomerLevel
  status: CustomerStatus
  owner_user_id: number
  owner_name: string
  owner_mobile: string
  company_address: string
  website: string
  taxpayer_no: string
  bank_name: string
  bank_account: string
  invoice_title: string
  cooperation_start_date: string | null
  source: string
  follow_status: CustomerFollowStatus
  latest_follow_time: number
  signed_contract_amount: string
  received_amount: string
  remark: string
  created_at: number
  updated_at: number
}

export interface CustomerContactItem {
  id: number
  customer_id: number
  customer_name: string
  customer_code: string
  contact_name: string
  mobile: string
  wechat: string
  email: string
  position: string
  is_primary: 0 | 1
  status: ContactStatus
  remark: string
  created_at: number
  updated_at: number
}

export interface CustomerFollowItem {
  id: number
  customer_id: number
  customer_name: string
  customer_code: string
  contact_id: number
  contact_name: string
  contact_mobile: string
  owner_user_id: number
  owner_name: string
  follow_time: number
  follow_type: 1 | 2 | 3 | 4
  follow_status: CustomerFollowStatus
  next_follow_time: number
  content: string
  result: string
  created_at: number
  updated_at: number
}

export interface CustomerUserOption {
  id: number
  name: string
  mobile: string
}

export interface CustomerOption {
  id: number
  customer_name: string
  customer_code: string
  owner_user_id: number
}

export interface CustomerListParams {
  page?: number
  size?: number
  customer_name?: string
  customer_code?: string
  customer_type?: CustomerType
  level?: CustomerLevel
  status?: CustomerStatus
  owner_user_id?: number
}

export type CustomerListResponse = Api.Common.PaginatedResponse<CustomerItem>

export interface CustomerOptionsResponse {
  customers: CustomerOption[]
  users: CustomerUserOption[]
}

export interface CustomerFormParams {
  id?: number
  customer_name: string
  customer_code?: string
  customer_type: CustomerType
  industry?: string
  level: CustomerLevel
  status: CustomerStatus
  owner_user_id: number
  company_address?: string
  website?: string
  taxpayer_no?: string
  bank_name?: string
  bank_account?: string
  invoice_title?: string
  cooperation_start_date?: string
  source?: string
  follow_status: CustomerFollowStatus
  remark?: string
  contact_name?: string
  contact_mobile?: string
  contact_wechat?: string
  contact_email?: string
  contact_position?: string
  contact_remark?: string
}

export interface CustomerContactFormParams {
  id?: number
  customer_id: number
  contact_name: string
  mobile: string
  wechat?: string
  email?: string
  position?: string
  is_primary: 0 | 1
  status: ContactStatus
  remark?: string
}

export interface CustomerFollowListParams {
  page?: number
  size?: number
  customer_id?: number
  owner_user_id?: number
  follow_status?: CustomerFollowStatus
  keyword?: string
}

export interface CustomerFollowFormParams {
  id?: number
  customer_id: number
  contact_id?: number | ''
  owner_user_id?: number | ''
  follow_time?: string | number
  follow_type: 1 | 2 | 3 | 4
  follow_status: CustomerFollowStatus
  next_follow_time?: string | number
  content: string
  result?: string
}

export interface CustomerDetailResponse {
  customer: CustomerItem
  stats: {
    contract_count: number
    contract_amount: string
    received_amount: string
    pending_amount: string
    contact_count: number
    follow_count: number
  }
  contacts: CustomerContactItem[]
  follows: CustomerFollowItem[]
  contracts: Array<{
    id: number
    contract_no: string
    contract_name: string
    contract_type: number
    parent_contract_id: number
    final_amount: string
    received_amount: string
    pending_amount: string
    status: number
    approval_status: number
    start_date: string | null
    end_date: string | null
    created_at: number
  }>
  contract_products: Array<{
    id: number
    contract_id: number
    product_id: number
    product_name: string
    media_name: string
    ad_type: string
    unit: string
    sale_price: string
    quantity: string
    executed_quantity: string
    amount: string
    start_date: string | null
    end_date: string | null
    delivery_requirements: string
  }>
  receivable_plans: Array<{
    id: number
    plan_no: string
    contract_id: number
    contract_no: string
    contract_name: string
    owner_name: string
    plan_name: string
    plan_date: string | null
    plan_amount: string
    received_amount: string
    pending_amount: string
    invoice_amount: string
    status: 1 | 2 | 3 | 4
    remark: string
    created_at: number
  }>
  receivable_records: Array<{
    id: number
    record_no: string
    contract_id: number
    contract_no: string
    contract_name: string
    plan_name: string
    owner_name: string
    receipt_date: string | null
    receipt_amount: string
    receipt_method: string
    payer_name: string
    status: 1 | 2
    remark: string
    created_at: number
  }>
  fulfillments: Array<{
    id: number
    fulfillment_no: string
    contract_id: number
    contract_no: string
    contract_name: string
    product_name: string
    product_code: string
    owner_name: string
    plan_date: string | null
    fulfillment_date: string | null
    execute_quantity: string
    executed_quantity: string
    execute_amount: string
    status: 1 | 2 | 3 | 4
    content_summary: string
    result_summary: string
    created_at: number
  }>
  manuscripts: Array<{
    id: number
    manuscript_no: string
    title: string
    manuscript_type: 1 | 2
    product_name: string
    product_code: string
    article_link: string
    remark: string
    created_at: number
  }>
  timeline: Array<{
    type:
      | 'follow'
      | 'contract'
      | 'receivable_plan'
      | 'receivable_record'
      | 'fulfillment'
      | 'manuscript'
    title: string
    content: string
    operator?: string
    amount?: string
    time: number
    link_id: number
  }>
}

export function fetchCustomerList(params: CustomerListParams) {
  return request.post<CustomerListResponse>({
    url: '/customer/index',
    params
  })
}

export function fetchCustomerOptions() {
  return request.post<CustomerOptionsResponse>({
    url: '/customer/select-options'
  })
}

export function fetchCustomerDetail(params: { id: number }) {
  return request.post<CustomerDetailResponse>({
    url: '/customer/view',
    params
  })
}

export function createCustomer(params: CustomerFormParams) {
  return request.post<CustomerItem>({
    url: '/customer/create',
    params,
    showSuccessMessage: true
  })
}

export function updateCustomer(params: CustomerFormParams & { id: number }) {
  return request.post<CustomerItem>({
    url: '/customer/update',
    params,
    showSuccessMessage: true
  })
}

export function deleteCustomer(params: { id: number }) {
  return request.post({
    url: '/customer/delete',
    params,
    showSuccessMessage: true
  })
}

export function fetchCustomerContacts(params: { customer_id?: number }) {
  return request.post<Api.Common.PaginatedResponse<CustomerContactItem>>({
    url: '/customer-contact/index',
    params
  })
}

export function createCustomerContact(params: CustomerContactFormParams) {
  return request.post<CustomerContactItem>({
    url: '/customer-contact/create',
    params,
    showSuccessMessage: true
  })
}

export function updateCustomerContact(params: CustomerContactFormParams & { id: number }) {
  return request.post<CustomerContactItem>({
    url: '/customer-contact/update',
    params,
    showSuccessMessage: true
  })
}

export function deleteCustomerContact(params: { id: number }) {
  return request.post({
    url: '/customer-contact/delete',
    params,
    showSuccessMessage: true
  })
}

export function setPrimaryCustomerContact(params: { id: number }) {
  return request.post<CustomerContactItem>({
    url: '/customer-contact/set-primary',
    params,
    showSuccessMessage: true
  })
}

export function fetchCustomerFollows(params: CustomerFollowListParams) {
  return request.post<Api.Common.PaginatedResponse<CustomerFollowItem>>({
    url: '/customer-follow/index',
    params
  })
}

export function createCustomerFollow(params: CustomerFollowFormParams) {
  return request.post<CustomerFollowItem>({
    url: '/customer-follow/create',
    params,
    showSuccessMessage: true
  })
}

export function updateCustomerFollow(params: CustomerFollowFormParams & { id: number }) {
  return request.post<CustomerFollowItem>({
    url: '/customer-follow/update',
    params,
    showSuccessMessage: true
  })
}

export function deleteCustomerFollow(params: { id: number }) {
  return request.post({
    url: '/customer-follow/delete',
    params,
    showSuccessMessage: true
  })
}
