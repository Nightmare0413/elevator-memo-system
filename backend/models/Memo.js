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
      recommendations,
      tester_signature_path,
      representative_signature,
      inspection_date,
      signing_date,
      created_by
    } = memoData;

    const query = `
      INSERT INTO memos (
        memo_number, user_unit_name, installation_location, equipment_type,
        product_number, registration_cert_no, non_conformance_status, recommendations,
        tester_signature_path, representative_signature, inspection_date, signing_date, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;

    const values = [
      memo_number, user_unit_name, installation_location, equipment_type,
      product_number, registration_cert_no, non_conformance_status, recommendations,
      tester_signature_path, representative_signature, inspection_date, signing_date, created_by
    ];

    try {
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // 获取所有备忘录（支持分页和搜索）- 针对10万数据优化
  static async findAll(page = 1, limit = 10, filters = {}, userId = null, userRole = null) {
    let whereConditions = ['1=1'];
    let queryParams = [];
    let paramIndex = 1;
    
    // 限制单页最大数据量，防止大数据量查询
    const maxLimit = 100;
    limit = Math.min(limit, maxLimit);
    
    const { search, date, memo_number, user_unit_name, registration_cert_no, user_full_name } = filters;

    // 用户权限过滤条件（优先级最高，利用索引）
    if (userId && userRole === 'user') {
      whereConditions.push(`m.created_by = $${paramIndex}`);
      queryParams.push(userId);
      paramIndex++;
    }

    // 备忘录编号筛选（精确匹配优先，利用主要索引）
    if (memo_number) {
      if (memo_number.length > 5) {
        // 如果输入较长，使用精确匹配或前缀匹配（更高效）
        whereConditions.push(`m.memo_number ILIKE $${paramIndex}`);
        queryParams.push(`${memo_number}%`);
      } else {
        // 短输入使用模糊匹配
        whereConditions.push(`m.memo_number ILIKE $${paramIndex}`);
        queryParams.push(`%${memo_number}%`);
      }
      paramIndex++;
    }

    // 使用单位名称筛选（利用索引）
    if (user_unit_name) {
      whereConditions.push(`m.user_unit_name ILIKE $${paramIndex}`);
      queryParams.push(`%${user_unit_name}%`);
      paramIndex++;
    }

    // 使用登记证号筛选（利用索引）
    if (registration_cert_no) {
      whereConditions.push(`m.registration_cert_no ILIKE $${paramIndex}`);
      queryParams.push(`%${registration_cert_no}%`);
      paramIndex++;
    }

    // 检测日期筛选（精确匹配，利用索引）
    if (date) {
      whereConditions.push(`m.inspection_date = $${paramIndex}`);
      queryParams.push(date);
      paramIndex++;
    }

    // 用户真实姓名筛选（通过JOIN查询用户表）
    if (user_full_name) {
      whereConditions.push(`u.full_name ILIKE $${paramIndex}`);
      queryParams.push(`%${user_full_name}%`);
      paramIndex++;
    }

    // 通用搜索条件（最后执行，避免全表扫描）
    if (search && !memo_number && !user_unit_name && !registration_cert_no && !user_full_name) {
      whereConditions.push(`(m.user_unit_name ILIKE $${paramIndex} OR m.memo_number ILIKE $${paramIndex} OR m.registration_cert_no ILIKE $${paramIndex})`);
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    const whereClause = whereConditions.join(' AND ');

    let query = `
      SELECT m.*, u.username as created_by_username, u.full_name as created_by_name
      FROM memos m
      LEFT JOIN users u ON m.created_by = u.id
      WHERE ${whereClause}
      ORDER BY m.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    const offset = (page - 1) * limit;
    queryParams.push(limit, offset);

    try {
      const result = await pool.query(query, queryParams);
      
      // 优化总数查询 - 对于大数据量，使用估算或缓存
      let total;
      const countParams = queryParams.slice(0, -2); // 移除limit和offset参数
      
      // 如果没有复杂筛选条件，使用快速估算
      if (whereConditions.length <= 2) { // 只有基础条件
        // 对于无筛选或只有用户筛选的情况，使用表统计信息快速估算
        const estimateQuery = `
          SELECT reltuples::bigint AS estimate
          FROM pg_class
          WHERE relname = 'memos'
        `;
        const estimateResult = await pool.query(estimateQuery);
        total = parseInt(estimateResult.rows[0]?.estimate || 0);
        
        // 如果有用户筛选，按比例估算
        if (userId && userRole === 'user') {
          total = Math.floor(total / 10); // 假设每个用户平均创建1/10的数据
        }
      } else {
        // 有复杂筛选条件时，仍使用精确COUNT，但优化查询
        const countQuery = `
          SELECT COUNT(*) FROM memos m
          LEFT JOIN users u ON m.created_by = u.id
          WHERE ${whereClause}
        `;
        const countResult = await pool.query(countQuery, countParams);
        total = parseInt(countResult.rows[0].count);
      }

      return {
        memos: result.rows,
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
  static async findById(id, userId = null, userRole = null) {
    let query = `
      SELECT m.*, u.username as created_by_username, u.full_name as created_by_name
      FROM memos m
      LEFT JOIN users u ON m.created_by = u.id
      WHERE m.id = $1
    `;
    
    // 普通用户只能查看自己创建的备忘录
    if (userId && userRole === 'user') {
      query += ' AND m.created_by = $2';
      
      try {
        const result = await pool.query(query, [id, userId]);
        return result.rows[0];
      } catch (error) {
        throw error;
      }
    } else {
      try {
        const result = await pool.query(query, [id]);
        return result.rows[0];
      } catch (error) {
        throw error;
      }
    }
  }

  // 复制备忘录
  static async copy(id, userId = null, userRole = null) {
    const originalMemo = await this.findById(id, userId, userRole);
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
  static async delete(id, userId = null, userRole = null) {
    let query = 'DELETE FROM memos WHERE id = $1';
    let params = [id];
    
    // 普通用户只能删除自己创建的备忘录
    if (userId && userRole === 'user') {
      query += ' AND created_by = $2';
      params.push(userId);
    }
    
    query += ' RETURNING *';
    
    try {
      const result = await pool.query(query, params);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // 更新签字信息
  static async updateSignature(id, signatureData) {
    const { representative_signature, signing_date } = signatureData;
    
    const query = `
      UPDATE memos 
      SET representative_signature = $1, signing_date = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `;
    
    try {
      const result = await pool.query(query, [representative_signature, signing_date, id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // 生成备忘录编号（新格式：03TCC0120241253）
  static generateMemoNumber() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    
    // 生成四位随机数
    const randomNum = Math.floor(Math.random() * 9000) + 1000; // 1000-9999
    
    // 格式：03TCC + 月份 + 年份 + 四位随机数
    return `03TCC${month}${year}${randomNum}`;
  }
}

module.exports = Memo;