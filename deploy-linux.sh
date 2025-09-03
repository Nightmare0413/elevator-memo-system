#!/bin/bash

# 电梯备忘录系统 Linux 生产环境一键部署脚本
# 适用于: Ubuntu 20.04+, CentOS 8+, Debian 11+

set -e  # 出错时停止执行
set -u  # 使用未定义变量时报错

# 颜色输出定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# 检查是否为 root 用户
check_root() {
    if [ "$EUID" -ne 0 ]; then
        log_error "请使用 sudo 运行此脚本"
        exit 1
    fi
}

# 检测操作系统
detect_os() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$ID
        OS_VERSION=$VERSION_ID
    else
        log_error "无法检测操作系统版本"
        exit 1
    fi
    
    log_info "检测到操作系统: $OS $OS_VERSION"
}

# 检查系统依赖
check_dependencies() {
    log_step "[1/8] 检查系统环境..."
    
    # 检查 curl
    if ! command -v curl &> /dev/null; then
        log_warn "curl 未安装，正在安装..."
        case $OS in
            ubuntu|debian)
                apt update && apt install -y curl
                ;;
            centos|rhel|rocky|almalinux)
                yum install -y curl || dnf install -y curl
                ;;
            *)
                log_error "不支持的操作系统: $OS"
                exit 1
                ;;
        esac
    fi

    # 检查 Docker
    if ! command -v docker &> /dev/null; then
        log_warn "Docker 未安装，正在安装..."
        install_docker
    fi

    # 检查 Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        log_warn "Docker Compose 未安装，正在安装..."
        install_docker_compose
    fi

    # 检查 Docker 服务是否运行
    if ! systemctl is-active --quiet docker; then
        log_warn "Docker 服务未运行，正在启动..."
        systemctl start docker
        systemctl enable docker
    fi

    # 验证 Docker 可用性
    if ! docker info &> /dev/null; then
        log_error "Docker 无法正常工作，请检查安装"
        exit 1
    fi

    log_info "✓ 系统依赖检查完成"
}

# 安装 Docker
install_docker() {
    log_info "正在安装 Docker..."
    
    case $OS in
        ubuntu|debian)
            apt update
            apt install -y apt-transport-https ca-certificates gnupg lsb-release
            
            # 添加 Docker 官方 GPG 密钥
            curl -fsSL https://download.docker.com/linux/$OS/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
            
            # 添加 Docker 仓库
            echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/$OS $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
            
            # 安装 Docker
            apt update
            apt install -y docker-ce docker-ce-cli containerd.io
            ;;
        centos|rhel)
            # 安装依赖
            yum install -y yum-utils device-mapper-persistent-data lvm2
            
            # 添加 Docker 仓库
            yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
            
            # 安装 Docker
            yum install -y docker-ce docker-ce-cli containerd.io
            ;;
        *)
            log_error "不支持的操作系统: $OS"
            exit 1
            ;;
    esac
    
    # 启动并启用 Docker
    systemctl start docker
    systemctl enable docker
    
    log_info "✓ Docker 安装完成"
}

# 安装 Docker Compose
install_docker_compose() {
    log_info "正在安装 Docker Compose..."
    
    # 获取最新版本号
    COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep tag_name | cut -d '"' -f 4)
    
    if [ -z "$COMPOSE_VERSION" ]; then
        COMPOSE_VERSION="v2.20.3"
        log_warn "无法获取最新版本，使用默认版本: $COMPOSE_VERSION"
    fi
    
    # 下载并安装 Docker Compose
    curl -L "https://github.com/docker/compose/releases/download/$COMPOSE_VERSION/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    
    # 创建软链接
    ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose
    
    log_info "✓ Docker Compose 安装完成"
}

# 检查环境配置
check_env_config() {
    log_step "[2/8] 检查环境配置..."
    
    if [ ! -f ".env.production" ]; then
        if [ -f ".env.production.example" ]; then
            log_warn "未找到 .env.production 文件，正在复制示例文件..."
            cp ".env.production.example" ".env.production"
            log_warn "请编辑 .env.production 文件，设置数据库密码和JWT密钥"
            read -p "按回车键继续..."
        else
            log_error "未找到 .env.production.example 文件"
            exit 1
        fi
    fi
    
    # 检查关键配置
    if grep -q "your_secure_database_password_here" .env.production; then
        log_warn "警告: 请修改 .env.production 中的默认数据库密码"
        read -p "是否继续？(y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    
    if grep -q "your_very_secure_jwt_secret_key_for_production_environment" .env.production; then
        log_warn "警告: 请修改 .env.production 中的默认JWT密钥"
        read -p "是否继续？(y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    
    log_info "✓ 环境配置检查完成"
}

# 停止现有服务
stop_services() {
    log_step "[3/8] 停止现有服务..."
    
    # 停止 Docker Compose 服务
    if [ -f "docker-compose.production.yml" ]; then
        docker-compose -f docker-compose.production.yml down &> /dev/null || true
    fi
    
    log_info "✓ 现有服务已停止"
}

# 清理资源
cleanup_resources() {
    log_step "[4/8] 清理旧资源..."
    
    # 清理悬挂的镜像
    docker image prune -f &> /dev/null || true
    
    # 清理未使用的网络
    docker network prune -f &> /dev/null || true
    
    log_info "✓ 资源清理完成"
}

# 拉取基础镜像
pull_base_images() {
    log_step "[5/8] 拉取基础镜像..."
    
    log_info "正在拉取 PostgreSQL 镜像..."
    docker pull postgres:15-alpine
    
    log_info "正在拉取 Nginx 镜像..."
    docker pull nginx:1.24-alpine
    
    log_info "✓ 基础镜像拉取完成"
}

# 构建应用镜像
build_images() {
    log_step "[6/8] 构建应用镜像..."
    
    log_info "正在构建后端镜像..."
    docker-compose -f docker-compose.production.yml build backend
    
    log_info "正在构建前端镜像..."
    docker-compose -f docker-compose.production.yml build frontend
    
    log_info "✓ 应用镜像构建完成"
}

# 启动服务
start_services() {
    log_step "[7/8] 启动生产环境服务..."
    
    # 启动所有服务
    docker-compose -f docker-compose.production.yml up -d
    
    log_info "✓ 服务启动命令已执行"
}

# 健康检查
health_check() {
    log_step "[8/8] 服务健康检查..."
    
    log_info "等待服务启动..."
    sleep 30
    
    # 显示服务状态
    log_info "当前服务状态:"
    docker-compose -f docker-compose.production.yml ps
    
    # 健康检查循环
    local retries=0
    local max_retries=30
    
    while [ $retries -lt $max_retries ]; do
        retries=$((retries + 1))
        
        # 检查后端服务
        if curl -sf http://localhost:3000 &> /dev/null; then
            # 检查前端服务
            if curl -sf http://localhost:8080 &> /dev/null; then
                log_info "✓ 所有服务健康检查通过"
                return 0
            fi
        fi
        
        log_info "等待服务启动... ($retries/$max_retries)"
        sleep 10
    done
    
    log_error "服务启动超时，请检查日志"
    show_logs
    return 1
}

# 显示日志
show_logs() {
    echo
    log_info "显示服务日志:"
    docker-compose -f docker-compose.production.yml logs --tail=20
    
    echo
    log_info "可能的解决方案:"
    echo "1. 检查端口 80, 3000, 8080 是否被占用: netstat -tlnp | grep -E ':(80|3000|8080)'"
    echo "2. 检查 .env.production 配置是否正确"
    echo "3. 重新运行脚本: sudo ./deploy-linux.sh"
    echo "4. 查看完整日志: docker-compose -f docker-compose.production.yml logs"
}

# 显示部署结果
show_result() {
    echo
    echo "=========================================="
    echo "           部署完成!"
    echo "=========================================="
    echo
    echo "🌐 访问地址:"
    echo "  - 主页面: http://localhost"
    echo "  - 前端服务: http://localhost:8080"
    echo "  - 后端API: http://localhost:3000"
    echo
    echo "🔐 默认管理员账号:"
    echo "  - 用户名: admin"
    echo "  - 密码: admin123"
    echo
    echo "📋 常用管理命令:"
    echo "  - 查看日志: docker-compose -f docker-compose.production.yml logs -f"
    echo "  - 停止服务: docker-compose -f docker-compose.production.yml down"
    echo "  - 重启服务: docker-compose -f docker-compose.production.yml restart"
    echo "  - 查看状态: docker-compose -f docker-compose.production.yml ps"
    echo
    echo "🔧 系统管理命令:"
    echo "  - 备份数据库: docker exec elevator-memo-postgres pg_dump -U elevator_user elevator_memo > backup_\$(date +%Y%m%d).sql"
    echo "  - 查看系统资源: docker stats"
    echo "  - 清理未使用镜像: docker system prune -f"
    echo
    echo "💡 安全提示:"
    echo "  - 建议修改 .env.production 中的默认密码和密钥"
    echo "  - 配置防火墙: ufw allow 80 && ufw allow 443 && ufw enable"
    echo "  - 定期备份数据库和上传的文件"
    echo
}

# 主函数
main() {
    echo "=========================================="
    echo "电梯备忘录系统 Linux 生产环境一键部署脚本"
    echo "=========================================="
    echo
    
    # 检查权限
    check_root
    
    # 检测操作系统
    detect_os
    
    # 执行部署步骤
    check_dependencies
    check_env_config
    stop_services
    cleanup_resources
    pull_base_images
    build_images
    start_services
    
    # 健康检查
    if health_check; then
        show_result
        echo "🎉 部署成功完成！"
        exit 0
    else
        echo "❌ 部署过程中出现问题，请查看上述日志信息"
        exit 1
    fi
}

# 信号处理函数
cleanup() {
    log_warn "收到中断信号，正在清理..."
    docker-compose -f docker-compose.production.yml down &> /dev/null || true
    exit 1
}

# 设置信号处理
trap cleanup SIGINT SIGTERM

# 检查脚本是否在项目根目录运行
if [ ! -f "docker-compose.production.yml" ]; then
    log_error "请在项目根目录下运行此脚本 (包含 docker-compose.production.yml 文件的目录)"
    exit 1
fi

# 执行主函数
main "$@"