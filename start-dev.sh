#!/bin/bash

# 电梯自行检测备忘录电子化系统 - 开发环境启动脚本

echo "================================"
echo "  电梯自行检测备忘录电子化系统"
echo "  开发环境启动脚本"
echo "================================"
echo

# 检查Node.js环境
echo "正在检查Node.js环境..."
if ! command -v node &> /dev/null; then
    echo "错误: 未找到Node.js，请先安装Node.js 16+"
    exit 1
fi

echo "Node.js版本: $(node --version)"
echo

# 检查PostgreSQL
echo "正在检查PostgreSQL连接..."
echo "请确保PostgreSQL服务已启动并且数据库已创建..."
echo

# 检查后端依赖
if [ ! -d "backend/node_modules" ]; then
    echo "正在安装后端依赖..."
    cd backend && npm install && cd ..
fi

# 检查前端依赖
if [ ! -d "frontend/node_modules" ]; then
    echo "正在安装前端依赖..."
    cd frontend && npm install && cd ..
fi

echo "启动后端服务..."
cd backend && npm run dev &
BACKEND_PID=$!
cd ..

# 等待后端启动
sleep 3

echo "启动前端开发服务器..."
cd frontend && npm run dev &
FRONTEND_PID=$!
cd ..

echo
echo "启动完成！"
echo "- 后端API: http://localhost:3000"
echo "- 前端界面: http://localhost:8080"
echo
echo "按 Ctrl+C 停止所有服务"

# 等待用户中断
trap "echo; echo '正在停止服务...'; kill $BACKEND_PID $FRONTEND_PID; exit 0" INT
wait