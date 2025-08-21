# 数据库设置说明

## PostgreSQL 安装和配置

### 1. 安装 PostgreSQL
- 下载并安装 PostgreSQL 12+ 版本
- Windows: 从 https://www.postgresql.org/download/windows/ 下载
- 安装过程中记住设置的密码（通常是 postgres 用户的密码）

### 2. 创建数据库
使用 pgAdmin 或命令行工具创建数据库：

```sql
CREATE DATABASE elevator_memo;
```

### 3. 执行初始化脚本
在 PostgreSQL 中执行 `init.sql` 文件：

**方法1：使用 psql 命令行**
```bash
psql -U postgres -d elevator_memo -f init.sql
```

**方法2：使用 pgAdmin**
1. 连接到 elevator_memo 数据库
2. 打开查询工具
3. 复制 init.sql 内容并执行

### 4. 配置后端连接
在后端项目根目录创建 `.env` 文件：
```
DB_USER=postgres
DB_HOST=localhost
DB_NAME=elevator_memo
DB_PASSWORD=你的密码
DB_PORT=5432
```

### 6. 搜索性能优化
初始化脚本会自动启用 `pg_trgm` 扩展并创建基于 GIN 的三元组索引，
以提升按单位名称和备忘录编号进行模糊查询时的性能。如果数据库
未启用该扩展，可手动执行：

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

### 5. 验证数据库连接
启动后端服务后，如果看到 "Connected to PostgreSQL database" 消息，说明连接成功。

## 数据库表结构说明

### memos 表字段
| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | SERIAL | PRIMARY KEY | 自增主键 |
| memo_number | VARCHAR(255) | UNIQUE | 备忘录编号 |
| user_unit_name | VARCHAR(255) | NOT NULL | 使用单位名称 |
| installation_location | TEXT | | 安装地点 |
| equipment_type | VARCHAR(255) | | 设备品种 |
| product_number | VARCHAR(255) | | 产品编号 |
| registration_cert_no | VARCHAR(255) | | 使用登记证编号 |
| non_conformance_status | INTEGER | NOT NULL | 不符合情况 (0:无, 1:存在不符合, 2:存在较严重不符合) |
| tester_signature_path | TEXT | | 检测人员签名图片路径 |
| representative_signature | TEXT | | 使用单位代表签名 (Base64) |
| inspection_date | DATE | NOT NULL | 检测日期 |
| signing_date | DATE | | 签收日期 |
| created_at | TIMESTAMP | DEFAULT NOW() | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT NOW() | 更新时间 |

### 索引
- idx_memos_created_at: 创建时间索引
- idx_memos_inspection_date: 检测日期索引
- idx_memos_memo_number_trgm: 备忘录编号三元组索引
- idx_memos_user_unit_name_trgm: 使用单位名称三元组索引

### 触发器
- update_memos_updated_at: 自动更新 updated_at 字段

## 测试数据
初始化脚本会自动插入2条测试数据，用于验证系统功能。