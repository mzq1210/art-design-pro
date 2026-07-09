import request from '@/utils/http'

export interface DingTalkEmployeeItem {
  id: number
  user_id: number
  username: string
  dingtalk_userid: string
  unionid: string
  name: string
  mobile: string
  email: string
  avatar: string
  department_ids: number[]
  department_names: string
  position: string
  job_number: string
  status: number
  synced_at: number
  created_at: number
  updated_at: number
}

export interface DingTalkEmployeeListParams {
  page?: number
  size?: number
  keyword?: string
}

export type DingTalkEmployeeListResponse = Api.Common.PaginatedResponse<DingTalkEmployeeItem>

export interface SyncDingTalkEmployeeParams {
  department_id?: number
  recursive?: boolean
}

export interface SyncDingTalkEmployeeResponse {
  queued: boolean
  task_id: number
  job_id: string
}

export function fetchDingTalkEmployees(params: DingTalkEmployeeListParams) {
  return request.post<DingTalkEmployeeListResponse>({
    url: '/dingtalk/employee-index',
    params
  })
}

export function syncDingTalkEmployees(params: SyncDingTalkEmployeeParams) {
  return request.post<SyncDingTalkEmployeeResponse>({
    url: '/dingtalk/employee-sync',
    params,
    showSuccessMessage: true
  })
}
