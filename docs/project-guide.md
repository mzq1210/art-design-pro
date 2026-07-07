# Art Design Pro + Yii2 API 项目接入说明

本文档记录当前项目的整体结构、关键配置、登录与权限流程、菜单流程，以及以后新增一个 CRUD 模块时的推荐步骤。

当前项目分为两部分：

- 前端后台 UI：`D:\www\art-design-pro`
- 后端 Yii2 API：`D:\www\art-design-pro-admin`

前端负责页面、路由、菜单展示、表格、弹窗、按钮显示等；后端负责登录、JWT、用户信息、RBAC 权限、菜单数据、业务接口。

## 一、当前技术栈

### 前端

- Vue 3
- TypeScript
- Vite
- Element Plus
- Tailwind CSS
- Sass
- Pinia
- Vue Router
- Axios 封装请求
- ESLint / Prettier / Stylelint

### 后端

- Yii2 Advanced
- Yii2 REST/API 控制器
- JWT 登录
- Yii2 RBAC
- MySQL
- Redis / Queue 已安装，后续可继续接入
- Redis 菜单缓存已接入，当前用于 `/user/menus`

### 开发工具建议

前端项目建议使用 VS Code 开发，后端 Yii2 项目继续使用 PhpStorm 开发。

VS Code 建议安装这些扩展：

- Vue - Official
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- TypeScript Vue Plugin 通常现在不需要单独安装，先以 Vue - Official 为准。
- Element Plus Snippets 可选，不安装也可以。

编辑器类型提示只是开发时的辅助检查，最终建议用下面命令检查整个前端项目的 TypeScript 类型：

```bash
pnpm exec vue-tsc --noEmit
```

## 二、前端目录说明

前端项目路径：

```text
D:\www\art-design-pro
```

常用目录如下。

```text
src
├─ api
├─ assets
├─ components
├─ config
├─ hooks
├─ locales
├─ router
├─ store
├─ types
├─ utils
└─ views
```

### `src/api`

接口封装目录。

现在已经有这些业务接口文件：

```text
src/api/auth.ts
src/api/user.ts
src/api/role.ts
src/api/permission.ts
src/api/menu.ts
src/api/notice.ts
src/api/upload.ts
src/api/system-manage.ts
```

说明：

- `auth.ts`：登录、获取用户信息、修改个人资料、修改密码。
- `user.ts`：用户管理 CRUD、用户角色分配。
- `role.ts`：角色管理 CRUD、角色权限分配。
- `permission.ts`：权限列表相关。
- `menu.ts`：菜单管理 CRUD、菜单树。
- `notice.ts`：公告管理 CRUD。
- `upload.ts`：公共图片上传，例如用户头像。
- `system-manage.ts`：框架原本的系统管理接口，目前其中的菜单接口已经改为请求后端 `/user/menus`。

以后新增业务模块时，建议每个模块单独一个接口文件，例如：

```text
src/api/product.ts
src/api/order.ts
src/api/article.ts
```

接口封装一般写法：

```ts
import request from '@/utils/http'

export interface ProductItem {
  id: number
  title: string
  status: number
  created_at?: number
}

export interface ProductListParams {
  page?: number
  size?: number
  keyword?: string
  status?: number
}

export type ProductListResponse = Api.Common.PaginatedResponse<ProductItem>

export function fetchProductList(params: ProductListParams) {
  return request.post<ProductListResponse>({
    url: '/product/index',
    params
  })
}

export function createProduct(params: Partial<ProductItem>) {
  return request.post<ProductItem>({
    url: '/product/create',
    params,
    showSuccessMessage: true
  })
}
```

### `src/views`

页面目录。

当前主要业务页面：

```text
src/views/content/notice/index.vue
src/views/system/user/index.vue
src/views/system/role/index.vue
src/views/system/menu/index.vue
src/views/system/permission/index.vue
src/views/system/user-center/index.vue
```

建议每个业务模块一个目录，例如：

```text
src/views/product/index.vue
src/views/order/index.vue
```

如果模块比较复杂，可以拆分：

```text
src/views/product
├─ index.vue
└─ components
   ├─ ProductForm.vue
   └─ ProductSearch.vue
```

当前为了方便学习流程，很多页面直接把列表、搜索、弹窗都写在一个 `index.vue` 中，这样更直观。

### `src/router`

路由目录。

重要文件：

```text
src/router/index.ts
src/router/guards/beforeEach.ts
src/router/core/MenuProcessor.ts
src/router/core/RouteRegistry.ts
src/router/core/RouteTransformer.ts
src/router/core/ComponentLoader.ts
src/router/routes/staticRoutes.ts
src/router/routes/asyncRoutes.ts
src/router/modules/*.ts
```

说明：

- `staticRoutes.ts`：登录页、错误页等静态路由。
- `asyncRoutes.ts`：动态路由入口。
- `modules/*.ts`：前端静态菜单模式下使用的本地路由。
- `beforeEach.ts`：全局路由守卫，负责登录检查、获取用户信息、获取菜单、注册动态路由。
- `MenuProcessor.ts`：根据 `.env` 中 `VITE_ACCESS_MODE` 决定菜单来源。
- `RouteRegistry.ts`：把菜单转成 Vue Router 路由并注册。
- `RouteTransformer.ts`：把后端返回的菜单对象转换为真实路由配置。
- `ComponentLoader.ts`：根据后端返回的 `component` 字符串加载 `src/views` 下的 Vue 页面。

当前项目已经切到后端菜单模式：

```env
VITE_ACCESS_MODE = backend
```

这意味着：

- 左侧菜单来自后端 `/user/menus`
- 页面按钮权限来自当前路由的 `meta.authList`
- 不再主要依赖 `src/router/modules/*.ts` 来显示左侧菜单

但 `src/router/modules/*.ts` 仍然可以作为开发参考，尤其是路径、组件路径、菜单结构。

### `src/store`

Pinia 状态管理目录。

重要文件：

```text
src/store/modules/user.ts
src/store/modules/menu.ts
src/store/modules/worktab.ts
src/store/modules/setting.ts
```

说明：

- `user.ts`：登录状态、用户信息、access token、refresh token。
- `menu.ts`：左侧菜单列表、首页路径、动态路由移除函数。
- `worktab.ts`：顶部 tab 标签页。
- `setting.ts`：主题、菜单宽度、布局、刷新状态等。

当前登录成功后，token 存在 `userStore` 中，并通过 Pinia 持久化到 localStorage。

浏览器里可以在：

```text
Application -> Local storage -> http://localhost:3006
```

看到类似：

```text
sys-v3.0.2-user
sys-v3.0.2-worktab
```

### `src/utils/http`

HTTP 请求封装。

重要文件：

```text
src/utils/http/index.ts
src/utils/http/error.ts
src/utils/http/status.ts
```

请求会自动：

- 拼接 `VITE_API_URL`
- 给请求头加 `Authorization: Bearer xxx`
- POST 请求自动把 `params` 放到 body
- 统一处理 `{ code, message/msg, data }` 格式
- 统一处理 401 未登录
- 可通过 `showSuccessMessage: true` 显示成功提示

常见写法：

```ts
request.post({
  url: '/notice/create',
  params,
  showSuccessMessage: true
})
```

### `src/types`

TypeScript 类型目录。

当前主要使用：

```text
src/types/api/api.d.ts
src/types/router/index.ts
```

其中：

- `Api.Common.PaginatedResponse<T>` 是分页接口通用返回结构。
- `AppRouteRecord` 是菜单/动态路由结构。

## 三、前端关键配置文件

### `.env`

通用环境变量。

当前关键配置：

```env
VITE_VERSION = 3.0.2
VITE_PORT = 3006
VITE_BASE_URL = /
VITE_ACCESS_MODE = backend
VITE_WITH_CREDENTIALS = false
VITE_OPEN_ROUTE_INFO = false
```

重点是：

```env
VITE_ACCESS_MODE = backend
```

含义：

- `frontend`：菜单和按钮主要由前端路由配置控制。
- `backend`：菜单和按钮由后端接口返回。

修改 `.env` 后必须重启 Vite：

```bash
pnpm dev
```

### `.env.development`

开发环境配置。

当前关键配置：

```env
VITE_API_URL = /api
VITE_API_PROXY_URL = http://api.artdesign.com
```

含义：

- 前端请求 `/api/login`
- Vite 开发服务器把 `/api` 代理到 `http://api.artdesign.com`
- 这样开发时不用浏览器直接跨域请求后端

### `.env.production`

生产环境配置。

生产环境通常应该把：

```env
VITE_API_URL = https://你的正式接口域名
```

或者使用相对路径：

```env
VITE_API_URL = /api
```

然后由 Nginx / Apache 反向代理 `/api` 到 Yii2 API。

### `vite.config.ts`

Vite 配置。

主要作用：

- 设置开发服务器端口。
- 设置开发环境代理。
- 设置路径别名 `@`。
- 接入 Vue 插件。
- 接入 Tailwind。
- 接入自动导入。

你平时主要关注代理配置即可。

### `package.json`

前端命令入口。

常用命令：

```bash
pnpm install
pnpm dev
pnpm exec vue-tsc --noEmit --pretty false
pnpm exec prettier --write 文件路径
pnpm build
```

### `tsconfig.json`

TypeScript 配置。

一般不用频繁改。

### `eslint.config.mjs`

ESLint 配置。

用于代码规则检查。

### `.prettierrc`

Prettier 格式化配置。

### `.stylelintrc.cjs`

Stylelint 样式检查配置。

## 四、后端目录说明

后端项目路径：

```text
D:\www\art-design-pro-admin
```

这是 Yii2 Advanced 项目结构。

重要目录：

```text
api
common
console
backend
frontend
vendor
```

当前实际作为前后端分离 API 使用的是：

```text
api
common
console
```

### `api`

API 应用目录。

常用文件：

```text
api/config/main.php
api/controllers/BaseController.php
api/controllers/SiteController.php
api/controllers/UserController.php
api/controllers/CommonController.php
api/controllers/NoticeController.php
api/controllers/RoleController.php
api/controllers/PermissionController.php
api/controllers/RuleController.php
api/controllers/MenuController.php
```

说明：

- `SiteController.php`：登录、刷新 token。
- `UserController.php`：用户管理、用户信息、当前用户菜单、个人中心、修改密码。
- `CommonController.php`：公共上传接口，目前用于头像上传。
- `NoticeController.php`：公告 CRUD。
- `RoleController.php`：角色 CRUD、角色权限分配。
- `PermissionController.php`：权限 CRUD。
- `RuleController.php`：RBAC rule 管理。
- `MenuController.php`：菜单管理 CRUD。

### `api/config/main.php`

API 应用主配置。

关键配置：

- JSON 请求解析：

```php
'parsers' => [
    'application/json' => yii\web\JsonParser::class,
],
```

- JSON 响应格式：

```php
'response' => [
    'format' => yii\web\Response::FORMAT_JSON,
]
```

- 无状态用户认证：

```php
'user' => [
    'identityClass' => \common\models\User::class,
    'enableSession' => false,
    'loginUrl' => null,
]
```

- API 路由：

```php
'POST login' => 'site/login',
'POST user/profile' => 'user/profile',
'POST user/update-profile' => 'user/update-profile',
'POST user/change-password' => 'user/change-password',
'POST user/menus' => 'user/menus',
'POST common/upload' => 'common/upload',
'POST notice/index' => 'notice/index',
```

新增接口时，需要在这里加路由。

### `api/controllers/BaseController.php`

API 控制器基类，当前已经把“是否登录”和“是否需要 RBAC 权限”集中放到这里处理。

子控制器主要配置三个数组：

```php
protected array $publicActions = [];
protected array $authOnlyActions = [];
protected array $rbacPermissions = [];
```

含义：

- `publicActions`：完全公开，不需要登录。当前主要用于登录接口这类特殊场景。
- `authOnlyActions`：需要 JWT 登录，但不需要 RBAC 权限。
- `rbacPermissions`：需要 JWT 登录，并且需要指定 RBAC 权限。

判断顺序：

1. `options` 请求放行，用于跨域预检。
2. `publicActions` 放行，不要求 token。
3. `authOnlyActions` 要求 token，但不检查 RBAC。
4. 其他 action 根据 `$rbacPermissions` 检查 `Yii::$app->user->can($permission)`。

例如用户控制器：

```php
protected array $authOnlyActions = [
    'profile',
    'update-profile',
    'change-password',
    'menus',
];

protected array $rbacPermissions = [
    'index' => 'user.view',
    'view' => 'user.view',
    'create' => 'user.create',
    'update' => 'user.update',
    'delete' => 'user.delete',
    'roles' => 'user.role.view',
    'assign-roles' => 'user.role.assign',
];
```

这里的含义是：

- `/user/profile`、`/user/update-profile`、`/user/change-password`、`/user/menus`：只要登录即可。
- `/user/index`、`/user/create`、`/user/delete` 等用户管理接口：必须有对应 RBAC 权限。

公共上传也是登录即可：

```php
class CommonController extends BaseController
{
    protected array $authOnlyActions = ['upload'];
}
```

这样以后新增接口时，不建议在每个 action 里重复写：

```php
if (!Yii::$app->user->can('xxx')) {
    throw new ForbiddenHttpException(...);
}
```

更推荐把权限映射写到控制器顶部的 `$rbacPermissions`。

### `common`

公共代码目录。

常用目录：

```text
common/models
common/config
```

模型一般放在：

```text
common/models
```

当前相关模型：

```text
common/models/User.php
common/models/Menu.php
common/models/Notice.php
```

### `common/config/main.php`

公共组件配置。

当前重要配置：

```php
'authManager' => [
    'class' => yii\rbac\DbManager::class,
],
```

表示 RBAC 使用数据库表：

```text
auth_item
auth_item_child
auth_assignment
auth_rule
```

如果你用了表前缀，实际可能是：

```text
web_auth_item
web_auth_item_child
web_auth_assignment
web_auth_rule
```

### `common/config/main-local.php`

本地数据库配置。

主要配置：

```php
'db' => [
    'dsn' => 'mysql:host=xxx;dbname=xxx',
    'username' => 'xxx',
    'password' => 'xxx',
    'charset' => 'utf8',
],
```

这个文件一般包含敏感信息，正式项目需要注意不要误提交密码。

### `console`

控制台命令目录。

当前新增过：

```text
console/controllers/MenuSeedController.php
console/controllers/PermissionSyncController.php
```

用于初始化菜单表：

```bash
php yii menu-seed
```

它会插入或更新：

- 仪表盘
- 工作台
- 系统管理
- 用户管理
- 角色管理
- 菜单管理
- 内容管理
- 公告管理
- 对应按钮权限节点

这个命令可以重复执行，不会反复生成重复菜单。

用于把菜单表中的权限同步到 RBAC：

```bash
php yii permission-sync admin
```

其中 `admin` 是角色名。传角色名时，命令会把菜单权限授权给这个角色；不传角色名时，只创建缺失的 RBAC 权限。

## 五、登录流程

### 1. 前端登录

登录页面调用：

```ts
fetchLogin()
```

文件：

```text
src/api/auth.ts
```

实际请求：

```text
POST /login
```

开发环境因为 `VITE_API_URL=/api` 和 Vite proxy，浏览器实际请求类似：

```text
http://localhost:3006/api/login
```

然后 Vite 代理到：

```text
http://api.artdesign.com/login
```

### 2. 后端返回 token

后端返回结构大致为：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "access_token": "...",
    "refresh_token": "...",
    "expires_in": 7200,
    "token_type": "Bearer",
    "user": {
      "id": 1,
      "username": "admin"
    }
  }
}
```

前端 `auth.ts` 会转换成框架需要的格式：

```ts
return {
  token: res.access_token,
  refreshToken: res.refresh_token
}
```

### 3. token 保存位置

登录成功后 token 保存在 Pinia 的 `userStore`。

因为 `userStore` 开启了持久化，最终会进入浏览器 localStorage：

```text
sys-v3.0.2-user
```

### 4. 后续请求自动带 token

`src/utils/http/index.ts` 请求拦截器会自动加：

```http
Authorization: Bearer xxx
```

后端根据 JWT 识别当前用户。

## 六、用户信息和按钮权限流程

### `/user/profile`

登录后路由守卫会调用：

```ts
fetchGetUserInfo()
```

实际请求：

```text
POST /user/profile
```

后端返回：

```json
{
  "userId": 1,
  "userName": "admin",
  "realName": "admin",
  "nickName": "admin",
  "buttons": ["user.view", "user.create", "role.view", "role.create"],
  "roles": ["R_SUPER"],
  "email": "",
  "avatar": "",
  "mobile": "",
  "address": "",
  "gender": "",
  "introduction": ""
}
```

这里的 `buttons` 来自：

```php
Yii::$app->authManager->getPermissionsByUser($userId)
```

注意：

- 在 `frontend` 模式下，`hasAuth()` 主要读这里的 `buttons`。
- 在 `backend` 模式下，`hasAuth()` 主要读当前路由的 `meta.authList`。

当前项目已经切到：

```env
VITE_ACCESS_MODE = backend
```

所以按钮权限是否显示，重点看 `/user/menus` 返回的菜单节点是否有 `meta.authList`。

### 个人中心

页面：

```text
src/views/system/user-center/index.vue
```

接口：

```text
POST /user/profile
POST /user/update-profile
POST /user/change-password
POST /common/upload
```

当前个人中心的处理方式：

- 左侧面板从 `userStore.getUserInfo` 读取用户信息。
- 基本设置可以修改用户名、邮箱、头像。
- 昵称、手机号、地址、性别、简介等字段页面先预留，目前后端暂时返回空值。
- 修改密码需要旧密码、新密码、确认密码。
- 头像上传使用公共上传接口，上传成功后把返回的 `url` 保存到用户 `avatar` 字段。

这些接口属于“登录即可访问”的接口，不需要 RBAC 权限：

```php
protected array $authOnlyActions = [
    'profile',
    'update-profile',
    'change-password',
    'menus',
];
```

原因是：用户修改自己的资料、修改自己的密码、获取自己的菜单，本质上不属于“管理别人”的后台权限。

### 公共上传

前端封装：

```text
src/api/upload.ts
```

后端控制器：

```text
api/controllers/CommonController.php
```

接口：

```text
POST /common/upload
```

请求方式是 `multipart/form-data`：

```text
file: 图片文件
scene: avatar
```

后端目前限制：

- 必须登录。
- 只允许图片。
- 支持 `jpg`、`jpeg`、`png`、`gif`、`webp`。
- 最大 2MB。
- 会用 `getimagesize()` 再验证一次真实图片类型。

存储位置：

```text
api/web/uploads/{scene}/{Ym}/文件名
```

例如：

```text
api/web/uploads/avatar/202607/xxxx.png
```

返回示例：

```json
{
  "url": "http://api.artdesign.com/uploads/avatar/202607/xxxx.png",
  "path": "/uploads/avatar/202607/xxxx.png",
  "name": "avatar.png",
  "size": 12345,
  "scene": "avatar"
}
```

## 七、菜单和动态路由流程

### 1. 后端菜单表

菜单表 `menu` 当前用于两件事：

- 左侧菜单显示
- 角色权限分配树

核心字段：

```text
id
parent_id
type
title
name
path
component
icon
permission
sort
visible
keep_alive
is_external
external_url
remark
created_at
updated_at
```

字段说明：

- `type = 1`：目录。
- `type = 2`：菜单页面。
- `type = 3`：按钮权限。
- `title`：菜单标题。
- `name`：路由名称，需要唯一。
- `path`：路由路径。
- `component`：前端组件路径。
- `icon`：菜单图标。
- `permission`：绑定 RBAC 权限，例如 `user.view`。
- `sort`：排序。
- `visible`：是否显示在菜单。
- `keep_alive`：页面是否缓存。

### 2. 当前用户菜单接口

接口：

```text
POST /user/menus
```

后端文件：

```text
api/controllers/UserController.php
```

逻辑：

1. 查询 `menu` 表。
2. 只把 `type = 1/2` 返回为左侧菜单。
3. 用当前用户 RBAC 权限过滤菜单。
4. 把 `type = 3` 的按钮节点转换为父菜单的 `meta.authList`。
5. 额外注入个人中心隐藏路由 `/system/user-center`。

返回结构示例：

```json
[
  {
    "path": "/system",
    "name": "System",
    "component": "/index/index",
    "meta": {
      "title": "系统管理",
      "icon": "ri:user-3-line",
      "keepAlive": true
    },
    "children": [
      {
        "path": "user",
        "name": "User",
        "component": "/system/user",
        "meta": {
          "title": "用户管理",
          "keepAlive": true,
          "authList": [
            {
              "title": "新增用户",
              "authMark": "user.create"
            }
          ]
        }
      }
    ]
  }
]
```

### 3. 前端如何使用菜单

路由守卫：

```text
src/router/guards/beforeEach.ts
```

流程：

1. 检查是否登录。
2. 请求 `/user/profile`。
3. 根据 `VITE_ACCESS_MODE` 获取菜单。
4. 当前是 `backend`，所以请求 `/user/menus`。
5. 注册动态路由。
6. 保存菜单到 `menuStore`。
7. 左侧菜单从 `menuStore.menuList` 渲染。

### 4. component 路径规则

后端菜单表里的 `component` 要对应前端 `src/views` 下的页面。

例如：

```text
component = /system/user
```

前端会尝试加载：

```text
src/views/system/user.vue
src/views/system/user/index.vue
```

当前实际文件是：

```text
src/views/system/user/index.vue
```

所以这个配置是正确的。

目录页面一般写：

```text
component = /index/index
```

例如：

```text
/system
/content
/dashboard
```

### 5. 隐藏路由

个人中心当前不是菜单表中的可见菜单，而是在 `/user/menus` 中由后端追加隐藏路由。

当前配置大致是：

```text
path = user-center
name = UserCenter
component = /system/user-center
meta.isHide = true
meta.isHideTab = true
```

这样它不会出现在左侧菜单里，但前端仍然能通过路由打开：

```text
/#/system/user-center
```

这种方式适合：

- 个人中心
- 修改密码
- 详情页
- 不希望出现在左侧菜单，但需要路由访问的页面

## 八、RBAC 权限设计

当前使用 Yii2 RBAC。

常见权限命名方式：

```text
模块.动作
```

例如：

```text
notice.view
notice.create
notice.update
notice.delete

user.view
user.create
user.update
user.delete

role.view
role.create
role.update
role.delete
role.permission.view
role.permission.assign

menu.view
menu.create
menu.update
menu.delete
```

建议：

- 菜单页面权限用 `xxx.view`。
- 新增按钮用 `xxx.create`。
- 修改按钮用 `xxx.update`。
- 删除按钮用 `xxx.delete`。
- 特殊操作用 `xxx.xxx`，例如 `role.permission.assign`。

### 哪些接口需要 RBAC

后台管理类接口需要 RBAC。

例如：

```text
user.index      -> user.view
user.create     -> user.create
role.index      -> role.view
menu.update     -> menu.update
notice.delete   -> notice.delete
```

用户自己的基础能力通常不需要 RBAC，但仍然需要登录。

例如：

```text
user.profile
user.update-profile
user.change-password
user.menus
common.upload
```

判断标准：

- 如果是在管理业务资源、管理用户、管理角色、操作后台数据，一般需要 RBAC。
- 如果是当前登录用户获取自己的信息、修改自己的密码、上传自己的头像，一般只需要 JWT 登录。
- 如果完全不需要登录，例如登录接口，才放到公开接口。

当前代码通过 `BaseController` 区分：

```php
protected array $publicActions = [];
protected array $authOnlyActions = [];
protected array $rbacPermissions = [];
```

### 角色和权限关系

角色是 `type = 1`。

权限是 `type = 2`。

角色拥有权限，实际存储在：

```text
auth_item_child
```

例如：

```text
admin -> user.view
admin -> user.create
admin -> user.update
admin -> user.delete
```

用户拥有角色，实际存储在：

```text
auth_assignment
```

例如：

```text
admin role -> user_id 1
```

### 菜单表和 RBAC 表是什么关系

菜单表不是 RBAC 表。

菜单表负责：

- 左侧显示什么
- 权限分配树长什么样
- 哪个菜单绑定哪个权限
- 哪个按钮绑定哪个权限

RBAC 表负责：

- 哪个角色有哪些权限
- 哪个用户有哪些角色
- `Yii::$app->user->can('xxx')` 是否通过

菜单表中的 `permission` 字段必须和 RBAC 权限名一致。

例如菜单表按钮节点：

```text
title = 新增用户
type = 3
permission = user.create
```

RBAC 中也必须存在：

```text
user.create
```

并且当前用户的角色拥有这个权限，按钮才会显示。

## 九、菜单管理和角色权限分配流程

### 菜单管理

页面：

```text
src/views/system/menu/index.vue
```

接口：

```text
src/api/menu.ts
```

后端：

```text
api/controllers/MenuController.php
```

接口：

```text
POST /menu/index
POST /menu/tree
POST /menu/create
POST /menu/update
POST /menu/delete
```

### 权限管理

页面：

```text
src/views/system/permission/index.vue
```

接口：

```text
src/api/permission.ts
```

后端：

```text
api/controllers/PermissionController.php
```

接口：

```text
POST /permission/index
POST /permission/create
POST /permission/update
POST /permission/delete
POST /permission/diagnose
POST /permission/sync-from-menu
```

当前已经做了这些能力：

- 查看 RBAC 权限列表。
- 新增、修改、删除权限。
- 按权限名前缀折叠分组，例如 `user.view` 属于 `user` 模块。
- 对高危权限显示醒目标记，例如 `role.permission.assign`、`user.role.assign`、`menu.delete`、`permission.delete`。
- 检查菜单表和 RBAC 权限是否一致。
- 从菜单表一键同步缺失的 RBAC 权限。

同步逻辑：

1. 读取 `menu.permission` 中非空的权限标识。
2. 如果 RBAC 中没有这个权限，就创建。
3. 如果 RBAC 中已有权限但描述为空，就用菜单标题补充描述。
4. 已存在且已有描述的权限不会被覆盖。

菜单管理里新增或修改菜单时，也会自动执行同样的单个权限同步：

- 如果菜单填写了新的 `permission`，保存后会自动创建 RBAC 权限。
- 如果 RBAC 权限已存在但描述为空，会用菜单标题补充描述。
- 如果旧权限已经不再被菜单使用，不会自动删除，避免误删已经授权给角色的权限。

第一次搭建或菜单权限较乱时，可以用控制台命令初始化：

```bash
php yii permission-sync admin
```

这个命令会从菜单表收集权限，自动创建 RBAC 中缺失的权限。如果传了角色名，例如 `admin`，还会把这些权限授权给该角色。

### 字典管理

页面：

```text
src/views/system/dict/index.vue
```

接口：

```text
src/api/dict.ts
```

后端：

```text
api/controllers/DictController.php
common/models/DictType.php
common/models/DictItem.php
```

数据表：

```text
dict_type
dict_item
```

接口：

```text
POST /dict/type-index
POST /dict/type-create
POST /dict/type-update
POST /dict/type-delete
POST /dict/item-index
POST /dict/item-create
POST /dict/item-update
POST /dict/item-delete
POST /dict/options
```

页面结构：

- 左侧维护字典类型，例如 `user_status`。
- 右侧维护当前字典类型下的字典项，例如 `启用 = 1`、`禁用 = 0`。
- `dict/options` 用于后续业务页面按字典编码获取可用选项。

### 文件管理

页面：

```text
src/views/system/file/index.vue
```

接口：

```text
src/api/file.ts
```

后端：

```text
api/controllers/FileController.php
common/models/FileGroup.php
common/models/FileAttachment.php
```

数据表：

```text
file_group
file_attachment
```

接口：

```text
POST /file/group-index
POST /file/group-create
POST /file/group-update
POST /file/group-delete
POST /file/index
POST /file/upload
POST /file/update
POST /file/delete
```

当前文件管理支持：

- 文件分组管理。
- 按分组查看附件。
- 上传文件到当前分组。
- 移动文件到其他分组。
- 删除附件时同步删除本地文件。

存储位置：

```text
api/web/uploads/{scene}/{Ym}/文件名
```

注意：

- 头像上传仍然走 `/common/upload`，只允许图片。
- 文件管理上传走 `/file/upload`，允许常见附件，但禁止 `php`、`exe`、`sh`、`html` 等危险扩展名。
- 当前文件存储在 API 本地，后续如果接对象存储，可以主要替换 `FileController::actionUpload()`。

### 角色权限分配

页面：

```text
src/views/system/role/index.vue
```

现在已经改成菜单树形式。

流程：

1. 点击角色列表中的权限按钮。
2. 前端请求 `/menu/tree` 获取完整菜单树。
3. 前端请求 `/role/permissions` 获取当前角色已有权限。
4. 弹窗树展示目录、菜单、按钮。
5. 目录节点禁用勾选。
6. 勾选菜单或按钮。
7. 保存时提交权限名数组到 `/role/assign-permissions`。

注意：

- 角色权限分配使用的是完整菜单树。
- 左侧菜单使用的是 `/user/menus` 返回的当前用户可访问菜单。
- 这两个接口用途不同。

## 十、新增一个 CRUD 模块的完整流程

下面以新增 `Product` 商品管理为例。

目标接口：

```text
POST product/index
POST product/view
POST product/create
POST product/update
POST product/delete
```

目标权限：

```text
product.view
product.create
product.update
product.delete
```

目标前端页面：

```text
src/views/product/index.vue
```

目标前端接口：

```text
src/api/product.ts
```

### 第 1 步：建业务表

示例 SQL：

```sql
CREATE TABLE `product` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `title` varchar(100) NOT NULL COMMENT '商品名称',
  `price` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT '价格',
  `status` tinyint NOT NULL DEFAULT 1 COMMENT '状态：1启用，0禁用',
  `created_at` int unsigned DEFAULT NULL,
  `updated_at` int unsigned DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='商品表';
```

### 第 2 步：创建 Yii2 Model

可以用 Gii，也可以手写。

建议模型放到：

```text
common/models/Product.php
```

基本结构：

```php
<?php

namespace common\models;

use yii\db\ActiveRecord;

class Product extends ActiveRecord
{
    public static function tableName()
    {
        return 'product';
    }

    public function rules()
    {
        return [
            [['title'], 'required'],
            [['price'], 'number'],
            [['status', 'created_at', 'updated_at'], 'integer'],
            [['title'], 'string', 'max' => 100],
        ];
    }
}
```

### 第 3 步：创建后端 Controller

文件：

```text
api/controllers/ProductController.php
```

示例结构：

```php
<?php

declare(strict_types=1);

namespace api\controllers;

use common\models\Product;
use Yii;
use yii\web\BadRequestHttpException;
use yii\web\NotFoundHttpException;

class ProductController extends BaseController
{
    protected array $rbacPermissions = [
        'index' => 'product.view',
        'view' => 'product.view',
        'create' => 'product.create',
        'update' => 'product.update',
        'delete' => 'product.delete',
    ];

    public function actionIndex(): array
    {
        $page = max(1, (int)Yii::$app->request->post('page', 1));
        $size = max(1, (int)Yii::$app->request->post('size', 10));
        $keyword = trim((string)Yii::$app->request->post('keyword', ''));
        $status = Yii::$app->request->post('status', '');

        $query = Product::find();

        if ($keyword !== '') {
            $query->andWhere(['like', 'title', $keyword]);
        }

        if ($status !== '' && $status !== null) {
            $query->andWhere(['status' => (int)$status]);
        }

        $total = (int)(clone $query)->count();
        $records = $query
            ->orderBy(['id' => SORT_DESC])
            ->offset(($page - 1) * $size)
            ->limit($size)
            ->all();

        return [
            'records' => array_map([$this, 'serializeProduct'], $records),
            'current' => $page,
            'size' => $size,
            'total' => $total,
        ];
    }

    public function actionCreate(): array
    {
        $model = new Product();
        $this->loadProduct($model);
        $model->created_at = time();
        $model->updated_at = time();

        if (!$model->save()) {
            throw new BadRequestHttpException($this->firstError($model));
        }

        return $this->serializeProduct($model);
    }

    public function actionUpdate(): array
    {
        $model = $this->findProduct((int)Yii::$app->request->post('id', 0));
        $this->loadProduct($model);
        $model->updated_at = time();

        if (!$model->save()) {
            throw new BadRequestHttpException($this->firstError($model));
        }

        return $this->serializeProduct($model);
    }

    public function actionDelete(): array
    {
        $model = $this->findProduct((int)Yii::$app->request->post('id', 0));

        if ($model->delete() === false) {
            throw new BadRequestHttpException('Failed to delete product.');
        }

        return [
            'deleted' => true,
            'id' => (int)$model->id,
        ];
    }

    private function findProduct(int $id): Product
    {
        if ($id <= 0) {
            throw new BadRequestHttpException('Product id is required.');
        }

        $model = Product::findOne($id);
        if ($model === null) {
            throw new NotFoundHttpException('Product does not exist.');
        }

        return $model;
    }

    private function loadProduct(Product $model): void
    {
        $model->title = trim((string)Yii::$app->request->post('title', ''));
        $model->price = (float)Yii::$app->request->post('price', 0);
        $model->status = (int)Yii::$app->request->post('status', 1);
    }

    private function serializeProduct(Product $model): array
    {
        return [
            'id' => (int)$model->id,
            'title' => $model->title,
            'price' => (float)$model->price,
            'status' => (int)$model->status,
            'created_at' => $model->created_at === null ? null : (int)$model->created_at,
            'updated_at' => $model->updated_at === null ? null : (int)$model->updated_at,
        ];
    }

    private function firstError(Product $model): string
    {
        $errors = $model->getFirstErrors();
        return reset($errors) ?: 'Invalid product data.';
    }
}
```

### 第 4 步：后端配置路由

文件：

```text
api/config/main.php
```

添加：

```php
'POST product/index' => 'product/index',
'POST product/view' => 'product/view',
'POST product/create' => 'product/create',
'POST product/update' => 'product/update',
'POST product/delete' => 'product/delete',
```

### 第 5 步：添加 RBAC 权限

权限建议：

```text
product.view
product.create
product.update
product.delete
```

可以通过你现在的权限管理接口添加，也可以写控制台种子。

添加后，要把这些权限分配给角色，例如 `admin`。

### 第 6 步：添加菜单表数据

菜单表至少需要一个页面菜单和几个按钮节点。

示例：

```text
商品管理 type=2 permission=product.view component=/product
新增商品 type=3 permission=product.create
修改商品 type=3 permission=product.update
删除商品 type=3 permission=product.delete
```

如果你想放在“内容管理”下面：

```text
内容管理
└─ 商品管理
   ├─ 新增商品
   ├─ 修改商品
   └─ 删除商品
```

注意：

- 页面菜单 `type = 2`。
- 按钮权限 `type = 3`。
- 按钮的 `parent_id` 要指向商品管理菜单。
- 页面菜单的 `permission` 用 `product.view`。
- 按钮节点的 `permission` 用对应操作权限。

### 第 7 步：封装前端 API

文件：

```text
src/api/product.ts
```

示例：

```ts
import request from '@/utils/http'

export interface ProductItem {
  id: number
  title: string
  price: number
  status: number
  created_at?: number | null
  updated_at?: number | null
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
  price: number
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

### 第 8 步：创建前端页面

文件：

```text
src/views/product/index.vue
```

页面通常包含：

- 搜索表单
- 表格
- 新增按钮
- 修改按钮
- 删除按钮
- 新增/修改弹窗

关键点：

```ts
const { hasAuth } = useAuth()
```

按钮显示：

```vue
<ElButton v-if="hasAuth('product.create')" type="primary">
  新增商品
</ElButton>
```

表格操作按钮：

```ts
hasAuth('product.update')
hasAuth('product.delete')
```

列表用 `useTable`：

```ts
const {
  columns,
  columnChecks,
  data,
  loading,
  pagination,
  refreshData,
  refreshCreate,
  refreshUpdate,
  refreshRemove,
  replaceSearchParams,
  resetSearchParams,
  getData,
  handleSizeChange,
  handleCurrentChange
} = useTable({
  core: {
    apiFn: fetchProductList,
    apiParams: {
      size: 10
    },
    paginationKey: {
      current: 'page',
      size: 'size'
    },
    columnsFactory: () => [
      { prop: 'id', label: 'ID', width: 80 },
      { prop: 'title', label: '商品名称', minWidth: 180 },
      { prop: 'price', label: '价格', width: 120 },
      {
        prop: 'status',
        label: '状态',
        width: 100,
        formatter: (row) => (row.status === 1 ? '启用' : '禁用')
      }
    ]
  }
})
```

### 第 9 步：刷新菜单和权限

新增菜单、权限、角色授权后，前端要重新获取：

- `/user/profile`
- `/user/menus`

最简单方式：

```text
退出登录，再登录
```

或者清理 localStorage 后刷新。

### 第 10 步：验证

按顺序验证：

1. Postman 调后端接口是否通。
2. 当前用户是否拥有 `product.view`。
3. `/user/menus` 是否返回商品菜单。
4. 商品菜单是否出现在左侧。
5. 点击菜单是否能打开页面。
6. 列表是否请求接口。
7. 新增按钮是否显示。
8. 新增是否成功。
9. 修改是否成功。
10. 删除是否成功。
11. 删除权限拿掉后，按钮是否隐藏。
12. 直接请求删除接口是否返回 403。

## 十一、常见问题

### 1. 左侧菜单不显示

检查：

- `.env` 是否为 `VITE_ACCESS_MODE = backend`
- 是否重启了 `pnpm dev`
- `/user/menus` 是否返回数据
- 当前用户是否拥有菜单的 `permission`
- 菜单表 `visible` 是否为 `1`
- 菜单表 `type` 是否为 `1` 或 `2`

### 2. 页面能打开，但新增/修改/删除按钮不显示

当前是后端菜单模式，按钮显示看当前路由的：

```ts
route.meta.authList
```

也就是 `/user/menus` 中页面菜单节点要带：

```json
"authList": [
  {
    "title": "新增",
    "authMark": "xxx.create"
  }
]
```

后端会根据菜单表 `type = 3` 的按钮节点生成 `authList`。

检查：

- 菜单表是否有按钮节点。
- 按钮节点的 `parent_id` 是否指向页面菜单。
- 按钮节点的 `permission` 是否正确。
- RBAC 是否存在这个权限。
- 当前角色是否拥有这个权限。
- 退出重新登录后是否正常。

### 3. 点击左侧菜单页面空白

常见原因：

- `component` 配错。
- 前端页面文件不存在。
- Vue 页面有多个根节点，和框架的 `Transition/KeepAlive` 冲突。

当前页面组件应保持一个根节点：

```vue
<template>
  <div>
    页面内容
    <ElDialog />
  </div>
</template>
```

不要这样：

```vue
<template>
  <div>页面内容</div>
  <ElDialog />
</template>
```

### 4. 后端接口返回 403

说明后端 RBAC 不通过。

当前 RBAC 主要在：

```text
api/controllers/BaseController.php
```

里面通过 `$rbacPermissions` 自动检查：

```php
Yii::$app->user->can($permission)
```

检查顺序：

1. RBAC 权限是否存在。
2. 角色是否拥有权限。
3. 用户是否分配了角色。
4. token 是否是当前用户。
5. 是否重新登录了。
6. 控制器的 `$rbacPermissions` 是否写了当前 action。

如果接口应该是“只登录即可”，不要给它加 RBAC 权限，而是放到控制器的：

```php
protected array $authOnlyActions = [
    'profile',
    'update-profile',
    'change-password',
    'menus',
];
```

如果看到：

```text
Permission rule is not configured.
```

通常表示控制器已经配置了 `$rbacPermissions`，但是当前 action 没有写映射。

### 5. 菜单改了但前端没变

当前后端已经接入 Redis 菜单缓存，缓存组件是：

```text
Yii::$app->menuCache
```

`/user/menus` 会按用户 ID 和菜单缓存版本号生成缓存 key。

这些操作会刷新菜单缓存版本：

- 菜单新增、修改、删除。
- 角色分配权限。
- 用户分配角色。
- 权限新增、修改、删除或从菜单同步。
- 执行 `php yii menu-seed`。
- 执行 `php yii permission-sync admin`。

但前端 store/localStorage 会保存用户信息和菜单状态。

处理方式：

- 刷新浏览器。
- 退出重新登录。
- 必要时清理 localStorage。

### 6. 修改 `.env` 后不生效

Vite 环境变量只在启动时读取。

改了 `.env` 后必须重启：

```bash
Ctrl + C
pnpm dev
```

## 十二、推荐开发顺序

以后新增模块，推荐按这个顺序：

```text
1. 设计表结构
2. 创建 Yii2 Model
3. 创建 Yii2 Controller
4. 配置 API 路由
5. 添加 RBAC 权限
6. 添加菜单表页面节点和按钮节点
7. 给角色分配权限
8. Postman 验证接口
9. 封装前端 src/api/xxx.ts
10. 创建前端 src/views/xxx/index.vue
11. 接 useTable 列表
12. 接新增弹窗
13. 接修改弹窗
14. 接删除确认
15. 验证按钮权限隐藏
16. 验证直接请求接口 403
```

这个顺序的好处是：

- 后端权限先成立。
- 菜单和按钮权限能同步生成。
- 前端开发时不容易遇到“按钮不显示但不知道为什么”。
- 每一步都能单独验证。

## 十三、当前项目已经完成的能力

目前已经打通：

- JWT 登录
- refresh token 基础支持
- `/user/profile`
- `/user/menus`
- Yii2 RBAC
- 用户管理 CRUD
- 用户角色分配
- 角色管理 CRUD
- 角色权限分配
- 菜单管理 CRUD
- 菜单树权限分配
- 权限管理 CRUD
- 菜单权限同步到 RBAC
- 菜单新增或修改后自动同步 RBAC 权限
- 菜单权限一致性诊断
- 权限管理按模块折叠展示
- 危险权限标记
- 字典管理
- 文件管理和分组附件管理
- Redis 缓存菜单
- 操作日志
- 队列任务示例
- 生产环境 Nginx 部署文档：`docs/production-nginx-deploy.md`
- 公告 CRUD
- 后端动态菜单
- 后端动态按钮权限
- 公共图片上传
- 用户头像上传
- 用户个人中心
- 修改个人资料
- 修改密码
- 后端登录接口和 RBAC 权限边界整理

后续可以继续做：

- 列表导入导出
- 更完整的审计日志检索和导出
- 定时任务管理

## 十四、操作日志

操作日志由后端 `BaseController` 统一记录，不需要每个业务控制器单独写。

已记录内容：

- 当前用户 ID 和用户名
- 控制器、动作、路由
- RBAC 权限标识
- 请求方法、IP、User-Agent
- 请求参数
- 响应码、响应消息
- 成功/失败状态
- 请求耗时
- 创建时间

敏感字段会自动打码，例如：

- `password`
- `old_password`
- `new_password`
- `access_token`
- `refresh_token`
- `token`

前端页面：

```text
src/views/system/operation-log/index.vue
```

后端接口：

```text
POST operation-log/index
POST operation-log/delete
POST operation-log/clear
```

对应权限：

```text
operation-log.view
operation-log.delete
```

## 十五、队列任务示例

当前项目已经接入 `yii2-queue` Redis driver，并做了一个可视化 Demo。

前端页面：

```text
src/views/system/queue-task/index.vue
```

后端接口：

```text
POST queue/index
POST queue/create-demo
POST queue/retry
POST queue/delete
```

对应权限：

```text
queue.view
queue.create
queue.delete
```

队列任务执行类：

```text
common/jobs/DemoJob.php
```

队列任务表：

```text
queue_task
```

开发时启动 worker：

```bash
cd D:\www\art-design-pro-admin
php yii queue/listen
```

如果没有启动 worker，页面可以创建任务，但任务会停留在“等待”状态。
