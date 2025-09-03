@echo off
echo ==========================================
echo 电梯备忘录系统 Windows 生产环境一键部署脚本
echo ==========================================

rem 设置错误时停止执行
setlocal EnableDelayedExpansion

rem 设置脚本编码为 UTF-8
chcp 65001 > nul

rem 检查管理员权限
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo 错误: 请以管理员身份运行此脚本
    pause
    exit /b 1
)

echo.
echo [1/8] 检查系统环境...

rem 检查 Docker Desktop 是否安装
docker --version > nul 2>&1
if %errorLevel% neq 0 (
    echo 错误: 未检测到 Docker Desktop，请先安装 Docker Desktop for Windows
    echo 下载地址: https://www.docker.com/products/docker-desktop/
    pause
    exit /b 1
)

rem 检查 Docker Compose
docker-compose --version > nul 2>&1
if %errorLevel% neq 0 (
    echo 错误: Docker Compose 未可用
    pause
    exit /b 1
)

rem 检查 Docker 是否运行
docker info > nul 2>&1
if %errorLevel% neq 0 (
    echo 错误: Docker Desktop 未启动，请启动 Docker Desktop 后重试
    pause
    exit /b 1
)

echo ✓ Docker Desktop 环境检查通过

echo.
echo [2/8] 检查环境配置文件...

rem 检查 .env.production 文件
if not exist ".env.production" (
    if exist ".env.production.example" (
        echo ! 未找到 .env.production 文件，正在复制示例文件...
        copy ".env.production.example" ".env.production" > nul
        echo ! 请编辑 .env.production 文件，设置数据库密码和JWT密钥
        echo ! 使用记事本或任何文本编辑器打开 .env.production
        pause
    ) else (
        echo 错误: 未找到 .env.production.example 文件
        pause
        exit /b 1
    )
)

rem 检查配置文件中的关键参数
findstr /C:"your_secure_database_password_here" .env.production > nul
if %errorLevel% equ 0 (
    echo ! 警告: 请修改 .env.production 中的默认数据库密码
    echo ! 当前使用的是示例密码，存在安全风险
    set /p continue="是否继续？(y/N): "
    if /i not "!continue!" == "y" exit /b 1
)

findstr /C:"your_very_secure_jwt_secret_key_for_production_environment" .env.production > nul
if %errorLevel% equ 0 (
    echo ! 警告: 请修改 .env.production 中的默认JWT密钥
    echo ! 当前使用的是示例密钥，存在安全风险
    set /p continue="是否继续？(y/N): "
    if /i not "!continue!" == "y" exit /b 1
)

echo ✓ 环境配置检查完成

echo.
echo [3/8] 停止现有服务...
docker-compose -f docker-compose.production.yml down > nul 2>&1

echo.
echo [4/8] 清理旧镜像和容器...
for /f "tokens=*" %%i in ('docker images -q --filter "dangling=true" 2^>nul') do (
    docker rmi %%i > nul 2>&1
)

echo.
echo [5/8] 拉取基础镜像...
echo 正在拉取镜像，请稍候...
docker pull postgres:15-alpine
docker pull nginx:1.24-alpine

echo.
echo [6/8] 构建应用镜像...
echo 正在构建后端镜像...
docker-compose -f docker-compose.production.yml build backend

echo 正在构建前端镜像...
docker-compose -f docker-compose.production.yml build frontend

echo.
echo [7/8] 启动生产环境服务...
docker-compose -f docker-compose.production.yml up -d

echo.
echo [8/8] 等待服务启动...
timeout /t 30 > nul

rem 检查服务健康状态
echo 检查服务状态...
docker-compose -f docker-compose.production.yml ps

echo.
echo 正在进行健康检查...
set /a retries=0
:health_check
set /a retries+=1
if %retries% gtr 30 (
    echo 错误: 服务启动超时，请检查日志
    goto show_logs
)

rem 检查后端健康状态
curl -s http://localhost:3000 > nul 2>&1
if %errorLevel% neq 0 (
    echo 等待服务启动... (%retries%/30^)
    timeout /t 10 > nul
    goto health_check
)

rem 检查前端健康状态  
curl -s http://localhost:8080 > nul 2>&1
if %errorLevel% neq 0 (
    echo 等待前端服务启动... (%retries%/30^)
    timeout /t 10 > nul
    goto health_check
)

echo.
echo ==========================================
echo           部署完成!
echo ==========================================
echo.
echo 🌐 访问地址:
echo   - 主页面: http://localhost
echo   - 前端服务: http://localhost:8080
echo   - 后端API: http://localhost:3000
echo.
echo 🔐 默认管理员账号:
echo   - 用户名: admin
echo   - 密码: admin123
echo.
echo 📋 常用命令:
echo   - 查看日志: docker-compose -f docker-compose.production.yml logs -f
echo   - 停止服务: docker-compose -f docker-compose.production.yml down
echo   - 重启服务: docker-compose -f docker-compose.production.yml restart
echo.
echo 💡 提示: 建议在 .env.production 中修改默认密码和密钥
echo.
goto end

:show_logs
echo.
echo 服务启动失败，显示日志信息:
docker-compose -f docker-compose.production.yml logs --tail=20

echo.
echo 可能的解决方案:
echo 1. 检查端口 80, 3000, 8080 是否被占用
echo 2. 检查 .env.production 配置是否正确
echo 3. 重新运行脚本: deploy-windows.bat
echo 4. 查看完整日志: docker-compose -f docker-compose.production.yml logs

:end
echo.
pause