#!/bin/bash

# 电梯备忘录系统日志收集脚本
# 用于技术支持和问题诊断

echo "======================================"
echo "电梯备忘录系统 - 日志收集报告"
echo "生成时间: $(date)"
echo "======================================"
echo

# 系统信息
echo "## 系统信息"
echo "操作系统: $(cat /etc/os-release 2>/dev/null | grep PRETTY_NAME | cut -d'"' -f2 || echo 'Unknown')"
echo "内核版本: $(uname -r)"
echo "架构: $(uname -m)"
echo "运行时间: $(uptime)"
echo "当前用户: $(whoami)"
echo "工作目录: $(pwd)"
echo

# Docker 信息（如果可用）
if command -v docker &>/dev/null && docker info &>/dev/null; then
    echo "## Docker 环境信息"
    echo "Docker 版本: $(docker --version)"
    echo "Docker Compose 版本: $(docker-compose --version 2>/dev/null || echo 'Not installed')"
    echo
    
    echo "### Docker 容器状态"
    docker-compose -f docker-compose.production.yml ps 2>/dev/null || echo "Docker Compose 未运行"
    echo
    
    echo "### Docker 容器资源使用"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}" 2>/dev/null || echo "无运行中的容器"
    echo
    
    echo "### Docker 日志 (最近100行)"
    echo "#### 后端日志:"
    docker-compose -f docker-compose.production.yml logs --tail=100 backend 2>/dev/null || echo "后端容器日志不可用"
    echo
    echo "#### 前端日志:"
    docker-compose -f docker-compose.production.yml logs --tail=100 frontend 2>/dev/null || echo "前端容器日志不可用"
    echo
    echo "#### 数据库日志:"
    docker-compose -f docker-compose.production.yml logs --tail=100 postgres 2>/dev/null || echo "数据库容器日志不可用"
    echo
    echo "#### Nginx 日志:"
    docker-compose -f docker-compose.production.yml logs --tail=100 nginx 2>/dev/null || echo "Nginx容器日志不可用"
    echo
fi

# 传统部署信息
if command -v pm2 &>/dev/null; then
    echo "## PM2 进程信息"
    pm2 jlist 2>/dev/null || echo "PM2 未运行或无进程"
    echo
    
    echo "### PM2 日志 (最近100行)"
    pm2 logs --lines 100 --nostream 2>/dev/null || echo "PM2 日志不可用"
    echo
fi

# Nginx 状态
if command -v nginx &>/dev/null; then
    echo "## Nginx 状态"
    if systemctl is-active nginx &>/dev/null; then
        echo "Nginx 状态: 运行中"
        echo "配置测试: $(nginx -t 2>&1)"
    else
        echo "Nginx 状态: 未运行"
    fi
    echo
    
    # Nginx 日志
    if [ -f "/var/log/nginx/error.log" ]; then
        echo "### Nginx 错误日志 (最近50行):"
        tail -50 /var/log/nginx/error.log 2>/dev/null || echo "无法读取 Nginx 错误日志"
        echo
    fi
fi

# PostgreSQL 状态
echo "## 数据库状态"
if command -v psql &>/dev/null; then
    if [ "$DEPLOYMENT_TYPE" = "docker" ]; then
        if docker exec elevator-memo-postgres pg_isready -U elevator_user &>/dev/null; then
            echo "PostgreSQL 状态: 运行中 (Docker)"
            
            # 数据库连接信息
            DB_CONNECTIONS=$(docker exec elevator-memo-postgres psql -U elevator_user -d elevator_memo -t -c "SELECT count(*) FROM pg_stat_activity WHERE datname='elevator_memo';" 2>/dev/null | xargs)
            echo "当前连接数: $DB_CONNECTIONS"
            
            # 数据库大小
            DB_SIZE=$(docker exec elevator-memo-postgres psql -U elevator_user -d elevator_memo -t -c "SELECT pg_size_pretty(pg_database_size('elevator_memo'));" 2>/dev/null | xargs)
            echo "数据库大小: $DB_SIZE"
            
            # 表记录统计
            echo "### 数据表统计:"
            docker exec elevator-memo-postgres psql -U elevator_user -d elevator_memo -c "
            SELECT 
                schemaname,
                tablename,
                n_tup_ins as inserts,
                n_tup_upd as updates,
                n_tup_del as deletes,
                n_live_tup as live_tuples
            FROM pg_stat_user_tables 
            ORDER BY n_live_tup DESC;" 2>/dev/null || echo "无法获取表统计信息"
        else
            echo "PostgreSQL 状态: 连接失败 (Docker)"
        fi
    else
        if systemctl is-active postgresql* &>/dev/null; then
            echo "PostgreSQL 状态: 运行中 (系统服务)"
            if psql -U elevator_user -d elevator_memo -c "SELECT 1;" &>/dev/null; then
                echo "数据库连接: 正常"
            else
                echo "数据库连接: 失败"
            fi
        else
            echo "PostgreSQL 状态: 未运行"
        fi
    fi
else
    echo "PostgreSQL 客户端未安装"
fi
echo

# 系统资源
echo "## 系统资源使用"

# 内存
MEMORY_INFO=$(free -h | awk 'NR==2{printf "已用: %s/%s (%.1f%%)", $3, $2, $3*100/$2}')
echo "内存使用: $MEMORY_INFO"

# 磁盘
DISK_INFO=$(df -h / | awk 'NR==2{printf "已用: %s/%s (%s)", $3, $2, $5}')
echo "磁盘使用: $DISK_INFO"

# CPU 负载
LOAD_AVG=$(uptime | awk -F'load average:' '{print $2}')
echo "CPU 负载:$LOAD_AVG"

# CPU 核心数
CPU_CORES=$(nproc)
echo "CPU 核心: $CPU_CORES"

echo

# 网络端口检查
echo "## 网络端口状态"
PORTS=(80 3000 8080 5432)
for port in "${PORTS[@]}"; do
    if ss -tlnp | grep ":$port " &>/dev/null; then
        PROCESS=$(ss -tlnp | grep ":$port " | awk '{print $6}' | head -1)
        echo "端口 $port: 监听中 ($PROCESS)"
    else
        echo "端口 $port: 未监听"
    fi
done
echo

# 环境配置检查
echo "## 环境配置"
if [ -f ".env.production" ]; then
    echo "环境配置文件: 存在"
    
    # 检查关键配置（隐藏敏感信息）
    if grep -q "your_secure_database_password_here" .env.production; then
        check_warning "数据库密码" "使用默认值（安全风险）"
    else
        echo "✓ 数据库密码: 已自定义"
    fi
    
    if grep -q "your_very_secure_jwt_secret" .env.production; then
        check_warning "JWT密钥" "使用默认值（安全风险）"
    else
        echo "✓ JWT密钥: 已自定义"
    fi
else
    check_result "环境配置" 1 ".env.production 文件不存在"
fi
echo

# 最近错误日志
echo "## 最近错误日志"

if [ "$DEPLOYMENT_TYPE" = "docker" ]; then
    echo "### Docker 错误日志 (最近20行):"
    docker-compose -f docker-compose.production.yml logs --tail=20 2>&1 | grep -i "error\|failed\|exception" | tail -10 || echo "未发现明显错误"
else
    echo "### PM2 错误日志 (最近20行):"
    pm2 logs --err --lines 20 --nostream 2>/dev/null | tail -10 || echo "PM2 错误日志不可用"
    
    echo "### 系统错误日志 (最近10行):"
    tail -10 /var/log/syslog 2>/dev/null | grep -i "error\|failed" || echo "未发现系统错误"
fi

echo
echo "======================================"
echo "健康检查完成"
if [ $HEALTH_STATUS -eq 0 ]; then
    echo -e "${GREEN}整体状态: 健康${NC}"
else
    echo -e "${RED}整体状态: 发现问题${NC}"
fi
echo "======================================"

# 返回健康状态
exit $HEALTH_STATUS