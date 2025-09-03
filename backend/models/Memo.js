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
    console.log('Memo.findAll权限检查:', { userId, userRole });
    if (userId && userRole === 'user') {
      console.log('应用用户权限过滤，只显示用户自己的记录');
      whereConditions.push(`m.created_by = $${paramIndex}`);
      queryParams.push(userId);
      paramIndex++;
    } else {
      console.log('管理员用户或无userId，显示所有记录');
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
      
      // 精确计算总数 - 确保数据准确性
      const countParams = queryParams.slice(0, -2); // 移除limit和offset参数
      const countQuery = `
        SELECT COUNT(*) FROM memos m
        LEFT JOIN users u ON m.created_by = u.id
        WHERE ${whereClause}
      `;
      const countResult = await pool.query(countQuery, countParams);
      const total = parseInt(countResult.rows[0].count);
      
      console.log('Memo.findAll查询结果:', {
        memosCount: result.rows.length,
        total,
        filters,
        userId,
        userRole
      });

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

  // 更新备忘录
  static async update(id, updateData, userId = null, userRole = null) {
    const allowedFields = [
      'user_unit_name', 'installation_location', 'equipment_type', 
      'product_number', 'registration_cert_no', 'inspection_date',
      'non_conformance_status', 'recommendations'
    ];

    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;

    // 构建更新字段
    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key)) {
        updateFields.push(`${key} = $${paramIndex}`);
        updateValues.push(value);
        paramIndex++;
      }
    }

    if (updateFields.length === 0) {
      throw new Error('没有有效的更新字段');
    }

    updateFields.push(`updated_at = $${paramIndex}`);
    updateValues.push(new Date().toISOString());
    paramIndex++;

    let query = `UPDATE memos SET ${updateFields.join(', ')} WHERE id = $${paramIndex}`;
    updateValues.push(id);
    
    // 普通用户只能更新自己创建的备忘录
    if (userId && userRole === 'user') {
      query += ` AND created_by = $${paramIndex + 1}`;
      updateValues.push(userId);
    }
    
    query += ' RETURNING *';

    try {
      const result = await pool.query(query, updateValues);
      if (result.rows.length === 0) {
        throw new Error('备忘录不存在或无权限更新');
      }
      return result.rows[0];
    } catch (error) {
      console.error('更新备忘录失败:', error);
      throw new Error('更新备忘录失败');
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