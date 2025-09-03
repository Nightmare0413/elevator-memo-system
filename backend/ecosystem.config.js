module.exports = {
  apps: [
    {
      name: 'elevator-memo-backend',
      script: './server.js',
      cwd: '/var/www/elevator-memo-system/backend',
      instances: 1,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      env_file: '.env.production',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: './logs/error.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      // 自动重启配置
      watch: false,
      ignore_watch: ['node_modules', 'uploads', 'logs'],
      max_memory_restart: '1G',
      // 进程管理
      min_uptime: '10s',
      max_restarts: 10,
      autorestart: true,
      // 监控
      monitoring: false
    }
  ]
};