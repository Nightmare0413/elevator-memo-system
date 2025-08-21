const { Pool } = require('pg');

// 数据库配置
const dbConfig = {
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'elevator_memo',
  password: process.env.DB_PASSWORD || 'password',
  port: Number(process.env.DB_PORT) || 5432,
  // 连接池配置，提升高并发场景下的数据库处理能力
  max: Number(process.env.DB_POOL_MAX) || 20, // 最大连接数
  idleTimeoutMillis: Number(process.env.DB_IDLE_TIMEOUT) || 30000, // 空闲连接回收时间
  connectionTimeoutMillis: Number(process.env.DB_CONN_TIMEOUT) || 2000, // 连接超时时间
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