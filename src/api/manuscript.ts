import request from '@/utils/http'

export type ManuscriptType = 1 | 2

export interface ManuscriptWriter {
  id: number
  name: string
  mobile: string
}

export interface ManuscriptItem {
  id: number
  manuscript_no: string
  manuscript_type: ManuscriptType
  customer_id: number
  customer_name: string
  contract_id: number
  fulfillment_id: number
  contract_product_id: number
  product_id: number
  product_name: string
  product_code: string
  title: string
  article_link: string
  writer_ids: number[]
  writer_names: string
  writers: ManuscriptWriter[]
  remark: string
  created_at: number
  updated_at: number
}

export interface ManuscriptCustomerOption {
  id: number
  customer_name: string
  customer_code: string
}

export interface ManuscriptProductOption {
  id: number
  product_name: string
  product_code: string
}

export interface ManuscriptContractOption {
  id: number
  contract_no: string
  contract_name: string
  customer_id: number
  owner_user_id: number
}

export interface ManuscriptContractProductOption {
  id: number
  contract_id: number
  contract_no: string
  contract_name: string
  customer_id: number
  customer_name: string
  product_id: number
  product_name: string
  product_code: string
  media_name: string
  ad_type: string
  quantity: string
}

export interface ManuscriptFulfillmentOption {
  id: number
  fulfillment_no: string
  contract_id: number
  contract_product_id: number
  customer_id: number
  customer_name: string
  product_id: number
  product_name: string
  product_code: string
  status: number
}

export interface ManuscriptUserOption {
  id: number
  name: string
  mobile: string
}

export interface ManuscriptListParams {
  page?: number
  size?: number
  manuscript_no?: string
  manuscript_type?: ManuscriptType
  customer_id?: number
  product_id?: number
  writer_id?: number
  keyword?: string
}

export interface ManuscriptFormParams {
  id?: number
  manuscript_no?: string
  manuscript_type: ManuscriptType
  customer_id: number | ''
  contract_id: number | ''
  fulfillment_id: number | ''
  contract_product_id: number | ''
  product_id: number | ''
  title: string
  article_link: string
  writer_ids: number[]
  remark?: string
}

export function fetchManuscriptList(params: ManuscriptListParams) {
  return request.post<Api.Common.PaginatedResponse<ManuscriptItem>>({
    url: '/manuscript/index',
    params
  })
}

export function fetchManuscriptOptions() {
  return request.post<{
    customers: ManuscriptCustomerOption[]
    products: ManuscriptProductOption[]
    contracts: ManuscriptContractOption[]
    contractProducts: ManuscriptContractProductOption[]
    fulfillments: ManuscriptFulfillmentOption[]
    writers: ManuscriptUserOption[]
  }>({
    url: '/manuscript/select-options'
  })
}

export function createManuscript(params: ManuscriptFormParams) {
  return request.post<ManuscriptItem>({
    url: '/manuscript/create',
    params,
    showSuccessMessage: true
  })
}

export function updateManuscript(params: ManuscriptFormParams & { id: number }) {
  return request.post<ManuscriptItem>({
    url: '/manuscript/update',
    params,
    showSuccessMessage: true
  })
}

export function deleteManuscript(params: { id: number }) {
  return request.post({
    url: '/manuscript/delete',
    params,
    showSuccessMessage: true
  })
}
