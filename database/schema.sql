-- 电梯自行检测备忘录系统 - 数据库完整架构
-- 包含所有表结构、索引、触发器和测试数据

-- ============================================================================
-- 1. 核心表结构
-- ============================================================================

-- 创建备忘录表
CREATE TABLE IF NOT EXISTS memos (
    id SERIAL PRIMARY KEY,
    memo_number VARCHAR(255) UNIQUE NOT NULL,
    user_unit_name VARCHAR(255) NOT NULL,
    installation_location TEXT,
    equipment_type VARCHAR(255),
    product_number VARCHAR(255),
    registration_cert_no VARCHAR(255),
    non_conformance_status INTEGER NOT NULL DEFAULT 0 CHECK (non_conformance_status IN (0, 1, 2)),
    tester_signature_path TEXT,
    representative_signature TEXT,
    inspection_date DATE NOT NULL,
    signing_date DATE,
    recommendations TEXT,
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建用户表
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建用户签名文件表
CREATE TABLE IF NOT EXISTS user_signatures (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 添加外键关系
ALTER TABLE memos ADD CONSTRAINT fk_memos_created_by 
    FOREIGN KEY (created_by) REFERENCES users(id);

-- ============================================================================
-- 2. 触发器函数
-- ============================================================================

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为所有表创建更新时间触发器
DROP TRIGGER IF EXISTS update_memos_updated_at ON memos;
CREATE TRIGGER update_memos_updated_at
    BEFORE UPDATE ON memos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_signatures_updated_at ON user_signatures;
CREATE TRIGGER update_user_signatures_updated_at
    BEFORE UPDATE ON user_signatures
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 3. 性能优化索引 (针对10万份备忘录优化)
-- ============================================================================

-- 备忘录表索引
CREATE INDEX IF NOT EXISTS idx_memos_memo_number ON memos(memo_number);
CREATE INDEX IF NOT EXISTS idx_memos_user_unit_name ON memos(user_unit_name);
CREATE INDEX IF NOT EXISTS idx_memos_registration_cert_no ON memos(registration_cert_no);
CREATE INDEX IF NOT EXISTS idx_memos_inspection_date ON memos(inspection_date);
CREATE INDEX IF NOT EXISTS idx_memos_created_by ON memos(created_by);
CREATE INDEX IF NOT EXISTS idx_memos_created_at ON memos(created_at DESC);

-- 组合索引优化常见查询
CREATE INDEX IF NOT EXISTS idx_memos_created_by_created_at ON memos(created_by, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_memos_unit_date ON memos(user_unit_name, inspection_date);

-- 用户表索引
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 签名表索引
CREATE INDEX IF NOT EXISTS idx_user_signatures_user_id ON user_signatures(user_id);
CREATE INDEX IF NOT EXISTS idx_user_signatures_is_default ON user_signatures(user_id, is_default);

-- ============================================================================
-- 4. 初始数据
-- ============================================================================

-- 插入默认管理员用户（密码：admin123）
INSERT INTO users (username, password_hash, email, full_name, role) VALUES 
('admin', '$2b$10$rQm7gUgOQjKQKWQQqfY3xOzMgEzb.CUlKP0ZYI.4kLGX6z8KbNzG6', 'admin@example.com', '系统管理员', 'admin')
ON CONFLICT (username) DO NOTHING;

-- 插入示例备忘录数据
INSERT INTO memos (
    memo_number, 
    user_unit_name, 
    installation_location, 
    equipment_type, 
    product_number, 
    registration_cert_no, 
    non_conformance_status, 
    inspection_date,
    recommendations,
    created_by
) VALUES 
(
    'MEMO-20241220-001', 
    '测试大厦物业管理有限公司', 
    '测试大厦1号电梯', 
    '客梯', 
    'TEST-001', 
    'REG-TEST-001', 
    0, 
    CURRENT_DATE,
    '电梯运行正常，建议定期维护保养',
    (SELECT id FROM users WHERE username = 'admin')
),
(
    'MEMO-20241220-002', 
    '示例办公楼业主委员会', 
    '示例办公楼B座货梯', 
    '货梯', 
    'DEMO-002', 
    'REG-DEMO-002', 
    1, 
    CURRENT_DATE - INTERVAL '1 day',
    '发现轻微异响，建议检查导轨润滑情况',
    (SELECT id FROM users WHERE username = 'admin')
)
ON CONFLICT (memo_number) DO NOTHING;

-- ============================================================================
-- 5. 更新表统计信息
-- ============================================================================

ANALYZE memos;
ANALYZE users;
ANALYZE user_signatures;

-- ============================================================================
-- 6. 表和字段注释
-- ============================================================================

-- 备忘录表注释
COMMENT ON TABLE memos IS '电梯自行检测备忘录表';
COMMENT ON COLUMN memos.id IS '备忘录唯一ID，自增';
COMMENT ON COLUMN memos.memo_number IS '备忘录编号，唯一';
COMMENT ON COLUMN memos.user_unit_name IS '使用单位名称';
COMMENT ON COLUMN memos.installation_location IS '安装地点';
COMMENT ON COLUMN memos.equipment_type IS '设备品种';
COMMENT ON COLUMN memos.product_number IS '产品编号';
COMMENT ON COLUMN memos.registration_cert_no IS '使用登记证编号';
COMMENT ON COLUMN memos.non_conformance_status IS '不符合情况 (0: 无, 1: 存在不符合, 2: 存在较严重不符合)';
COMMENT ON COLUMN memos.tester_signature_path IS '检测人员签名图片存储路径';
COMMENT ON COLUMN memos.representative_signature IS '使用单位代表签名 (Base64格式)';
COMMENT ON COLUMN memos.inspection_date IS '检测日期';
COMMENT ON COLUMN memos.signing_date IS '签收日期';
COMMENT ON COLUMN memos.recommendations IS '相关建议和整改要求';
COMMENT ON COLUMN memos.created_by IS '备忘录创建者用户ID';
COMMENT ON COLUMN memos.created_at IS '记录创建时间';
COMMENT ON COLUMN memos.updated_at IS '记录更新时间';

-- 用户表注释
COMMENT ON TABLE users IS '系统用户表';
COMMENT ON COLUMN users.id IS '用户唯一ID';
COMMENT ON COLUMN users.username IS '用户名';
COMMENT ON COLUMN users.password_hash IS '密码哈希值';
COMMENT ON COLUMN users.email IS '邮箱（可选）';
COMMENT ON COLUMN users.phone IS '手机号（可选）';
COMMENT ON COLUMN users.full_name IS '真实姓名';
COMMENT ON COLUMN users.role IS '用户角色：admin-管理员，user-普通用户';
COMMENT ON COLUMN users.is_active IS '是否启用';

-- 签名表注释
COMMENT ON TABLE user_signatures IS '用户签名文件表';
COMMENT ON COLUMN user_signatures.id IS '签名文件唯一ID';
COMMENT ON COLUMN user_signatures.user_id IS '所属用户ID';
COMMENT ON COLUMN user_signatures.filename IS '文件名';
COMMENT ON COLUMN user_signatures.file_path IS '文件路径';
COMMENT ON COLUMN user_signatures.is_default IS '是否为默认签名';