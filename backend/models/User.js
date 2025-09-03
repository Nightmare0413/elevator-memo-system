const pool = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  static async create(userData) {
    const { username, password, phone, full_name, role = 'user' } = userData;
    
    const passwordHash = await bcrypt.hash(password, 10);
    
    const query = `
      INSERT INTO users (username, password_hash, phone, full_name, role)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, username, phone, full_name, role, is_active, created_at
    `;
    
    const values = [username, passwordHash, phone, full_name, role];
    
    try {
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  static async findByUsername(username) {
    const query = 'SELECT * FROM users WHERE username = $1 AND is_active = true';
    
    try {
      const result = await pool.query(query, [username]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  static async findByPhone(phone) {
    if (!phone) return null;
    const query = 'SELECT * FROM users WHERE phone = $1 AND is_active = true';
    
    try {
      const result = await pool.query(query, [phone]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  static async findById(id) {
    const query = 'SELECT id, username, phone, full_name, role, is_active, created_at FROM users WHERE id = $1';
    
    try {
      const result = await pool.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  static async findAll(page = 1, limit = 10, search = '', full_name = '') {
    let whereConditions = ['is_active = true'];
    let queryParams = [];
    let paramIndex = 1;

    if (search) {
      whereConditions.push(`(username ILIKE $${paramIndex} OR full_name ILIKE $${paramIndex} OR phone ILIKE $${paramIndex})`);
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    if (full_name) {
      whereConditions.push(`full_name ILIKE $${paramIndex}`);
      queryParams.push(`%${full_name}%`);
      paramIndex++;
    }

    const whereClause = whereConditions.join(' AND ');
    
    const query = `
      SELECT id, username, phone, full_name, role, is_active, created_at
      FROM users
      WHERE ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    const offset = (page - 1) * limit;
    queryParams.push(limit, offset);

    try {
      const result = await pool.query(query, queryParams);
      
      const countQuery = `SELECT COUNT(*) FROM users WHERE ${whereClause}`;
      const countParams = queryParams.slice(0, -2);
      const countResult = await pool.query(countQuery, countParams);
      const total = parseInt(countResult.rows[0].count);

      return {
        users: result.rows,
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

  static async validatePassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  static async updateRole(id, role) {
    const query = `
      UPDATE users 
      SET role = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, username, phone, full_name, role, is_active, created_at
    `;
    
    try {
      const result = await pool.query(query, [role, id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  static async updateUser(id, userData) {
    const { phone, full_name, role } = userData;
    const query = `
      UPDATE users 
      SET phone = $1, full_name = $2, role = $3, updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING id, username, phone, full_name, role, is_active, created_at
    `;
    
    try {
      const result = await pool.query(query, [phone, full_name, role, id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  static async updateProfile(id, profileData) {
    const { full_name, phone } = profileData;
    const query = `
      UPDATE users 
      SET full_name = $1, phone = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING id, username, phone, full_name, role, is_active, created_at
    `;
    
    try {
      const result = await pool.query(query, [full_name, phone, id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  static async deactivate(id) {
    const query = `
      UPDATE users 
      SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id, username, phone, full_name, role, is_active, created_at
    `;
    
    try {
      const result = await pool.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  static async addSignature(userId, signatureData) {
    const { filename, file_path, is_default = false } = signatureData;
    
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      if (is_default) {
        await client.query(
          'UPDATE user_signatures SET is_default = false WHERE user_id = $1',
          [userId]
        );
      }
      
      const query = `
        INSERT INTO user_signatures (user_id, filename, file_path, is_default)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `;
      
      const result = await client.query(query, [userId, filename, file_path, is_default]);
      
      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async getSignatures(userId) {
    const query = `
      SELECT * FROM user_signatures 
      WHERE user_id = $1 
      ORDER BY is_default DESC, created_at DESC
    `;
    
    try {
      const result = await pool.query(query, [userId]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  static async getDefaultSignature(userId) {
    const query = `
      SELECT * FROM user_signatures 
      WHERE user_id = $1 AND is_default = true
      LIMIT 1
    `;
    
    try {
      const result = await pool.query(query, [userId]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  static async deleteSignature(signatureId, userId) {
    const query = `
      DELETE FROM user_signatures 
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `;
    
    try {
      const result = await pool.query(query, [signatureId, userId]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }
}

module.exports = User;