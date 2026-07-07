import request from '@/utils/http'

export interface FileGroupItem {
  id: number
  name: string
  code: string
  sort: number
  remark?: string
  created_at?: number
  updated_at?: number
}

export interface FileAttachmentItem {
  id: number
  group_id: number
  scene: string
  name: string
  storage_name: string
  path: string
  url: string
  extension: string
  mime_type: string
  size: number
  remark?: string
  created_by: number
  created_at?: number
  updated_at?: number
}

export interface FileListParams {
  page?: number
  size?: number
  group_id?: number | ''
  keyword?: string
}

export type FileGroupSaveParams = Partial<FileGroupItem> & Pick<FileGroupItem, 'name' | 'code'>

export function fetchFileGroups(params: { keyword?: string } = {}) {
  return request.post<Api.Common.PaginatedResponse<FileGroupItem>>({
    url: '/file/group-index',
    params
  })
}

export function createFileGroup(params: FileGroupSaveParams) {
  return request.post<FileGroupItem>({
    url: '/file/group-create',
    params,
    showSuccessMessage: true
  })
}

export function updateFileGroup(params: FileGroupSaveParams & { id: number }) {
  return request.post<FileGroupItem>({
    url: '/file/group-update',
    params,
    showSuccessMessage: true
  })
}

export function deleteFileGroup(params: { id: number }) {
  return request.post({
    url: '/file/group-delete',
    params,
    showSuccessMessage: true
  })
}

export function fetchFiles(params: FileListParams = {}) {
  return request.post<Api.Common.PaginatedResponse<FileAttachmentItem>>({
    url: '/file/index',
    params
  })
}

export function uploadManagedFile(file: File, groupId: number, scene = 'attachment') {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('group_id', String(groupId || 0))
  formData.append('scene', scene)

  return request.post<FileAttachmentItem>({
    url: '/file/upload',
    data: formData,
    showSuccessMessage: true
  })
}

export function updateFile(params: { id: number; group_id: number; remark?: string }) {
  return request.post<FileAttachmentItem>({
    url: '/file/update',
    params,
    showSuccessMessage: true
  })
}

export function deleteFile(params: { id: number }) {
  return request.post({
    url: '/file/delete',
    params,
    showSuccessMessage: true
  })
}
