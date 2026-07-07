import request from '@/utils/http'

/**
 * 登录
 * @param params 登录参数
 * @returns 登录响应
 */
export async function fetchLogin(params: Api.Auth.LoginParams) {
  const res = await request.post<{
    access_token: string
    refresh_token: string
    expires_in: number
    token_type: string
    user: {
      id: number
      username: string
    }
  }>({
    url: '/login',
    params: {
      username: params.userName,
      password: params.password
    }
  })

  return {
    token: res.access_token,
    refreshToken: res.refresh_token
  }
}

/**
 * 获取用户信息
 * @returns 用户信息
 */
export function fetchGetUserInfo() {
  return request.post<Api.Auth.UserInfo>({
    url: '/user/profile'
    // 自定义请求头
    // headers: {
    //   'X-Custom-Header': 'your-custom-value'
    // }
  })
}

export interface UpdateProfileParams {
  userName: string
  email: string
  avatar?: string
}

export interface ChangePasswordParams {
  oldPassword: string
  newPassword: string
}

export function updateProfile(params: UpdateProfileParams) {
  return request.post<Api.Auth.UserInfo>({
    url: '/user/update-profile',
    params,
    showSuccessMessage: true
  })
}

export function changePassword(params: ChangePasswordParams) {
  return request.post({
    url: '/user/change-password',
    params,
    showSuccessMessage: true
  })
}
