/**
 * 快速入口配置
 */
import type { FastEnterConfig } from '@/types/config'

const fastEnterConfig: FastEnterConfig = {
  minWidth: 1200,
  applications: [
    {
      name: '工作台',
      description: '系统概览与数据统计',
      icon: 'ri:pie-chart-line',
      iconColor: '#377dff',
      enabled: true,
      order: 1,
      routeName: 'Console'
    },
    {
      name: '个人中心',
      description: '个人资料与密码设置',
      icon: 'ri:user-3-line',
      iconColor: '#00a870',
      enabled: true,
      order: 2,
      routeName: 'UserCenter'
    }
  ],
  quickLinks: []
}

export default Object.freeze(fastEnterConfig)
