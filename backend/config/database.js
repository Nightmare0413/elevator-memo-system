const { Pool } = require('pg');

// 数据库配置 - 针对50用户，10万数据优化
const dbConfig = {
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'elevator_memo',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
  
  // 连接池优化配置
  max: 20, // 最大连接数 - 50用户下足够
  min: 5,  // 最小连接数 - 保持基础连接
  idle: 10000, // 10秒空闲时间
  connect_timeout: 10000, // 10秒连接超时
  acquire: 20000, // 20秒获取连接超时
  
  // PostgreSQL 优化参数
  statement_timeout: 30000, // 30秒查询超时
  query_timeout: 30000, // 30秒查询超时
  
  // 连接保持
  keepAlive: true,
  keepAliveInitialDelayMillis: 30000, // 30秒后开始keep-alive
};

// 创建连接池
const pool = new Pool(dbConfig);

// 测试连接
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Database connection error:', err);
});

module.exports = pool;