const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'elevator-memo-secret-key';

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: '访问令牌缺失' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    const user = await User.findById(decoded.userId);
    if (!user || !user.is_active) {
      return res.status(401).json({ error: '用户不存在或已被禁用' });
    }

    req.user = decoded;
    next();
  } catch (error) {
    console.error('Token验证失败:', error);
    return res.status(403).json({ error: '访问令牌无效' });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: '需要管理员权限' });
  }
  next();
};

const requireOwnerOrAdmin = (req, res, next) => {
  const resourceUserId = parseInt(req.params.userId) || parseInt(req.params.id);
  
  if (req.user.role === 'admin' || req.user.userId === resourceUserId) {
    return next();
  }
  
  return res.status(403).json({ error: '无权访问此资源' });
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireOwnerOrAdmin
};