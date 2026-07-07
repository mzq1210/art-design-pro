import request from '@/utils/http'

export interface RoleItem {
  name: string
  description: string
  created_at?: number
  updated_at?: number
}

export interface RoleListParams {
  page?: number
  size?: number
  keyword?: string
}

export type RoleListResponse = Api.Common.PaginatedResponse<RoleItem>

export interface RoleCreateParams {
  name: string
  description?: string
}

export interface RoleUpdateParams {
  name: string
  description?: string
}

export interface RoleDeleteParams {
  name: string
}

export interface RolePermissionsParams {
  name: string
}

export interface RolePermissionsResponse {
  role: string
  permissions: string[]
}

export interface RoleAssignPermissionsParams {
  name: string
  permissions: string[]
}

export function fetchRoleList(params: RoleListParams) {
  return request.post<RoleListResponse>({
    url: '/role/index',
    params
  })
}

export function createRole(params: RoleCreateParams) {
  return request.post<RoleItem>({
    url: '/role/create',
    params,
    showSuccessMessage: true
  })
}

export function updateRole(params: RoleUpdateParams) {
  return request.post<RoleItem>({
    url: '/role/update',
    params,
    showSuccessMessage: true
  })
}

export function deleteRole(params: RoleDeleteParams) {
  return request.post({
    url: '/role/delete',
    params,
    showSuccessMessage: true
  })
}

export function fetchRolePermissions(params: RolePermissionsParams) {
  return request.post<RolePermissionsResponse>({
    url: '/role/permissions',
    params
  })
}

export function assignRolePermissions(params: RoleAssignPermissionsParams) {
  return request.post({
    url: '/role/assign-permissions',
    params,
    showSuccessMessage: true
  })
}
