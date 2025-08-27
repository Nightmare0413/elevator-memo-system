# 电梯自行检测备忘录电子化系统

## 项目概述
这是一个基于Web的电梯检测备忘录管理系统，用于替代传统的纸质版《电梯自行检测备忘录》。系统支持用户管理、在线填写、电子签名和PDF导出功能，实现了完整的无纸化办公流程。

## 功能特性
- ✅ **用户系统**: 支持管理员和普通用户角色，JWT身份验证
- ✅ **备忘录管理**: 新增、编辑、查询、删除、复制备忘录
- ✅ **电子签名**: 检测人员图片上传 + 使用单位代表手写签名
- ✅ **权限控制**: 用户只能管理自己创建的备忘录
- ✅ **PDF导出**: 基于HTML模板生成标准格式PDF文件
- ✅ **搜索分页**: 支持多字段搜索和分页显示
- ✅ **响应式设计**: 支持桌面端、平板和移动端
- ✅ **数据优化**: 支持大量数据的高性能查询（优化至10万份备忘录）

## 技术架构

### 前端 (Frontend)
- **框架**: Vue.js 3 + Composition API
- **UI组件**: Element Plus 2.x
- **构建工具**: Vite 4.x
- **路由**: Vue Router 4.x
- **状态管理**: Pinia
- **HTTP客户端**: Axios
- **电子签名**: vue-signature-pad

### 后端 (Backend) 
- **运行时**: Node.js 16+
- **框架**: Express.js
- **身份验证**: JWT + bcrypt
- **文件上传**: Multer
- **PDF生成**: Puppeteer
- **定时任务**: node-cron
- **跨域支持**: CORS

### 数据库 (Database)
- **数据库**: PostgreSQL 12+
- **连接池**: node-postgres (pg)
- **性能优化**: 多重索引和组合索引

## 项目结构
```
elevator-memo-system/
├── frontend/                 # Vue.js 前端项目
│   ├── src/
│   │   ├── api/              # API接口封装 (auth.js, memo.js)
│   │   ├── components/       # 可复用组件 (MemoForm, SignaturePad)
│   │   ├── views/            # 页面组件
│   │   │   ├── Login.vue     # 登录页面
│   │   │   ├── MemoList.vue  # 备忘录列表
│   │   │   ├── MemoCreate.vue# 创建备忘录
│   │   │   ├── MemoEdit.vue  # 编辑备忘录
│   │   │   ├── MemoDetail.vue# 备忘录详情
│   │   │   ├── UserManagement.vue # 用户管理（管理员）
│   │   │   └── Profile.vue   # 个人资料
│   │   ├── router/           # 路由配置
│   │   ├── stores/           # Pinia状态管理
│   │   ├── styles/           # 样式文件
│   │   └── utils/            # 工具函数
│   └── package.json
├── backend/                  # Node.js 后端项目
│   ├── config/
│   │   └── database.js       # 数据库配置
│   ├── controllers/          # 控制器
│   │   ├── userController.js # 用户管理控制器
│   │   ├── memoController.js # 备忘录控制器
│   │   └── uploadController.js # 文件上传控制器
│   ├── middleware/
│   │   └── auth.js           # JWT身份验证中间件
│   ├── models/               # 数据模型
│   │   ├── User.js           # 用户模型
│   │   └── Memo.js           # 备忘录模型
│   ├── routes/               # 路由定义
│   │   ├── userRoutes.js     # 用户路由
│   │   ├── memoRoutes.js     # 备忘录路由
│   │   └── uploadRoutes.js   # 文件上传路由
│   ├── templates/
│   │   └── memo-template.html# PDF模板
│   ├── uploads/
│   │   └── signatures/       # 签名文件存储
│   ├── utils/
│   │   ├── fileManager.js    # 文件管理工具
│   │   └── scheduler.js      # 定时任务
│   └── package.json
├── database/                 # 数据库相关
│   └── schema.sql            # 完整数据库架构脚本
├── start-dev.bat            # Windows开发启动脚本
├── start-dev.sh             # Linux/Mac开发启动脚本
└── README.md               # 项目说明文档
```

## 快速开始

### 环境要求
- Node.js 16.0+
- PostgreSQL 12+
- npm 7.0+ 或 yarn 1.22+

### 1. 克隆项目
```bash
git clone <repository-url>
cd elevator-memo-system
```

### 2. 数据库设置
```bash
# 创建PostgreSQL数据库
createdb elevator_memo

# 执行完整架构脚本
psql -d elevator_memo -f database/schema.sql
```

### 3. 后端设置
```bash
cd backend
npm install

# 配置环境变量（复制.env.example并重命名为.env，然后修改配置）
cp .env.example .env
# 编辑.env文件，修改以下配置：
# DB_PASSWORD=your_actual_password
# JWT_SECRET=your_jwt_secret_key

npm run dev
```

### 4. 前端设置
```bash
cd frontend
npm install
npm run dev
```

### 5. 一键启动（推荐）
```bash
# Windows
start-dev.bat

# Linux/Mac
./start-dev.sh
```

### 6. 访问系统
- 前端界面: http://localhost:8080
- 后端API: http://localhost:3000
- 默认管理员账号: admin / admin123

## API接口文档

### 用户认证
| 方法 | 路径 | 描述 |
|------|------|------|
| POST | /api/auth/login | 用户登录 |
| POST | /api/auth/register | 用户注册（管理员功能） |
| GET | /api/auth/me | 获取当前用户信息 |
| PUT | /api/auth/profile | 更新用户资料 |

### 备忘录管理
| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/memos | 获取备忘录列表（支持分页和搜索） |
| POST | /api/memos | 创建新备忘录 |
| GET | /api/memos/:id | 获取单个备忘录详情 |
| PUT | /api/memos/:id | 更新备忘录 |
| POST | /api/memos/:id/copy | 复制备忘录 |
| DELETE | /api/memos/:id | 删除备忘录 |
| GET | /api/memos/:id/pdf | 生成并下载PDF |

### 用户管理（管理员）
| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/users | 获取用户列表 |
| POST | /api/users | 创建新用户 |
| PUT | /api/users/:id | 更新用户信息 |
| DELETE | /api/users/:id | 删除用户 |

### 文件上传
| 方法 | 路径 | 描述 |
|------|------|------|
| POST | /api/upload/tester-signature | 上传检测人员签名图片 |

## 数据库设计

### users 表（用户表）
| 字段名 | 数据类型 | 约束 | 描述 |
|--------|----------|------|------|
| id | SERIAL | PRIMARY KEY | 用户ID |
| username | VARCHAR(255) | UNIQUE | 用户名 |
| password_hash | VARCHAR(255) | NOT NULL | 密码哈希 |
| email | VARCHAR(255) | | 邮箱（可选） |
| phone | VARCHAR(20) | | 手机号（可选） |
| full_name | VARCHAR(255) | NOT NULL | 真实姓名 |
| role | VARCHAR(20) | NOT NULL | 角色（admin/user） |
| is_active | BOOLEAN | DEFAULT TRUE | 是否启用 |

### memos 表（备忘录表）
| 字段名 | 数据类型 | 约束 | 描述 |
|--------|----------|------|------|
| id | SERIAL | PRIMARY KEY | 备忘录ID |
| memo_number | VARCHAR(255) | UNIQUE | 备忘录编号 |
| user_unit_name | VARCHAR(255) | NOT NULL | 使用单位名称 |
| installation_location | TEXT | | 安装地点 |
| equipment_type | VARCHAR(255) | | 设备品种 |
| product_number | VARCHAR(255) | | 产品编号 |
| registration_cert_no | VARCHAR(255) | | 使用登记证编号 |
| non_conformance_status | INTEGER | NOT NULL | 不符合情况 |
| recommendations | TEXT | | 相关建议 |
| tester_signature_path | TEXT | | 检测人员签名路径 |
| representative_signature | TEXT | | 代表签名（Base64） |
| inspection_date | DATE | NOT NULL | 检测日期 |
| signing_date | DATE | | 签收日期 |
| created_by | INTEGER | FOREIGN KEY | 创建者用户ID |

### user_signatures 表（用户签名表）
| 字段名 | 数据类型 | 约束 | 描述 |
|--------|----------|------|------|
| id | SERIAL | PRIMARY KEY | 签名文件ID |
| user_id | INTEGER | FOREIGN KEY | 用户ID |
| filename | VARCHAR(255) | NOT NULL | 文件名 |
| file_path | TEXT | NOT NULL | 文件路径 |
| is_default | BOOLEAN | DEFAULT FALSE | 是否默认签名 |

## 业务流程

### 用户登录流程
1. 用户输入用户名和密码
2. 后端验证用户凭据
3. 生成JWT token返回给前端
4. 前端存储token并跳转到主页面

### 创建备忘录流程
1. 用户填写备忘录基本信息
2. 选择不符合情况类型，填写建议
3. 上传检测人员签名图片
4. 使用电子签名板进行手写签名
5. 系统自动记录创建者和创建时间
6. 提交保存备忘录

### 权限控制流程
1. 普通用户只能查看和管理自己创建的备忘录
2. 管理员可以查看所有备忘录和管理用户
3. JWT中间件验证每个API请求的身份

## 部署说明

### 生产环境部署

#### 1. 前端部署
```bash
cd frontend
npm run build
# 将 dist 目录部署到 Nginx 等Web服务器
```

#### 2. 后端部署
```bash
cd backend
npm install --production
# 使用 pm2 等进程管理器启动服务
pm2 start server.js --name "elevator-memo-api"
```

#### 3. 数据库部署
```bash
# 在生产环境执行数据库架构脚本
psql -d elevator_memo_prod -f database/schema.sql
```

#### 4. Nginx配置示例
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        root /path/to/frontend/dist;
        try_files $uri $uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
    
    location /uploads {
        proxy_pass http://localhost:3000;
    }
}
```

## 性能优化

系统已针对大数据量场景进行优化：
- **索引优化**: 为常用查询字段创建单独索引和组合索引
- **查询优化**: 使用分页查询减少内存占用
- **文件管理**: 定时清理过期的签名文件
- **连接池**: 使用PostgreSQL连接池提高数据库性能

支持场景：
- 用户数量: 50人以下
- 备忘录数量: 10万份以下
- 并发访问: 20人同时在线

## 故障排除

### 常见问题
1. **JWT认证失败**
   - 检查JWT_SECRET环境变量
   - 确认token未过期
   
2. **数据库连接失败**
   - 检查PostgreSQL服务状态
   - 验证数据库连接配置
   
3. **文件上传失败**
   - 检查uploads目录权限
   - 确认文件大小限制
   
4. **PDF生成失败**
   - 确认Puppeteer安装成功
   - 检查系统字体支持

## 开发指南

### 代码规范
- 前端使用ESLint + Vue官方风格指南
- 后端遵循Node.js最佳实践
- 数据库使用标准SQL和合理的索引设计

### 扩展功能建议
- [ ] 备忘录模板功能
- [ ] 批量导出PDF
- [ ] 数据统计报表
- [ ] 邮件通知功能
- [ ] 移动端PWA
- [ ] 数据备份与恢复

## 许可证
本项目采用 MIT 许可证。

## 贡献
欢迎提交Issue和Pull Request来帮助改进项目。