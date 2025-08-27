const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const userController = require('../controllers/userController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/signatures/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `signature-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('只支持图片文件格式 (JPEG, JPG, PNG, GIF)'));
    }
  }
});

router.post('/register', authenticateToken, requireAdmin, userController.register);

router.post('/login', userController.login);

router.get('/me', authenticateToken, userController.getCurrentUser);

router.put('/me', authenticateToken, userController.updateProfile);

router.get('/', authenticateToken, requireAdmin, userController.getAllUsers);

router.put('/:id/role', authenticateToken, requireAdmin, userController.updateUserRole);

// 管理员更新用户完整信息
router.put('/:id', authenticateToken, requireAdmin, userController.updateUser);

router.delete('/:id', authenticateToken, requireAdmin, userController.deactivateUser);

router.post('/signatures', authenticateToken, upload.single('signature'), userController.uploadSignature);

router.get('/signatures', authenticateToken, userController.getUserSignatures);

router.delete('/signatures/:signatureId', authenticateToken, userController.deleteSignature);

// 管理员为特定用户上传签名
router.post('/:id/signatures', authenticateToken, requireAdmin, upload.single('signature'), userController.uploadUserSignature);

// 管理员获取特定用户的签名列表
router.get('/:id/signatures', authenticateToken, requireAdmin, userController.getUserSignaturesList);

module.exports = router;