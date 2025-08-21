const multer = require('multer');
const path = require('path');
const fs = require('fs');

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
    // 生成唯一文件名
    const uniqueName = `signature-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
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
  // 上传检测人员签名图片
  static uploadTesterSignature(req, res) {
    const uploadSingle = upload.single('signature');
    
    uploadSingle(req, res, (err) => {
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

      // 返回文件访问路径
      const filePath = `/uploads/signatures/${req.file.filename}`;
      
      res.status(200).json({
        message: '文件上传成功',
        filePath: filePath,
        originalName: req.file.originalname,
        size: req.file.size
      });
    });
  }
}

module.exports = UploadController;