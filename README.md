# 电梯自行检测备忘录电子化系统

## 项目概述
这是一个基于Web的内部管理系统，用于替代传统的纸质版《电梯自行检测备忘录》。系统实现了在线填写、管理和生成备忘录的完整功能，支持电子签名、文件上传和PDF导出，帮助企业实现无纸化办公，提升工作效率。

## 功能特性
- ✅ **备忘录管理**: 支持新增、复制、查询、删除操作
- ✅ **自动化字段**: 检测日期和签收日期自动生成
- ✅ **电子签名**: 检测人员图片上传 + 使用单位代表在线手写签名
- ✅ **表单验证**: 完整的数据验证和错误提示
- ✅ **PDF导出**: 一键生成标准格式PDF文件
- ✅ **搜索分页**: 支持备忘录搜索和分页显示
- ✅ **响应式设计**: 支持桌面端、平板和移动端

## 技术架构

### 前端 (Frontend)
- **框架**: Vue.js 3 + Composition API
- **UI组件**: Element Plus 2.x
- **构建工具**: Vite 4.x
- **路由**: Vue Router 4.x
- **HTTP客户端**: Axios
- **电子签名**: vue-signature-pad

### 后端 (Backend) 
- **运行时**: Node.js 16+
- **框架**: Express.js
- **文件上传**: Multer
- **PDF生成**: Puppeteer
- **跨域支持**: CORS

### 数据库 (Database)
- **数据库**: PostgreSQL 12+
- **连接池**: node-postgres (pg)

## 项目结构
```
elevator-memo-system/
├── frontend/           # Vue.js 前端项目
│   ├── src/
│   │   ├── api/        # API接口封装
│   │   ├── components/ # 可复用组件
│   │   ├── views/      # 页面组件
│   │   ├── router/     # 路由配置
│   │   └── utils/      # 工具函数
│   ├── public/         # 静态资源
│   └── package.json
├── backend/            # Node.js 后端项目
│   ├── config/         # 配置文件
│   ├── controllers/    # 控制器
│   ├── models/         # 数据模型
│   ├── routes/         # 路由定义
│   ├── templates/      # PDF模板
│   ├── uploads/        # 上传文件存储
│   └── package.json
├── database/           # 数据库相关
│   ├── init.sql        # 数据库初始化脚本
│   └── README.md       # 数据库设置说明
└── README.md          # 项目说明文档
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

# 执行初始化脚本
psql -d elevator_memo -f database/init.sql
```

### 3. 后端设置
```bash
# 进入后端目录
cd backend

# 安装依赖
npm install

# 复制环境配置文件
cp .env.example .env

# 修改 .env 文件中的数据库连接信息
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=elevator_memo
# DB_USER=postgres
# DB_PASSWORD=your_password

# 启动后端服务
npm run dev
```

### 4. 前端设置
```bash
# 新开终端，进入前端目录
cd frontend

# 安装依赖
npm install

# 启动前端开发服务器
npm run dev
```

### 5. 访问系统
- 前端界面: http://localhost:8080
- 后端API: http://localhost:3000

## API接口文档

### 备忘录管理
| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/memos | 获取备忘录列表（支持分页和搜索） |
| POST | /api/memos | 创建新备忘录 |
| GET | /api/memos/:id | 获取单个备忘录详情 |
| POST | /api/memos/:id/copy | 复制备忘录 |
| DELETE | /api/memos/:id | 删除备忘录 |
| GET | /api/memos/:id/pdf | 生成并下载PDF |

### 文件上传
| 方法 | 路径 | 描述 |
|------|------|------|
| POST | /api/upload/tester-signature | 上传检测人员签名图片 |

## 数据库设计

### memos 表结构
| 字段名 | 数据类型 | 约束 | 描述 |
|--------|----------|------|------|
| id | SERIAL | PRIMARY KEY | 自增主键 |
| memo_number | VARCHAR(255) | UNIQUE | 备忘录编号 |
| user_unit_name | VARCHAR(255) | NOT NULL | 使用单位名称 |
| installation_location | TEXT | | 安装地点 |
| equipment_type | VARCHAR(255) | | 设备品种 |
| product_number | VARCHAR(255) | | 产品编号 |
| registration_cert_no | VARCHAR(255) | | 使用登记证编号 |
| non_conformance_status | INTEGER | NOT NULL | 不符合情况(0:无,1:存在,2:严重) |
| tester_signature_path | TEXT | | 检测人员签名图片路径 |
| representative_signature | TEXT | | 使用单位代表签名(Base64) |
| inspection_date | DATE | NOT NULL | 检测日期 |
| signing_date | DATE | | 签收日期 |
| created_at | TIMESTAMP | DEFAULT NOW() | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT NOW() | 更新时间 |

## 业务流程

### 创建备忘录流程
1. 用户填写备忘录基本信息（单位名称、安装地点等）
2. 选择不符合情况类型
3. 上传检测人员签名图片
4. 使用电子签名板进行手写签名
5. 签名完成后自动填入签收日期
6. 提交保存备忘录

### PDF生成流程  
1. 用户点击下载PDF按钮
2. 后端查询备忘录完整数据
3. 使用Puppeteer将HTML模板填充数据
4. 生成PDF文件并返回给前端
5. 前端触发文件下载

## 部署说明

### 生产环境部署

#### 1. 前端部署
```bash
cd frontend
npm run build
# 将 dist 目录部署到 Nginx/Apache 等Web服务器
```

#### 2. 后端部署
```bash
cd backend
npm install --production
# 使用 pm2 等进程管理器启动服务
pm2 start server.js --name "elevator-memo-api"
```

#### 3. Nginx配置示例
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    # 前端静态文件
    location / {
        root /path/to/frontend/dist;
        try_files $uri $uri/ /index.html;
    }
    
    # API代理
    location /api {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
    
    # 上传文件访问
    location /uploads {
        proxy_pass http://localhost:3000;
    }
}
```

## 开发指南

### 代码规范
- 前端使用ESLint + Vue官方风格指南
- 后端遵循Node.js最佳实践
- 数据库使用标准SQL和合理的索引设计

### 扩展功能建议
- [ ] 用户权限管理
- [ ] 备忘录模板功能  
- [ ] 批量导出PDF
- [ ] 数据统计报表
- [ ] 移动端App
- [ ] 微信小程序

## 故障排除

### 常见问题
1. **数据库连接失败**
   - 检查PostgreSQL服务是否启动
   - 验证数据库用户名和密码
   - 确认防火墙设置

2. **文件上传失败**
   - 检查uploads目录权限
   - 确认文件大小限制
   - 验证文件类型过滤

3. **PDF生成失败**
   - 确认Puppeteer安装成功
   - 检查系统字体支持
   - 验证HTML模板语法

4. **前端访问API失败**
   - 检查CORS配置
   - 验证代理设置
   - 确认API服务状态

## 许可证
本项目采用 MIT 许可证。详见 LICENSE 文件。

## 贡献
欢迎提交Issue和Pull Request来帮助改进项目。

## 联系方式
如有问题或建议，请通过以下方式联系：
- 创建GitHub Issue
- 发送邮件到 [your-email@example.com]