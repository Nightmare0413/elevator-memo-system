const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');

// 配置multer存储
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/signatures');
    
    // 确保目录存在
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // 生成唯一文件名，包含用户ID
    const userId = req.user?.userId || 'anonymous';
    const uniqueName = `signature-${userId}-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// 文件过滤器
const fileFilter = (req, file, cb) => {
  // 只允许图片文件
  const allowedTypes = /jpeg|jpg|png|gif/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('只允许上传图片文件 (jpeg, jpg, png, gif)'));
  }
};

// 创建multer实例
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB限制
  }
});

class UploadController {
  // 上传检测人员签名图片（存储为用户签名文件）
  static uploadTesterSignature(req, res) {
    const uploadSingle = upload.single('signature');
    
    uploadSingle(req, res, async (err) => {
      if (err) {
        console.error('文件上传失败:', err);
        return res.status(400).json({ 
          error: '文件上传失败', 
          message: err.message 
        });
      }

      if (!req.file) {
        return res.status(400).json({ 
          error: '没有文件被上传' 
        });
      }

      try {
        // 将签名文件添加到用户签名库中
        const userId = req.user.userId;
        const filename = req.file.filename;
        const file_path = `/uploads/signatures/${req.file.filename}`;
        const is_default = req.body.is_default === 'true' || false;

        const signature = await User.addSignature(userId, {
          filename,
          file_path,
          is_default
        });

        res.status(200).json({
          message: '文件上传成功',
          signature: signature,
          filePath: file_path,
          originalName: req.file.originalname,
          size: req.file.size
        });
      } catch (error) {
        console.error('保存签名文件失败:', error);
        // 删除已上传的文件
        fs.unlink(req.file.path, () => {});
        res.status(500).json({ 
          error: '保存签名文件失败', 
          message: error.message 
        });
      }
    });
  }

  // 获取用户默认签名文件
  static async getDefaultSignature(req, res) {
    try {
      const userId = req.user.userId;
      const signature = await User.getDefaultSignature(userId);
      
      if (!signature) {
        return res.status(404).json({ error: '未找到默认签名文件' });
      }
      
      res.status(200).json({ signature });
    } catch (error) {
      console.error('获取默认签名文件失败:', error);
      res.status(500).json({ 
        error: '获取默认签名文件失败', 
        message: error.message 
      });
    }
  }
}

module.exports = UploadController;