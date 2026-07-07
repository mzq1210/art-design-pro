import request from '@/utils/http'

export type UserStatus = 0 | 9 | 10

export interface UserItem {
  id: number
  username: string
  email: string
  avatar: string
  status: UserStatus
  statusText: string
  roles: string[]
  created_at: number
  updated_at: number
}

export interface UserListParams {
  page?: number
  size?: number
  username?: string
  email?: string
  status?: UserStatus
}

export type UserListResponse = Api.Common.PaginatedResponse<UserItem>

export interface UserViewParams {
  id: number
}

export interface UserCreateParams {
  username: string
  email: string
  avatar?: string
  password: string
  status: UserStatus
  roles?: string[]
}

export interface UserUpdateParams {
  id: number
  username: string
  email: string
  avatar?: string
  password?: string
  status: UserStatus
}

export interface UserDeleteParams {
  id: number
}

export interface UserRolesParams {
  id: number
}

export interface UserRolesResponse {
  id: number
  roles: string[]
}

export interface UserAssignRolesParams {
  id: number
  roles: string[]
}

export function fetchUserList(params: UserListParams) {
  return request.post<UserListResponse>({
    url: '/user/index',
    params
  })
}

export function viewUser(params: UserViewParams) {
  return request.post<UserItem>({
    url: '/user/view',
    params
  })
}

export function createUser(params: UserCreateParams) {
  return request.post<UserItem>({
    url: '/user/create',
    params,
    showSuccessMessage: true
  })
}

export function updateUser(params: UserUpdateParams) {
  return request.post<UserItem>({
    url: '/user/update',
    params,
    showSuccessMessage: true
  })
}

export function deleteUser(params: UserDeleteParams) {
  return request.post({
    url: '/user/delete',
    params,
    showSuccessMessage: true
  })
}

export function fetchUserRoles(params: UserRolesParams) {
  return request.post<UserRolesResponse>({
    url: '/user/roles',
    params
  })
}

export function assignUserRoles(params: UserAssignRolesParams) {
  return request.post({
    url: '/user/assign-roles',
    params,
    showSuccessMessage: true
  })
}
