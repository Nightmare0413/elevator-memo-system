const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const { authenticateToken } = require('../middleware/auth');

// 上传检测人员签名图片 POST /api/upload/tester-signature
router.post('/tester-signature', authenticateToken, uploadController.uploadTesterSignature);

// 获取用户默认签名 GET /api/upload/default-signature
router.get('/default-signature', authenticateToken, uploadController.getDefaultSignature);

module.exports = router;