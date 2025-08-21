const express = require('express');
const router = express.Router();
const memoController = require('../controllers/memoController');

// 获取备忘录列表 GET /api/memos
router.get('/', memoController.getAllMemos);

// 创建新备忘录 POST /api/memos
router.post('/', memoController.createMemo);

// 获取单个备忘录 GET /api/memos/:id
router.get('/:id', memoController.getMemoById);

// 复制备忘录 POST /api/memos/:id/copy
router.post('/:id/copy', memoController.copyMemo);

// 删除备忘录 DELETE /api/memos/:id
router.delete('/:id', memoController.deleteMemo);

// 生成PDF GET /api/memos/:id/pdf
router.get('/:id/pdf', memoController.generatePDF);

module.exports = router;