const pool = require('../config/database');

class Memo {
  // 创建备忘录
  static async create(memoData) {
    const {
      memo_number,
      user_unit_name,
      installation_location,
      equipment_type,
      product_number,
      registration_cert_no,
      non_conformance_status,
      tester_signature_path,
      representative_signature,
      inspection_date,
      signing_date
    } = memoData;

    const query = `
      INSERT INTO memos (
        memo_number, user_unit_name, installation_location, equipment_type,
        product_number, registration_cert_no, non_conformance_status,
        tester_signature_path, representative_signature, inspection_date, signing_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;

    const values = [
      memo_number, user_unit_name, installation_location, equipment_type,
      product_number, registration_cert_no, non_conformance_status,
      tester_signature_path, representative_signature, inspection_date, signing_date
    ];

    try {
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // 获取所有备忘录（支持分页和搜索）
  static async findAll(page = 1, limit = 10, search = '') {
    const query = `
      SELECT *, COUNT(*) OVER() AS total_count
      FROM memos
      WHERE ($3 = '' OR user_unit_name ILIKE $3 OR memo_number ILIKE $3)
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `;

    const offset = (page - 1) * limit;
    const searchPattern = `%${search}%`;

    try {
      const result = await pool.query(query, [limit, offset, searchPattern]);
      const total = result.rows.length ? parseInt(result.rows[0].total_count) : 0;
      const memos = result.rows.map(({ total_count, ...memo }) => memo);

      return {
        memos,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw error;
    }
  }

  // 根据ID获取单个备忘录
  static async findById(id) {
    const query = 'SELECT * FROM memos WHERE id = $1';
    
    try {
      const result = await pool.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // 复制备忘录
  static async copy(id) {
    const originalMemo = await this.findById(id);
    if (!originalMemo) {
      throw new Error('原始备忘录不存在');
    }

    // 生成新的备忘录编号
    const newMemoNumber = `${originalMemo.memo_number}_COPY_${Date.now()}`;
    
    const newMemoData = {
      ...originalMemo,
      memo_number: newMemoNumber,
      inspection_date: new Date().toISOString().split('T')[0], // 重置为当前日期
      signing_date: null, // 清空签收日期
      representative_signature: null, // 清空使用单位代表签名
    };

    // 移除id字段，因为会自动生成
    delete newMemoData.id;
    delete newMemoData.created_at;
    delete newMemoData.updated_at;

    return await this.create(newMemoData);
  }

  // 删除备忘录
  static async delete(id) {
    const query = 'DELETE FROM memos WHERE id = $1 RETURNING *';
    
    try {
      const result = await pool.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // 生成备忘录编号
  static generateMemoNumber() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const timestamp = now.getTime();
    
    return `MEMO-${year}${month}${day}-${timestamp}`;
  }
}

module.exports = Memo;