const express = require('express');
const router = express.Router();
const memoController = require('../controllers/memoController');
const { authenticateToken } = require('../middleware/auth');

// 获取备忘录列表 GET /api/memos
router.get('/', authenticateToken, memoController.getAllMemos);

// 创建新备忘录 POST /api/memos
router.post('/', authenticateToken, memoController.createMemo);

// 批量签字 POST /api/memos/batch-sign (必须放在/:id路由之前)
router.post('/batch-sign', authenticateToken, memoController.batchSign);

// 获取单个备忘录 GET /api/memos/:id
router.get('/:id', authenticateToken, memoController.getMemoById);

// 更新备忘录 PUT /api/memos/:id
router.put('/:id', authenticateToken, memoController.updateMemo);

// 复制备忘录 POST /api/memos/:id/copy
router.post('/:id/copy', authenticateToken, memoController.copyMemo);

// 删除备忘录 DELETE /api/memos/:id
router.delete('/:id', authenticateToken, memoController.deleteMemo);

// 生成PDF GET /api/memos/:id/pdf
router.get('/:id/pdf', authenticateToken, memoController.generatePDF);

module.exports = router;