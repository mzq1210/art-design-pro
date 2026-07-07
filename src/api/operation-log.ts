import request from '@/utils/http'

export interface OperationLogItem {
  id: number
  user_id: number
  username: string
  controller: string
  action: string
  route: string
  permission: string
  method: string
  ip: string
  user_agent: string
  request_data: string
  response_code: number
  message: string
  status: 0 | 1
  duration: number
  created_at: number
}

export interface OperationLogListParams {
  page?: number
  size?: number
  keyword?: string
  route?: string
  status?: number | ''
}

export function fetchOperationLogs(params: OperationLogListParams = {}) {
  return request.post<Api.Common.PaginatedResponse<OperationLogItem>>({
    url: '/operation-log/index',
    params
  })
}

export function deleteOperationLog(params: { id: number }) {
  return request.post({
    url: '/operation-log/delete',
    params,
    showSuccessMessage: true
  })
}

export function clearOperationLogs(params: { days: number }) {
  return request.post<{ deleted: number }>({
    url: '/operation-log/clear',
    params,
    showSuccessMessage: true
  })
}
