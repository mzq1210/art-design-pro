import request from '@/utils/http'

export type SwitchValue = 0 | 1

export interface DictTypeItem {
  id: number
  name: string
  code: string
  status: SwitchValue
  sort: number
  remark?: string
  created_at?: number
  updated_at?: number
}

export interface DictItem {
  id: number
  type_id: number
  label: string
  value: string
  status: SwitchValue
  sort: number
  remark?: string
  created_at?: number
  updated_at?: number
}

export interface DictTypeListParams {
  keyword?: string
}

export interface DictItemListParams {
  type_id?: number
  keyword?: string
}

export type DictTypeSaveParams = Partial<DictTypeItem> & Pick<DictTypeItem, 'name' | 'code'>
export type DictItemSaveParams = Partial<DictItem> & Pick<DictItem, 'type_id' | 'label' | 'value'>

export function fetchDictTypes(params: DictTypeListParams = {}) {
  return request.post<Api.Common.PaginatedResponse<DictTypeItem>>({
    url: '/dict/type-index',
    params
  })
}

export function createDictType(params: DictTypeSaveParams) {
  return request.post<DictTypeItem>({
    url: '/dict/type-create',
    params,
    showSuccessMessage: true
  })
}

export function updateDictType(params: DictTypeSaveParams & { id: number }) {
  return request.post<DictTypeItem>({
    url: '/dict/type-update',
    params,
    showSuccessMessage: true
  })
}

export function deleteDictType(params: { id: number }) {
  return request.post({
    url: '/dict/type-delete',
    params,
    showSuccessMessage: true
  })
}

export function fetchDictItems(params: DictItemListParams = {}) {
  return request.post<Api.Common.PaginatedResponse<DictItem>>({
    url: '/dict/item-index',
    params
  })
}

export function createDictItem(params: DictItemSaveParams) {
  return request.post<DictItem>({
    url: '/dict/item-create',
    params,
    showSuccessMessage: true
  })
}

export function updateDictItem(params: DictItemSaveParams & { id: number }) {
  return request.post<DictItem>({
    url: '/dict/item-update',
    params,
    showSuccessMessage: true
  })
}

export function deleteDictItem(params: { id: number }) {
  return request.post({
    url: '/dict/item-delete',
    params,
    showSuccessMessage: true
  })
}

export function fetchDictOptions(params: { code: string }) {
  return request.post<{ records: DictItem[] }>({
    url: '/dict/options',
    params
  })
}
