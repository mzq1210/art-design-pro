# 项目开发指南

本文档记录当前前后端基础项目的目录职责、配置约定、权限流程、常用命令和新增业务模块流程。生产环境部署说明见 [production-nginx-deploy.md](./production-nginx-deploy.md)。

## 项目结构

```text
D:\www\art-design-pro        Vue 3 + TypeScript + Vite 前端
D:\www\art-design-pro-admin  Yii2 Advanced API 后端
```

前端负责页面、菜单、路由、表格、弹窗、按钮显示和用户交互。

后端负责登录、JWT、RBAC、菜单数据、业务接口、权限校验、队列、Redis 缓存和第三方接口。

## 技术栈

前端：

- Vue 3
- TypeScript
- Vite
- Element Plus
- Tailwind CSS
- Sass
- Pinia
- Vue Router
- ESLint / Prettier / Stylelint

后端：

- Yii2 Advanced
- Yii2 REST/API 控制器
- JWT
- Yii2 RBAC
- MySQL
- Redis / yii2-queue
- DingTalk SDK

## 开发工具

前端建议使用 VS Code，后端 Yii2 建议使用 PhpStorm。

前端项目建议在 VS Code 中直接打开：

```text
D:\www\art-design-pro
```

不要直接打开：

```text
D:\www
```

否则 VS Code 可能无法准确识别当前项目的 ESLint、Prettier、TypeScript、Vite 配置。

### VS Code 推荐扩展

| 扩展 | 作用 | 运行方式 | 常用命令 |
| --- | --- | --- | --- |
| Vue - Official | Vue 3、`.vue`、TypeScript 类型提示、模板检查、组件跳转 | 自动运行 | `Vue: Restart Vue Server` |
| ESLint | 根据项目 ESLint 规则提示 JS / TS / Vue 代码问题，并自动修复可修复问题 | 自动提示，保存时自动修复 | `ESLint: Fix all auto-fixable Problems`，项目命令：`pnpm lint`、`pnpm fix` |
| Prettier | 统一代码格式，如缩进、换行、引号等 | 手动格式化为主，当前项目不让它直接参与保存格式化 | `Format Document`，项目命令：`pnpm lint:prettier` |
| Tailwind CSS IntelliSense | Tailwind class 提示、颜色预览、语法提示 | 自动运行 | 通常不需要手动命令 |
| Element Plus Snippets | Element Plus 组件代码片段 | 手动触发代码片段 | 输入片段前缀后按 `Tab` 或 `Enter` |
| GitLens | 增强 Git 历史、blame、提交记录查看能力 | 自动增强，也可手动执行命令 | `GitLens: Open File History`、`GitLens: Show Line Commit Details` |
| Path Intellisense | 文件路径自动补全 | 自动运行 | 通常不需要手动命令 |
| Auto Rename Tag | 修改 HTML / Vue 标签时自动同步结束标签 | 自动运行 | 通常不需要手动命令 |
| Error Lens | 把 TypeScript / ESLint / Volar 等错误直接显示到代码行内 | 自动运行 | `Error Lens: Toggle Error Lens` |
| DotENV | `.env` 文件语法高亮 | 自动运行 | 通常不需要手动命令 |
| Iconify IntelliSense | Iconify 图标名称提示和预览，适合 `ri:xxx` 菜单图标 | 自动运行 | 通常不需要手动命令 |

建议：

- 不要安装旧的 `Vetur`，它会和 `Vue - Official` 冲突。
- `TypeScript Vue Plugin` 通常不需要单独安装，优先以 `Vue - Official` 为准。
- 如果安装了多个格式化扩展，`.vue`、`.ts`、`.js`、`.scss` 默认格式化工具统一使用 `Prettier - Code formatter`。
- 如果安装了 `UnoCSS` 但当前项目没有使用 UnoCSS，可以在本项目工作区禁用。

### VS Code 保存和格式化策略

项目级配置在：

```text
.vscode/settings.json
```

当前约定：

```json
{
  "files.autoSave": "afterDelay",
  "files.autoSaveDelay": 1000,
  "editor.formatOnSave": false,
  "editor.codeActionsOnSaveTimeout": 3000,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "always"
  },
  "prettier.requireConfig": true
}
```

含义：

- 停止输入约 1 秒后自动保存。
- 保存时只执行 ESLint 自动修复。
- 不让 VS Code 保存时再额外跑一遍 Prettier，避免 ESLint 和 Prettier 同时抢格式。
- Prettier 仍然作为默认手动格式化器使用。
- 前端格式化问题不作为重点处理，除非它直接影响功能运行。

如果保存后仍有红线，优先判断是否影响功能：

- 不影响功能：先继续开发。
- 影响功能：再单独处理。
- VS Code 插件状态异常：执行 `Developer: Reload Window`。
- Vue 类型服务异常：执行 `Vue: Restart Vue Server`。

## 常用命令

前端：

```bash
pnpm install
pnpm dev
pnpm exec vue-tsc --noEmit
pnpm lint
pnpm fix
pnpm build
```

后端：

```bash
composer install
php init
php yii migrate --interactive=0
php yii menu-seed
php yii permission-sync admin
php yii queue/listen
```

钉钉通讯录同步：

```bash
# 默认：先获取当前应用授权范围内的部门列表，再递归同步部门员工
php yii ding-talk/sync-employees

# 指定部门 ID，同步该部门及子部门
php yii ding-talk/sync-employees 123456 1

# 指定部门 ID，只同步当前部门
php yii ding-talk/sync-employees 123456 0

# 关闭详细控制台日志
php yii ding-talk/sync-employees 0 1 --verboseLog=0

# 将已有用户 username 修正为手机号
php yii ding-talk/fix-usernames-by-mobile 0 1
```

当前同步只读取钉钉通讯录，不会修改钉钉数据；本地会写入或更新 `user`、`oa_employee`、`oa_sync_log`。

## 环境配置

`.env`：

```env
VITE_PORT = 3006
VITE_ACCESS_MODE = backend
VITE_WITH_CREDENTIALS = false
```

`.env.development`：

```env
VITE_API_URL = /api
VITE_API_PROXY_URL = http://api.artdesign.com
```

`.env.production`：

```env
VITE_API_URL = https://api.artdesign.com
VITE_ACCESS_MODE = backend
```

改 `.env` 后必须重启 Vite：

```bash
pnpm dev
```

## 前端目录

```text
src/api         接口封装
src/views       页面
src/router      路由、菜单转换、动态路由注册
src/store       Pinia 状态
src/utils/http  HTTP 请求封装
src/types       全局类型
src/config      系统配置
docs            项目文档
```

常用接口文件：

```text
src/api/auth.ts
src/api/user.ts
src/api/role.ts
src/api/menu.ts
src/api/permission.ts
src/api/notice.ts
src/api/dict.ts
src/api/file.ts
src/api/upload.ts
src/api/operation-log.ts
src/api/customer.ts
src/api/product.ts
src/api/dingtalk.ts
```

常用页面：

```text
src/views/system/user/index.vue
src/views/system/role/index.vue
src/views/system/menu/index.vue
src/views/system/permission/index.vue
src/views/system/dict/index.vue
src/views/system/file/index.vue
src/views/system/user-center/index.vue
src/views/system/operation-log/index.vue
src/views/system/queue-task/index.vue
src/views/content/notice/index.vue
src/views/customer/manage/index.vue
src/views/product/manage/index.vue
src/views/product/category/index.vue
src/views/dingtalk/employee/index.vue
```

## 登录流程

1. 登录页调用 `src/api/auth.ts`。
2. 前端请求 `POST /login`。
3. 开发环境中，Vite 把 `/api/login` 代理到 `http://api.artdesign.com/login`。
4. 后端返回 `access_token`、`refresh_token`、用户基础信息。
5. token 存入 Pinia `userStore`，并持久化到 localStorage。
6. 后续请求由 `src/utils/http` 自动添加：

```http
Authorization: Bearer xxx
```

浏览器查看位置：

```text
Application -> Local storage -> http://localhost:3006 -> sys-v3.0.2-user
```

当前路由使用 history 模式，不再使用 `#`：

```text
http://localhost:3006/dashboard/console
```

退出登录后默认回到登录页，再登录默认进入工作台，不继续拼接多层 `redirect`。

## 用户信息和按钮权限

登录后路由守卫会请求：

```text
POST /user/profile
POST /user/menus
```

`/user/profile` 返回用户信息、角色、按钮权限等。

`/user/menus` 返回当前用户可访问的菜单树，并把按钮权限放入页面路由的 `meta.authList`。

当前项目使用：

```env
VITE_ACCESS_MODE = backend
```

所以左侧菜单和按钮权限主要以后端 `/user/menus` 为准。

前端按钮判断：

```ts
const { hasAuth } = useAuth()
hasAuth('user.create')
```

后端仍必须做 RBAC 校验，前端隐藏按钮只是体验优化。

## 菜单和权限关系

菜单表用于组织前端菜单和角色权限树；Yii2 RBAC 表用于真正权限判断。

菜单类型：

```text
type = 1 目录
type = 2 菜单页面
type = 3 按钮权限
```

推荐填写方式：

```text
目录：标题、路由路径、图标、排序
菜单：父级、标题、路由名称、路由路径、组件路径、权限标识、图标、排序
按钮：父级菜单、标题、权限标识、排序
```

示例：

```text
系统管理          type=1 path=/system
用户管理          type=2 path=/system/user component=/system/user permission=user.view
新增用户          type=3 permission=user.create
修改用户          type=3 permission=user.update
删除用户          type=3 permission=user.delete
```

注意：

- 目录节点只做分组，不作为真实 RBAC 权限提交。
- 菜单和按钮节点可以绑定 `permission`。
- 菜单新增或修改时，会同步创建对应 RBAC 权限。
- 角色权限分配页面按菜单树展示。
- 危险权限，例如 `delete`，页面上会做醒目标记。

## 后端权限约定

后端控制器继承 `api/controllers/BaseController.php`。

常用配置：

```php
protected array $publicActions = [];
protected array $authOnlyActions = [];
protected array $rbacPermissions = [];
```

含义：

- `publicActions`：完全公开，例如登录。
- `authOnlyActions`：只需要登录，例如个人资料、修改密码、上传头像、获取菜单。
- `rbacPermissions`：需要登录并通过 RBAC。

推荐把权限集中写在控制器顶部，不要在每个 action 里反复写 `Yii::$app->user->can()`。

## 已完成模块

当前基础版已经包含：

- JWT 登录和 refresh token
- 用户信息 `/user/profile`
- 后端菜单 `/user/menus`
- Yii2 RBAC
- 用户管理
- 角色管理
- 角色权限分配
- 菜单管理
- 权限管理
- 公告管理
- 字典管理
- 文件分组和附件管理
- 公共上传和头像上传
- 用户中心
- 操作日志
- 队列任务示例
- Redis 菜单缓存
- 钉钉员工同步
- 钉钉员工管理
- 客户管理
- 产品分类
- 产品管理
- 稿件管理
- 履约管理
- 合同管理
- 合同产品明细
- 回款计划
- 回款记录
- 生产环境 Nginx 部署文档

## 业务模块迁移注意事项

从旧项目迁移模块时，当前约定：

- 用户、RBAC、菜单、登录、权限不从旧项目迁移，使用当前项目已有基础能力。
- 新业务表尽量统一加业务前缀，例如 `crm_`、`oa_`。
- `created_at`、`updated_at` 交给 Model 行为自动处理，不从前端传。
- `created_by`、`updated_by` 交给后端自动处理。
- 前端表单字段要和后端 Model 对齐，避免后端读取不存在字段导致 500。
- 前端表单里的可选下拉外键不要默认写 `0`，例如客户、合同、产品、负责人、分类等；默认用空字符串 `''`，提交前再转成数字。
- 只有真实存在 `0` 选项时才保留 `0`，例如菜单父级的“顶级菜单”。
- 表单里的 `created_at`、`updated_at`、`latest_follow_time` 这类派生字段不要从前端硬传，后端也不要直接读不存在的数组键。
- `<script setup>` 中如果初始化对象会提前调用工具函数，工具函数用 `function xxx() {}` 声明，避免 `const xxx = () => {}` 带来的初始化顺序问题。
- 列表接口统一使用分页参数 `page`、`size`。
- 接口返回统一走当前项目格式。
- 新增菜单和权限后，通常需要重新登录刷新本地菜单和按钮权限。

已迁移业务：

- 客户管理：`crm_customer`、`crm_customer_contact`
- 产品管理：`crm_product_category`、`crm_ad_product`
- 稿件管理：`crm_manuscript`、`crm_manuscript_writer`
- 履约管理：`crm_fulfillment`、`crm_fulfillment_execution`
- 合同管理：`crm_contract`、`crm_contract_product`
- 回款管理：`crm_receivable_plan`、`crm_receivable_record`

合同相关约定：

- 新增或修改合同时，合同产品明细和回款计划在合同弹窗内一起维护。
- 合同最终金额由产品明细、优惠金额、税率计算得出，不建议前端随意传覆盖值。
- 回款计划总额需要和合同最终金额一致。
- 已经产生回款记录的回款计划，不应在合同编辑时直接删除。
- 履约管理选择合同产品，不直接让用户手填合同 ID 或合同产品 ID。
- 从 Excel 导入产品时，字段映射文档见 `docs/product-list-field-mapping.md`，清洗结果见 `docs/product-list-mapped.csv`。

## 新增 CRUD 标准流程

以后新增业务模块，建议按这个顺序：

1. 设计业务表。
2. 创建 Yii2 migration。
3. 创建 Yii2 Model，放在 `common/models`。
4. 创建 API Controller，放在 `api/controllers`。
5. 在 `api/config/main.php` 添加路由。
6. 在控制器 `$rbacPermissions` 配置权限。
7. 添加菜单页面节点和按钮节点。
8. 执行 `php yii menu-seed` 或通过菜单管理维护菜单。
9. 执行 `php yii permission-sync admin` 或在角色权限页授权。
10. 用 Postman 验证后端接口。
11. 新建前端接口文件 `src/api/xxx.ts`。
12. 新建页面 `src/views/xxx/index.vue`。
13. 接列表、搜索、分页。
14. 接新增弹窗。
15. 接修改弹窗。
16. 接删除确认。
17. 验证按钮权限隐藏。
18. 直接请求未授权接口，确认返回 403。

## CRUD 命名示例

以商品模块为例。

后端接口：

```text
POST product/index
POST product/view
POST product/create
POST product/update
POST product/delete
```

RBAC 权限：

```text
product.view
product.create
product.update
product.delete
```

前端文件：

```text
src/api/product.ts
src/views/product/index.vue
```

菜单节点：

```text
商品管理  type=2 permission=product.view component=/product
新增商品  type=3 permission=product.create
修改商品  type=3 permission=product.update
删除商品  type=3 permission=product.delete
```

## 接口封装模板

```ts
import request from '@/utils/http'

export interface ProductItem {
  id: number
  title: string
  status: number
  created_at?: number | null
}

export interface ProductListParams {
  page?: number
  size?: number
  keyword?: string
  status?: number
}

export type ProductListResponse = Api.Common.PaginatedResponse<ProductItem>

export interface ProductSaveParams {
  id?: number
  title: string
  status: number
}

export function fetchProductList(params: ProductListParams) {
  return request.post<ProductListResponse>({
    url: '/product/index',
    params
  })
}

export function createProduct(params: ProductSaveParams) {
  return request.post<ProductItem>({
    url: '/product/create',
    params,
    showSuccessMessage: true
  })
}

export function updateProduct(params: ProductSaveParams) {
  return request.post<ProductItem>({
    url: '/product/update',
    params,
    showSuccessMessage: true
  })
}

export function deleteProduct(params: { id: number }) {
  return request.post({
    url: '/product/delete',
    params,
    showSuccessMessage: true
  })
}
```

## 钉钉相关注意事项

当前第一阶段只做员工同步和本地系统登录。

同步逻辑：

- 读取钉钉通讯录。
- 本地创建或更新 `user`。
- 本地创建或更新 `oa_employee`。
- 同步日志写入 `oa_sync_log`。

账号约定：

- `username` 使用员工手机号。
- 初始密码使用手机号后 6 位。
- 登录界面右上角展示本地用户姓名。

注意：

- 钉钉接口只读取，不修改钉钉通讯录。
- 钉钉应用必须配置通讯录授权范围。
- 如果报“部门 id 不在授权范围内”，先检查钉钉开放平台通讯录权限范围。
- 钉钉接口有 QPS 限流，不要短时间频繁反复执行同步命令。
- 员工变动不频繁时，手动执行同步命令即可。

## 常见问题

### 左侧菜单不显示

检查：

- `.env` 是否是 `VITE_ACCESS_MODE = backend`
- 改 `.env` 后是否重启了 `pnpm dev`
- `/user/menus` 是否返回菜单
- 当前用户角色是否拥有菜单的 `permission`
- 菜单 `visible` 是否为 `1`
- 菜单类型是否为目录或菜单
- 是否重新登录刷新了菜单缓存

### 按钮不显示

检查：

- 菜单表是否有 `type=3` 的按钮节点
- 按钮 `parent_id` 是否指向页面菜单
- 按钮 `permission` 是否正确
- RBAC 是否存在该权限
- 当前角色是否拥有该权限
- 是否重新登录刷新了用户菜单

### 点击菜单页面空白

检查：

- 菜单 `component` 是否对应 `src/views` 下真实文件
- 页面组件是否只有一个根节点
- 浏览器控制台是否有组件加载错误
- 菜单是否是单节点，单节点需要按当前动态路由规则处理

### 页面空白并出现初始化错误

如果控制台出现：

```text
Cannot access 'getToday' before initialization
Cannot read properties of undefined
hasAuth is not a function
```

优先检查 `<script setup>` 中是否在表单默认值、查询条件、表格列生成前调用了后面才用 `const` 定义的函数。

推荐写法：

```ts
function getToday() {
  return new Date().toISOString().slice(0, 10)
}
```

不要在会被提前调用的场景里写成：

```ts
const getToday = () => new Date().toISOString().slice(0, 10)
```

### 下拉框默认显示 0

新增弹窗里的客户、合同、产品、负责人、分类等下拉框，如果没有选择值，不要把默认值设成 `0`。

推荐：

```ts
const form = reactive({
  customer_id: '',
  product_id: ''
})

const params = {
  ...form,
  customer_id: Number(form.customer_id || 0),
  product_id: Number(form.product_id || 0)
}
```

只有菜单父级这类明确有“顶级菜单 = 0”的字段，才保留 `0`。

### 数字输入框显示不全

`ElInputNumber` 在表格或窄弹窗内容易因为列宽不足显示不全。

处理方式：

- 表格列给足 `width` 或 `minWidth`。
- 弹窗宽度不足时优先加大弹窗宽度。
- 金额、税率、数量等字段不要放在过窄列里。

### 接口返回 403

检查：

- 控制器 `$rbacPermissions` 是否配置当前 action
- RBAC 权限是否存在
- 角色是否拥有权限
- 用户是否分配了角色
- token 是否属于当前用户
- 是否重新登录

### 菜单改了前端没变

后端有 Redis 菜单缓存，前端也会缓存用户和菜单状态。处理方式：

```text
刷新浏览器
退出重新登录
必要时清理 localStorage
```

这些操作会刷新后端菜单缓存版本：

- 菜单新增、修改、删除
- 角色分配权限
- 用户分配角色
- 权限新增、修改、删除
- `php yii menu-seed`
- `php yii permission-sync admin`

### VS Code 保存后代码又变回去了

当前项目保存策略是：

- 自动保存打开。
- 保存时只跑 ESLint 自动修复。
- Prettier 只作为默认手动格式化器。

如果出现格式来回变化：

- 确认没有安装并启用 `Vetur`。
- 确认不是全局 VS Code 设置覆盖了项目设置。
- 执行 `Developer: Reload Window`。
- 不影响功能时，不优先处理格式化问题。

## GitHub 基础版

当前两个项目都打过公共基础版 tag：

```text
v1.0.0-base
```

前端仓库：

```text
https://github.com/mzq1210/art-design-pro.git
```

后端仓库：

```text
https://github.com/mzq1210/art-design-pro-admin.git
```

如果需要从基础版创建新项目，可以基于该 tag 克隆或新建分支。
