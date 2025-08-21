# 电梯自行检测备忘录电子化系统 - 后端API

## 项目结构
```
backend/
├── config/             # 配置文件
│   └── database.js     # 数据库连接配置
├── controllers/        # 控制器
│   ├── memoController.js    # 备忘录控制器
│   └── uploadController.js  # 文件上传控制器
├── models/             # 数据模型
│   └── Memo.js         # 备忘录模型
├── routes/             # 路由配置
│   ├── memoRoutes.js   # 备忘录路由
│   └── uploadRoutes.js # 文件上传路由
├── templates/          # PDF模板
│   └── memo-template.html   # 备忘录PDF模板
├── uploads/            # 上传文件存储目录
│   └── signatures/     # 签名图片存储
├── package.json        # 项目依赖配置
└── server.js          # 主服务器文件
```

## 安装依赖
```bash
cd backend
npm install
```

## 环境变量配置
创建 `.env` 文件：
```
DB_USER=postgres
DB_HOST=localhost
DB_NAME=elevator_memo
DB_PASSWORD=your_password
DB_PORT=5432
```

## 启动服务
```bash
# 开发环境
npm run dev

# 生产环境
npm start
```

## API接口文档

### 备忘录管理
- `GET /api/memos` - 获取备忘录列表
- `POST /api/memos` - 创建新备忘录
- `GET /api/memos/:id` - 获取单个备忘录
- `POST /api/memos/:id/copy` - 复制备忘录
- `DELETE /api/memos/:id` - 删除备忘录
- `GET /api/memos/:id/pdf` - 生成PDF

### 文件上传
- `POST /api/upload/tester-signature` - 上传检测人员签名图片

## 数据库要求
- PostgreSQL 12+
- 执行 `../database/init.sql` 初始化数据库表结构