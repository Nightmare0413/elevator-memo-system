require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const Scheduler = require('./utils/scheduler');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件配置
const corsOptions = {
  origin: ['http://localhost:8080', 'http://127.0.0.1:8080', 'http://localhost:3000', 'http://192.168.130.36:8080'],
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 静态文件服务 - 用于提供上传的图片
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 路由配置
const memoRoutes = require('./routes/memoRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const userRoutes = require('./routes/userRoutes');

app.use('/api/memos', memoRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/users', userRoutes);

// 根路径 - 返回 API 信息
app.get('/', (req, res) => {
  res.json({ 
    message: '电梯自行检测备忘录电子化系统 API',
    version: '1.0.0',
    status: 'running'
  });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: '服务器内部错误',
    message: err.message 
  });
});

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: '接口不存在',
    path: req.originalUrl 
  });
});

app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
  console.log(`访问地址: http://localhost:${PORT}`);
  
  // 初始化定时任务调度器
  Scheduler.init();
});