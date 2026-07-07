import request from '@/utils/http'

export interface PermissionItem {
  name: string
  description: string
  rule_name?: string | null
  created_at?: number
  updated_at?: number
}

export interface PermissionListParams {
  keyword?: string
}

export type PermissionListResponse = Api.Common.PaginatedResponse<PermissionItem>

export interface PermissionSaveParams {
  name: string
  description?: string
  rule_name?: string
}

export interface PermissionBrief {
  name: string
  description: string
}

export interface PermissionDiagnoseResponse {
  missing: PermissionBrief[]
  orphan: PermissionItem[]
  menu_total: number
  rbac_total: number
}

export interface PermissionSyncResponse {
  created: PermissionItem[]
  updated: PermissionItem[]
  existed_count: number
  menu_total: number
}

export function fetchPermissionList(params: PermissionListParams = {}) {
  return request.post<PermissionListResponse>({
    url: '/permission/index',
    params
  })
}

export function createPermission(params: PermissionSaveParams) {
  return request.post<PermissionItem>({
    url: '/permission/create',
    params,
    showSuccessMessage: true
  })
}

export function updatePermission(params: PermissionSaveParams) {
  return request.post<PermissionItem>({
    url: '/permission/update',
    params,
    showSuccessMessage: true
  })
}

export function deletePermission(params: { name: string }) {
  return request.post({
    url: '/permission/delete',
    params,
    showSuccessMessage: true
  })
}

export function diagnosePermissionFromMenu() {
  return request.post<PermissionDiagnoseResponse>({
    url: '/permission/diagnose'
  })
}

export function syncPermissionFromMenu() {
  return request.post<PermissionSyncResponse>({
    url: '/permission/sync-from-menu',
    showSuccessMessage: true
  })
}
