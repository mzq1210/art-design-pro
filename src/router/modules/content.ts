import { AppRouteRecord } from '@/types/router'

export const contentRoutes: AppRouteRecord = {
  path: '/content',
  name: 'Content',
  component: '/index/index',
  meta: {
    title: '公告管理',
    icon: 'ri:file-list-3-line',
    roles: ['R_SUPER', 'R_ADMIN']
  },
  children: [
    {
      path: 'notice',
      name: 'Notice',
      component: '/content/notice',
      meta: {
        title: '公告管理',
        keepAlive: true,
        roles: ['R_SUPER', 'R_ADMIN'],
        authList: [
          { title: '新增', authMark: 'notice.create' },
          { title: '编辑', authMark: 'notice.update' },
          { title: '删除', authMark: 'notice.delete' }
        ]
      }
    }
  ]
}
