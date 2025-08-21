# 电梯自行检测备忘录电子化系统 - 前端

## 项目概述
基于 Vue.js 3 + Element Plus 的现代化Web前端应用，提供直观的备忘录管理界面。

## 技术栈
- **框架**: Vue.js 3 (Composition API)
- **UI组件库**: Element Plus 2.x
- **构建工具**: Vite 4.x  
- **路由**: Vue Router 4.x
- **HTTP客户端**: Axios
- **电子签名**: vue-signature-pad

## 项目结构
```
src/
├── api/                # API接口封装
│   └── memo.js         # 备忘录相关接口
├── assets/             # 静态资源
├── components/         # 可复用组件
│   ├── MemoForm.vue    # 备忘录表单组件
│   └── SignaturePad.vue # 电子签名组件
├── router/             # 路由配置
│   └── index.js
├── utils/              # 工具函数
│   ├── index.js        # 通用工具
│   └── request.js      # HTTP请求封装
├── views/              # 页面组件
│   ├── MemoList.vue    # 备忘录列表
│   ├── MemoCreate.vue  # 新建备忘录
│   ├── MemoEdit.vue    # 编辑备忘录
│   ├── MemoDetail.vue  # 备忘录详情
│   └── NotFound.vue    # 404页面
├── App.vue             # 根组件
└── main.js            # 入口文件
```

## 功能特性

### 🏠 备忘录管理
- ✅ 备忘录列表展示
- ✅ 分页和搜索功能
- ✅ 新建/编辑备忘录
- ✅ 复制备忘录
- ✅ 删除备忘录（含确认）

### 📝 表单功能
- ✅ 自动生成备忘录编号
- ✅ 表单验证和提示
- ✅ 实时数据保存
- ✅ 自动填充日期

### 🖊️ 签名功能
- ✅ 图片上传（检测人员签名）
- ✅ 在线电子签名（使用单位代表）
- ✅ 签名预览和清除
- ✅ 签名后自动填入签收日期

### 📄 PDF导出
- ✅ 一键生成标准格式PDF
- ✅ 包含所有表单数据和签名
- ✅ 支持下载和预览

### 📱 响应式设计
- ✅ 移动端适配
- ✅ 平板设备优化
- ✅ 桌面端完整体验

## 开发环境设置

### 环境要求
- Node.js 16.0+
- npm 7.0+ 或 yarn 1.22+

### 安装依赖
```bash
cd frontend
npm install
```

### 环境变量配置
创建 `.env.development` 文件：
```
VITE_API_BASE_URL=http://localhost:3000
```

### 启动开发服务器
```bash
npm run dev
```
访问 http://localhost:8080

### 构建生产版本
```bash
npm run build
```

## 组件说明

### MemoForm 组件
备忘录表单的核心组件，支持：
- 所有表单字段的录入和验证
- 文件上传（检测人员签名图片）
- 电子签名集成
- 自动日期填充
- 表单提交和重置

### SignaturePad 组件
电子签名组件，基于 vue-signature-pad：
- 响应式画布
- 签名保存和清除
- Base64格式输出
- 触摸设备支持

### API 封装
所有HTTP请求统一封装在 `@/api/memo.js`：
- RESTful API调用
- 错误处理
- Loading状态管理
- 文件上传支持

## 开发规范

### 代码风格
- 使用 ESLint 进行代码检查
- 遵循 Vue.js 官方风格指南
- 组件名使用PascalCase
- 文件名使用PascalCase

### 组件开发
- 单文件组件(.vue)
- Composition API优先
- Props类型定义
- 事件名使用kebab-case

### 样式规范
- 使用scoped样式
- 响应式设计
- Element Plus主题定制
- CSS变量使用

## 部署说明

### 构建
```bash
npm run build
```

### 静态部署
构建后的 `dist` 目录可以部署到任何静态文件服务器：
- Nginx
- Apache
- CDN服务

### 配置示例 (Nginx)
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        root /path/to/dist;
        try_files $uri $uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 浏览器兼容性
- Chrome 70+
- Firefox 65+
- Safari 12+
- Edge 79+

## 故障排除

### 常见问题
1. **安装依赖失败**
   - 清除npm缓存: `npm cache clean --force`
   - 删除node_modules重新安装

2. **开发服务器启动失败**
   - 检查端口是否被占用
   - 确认Node.js版本

3. **API请求失败**
   - 确认后端服务已启动
   - 检查代理配置

### 调试技巧
- 使用Vue DevTools浏览器扩展
- 查看Network面板检查API请求
- 使用console.log调试组件状态

## 贡献指南
1. Fork本项目
2. 创建功能分支
3. 提交更改
4. 发起Pull Request