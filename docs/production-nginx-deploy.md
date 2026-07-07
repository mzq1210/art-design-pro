# 生产环境 Nginx 部署文档

本文档用于当前项目的生产部署：

- 前端：`art-design-pro`，Vue 3 + Vite，构建后产物在 `dist/`
- 后端：`art-design-pro-admin`，Yii2 Advanced API，入口为 `api/web/index.php`
- API 域名示例：`api.artdesign.com`
- 前端域名示例：`admin.artdesign.com`

以下域名、证书路径、PHP-FPM 版本和项目目录都需要按真实服务器调整。

## 一、推荐部署结构

```text
/www/wwwroot/art-design-pro
├─ dist/                         # 前端 pnpm build 后上传

/www/wwwroot/art-design-pro-admin
├─ api/web/index.php             # Yii2 API 入口
├─ api/web/uploads/              # 上传文件公开访问目录
├─ common/config/main-local.php  # 生产数据库、Redis 等本地配置
├─ console/
├─ vendor/
└─ yii
```

前端和后端建议使用两个域名：

```text
admin.artdesign.com  -> 前端 dist
api.artdesign.com    -> Yii2 API
```

这样最清晰，也方便分别设置静态缓存、PHP-FPM、上传大小和日志。

## 二、前端构建

在本地或服务器执行：

```bash
cd /www/wwwroot/art-design-pro
pnpm install --frozen-lockfile
pnpm build
```

构建完成后生成：

```text
dist/
```

生产环境 `.env.production` 建议配置为正式 API：

```env
VITE_API_URL = https://api.artdesign.com
VITE_ACCESS_MODE = backend
```

如果改了 env，必须重新构建。

## 三、后端准备

```bash
cd /www/wwwroot/art-design-pro-admin
composer install --no-dev --optimize-autoloader
php init
php yii migrate --interactive=0
php yii menu-seed
php yii permission-sync admin
```

生产环境要确认：

- `common/config/main-local.php` 数据库连接正确
- Redis 可连接
- JWT 密钥已配置
- `api/runtime`、`console/runtime`、`api/web/assets`、`api/web/uploads` 可写
- PHP 扩展满足 Yii2 和项目依赖，例如 `pdo_mysql`、`mbstring`、`openssl`、`fileinfo`、`redis`

## 四、前端 Nginx 配置

前端是静态文件。由于 Vue Router 使用 hash 模式，目前刷新压力较小，但仍建议保留 `try_files`。

```nginx
server {
    listen 80;
    server_name admin.artdesign.com;

    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name admin.artdesign.com;

    ssl_certificate     /etc/nginx/ssl/admin.artdesign.com.pem;
    ssl_certificate_key /etc/nginx/ssl/admin.artdesign.com.key;

    root /www/wwwroot/art-design-pro/dist;
    index index.html;

    access_log /var/log/nginx/admin.artdesign.access.log;
    error_log  /var/log/nginx/admin.artdesign.error.log;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|webp|svg|ico|woff2?)$ {
        expires 30d;
        access_log off;
        try_files $uri =404;
    }
}
```

## 五、后端 API Nginx 配置

Yii2 API 入口目录必须指向 `api/web`，不要把整个项目暴露为 Web 根目录。

```nginx
server {
    listen 80;
    server_name api.artdesign.com;

    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.artdesign.com;

    ssl_certificate     /etc/nginx/ssl/api.artdesign.com.pem;
    ssl_certificate_key /etc/nginx/ssl/api.artdesign.com.key;

    root /www/wwwroot/art-design-pro-admin/api/web;
    index index.php;

    client_max_body_size 50m;

    access_log /var/log/nginx/api.artdesign.access.log;
    error_log  /var/log/nginx/api.artdesign.error.log;

    location / {
        try_files $uri $uri/ /index.php$is_args$args;
    }

    location ~ ^/index\.php(/|$) {
        include fastcgi_params;
        fastcgi_pass unix:/run/php/php8.2-fpm.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        fastcgi_param SCRIPT_NAME $fastcgi_script_name;
    }

    location ~ \.php$ {
        return 404;
    }

    location ^~ /uploads/ {
        try_files $uri =404;
        expires 7d;
        access_log off;
    }

    location ~ /\.(?!well-known) {
        deny all;
    }
}
```

如果你的 PHP-FPM 是 TCP 方式，替换为：

```nginx
fastcgi_pass 127.0.0.1:9000;
```

## 六、跨域说明

开发环境用 Vite `server.proxy` 只是为了本地调试方便。

生产环境有两种方式：

1. 前端直接请求 `https://api.artdesign.com`
2. 前端同域 `/api` 反向代理到 Yii2 API

目前项目按第一种方式更直接。后端需要允许正式前端域名跨域，建议在 Yii2 CORS 配置中限制来源，不要长期使用全开放。

同域反向代理示例：

```nginx
location /api/ {
    proxy_pass https://api.artdesign.com/;
    proxy_set_header Host api.artdesign.com;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

使用这个方式时，前端生产 API 可以配置为：

```env
VITE_API_URL = /api
```

## 七、队列 Worker 部署

队列示例使用 `yii2-queue` 的 Redis driver。接口只负责把任务推入队列，真正执行任务必须启动 worker。

临时启动：

```bash
cd /www/wwwroot/art-design-pro-admin
php yii queue/listen
```

生产环境建议使用 Supervisor：

```ini
[program:artdesign-queue]
process_name=%(program_name)s_%(process_num)02d
command=/usr/bin/php /www/wwwroot/art-design-pro-admin/yii queue/listen --verbose=1
autostart=true
autorestart=true
user=www
numprocs=1
redirect_stderr=true
stdout_logfile=/www/wwwroot/art-design-pro-admin/console/runtime/logs/queue.log
stopwaitsecs=60
```

常用命令：

```bash
supervisorctl reread
supervisorctl update
supervisorctl start artdesign-queue:*
supervisorctl status
```

## 八、上线检查清单

- 前端 `pnpm build` 成功
- 后端 `composer install --no-dev --optimize-autoloader` 成功
- `php yii migrate --interactive=0` 已执行
- `php yii menu-seed` 已执行
- `php yii permission-sync admin` 已执行
- Nginx `root` 指向正确目录
- PHP-FPM socket 或端口正确
- `client_max_body_size` 大于系统允许上传大小
- Redis 正常
- 队列 worker 正常
- 上传目录可写
- 后台重新登录，刷新 `/user/menus` 和按钮权限

## 九、参考

- NGINX 官方文档：静态文件服务和 `try_files`
- NGINX 官方文档：`client_max_body_size`
