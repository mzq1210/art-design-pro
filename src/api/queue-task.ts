import request from '@/utils/http'

export type QueueTaskStatus = 0 | 1 | 2 | 3

export interface QueueTaskItem {
  id: number
  job_id: string
  name: string
  payload: string
  result: string
  status: QueueTaskStatus
  attempts: number
  error: string
  created_by: number
  created_at: number
  started_at: number | null
  finished_at: number | null
  updated_at: number
}

export interface QueueTaskListParams {
  page?: number
  size?: number
  keyword?: string
  status?: number | ''
}

export function fetchQueueTasks(params: QueueTaskListParams = {}) {
  return request.post<Api.Common.PaginatedResponse<QueueTaskItem>>({
    url: '/queue/index',
    params
  })
}

export function createDemoQueueTask(params: { name: string; seconds: number }) {
  return request.post<QueueTaskItem>({
    url: '/queue/create-demo',
    params,
    showSuccessMessage: true
  })
}

export function retryQueueTask(params: { id: number }) {
  return request.post<QueueTaskItem>({
    url: '/queue/retry',
    params,
    showSuccessMessage: true
  })
}

export function deleteQueueTask(params: { id: number }) {
  return request.post({
    url: '/queue/delete',
    params,
    showSuccessMessage: true
  })
}
