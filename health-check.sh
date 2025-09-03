#!/bin/bash

# 电梯备忘录系统健康检查脚本
# 适用于 Docker 和传统部署环境

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=== 电梯备忘录系统健康检查 ===${NC}"
echo "检查时间: $(date)"
echo

# 检查部署方式
if [ -f "docker-compose.production.yml" ] && docker info &>/dev/null; then
    DEPLOYMENT_TYPE="docker"
    echo -e "${BLUE}检测到 Docker 部署环境${NC}"
else
    DEPLOYMENT_TYPE="traditional"
    echo -e "${BLUE}检测到传统部署环境${NC}"
fi

echo

# 初始化检查结果
HEALTH_STATUS=0

# 函数：输出检查结果
check_result() {
    local service=$1
    local status=$2
    local message=$3
    
    if [ $status -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $service: $message"
    else
        echo -e "${RED}✗${NC} $service: $message"
        HEALTH_STATUS=1
    fi
}

# 函数：输出警告
check_warning() {
    local service=$1
    local message=$2
    echo -e "${YELLOW}⚠${NC} $service: $message"
}

# 1. 检查后端 API 服务
echo "🔍 检查后端服务..."
if curl -sf http://localhost:3000 &>/dev/null; then
    check_result "后端API" 0 "服务正常运行 (http://localhost:3000)"
else
    check_result "后端API" 1 "服务无法访问"
    
    if [ "$DEPLOYMENT_TYPE" = "docker" ]; then
        echo "   Docker 容器状态:"
        docker ps --filter "name=elevator-memo-backend" --format "table {{.Names}}\t{{.Status}}"
    else
        echo "   PM2 进程状态:"
        pm2 describe elevator-memo-backend 2>/dev/null | grep -E "status|restarts" || echo "   PM2 进程未找到"
    fi
fi

# 2. 检查前端服务
echo "🔍 检查前端服务..."
if curl -sf http://localhost:8080 &>/dev/null; then
    check_result "前端服务" 0 "服务正常运行 (http://localhost:8080)"
else
    check_result "前端服务" 1 "服务无法访问"
    
    if [ "$DEPLOYMENT_TYPE" = "docker" ]; then
        echo "   Docker 容器状态:"
        docker ps --filter "name=elevator-memo-frontend" --format "table {{.Names}}\t{{.Status}}"
    fi
fi

# 3. 检查 Nginx 代理
echo "🔍 检查 Nginx 代理..."
if curl -sf http://localhost &>/dev/null; then
    check_result "Nginx代理" 0 "反向代理正常运行 (http://localhost)"
else
    check_result "Nginx代理" 1 "反向代理无法访问"
    
    if [ "$DEPLOYMENT_TYPE" = "docker" ]; then
        echo "   Docker 容器状态:"
        docker ps --filter "name=elevator-memo-nginx" --format "table {{.Names}}\t{{.Status}}"
    else
        systemctl is-active nginx &>/dev/null
        if [ $? -eq 0 ]; then
            echo "   Nginx 服务运行中，检查配置文件"
        else
            echo "   Nginx 服务未运行"
        fi
    fi
fi

# 4. 检查数据库连接
echo "🔍 检查数据库..."
if [ "$DEPLOYMENT_TYPE" = "docker" ]; then
    if docker exec elevator-memo-postgres pg_isready -U elevator_user &>/dev/null; then
        check_result "PostgreSQL" 0 "数据库连接正常"
        
        # 检查数据库大小
        DB_SIZE=$(docker exec elevator-memo-postgres psql -U elevator_user -d elevator_memo -t -c "SELECT pg_size_pretty(pg_database_size('elevator_memo'));" 2>/dev/null | xargs)
        if [ ! -z "$DB_SIZE" ]; then
            echo -e "${BLUE}   数据库大小: $DB_SIZE${NC}"
        fi
    else
        check_result "PostgreSQL" 1 "数据库连接失败"
        echo "   Docker 容器状态:"
        docker ps --filter "name=elevator-memo-postgres" --format "table {{.Names}}\t{{.Status}}"
    fi
else
    if systemctl is-active postgresql &>/dev/null; then
        if psql -U elevator_user -d elevator_memo -c "SELECT 1;" &>/dev/null; then
            check_result "PostgreSQL" 0 "数据库连接正常"
        else
            check_result "PostgreSQL" 1 "数据库连接失败（权限问题）"
        fi
    else
        check_result "PostgreSQL" 1 "数据库服务未运行"
    fi
fi

# 5. 检查系统资源
echo "🔍 检查系统资源..."

# 内存使用率
MEM_USAGE=$(free | awk 'NR==2{printf "%.1f", $3*100/$2}')
MEM_USAGE_INT=${MEM_USAGE%.*}
if [ $MEM_USAGE_INT -lt 80 ]; then
    check_result "内存使用" 0 "${MEM_USAGE}%"
elif [ $MEM_USAGE_INT -lt 90 ]; then
    check_warning "内存使用" "${MEM_USAGE}% (接近高负载)"
else
    check_result "内存使用" 1 "${MEM_USAGE}% (负载过高)"
fi

# 磁盘使用率
DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $DISK_USAGE -lt 80 ]; then
    check_result "磁盘使用" 0 "${DISK_USAGE}%"
elif [ $DISK_USAGE -lt 90 ]; then
    check_warning "磁盘使用" "${DISK_USAGE}% (需要清理)"
else
    check_result "磁盘使用" 1 "${DISK_USAGE}% (磁盘空间不足)"
fi

# CPU 负载（1分钟平均）
CPU_LOAD=$(uptime | awk -F'load average:' '{print $2}' | cut -d, -f1 | xargs)
CPU_CORES=$(nproc)
CPU_LOAD_PERCENT=$(echo "scale=1; $CPU_LOAD * 100 / $CPU_CORES" | bc 2>/dev/null || echo "0")
echo -e "${BLUE}   CPU负载: $CPU_LOAD (${CPU_LOAD_PERCENT%.*}% of $CPU_CORES cores)${NC}"

# 6. 检查端口占用
echo "🔍 检查端口状态..."
PORTS=(80 3000 8080 5432)
for port in "${PORTS[@]}"; do
    if ss -tlnp | grep ":$port " &>/dev/null; then
        check_result "端口$port" 0 "已监听"
    else
        check_result "端口$port" 1 "未监听"
    fi
done

# 7. 网络连通性测试
echo "🔍 检查网络连通性..."
if curl -sf http://localhost:3000/api/health &>/dev/null; then
    check_result "API健康端点" 0 "响应正常"
else
    check_result "API健康端点" 1 "无响应"
fi

echo
if [ $HEALTH_STATUS -eq 0 ]; then
    echo -e "${GREEN}🎉 系统健康状况良好！${NC}"
else
    echo -e "${RED}⚠️ 发现问题，请查看上述检查结果${NC}"
    echo
    echo "建议操作："
    echo "1. 查看详细日志: docker-compose -f docker-compose.production.yml logs"
    echo "2. 重启问题服务: docker-compose -f docker-compose.production.yml restart [service_name]"
    echo "3. 检查配置文件: cat .env.production"
    echo "4. 运行部署脚本: ./deploy-linux.sh (Linux) 或 deploy-windows.bat (Windows)"
fi

echo
echo -e "${BLUE}完整系统信息:${NC}"
echo "操作系统: $(cat /etc/os-release 2>/dev/null | grep PRETTY_NAME | cut -d'"' -f2 || echo 'Unknown')"
echo "内核版本: $(uname -r)"
echo "运行时间: $(uptime -p 2>/dev/null || uptime)"

exit $HEALTH_STATUS