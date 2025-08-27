const User = require('../models/User');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const JWT_SECRET = process.env.JWT_SECRET || 'elevator-memo-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

class UserController {
  static async register(req, res) {
    try {
      const { username, password, phone, full_name, role } = req.body;
      
      if (!username || !password || !full_name) {
        return res.status(400).json({ 
          error: '用户名、密码和真实姓名为必填项' 
        });
      }

      if (role && !['admin', 'user'].includes(role)) {
        return res.status(400).json({ 
          error: '角色只能是admin或user' 
        });
      }

      const existingUser = await User.findByUsername(username);
      if (existingUser) {
        return res.status(409).json({ 
          error: '用户名已存在' 
        });
      }

      const newUser = await User.create({ username, password, phone, full_name, role });
      
      res.status(201).json({
        message: '用户注册成功',
        user: newUser
      });
    } catch (error) {
      console.error('用户注册失败:', error);
      res.status(500).json({ 
        error: '用户注册失败', 
        message: error.message 
      });
    }
  }

  static async login(req, res) {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ 
          error: '用户名和密码为必填项' 
        });
      }

      const user = await User.findByUsername(username);
      if (!user) {
        return res.status(401).json({ 
          error: '用户名或密码错误' 
        });
      }

      const isValidPassword = await User.validatePassword(password, user.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({ 
          error: '用户名或密码错误' 
        });
      }

      const token = jwt.sign(
        { 
          userId: user.id, 
          username: user.username, 
          role: user.role 
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      const { password_hash, ...userWithoutPassword } = user;

      res.status(200).json({
        message: '登录成功',
        token,
        user: userWithoutPassword
      });
    } catch (error) {
      console.error('用户登录失败:', error);
      res.status(500).json({ 
        error: '用户登录失败', 
        message: error.message 
      });
    }
  }

  static async getCurrentUser(req, res) {
    try {
      const user = await User.findById(req.user.userId);
      
      if (!user) {
        return res.status(404).json({ error: '用户不存在' });
      }

      res.status(200).json({ user });
    } catch (error) {
      console.error('获取当前用户信息失败:', error);
      res.status(500).json({ 
        error: '获取用户信息失败', 
        message: error.message 
      });
    }
  }

  static async updateProfile(req, res) {
    try {
      const { full_name, phone } = req.body;
      const userId = req.user.userId;
      
      if (!full_name) {
        return res.status(400).json({ 
          error: '真实姓名为必填项' 
        });
      }

      // 检查手机号是否已被其他用户使用（如果提供了手机号）
      if (phone) {
        const existingUser = await User.findByPhone(phone);
        if (existingUser && existingUser.id !== userId) {
          return res.status(409).json({ 
            error: '手机号已被其他用户使用' 
          });
        }
      }

      const updatedUser = await User.updateProfile(userId, { full_name, phone });
      
      if (!updatedUser) {
        return res.status(404).json({ error: '用户不存在' });
      }

      res.status(200).json({
        message: '个人信息更新成功',
        user: updatedUser
      });
    } catch (error) {
      console.error('更新个人信息失败:', error);
      res.status(500).json({ 
        error: '更新个人信息失败', 
        message: error.message 
      });
    }
  }

  static async getAllUsers(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const search = req.query.search || '';
      const full_name = req.query.full_name || '';

      const result = await User.findAll(page, limit, search, full_name);
      res.status(200).json(result);
    } catch (error) {
      console.error('获取用户列表失败:', error);
      res.status(500).json({ 
        error: '获取用户列表失败', 
        message: error.message 
      });
    }
  }

  static async updateUserRole(req, res) {
    try {
      const { id } = req.params;
      const { role } = req.body;

      if (!['admin', 'user'].includes(role)) {
        return res.status(400).json({ 
          error: '角色只能是admin或user' 
        });
      }

      const updatedUser = await User.updateRole(id, role);
      
      if (!updatedUser) {
        return res.status(404).json({ error: '用户不存在' });
      }

      res.status(200).json({
        message: '用户角色更新成功',
        user: updatedUser
      });
    } catch (error) {
      console.error('更新用户角色失败:', error);
      res.status(500).json({ 
        error: '更新用户角色失败', 
        message: error.message 
      });
    }
  }

  // 管理员更新用户完整信息
  static async updateUser(req, res) {
    try {
      const { id } = req.params;
      const { phone, full_name, role } = req.body;

      if (parseInt(id) === req.user.userId) {
        return res.status(400).json({ 
          error: '不能修改自己的账户信息，请使用个人资料功能' 
        });
      }

      // 验证角色
      if (role && !['admin', 'user'].includes(role)) {
        return res.status(400).json({ 
          error: '角色只能是admin或user' 
        });
      }

      // 验证目标用户是否存在
      const targetUser = await User.findById(id);
      if (!targetUser) {
        return res.status(404).json({ error: '用户不存在' });
      }

      // 更新用户信息
      const updatedUser = await User.updateUser(id, {
        phone,
        full_name,
        role
      });

      if (!updatedUser) {
        return res.status(404).json({ error: '用户不存在' });
      }

      res.status(200).json({
        message: '用户信息更新成功',
        user: updatedUser
      });
    } catch (error) {
      console.error('更新用户信息失败:', error);
      res.status(500).json({ 
        error: '更新用户信息失败', 
        message: error.message 
      });
    }
  }

  static async deactivateUser(req, res) {
    try {
      const { id } = req.params;

      if (parseInt(id) === req.user.userId) {
        return res.status(400).json({ 
          error: '不能停用自己的账户' 
        });
      }

      const deactivatedUser = await User.deactivate(id);
      
      if (!deactivatedUser) {
        return res.status(404).json({ error: '用户不存在' });
      }

      res.status(200).json({
        message: '用户已停用',
        user: deactivatedUser
      });
    } catch (error) {
      console.error('停用用户失败:', error);
      res.status(500).json({ 
        error: '停用用户失败', 
        message: error.message 
      });
    }
  }

  static async uploadSignature(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: '请上传签名文件' });
      }

      const userId = req.user.userId;
      const filename = req.file.filename;
      const file_path = req.file.path.replace(/\\/g, '/').replace(/^.*\/uploads/, '/uploads');
      const is_default = req.body.is_default === 'true';

      const signature = await User.addSignature(userId, {
        filename,
        file_path,
        is_default
      });

      res.status(201).json({
        message: '签名上传成功',
        signature
      });
    } catch (error) {
      console.error('上传签名失败:', error);
      if (req.file) {
        fs.unlink(req.file.path, () => {});
      }
      res.status(500).json({ 
        error: '上传签名失败', 
        message: error.message 
      });
    }
  }

  static async getUserSignatures(req, res) {
    try {
      const userId = req.user.userId;
      console.log('获取用户签名请求，用户ID:', userId);
      
      const signatures = await User.getSignatures(userId);
      console.log('找到的签名:', signatures);
      
      res.status(200).json({ signatures });
    } catch (error) {
      console.error('获取用户签名失败:', error);
      res.status(500).json({ 
        error: '获取用户签名失败', 
        message: error.message 
      });
    }
  }

  static async deleteSignature(req, res) {
    try {
      const { signatureId } = req.params;
      const userId = req.user.userId;

      const deletedSignature = await User.deleteSignature(signatureId, userId);
      
      if (!deletedSignature) {
        return res.status(404).json({ error: '签名文件不存在或无权删除' });
      }

      const filePath = path.join(__dirname, '..', deletedSignature.file_path);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      res.status(200).json({
        message: '签名删除成功',
        signature: deletedSignature
      });
    } catch (error) {
      console.error('删除签名失败:', error);
      res.status(500).json({ 
        error: '删除签名失败', 
        message: error.message 
      });
    }
  }

  // 管理员为特定用户上传签名
  static async uploadUserSignature(req, res) {
    try {
      console.log('收到签名上传请求，用户ID:', req.params.id);
      console.log('上传的文件:', req.file ? req.file.filename : '无文件');

      if (!req.file) {
        return res.status(400).json({ error: '请上传签名文件' });
      }

      const { id: userId } = req.params;
      const filename = req.file.filename;
      const file_path = req.file.path.replace(/\\/g, '/').replace(/^.*\/uploads/, '/uploads');
      const is_default = req.body.is_default === 'true';

      console.log('处理签名上传:', { userId, filename, file_path, is_default });

      // 验证目标用户是否存在
      const targetUser = await User.findById(userId);
      if (!targetUser) {
        console.log('目标用户不存在:', userId);
        if (req.file) {
          fs.unlink(req.file.path, () => {});
        }
        return res.status(404).json({ error: '目标用户不存在' });
      }

      const signature = await User.addSignature(userId, {
        filename,
        file_path,
        is_default
      });

      console.log('签名保存成功:', signature);

      res.status(201).json({
        message: '签名上传成功',
        signature
      });
    } catch (error) {
      console.error('为用户上传签名失败:', error);
      if (req.file) {
        fs.unlink(req.file.path, () => {});
      }
      res.status(500).json({ 
        error: '为用户上传签名失败', 
        message: error.message 
      });
    }
  }

  // 管理员获取特定用户的签名列表
  static async getUserSignaturesList(req, res) {
    try {
      const { id: userId } = req.params;
      
      // 验证目标用户是否存在
      const targetUser = await User.findById(userId);
      if (!targetUser) {
        return res.status(404).json({ error: '目标用户不存在' });
      }

      const signatures = await User.getSignatures(userId);
      
      res.status(200).json({ signatures });
    } catch (error) {
      console.error('获取用户签名失败:', error);
      res.status(500).json({ 
        error: '获取用户签名失败', 
        message: error.message 
      });
    }
  }
}

module.exports = UserController;