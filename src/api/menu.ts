import request from '@/utils/http'

export type MenuType = 1 | 2 | 3
export type SwitchValue = 0 | 1

export interface MenuItem {
  id: number
  parent_id: number
  type: MenuType
  title: string
  name?: string | null
  path?: string | null
  component?: string | null
  icon?: string | null
  permission?: string | null
  sort: number
  visible: SwitchValue
  keep_alive: SwitchValue
  is_external: SwitchValue
  external_url?: string | null
  remark?: string | null
  created_at?: number | null
  updated_at?: number | null
  children?: MenuItem[]
}

export interface MenuListParams {
  keyword?: string
}

export type MenuListResponse = Api.Common.PaginatedResponse<MenuItem>

export interface MenuTreeResponse {
  records: MenuItem[]
}

export interface MenuSaveParams {
  id?: number
  parent_id: number
  type: MenuType
  title: string
  name?: string
  path?: string
  component?: string
  icon?: string
  permission?: string
  sort: number
  visible: SwitchValue
  keep_alive: SwitchValue
  is_external: SwitchValue
  external_url?: string
  remark?: string
}

export function fetchMenuList(params: MenuListParams = {}) {
  return request.post<MenuListResponse>({
    url: '/menu/index',
    params
  })
}

export function fetchMenuTree() {
  return request.post<MenuTreeResponse>({
    url: '/menu/tree'
  })
}

export function createMenu(params: MenuSaveParams) {
  return request.post<MenuItem>({
    url: '/menu/create',
    params,
    showSuccessMessage: true
  })
}

export function updateMenu(params: MenuSaveParams) {
  return request.post<MenuItem>({
    url: '/menu/update',
    params,
    showSuccessMessage: true
  })
}

export function deleteMenu(params: { id: number }) {
  return request.post({
    url: '/menu/delete',
    params,
    showSuccessMessage: true
  })
}
