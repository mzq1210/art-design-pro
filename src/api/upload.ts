import request from '@/utils/http'

export interface UploadResponse {
  url: string
  path: string
  name: string
  size: number
  scene: string
}

export function uploadFile(file: File, scene = 'common') {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('scene', scene)

  return request.post<UploadResponse>({
    url: '/common/upload',
    data: formData
  })
}
