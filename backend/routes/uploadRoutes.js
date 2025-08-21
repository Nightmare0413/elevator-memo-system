const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');

// 上传检测人员签名图片 POST /api/upload/tester-signature
router.post('/tester-signature', uploadController.uploadTesterSignature);

module.exports = router;