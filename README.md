# 🏢 电梯自行检测备忘录电子化系统

## 📖 项目简介

现代化的电梯检测备忘录管理系统，专为电梯检测行业设计，完全替代传统纸质备忘录流程。

### ✨ 核心功能

- 🔐 **用户管理** - 管理员/普通用户角色，JWT安全认证
- 📋 **备忘录管理** - 创建、编辑、查看、删除、复制备忘录
- ✍️ **电子签名** - 检测人员签名上传 + 手写电子签名
- 🎯 **权限控制** - 数据隔离，用户只能管理自己的备忘录
- 📄 **PDF导出** - 标准格式PDF文档生成
- 🔍 **智能搜索** - 多条件搜索和分页显示
- 📱 **响应式设计** - 支持PC、平板、手机多端访问
- ⚡ **高性能** - 优化支持10万+备忘录数据

## 🏗️ 技术栈

### 前端技术
- **Vue.js 3** + Composition API - 现代化前端框架
- **Element Plus 2** - 企业级UI组件库
- **Vite 4** - 快速构建工具
- **Vue Router 4** - 单页路由管理
- **vue-signature-pad** - 电子签名组件

### 后端技术
- **Node.js 18** - 服务端运行环境
- **Express.js** - Web应用框架
- **JWT + bcrypt** - 安全认证
- **Puppeteer** - PDF文档生成
- **Multer** - 文件上传处理
- **node-cron** - 定时任务调度

### 数据库与存储
- **PostgreSQL 15** - 关系型数据库
- **文件系统** - 签名图片本地存储

## 📁 项目结构

```
elevator-memo-system/
├── 📁 frontend/              # Vue.js 前端应用
│   ├── src/
│   │   ├── api/              # API接口封装
│   │   ├── components/       # 可复用组件
│   │   ├── views/            # 页面组件
│   │   ├── router/           # 路由配置
│   │   ├── stores/           # 状态管理
│   │   └── utils/            # 工具函数
│   └── Dockerfile.production # 前端生产环境镜像
│
├── 📁 backend/               # Node.js 后端API
│   ├── controllers/          # 业务控制器
│   ├── middleware/           # 中间件
│   ├── models/               # 数据模型
│   ├── routes/               # 路由定义
│   ├── templates/            # PDF模板
│   ├── utils/                # 工具函数
│   └── Dockerfile.production # 后端生产环境镜像
│
├── 📁 database/              # 数据库脚本
│   └── schema.sql            # 数据库架构
│
├── 📁 deploy/                # 部署脚本
│   ├── docker-deploy.sh      # Docker一键部署
│   └── production-deploy.sh  # 传统服务器部署
│
├── 📁 nginx/                 # Nginx配置
│   └── sites/                # 站点配置
│
├── docker-compose.production.yml # Docker编排配置
├── start-dev.bat            # 开发环境启动(Windows)
├── start-dev.sh             # 开发环境启动(Linux/Mac)
└── README.md               # 项目文档
```

## 🚀 快速开始

### 🔧 环境要求

- **Node.js** 18.0+
- **PostgreSQL** 15+
- **Docker** & **Docker Compose** (推荐)

### 📦 一键部署

### 🚀 生产环境部署（推荐）

#### Windows 系统部署
```batch
# 1. 配置环境变量（首次部署必须）
copy .env.production.example .env.production
# 编辑 .env.production 设置数据库密码、JWT密钥等

# 2. 一键部署（以管理员身份运行）
deploy-windows.bat
```

#### Linux 系统部署
```bash
# 1. 配置环境变量（首次部署必须）
cp .env.production.example .env.production
nano .env.production  # 修改数据库密码、JWT密钥等

# 2. 一键部署（需要root权限）
sudo chmod +x deploy-linux.sh
sudo ./deploy-linux.sh
```

### 🛠️ 开发环境启动

#### 方式一：快速启动脚本
```bash
# Windows
start-dev.bat

# Linux/Mac  
./start-dev.sh
```

#### 方式二：手动启动
```bash
# 1. 安装 PostgreSQL 并创建数据库
createdb elevator_memo
psql -d elevator_memo -f database/schema.sql

# 2. 后端启动
cd backend
npm install
cp .env.example .env  # 配置数据库连接
npm run dev

# 3. 前端启动 (新终端)
cd frontend
npm install
npm run dev
```

### 🌐 访问系统

- **前端界面**: http://localhost:8080 (开发) / http://localhost (生产)
- **后端API**: http://localhost:3000/api
- **默认管理员**: `admin` / `admin123`

## 🔌 主要API接口

### 🔐 用户认证
- `POST /api/users/login` - 用户登录
- `GET /api/users/me` - 获取当前用户信息
- `PUT /api/users/me` - 更新个人资料

### 📋 备忘录管理
- `GET /api/memos` - 获取备忘录列表（支持搜索分页）
- `POST /api/memos` - 创建新备忘录
- `GET /api/memos/:id` - 获取备忘录详情
- `PUT /api/memos/:id` - 更新备忘录
- `DELETE /api/memos/:id` - 删除备忘录
- `GET /api/memos/:id/pdf` - 导出PDF

### 👥 用户管理（管理员）
- `GET /api/users` - 获取用户列表
- `POST /api/users` - 创建新用户
- `PUT /api/users/:id` - 更新用户信息

### 📁 文件上传
- `POST /api/upload/tester-signature` - 上传检测人员签名

## 🏗️ 部署架构说明

### 📋 系统要求

#### 最低配置要求
- **CPU**: 2核心以上
- **内存**: 2GB以上（推荐4GB）
- **存储**: 10GB可用空间（SSD推荐）
- **网络**: 稳定的互联网连接

#### 支持的操作系统
- **Windows**: Windows 10/11, Windows Server 2019/2022
- **Linux**: Ubuntu 20.04+, CentOS 8+, Debian 11+, Rocky Linux 8+

### 🏛️ 系统架构

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Nginx Proxy   │───▶│  Frontend (Vue) │    │ Backend (Node)  │
│   (Port 80)     │    │   (Port 8080)   │◀──▶│  (Port 3000)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
                                               ┌─────────────────┐
                                               │  PostgreSQL DB  │
                                               │   (Port 5432)   │
                                               └─────────────────┘
```

核心服务组件：
- **Nginx**: 反向代理、负载均衡、静态资源服务
- **Frontend**: Vue.js 3 + Element Plus 前端应用
- **Backend**: Node.js + Express API 服务
- **Database**: PostgreSQL 15 数据库

### 🐳 Docker 容器化部署详解

#### 环境要求验证
```bash
# 检查 Docker 版本
docker --version          # 需要 20.10+
docker-compose --version   # 需要 2.0+

# 检查系统资源
free -h                   # 查看内存
df -h                     # 查看磁盘空间
```

#### 部署配置说明

**环境变量配置** (`.env.production`)：
```env
# 数据库安全配置（必须修改）
DB_PASSWORD=YourSecurePassword123!

# JWT 安全密钥（必须修改，至少32字符）
JWT_SECRET=your_jwt_secret_key_minimum_32_characters

# 可选配置
DOMAIN_NAME=yourdomain.com
ADMIN_EMAIL=admin@yourdomain.com
ENABLE_SSL=true
BACKUP_SCHEDULE="0 2 * * *"
```

**容器资源限制**：
- Backend: 512MB内存限制, 1CPU核心
- Frontend: 128MB内存限制, 0.5CPU核心  
- PostgreSQL: 根据数据量自动调整
- Nginx: 256MB内存限制

#### Docker 网络和存储

**持久化数据卷**：
- `postgres_data`: 数据库文件
- `uploads_data`: 用户上传文件
- `backend_logs`: 后端日志
- `nginx_logs`: Web服务器日志

**网络配置**：
- 内部网络: `172.20.0.0/16`
- 服务间通信通过容器名称
- 对外暴露端口: 80 (Nginx), 3000 (Backend), 8080 (Frontend)

### 🖥️ 传统服务器部署详解

#### 适用场景
- 无法使用Docker的企业环境
- 需要更精细的服务器控制
- 已有PostgreSQL/Nginx等基础设施

#### 系统依赖安装

**Ubuntu/Debian 系统**:
```bash
# 更新包列表
sudo apt update && sudo apt upgrade -y

# 安装 Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 安装 PostgreSQL 15
sudo apt install -y postgresql-15 postgresql-client-15

# 安装 Nginx 和 PM2
sudo apt install -y nginx
sudo npm install -g pm2

# 安装 Git（如果需要）
sudo apt install -y git
```

**CentOS/RHEL 系统**:
```bash
# 安装 EPEL 仓库
sudo dnf install -y epel-release

# 安装 Node.js 18
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo dnf install -y nodejs

# 安装 PostgreSQL 15
sudo dnf install -y postgresql15-server postgresql15
sudo /usr/pgsql-15/bin/postgresql-15-setup initdb
sudo systemctl enable postgresql-15
sudo systemctl start postgresql-15

# 安装 Nginx 和 PM2
sudo dnf install -y nginx
sudo npm install -g pm2
```

#### 数据库初始化详解
```bash
# 切换到 postgres 用户
sudo su - postgres

# 创建应用用户和数据库
createuser -P -s elevator_user  # 输入密码: your_db_password
createdb -O elevator_user elevator_memo

# 验证连接
psql -U elevator_user -d elevator_memo -c "\l"

# 导入数据库架构
psql -U elevator_user -d elevator_memo -f /path/to/database/schema.sql

# 退出 postgres 用户
exit
```

#### PM2 进程管理配置
```bash
# 生产环境启动
cd backend
pm2 start ecosystem.config.js --env production

# 保存 PM2 配置
pm2 save

# 设置开机自启
pm2 startup  # 按提示执行返回的命令

# 监控服务状态
pm2 monit
```

#### Nginx 详细配置
```bash
# 复制配置文件
sudo cp nginx/sites/elevator-memo.conf /etc/nginx/sites-available/

# 启用站点
sudo ln -s /etc/nginx/sites-available/elevator-memo.conf /etc/nginx/sites-enabled/

# 删除默认配置（如果存在）
sudo rm -f /etc/nginx/sites-enabled/default

# 测试配置
sudo nginx -t

# 重新加载配置
sudo systemctl reload nginx
sudo systemctl enable nginx
```

#### 性能调优建议
```bash
# Node.js 内存优化
export NODE_OPTIONS="--max-old-space-size=4096"

# PostgreSQL 配置优化 (/etc/postgresql/15/main/postgresql.conf)
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 4MB
maintenance_work_mem = 64MB
max_connections = 100
```

#### 安全配置强化
```bash
# 防火墙配置
sudo ufw allow 22         # SSH
sudo ufw allow 80         # HTTP  
sudo ufw allow 443        # HTTPS
sudo ufw deny 3000        # 阻止直接访问后端
sudo ufw deny 5432        # 阻止直接访问数据库
sudo ufw enable

# 文件权限设置
chmod 600 .env.production
chmod 755 backend/uploads/
chown -R www-data:www-data /var/www/html/

# SSL 证书配置（推荐使用 Let's Encrypt）
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

#### 自动化备份脚本
```bash
# 创建备份脚本 /usr/local/bin/backup-elevator-memo.sh
#!/bin/bash
BACKUP_DIR="/opt/backups/elevator-memo"
DATE=$(date +%Y%m%d_%H%M%S)

# 创建备份目录
mkdir -p $BACKUP_DIR

# 数据库备份
pg_dump -U elevator_user -h localhost elevator_memo | gzip > $BACKUP_DIR/db_backup_$DATE.sql.gz

# 文件备份
tar -czf $BACKUP_DIR/uploads_backup_$DATE.tar.gz backend/uploads/

# 清理7天前的备份
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete

echo "备份完成: $DATE"
```

```bash
# 设置定时备份（每日凌晨2点）
sudo crontab -e
# 添加以下行:
0 2 * * * /usr/local/bin/backup-elevator-memo.sh >> /var/log/backup.log 2>&1
```

## 🔧 部署后管理

### 📊 服务监控

#### 实时状态监控
```bash
# Docker 部署监控
docker-compose -f docker-compose.production.yml ps
docker stats

# 传统部署监控
pm2 status
pm2 monit           # 实时监控界面
systemctl status nginx postgresql
```

#### 日志管理
```bash
# Docker 部署日志
docker-compose -f docker-compose.production.yml logs -f          # 所有服务
docker-compose -f docker-compose.production.yml logs -f backend  # 后端日志
docker-compose -f docker-compose.production.yml logs -f frontend # 前端日志

# 传统部署日志
pm2 logs --lines 100          # PM2 应用日志
tail -f /var/log/nginx/access.log  # Nginx 访问日志
tail -f /var/log/nginx/error.log   # Nginx 错误日志
journalctl -u postgresql -f        # PostgreSQL 日志
```

#### 健康检查脚本
```bash
#!/bin/bash
# 保存为 health-check.sh

echo "=== 电梯备忘录系统健康检查 ==="

# 检查 API 健康状态
if curl -sf http://localhost:3000 &>/dev/null; then
    echo "✓ 后端 API 服务正常"
else
    echo "✗ 后端 API 服务异常"
fi

# 检查前端服务
if curl -sf http://localhost:8080 &>/dev/null; then
    echo "✓ 前端服务正常"
else
    echo "✗ 前端服务异常"
fi

# 检查数据库连接
if docker exec elevator-memo-postgres pg_isready -U elevator_user &>/dev/null; then
    echo "✓ 数据库连接正常"
else
    echo "✗ 数据库连接异常"
fi

# 检查磁盘空间
DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $DISK_USAGE -lt 90 ]; then
    echo "✓ 磁盘空间充足 ($DISK_USAGE%)"
else
    echo "⚠ 磁盘空间不足 ($DISK_USAGE%)"
fi

# 检查内存使用
MEM_USAGE=$(free | awk 'NR==2{printf "%.1f", $3*100/$2}')
echo "📊 内存使用率: ${MEM_USAGE}%"
```

### ⚡ 常用管理命令

#### Docker 部署管理
```bash
# 查看服务状态
docker-compose -f docker-compose.production.yml ps

# 重启特定服务
docker-compose -f docker-compose.production.yml restart backend
docker-compose -f docker-compose.production.yml restart frontend

# 更新服务（有新代码时）
docker-compose -f docker-compose.production.yml build backend
docker-compose -f docker-compose.production.yml up -d backend

# 数据库备份
docker exec elevator-memo-postgres pg_dump -U elevator_user elevator_memo > backup_$(date +%Y%m%d).sql

# 查看资源使用
docker stats
```

#### 传统部署管理
```bash
# PM2 应用管理
pm2 restart elevator-memo-backend
pm2 reload elevator-memo-backend
pm2 stop elevator-memo-backend
pm2 delete elevator-memo-backend

# Nginx 配置管理
sudo nginx -t                    # 测试配置
sudo systemctl reload nginx      # 重载配置
sudo systemctl restart nginx     # 重启服务

# 数据库管理
sudo systemctl status postgresql-15
sudo -u postgres psql elevator_memo
```

### 🚨 故障排除指南

#### 问题1: 服务无法启动
```bash
# 检查端口占用
netstat -tlnp | grep -E ':(80|3000|5432|8080)'
# 或使用 ss 命令
ss -tlnp | grep -E ':(80|3000|5432|8080)'

# 解决方案: 停止占用端口的进程或修改配置文件中的端口
```

#### 问题2: 数据库连接失败
```bash
# Docker 环境
docker logs elevator-memo-postgres
docker exec -it elevator-memo-postgres psql -U elevator_user -d elevator_memo

# 传统环境  
sudo systemctl status postgresql
sudo -u postgres psql -l
psql -U elevator_user -d elevator_memo -c "SELECT version();"

# 常见解决方案:
# 1. 检查 .env.production 中的数据库配置
# 2. 确认数据库用户权限: GRANT ALL PRIVILEGES ON DATABASE elevator_memo TO elevator_user;
# 3. 检查防火墙设置
```

#### 问题3: PDF 生成失败
```bash
# Docker: 检查 Chromium
docker exec elevator-memo-backend chromium-browser --version
docker exec elevator-memo-backend ls -la /usr/bin/chromium-browser

# 传统部署: 安装 Chrome/Chromium
# Ubuntu/Debian:
wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | sudo apt-key add -
sudo apt install google-chrome-stable

# CentOS/RHEL:
sudo yum install -y google-chrome-stable
```

#### 问题4: 文件上传失败
```bash
# 检查上传目录
ls -la backend/uploads/
chmod 755 backend/uploads/
chmod 755 backend/uploads/signatures/

# Docker 环境检查卷挂载
docker volume inspect elevator-memo-system_uploads_data
docker exec elevator-memo-backend ls -la /app/uploads/
```

#### 问题5: 前端页面空白或404
```bash
# 检查前端构建状态
docker logs elevator-memo-frontend
curl -I http://localhost:8080

# 检查 API 连接配置
grep VITE_API_BASE_URL frontend/.env.production
curl http://localhost:3000/api/health

# 查看浏览器开发者工具网络和控制台选项卡的错误信息
```

#### 问题6: 性能问题
```bash
# 监控资源使用
docker stats                    # Docker 环境
htop                           # 传统环境

# 数据库性能分析
docker exec elevator-memo-postgres psql -U elevator_user -d elevator_memo -c "
SELECT schemaname,tablename,attname,n_distinct,correlation 
FROM pg_stats WHERE tablename='memos';"

# 优化建议:
# 1. 增加数据库连接池: backend/config/database.js
# 2. 启用 Redis 缓存
# 3. 配置 CDN 加速静态资源
```

## 📊 性能特性

- **高并发**: 支持50+ 用户同时在线
- **大数据量**: 优化支持10万+ 备忘录
- **快速响应**: 数据库索引优化，API响应<200ms
- **自动清理**: 定时清理过期文件，节省存储空间

### 🔒 安全建议

#### 生产环境安全清单
- [ ] 修改默认密码：`.env.production` 中的 `DB_PASSWORD` 和 `JWT_SECRET`
- [ ] 启用防火墙：仅开放必要端口 (80, 443, 22)
- [ ] 配置 SSL 证书：使用 Let's Encrypt 或商业证书
- [ ] 定期更新：保持系统和依赖包为最新版本
- [ ] 备份策略：配置自动数据库和文件备份
- [ ] 日志监控：配置日志轮换和监控告警

#### 数据安全
```bash
# 数据库加密连接（推荐）
# 在 .env.production 中添加:
DB_SSL=true

# 文件权限强化
chmod 600 .env.production
chmod 700 backend/logs/
chmod 755 backend/uploads/

# 定期安全扫描
docker scan elevator-memo-backend  # Docker镜像安全扫描
npm audit                         # Node.js依赖安全检查
```

## 📈 性能优化指南

### 高负载优化配置
```bash
# Node.js 集群模式 (ecosystem.config.js)
instances: "max"          # 使用所有CPU核心
exec_mode: "cluster"      # 集群模式

# PostgreSQL 性能调优
shared_buffers = 512MB    # 增加共享缓冲区
max_connections = 200     # 增加最大连接数
effective_cache_size = 2GB
work_mem = 8MB

# Nginx 并发优化
worker_processes auto;
worker_connections 2048;
keepalive_requests 1000;
```

### 监控告警设置
```bash
# 创建监控脚本 /usr/local/bin/monitor-elevator-memo.sh
#!/bin/bash
# 检查关键指标并发送告警
CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)
MEM_USAGE=$(free | awk 'NR==2{printf "%.1f", $3*100/$2}')
DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')

if (( $(echo "$CPU_USAGE > 80" | bc -l) )) || \
   (( $(echo "$MEM_USAGE > 80" | bc -l) )) || \
   [ $DISK_USAGE -gt 90 ]; then
    echo "系统资源告警: CPU:${CPU_USAGE}%, 内存:${MEM_USAGE}%, 磁盘:${DISK_USAGE}%"
    # 这里可以添加邮件或webhook通知
fi
```

## 🆘 技术支持

### 日志收集和分析
```bash
# 收集完整日志信息（问题报告时使用）
./collect-logs.sh > system-logs-$(date +%Y%m%d).txt
```

### 常见问题快速解决
1. **无法访问系统** → 运行健康检查: `./health-check.sh`
2. **性能缓慢** → 查看资源监控: `docker stats` 或 `htop`
3. **数据丢失** → 查看备份: `ls -la /opt/backups/elevator-memo/`
4. **服务崩溃** → 查看日志: `docker-compose -f docker-compose.production.yml logs`

## 📝 许可证

本项目采用 MIT 许可证，详见 [LICENSE](LICENSE) 文件。

## 🤝 贡献

欢迎提交 Issue 和 Pull Request 来帮助改进项目！