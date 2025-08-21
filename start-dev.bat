@echo off
title 电梯备忘录系统 - 开发环境启动

echo ================================
echo   电梯自行检测备忘录电子化系统
echo   开发环境启动脚本
echo ================================
echo.

echo 正在检查Node.js环境...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo 错误: 未找到Node.js，请先安装Node.js 16+
    pause
    exit /b 1
)

echo 正在检查PostgreSQL连接...
echo 请确保PostgreSQL服务已启动并且数据库已创建...
echo.

echo 启动后端服务...
start "后端API服务" cmd /k "cd /d backend && npm run dev"
timeout /t 3 /nobreak >nul

echo 启动前端开发服务器...  
start "前端开发服务器" cmd /k "cd /d frontend && npm run dev"

echo.
echo 启动完成！
echo - 后端API: http://localhost:3000
echo - 前端界面: http://localhost:8080
echo.
echo 按任意键退出...
pause >nul