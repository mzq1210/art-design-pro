import request from '@/utils/http'

export type NoticeStatus = 0 | 1

export interface NoticeItem {
  id: number
  title: string
  status: NoticeStatus
  created_at?: string
  updated_at?: string
}

export interface NoticeListParams {
  page?: number
  size?: number
  status?: NoticeStatus
}

export type NoticeListResponse = Api.Common.PaginatedResponse<NoticeItem>

export interface NoticeCreateParams {
  title: string
  status: NoticeStatus
}

export interface NoticeUpdateParams extends NoticeCreateParams {
  id: number
}

export interface NoticeViewParams {
  id: number
}

export interface NoticeDeleteParams {
  id: number
}

export function fetchNoticeList(params: NoticeListParams) {
  return request.post<NoticeListResponse>({
    url: '/notice/index',
    params
  })
}

export function viewNotice(params: NoticeViewParams) {
  return request.post<NoticeItem>({
    url: '/notice/view',
    params
  })
}

export function createNotice(params: NoticeCreateParams) {
  return request.post({
    url: '/notice/create',
    params,
    showSuccessMessage: true
  })
}

export function updateNotice(params: NoticeUpdateParams) {
  return request.post({
    url: '/notice/update',
    params,
    showSuccessMessage: true
  })
}

export function deleteNotice(params: NoticeDeleteParams) {
  return request.post({
    url: '/notice/delete',
    params,
    showSuccessMessage: true
  })
}
