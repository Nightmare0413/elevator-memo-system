-- 创建数据库 (如果不存在)
-- CREATE DATABASE elevator_memo;

-- 使用数据库
-- \c elevator_memo;

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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 创建触发器，自动更新 updated_at 字段
DROP TRIGGER IF EXISTS update_memos_updated_at ON memos;
CREATE TRIGGER update_memos_updated_at
    BEFORE UPDATE ON memos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_memos_memo_number ON memos(memo_number);
CREATE INDEX IF NOT EXISTS idx_memos_user_unit_name ON memos(user_unit_name);
CREATE INDEX IF NOT EXISTS idx_memos_created_at ON memos(created_at);
CREATE INDEX IF NOT EXISTS idx_memos_inspection_date ON memos(inspection_date);

-- 插入测试数据 (可选)
INSERT INTO memos (
    memo_number, 
    user_unit_name, 
    installation_location, 
    equipment_type, 
    product_number, 
    registration_cert_no, 
    non_conformance_status, 
    inspection_date
) VALUES 
(
    'MEMO-20241220-001', 
    '测试大厦物业管理有限公司', 
    '测试大厦1号电梯', 
    '客梯', 
    'TEST-001', 
    'REG-TEST-001', 
    0, 
    CURRENT_DATE
),
(
    'MEMO-20241220-002', 
    '示例办公楼业主委员会', 
    '示例办公楼B座货梯', 
    '货梯', 
    'DEMO-002', 
    'REG-DEMO-002', 
    1, 
    CURRENT_DATE - INTERVAL '1 day'
)
ON CONFLICT (memo_number) DO NOTHING;

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
COMMENT ON COLUMN memos.created_at IS '记录创建时间';
COMMENT ON COLUMN memos.updated_at IS '记录更新时间';