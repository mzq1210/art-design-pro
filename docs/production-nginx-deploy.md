# 生产环境 Nginx 部署

本文档记录当前 Vue 前端 + Yii2 API 后端的推荐生产部署方式。域名、证书、PHP-FPM 路径和项目目录需要按真实服务器调整。

## 推荐结构

```text
/www/wwwroot/art-design-pro
└─ dist/                         前端构建产物

/www/wwwroot/art-design-pro-admin
├─ api/web/index.php             Yii2 API 入口
├─ api/web/uploads/              上传文件
├─ common/config/main-local.php  生产数据库、Redis、JWT 配置
├─ console/
├─ vendor/
└─ yii
```

推荐两个域名：

```text
admin.artdesign.com  前端
api.artdesign.com    后端 API
```

## 构建前端

```bash
cd /www/wwwroot/art-design-pro
pnpm install --frozen-lockfile
pnpm build
```

生产环境变量示例：

```env
VITE_API_URL = https://api.artdesign.com
VITE_ACCESS_MODE = backend
```

如果改了 `.env.production`，必须重新执行 `pnpm build`。

## 准备后端

```bash
cd /www/wwwroot/art-design-pro-admin
composer install --no-dev --optimize-autoloader
php init
php yii migrate --interactive=0
php yii menu-seed
php yii permission-sync admin
```

确认：

- `common/config/main-local.php` 数据库、Redis、JWT 配置正确
- `api/runtime`、`console/runtime`、`api/web/assets`、`api/web/uploads` 可写
- PHP 扩展包含 `pdo_mysql`、`mbstring`、`openssl`、`fileinfo`、`redis`
- 生产环境不要暴露 Yii2 项目根目录，只暴露 `api/web`

## 前端 Nginx

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

## 后端 API Nginx

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

如果 PHP-FPM 使用 TCP：

```nginx
fastcgi_pass 127.0.0.1:9000;
```

## 跨域方案

开发环境使用 Vite `server.proxy` 解决本地跨域。

生产环境推荐二选一：

```text
方案 A：前端直接请求 https://api.artdesign.com
方案 B：前端请求同域 /api，由 Nginx 反向代理到 API
```

方案 A 需要后端 CORS 允许正式前端域名。

方案 B 示例：

```nginx
location /api/ {
    proxy_pass https://api.artdesign.com/;
    proxy_set_header Host api.artdesign.com;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

使用方案 B 时：

```env
VITE_API_URL = /api
```

## 队列 Worker

临时启动：

```bash
cd /www/wwwroot/art-design-pro-admin
php yii queue/listen
```

生产建议使用 Supervisor：

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

## 上线检查

- 前端 `pnpm build` 成功
- 后端 `composer install --no-dev --optimize-autoloader` 成功
- 数据库迁移已执行
- 菜单和权限初始化已执行
- Nginx `root` 指向正确目录
- PHP-FPM socket 或端口正确
- 上传目录可写
- Redis 正常
- 队列 worker 正常
- 正式 API 域名和 CORS 配置正确
- 后台重新登录，确认菜单和按钮权限正常
