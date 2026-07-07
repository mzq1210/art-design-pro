import { AppRouteRecord } from '@/types/router'

export const systemRoutes: AppRouteRecord = {
  path: '/system',
  name: 'System',
  component: '/index/index',
  meta: {
    title: 'menus.system.title',
    icon: 'ri:user-3-line',
    roles: ['R_SUPER', 'R_ADMIN']
  },
  children: [
    {
      path: 'user',
      name: 'User',
      component: '/system/user',
      meta: {
        title: 'menus.system.user',
        keepAlive: true,
        roles: ['R_SUPER', 'R_ADMIN']
      }
    },
    {
      path: 'role',
      name: 'Role',
      component: '/system/role',
      meta: {
        title: 'menus.system.role',
        keepAlive: true,
        roles: ['R_SUPER']
      }
    },
    {
      path: 'user-center',
      name: 'UserCenter',
      component: '/system/user-center',
      meta: {
        title: 'menus.system.userCenter',
        isHide: true,
        keepAlive: true,
        isHideTab: true
      }
    },
    {
      path: 'menu',
      name: 'Menus',
      component: '/system/menu',
      meta: {
        title: 'menus.system.menu',
        keepAlive: true,
        roles: ['R_SUPER'],
        authList: [
          { title: '新增', authMark: 'add' },
          { title: '编辑', authMark: 'edit' },
          { title: '删除', authMark: 'delete' }
        ]
      }
    },
    {
      path: 'permission',
      name: 'Permission',
      component: '/system/permission',
      meta: {
        title: '权限管理',
        keepAlive: true,
        roles: ['R_SUPER'],
        authList: [
          { title: '新增', authMark: 'permission.create' },
          { title: '编辑', authMark: 'permission.update' },
          { title: '删除', authMark: 'permission.delete' }
        ]
      }
    },
    {
      path: 'dict',
      name: 'Dict',
      component: '/system/dict',
      meta: {
        title: '字典管理',
        keepAlive: true,
        roles: ['R_SUPER'],
        authList: [
          { title: '新增', authMark: 'dict.create' },
          { title: '编辑', authMark: 'dict.update' },
          { title: '删除', authMark: 'dict.delete' }
        ]
      }
    },
    {
      path: 'file',
      name: 'File',
      component: '/system/file',
      meta: {
        title: '文件管理',
        keepAlive: true,
        roles: ['R_SUPER'],
        authList: [
          { title: '上传', authMark: 'file.upload' },
          { title: '编辑', authMark: 'file.update' },
          { title: '删除', authMark: 'file.delete' }
        ]
      }
    },
    {
      path: 'operation-log',
      name: 'OperationLog',
      component: '/system/operation-log',
      meta: {
        title: '操作日志',
        keepAlive: true,
        roles: ['R_SUPER'],
        authList: [{ title: '删除', authMark: 'operation-log.delete' }]
      }
    },
    {
      path: 'queue-task',
      name: 'QueueTask',
      component: '/system/queue-task',
      meta: {
        title: '队列任务',
        keepAlive: true,
        roles: ['R_SUPER'],
        authList: [
          { title: '创建', authMark: 'queue.create' },
          { title: '删除', authMark: 'queue.delete' }
        ]
      }
    }
  ]
}
