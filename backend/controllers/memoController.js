const Memo = require('../models/Memo');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// PDF生成互斥锁
let pdfGenerationMutex = Promise.resolve();

class MemoController {
  // 获取所有备忘录
  static async getAllMemos(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const userId = req.user?.userId;
      const userRole = req.user?.role;
      
      // 添加调试日志
      console.log('getAllMemos调试信息:', {
        userId,
        userRole,
        page,
        limit,
        query: req.query
      });
      
      // 构建筛选条件对象
      const filters = {
        search: req.query.search || '',
        date: req.query.date || '',
        memo_number: req.query.memo_number || '',
        user_unit_name: req.query.user_unit_name || '',
        registration_cert_no: req.query.registration_cert_no || '',
        user_full_name: req.query.user_full_name || ''
      };

      const result = await Memo.findAll(page, limit, filters, userId, userRole);
      console.log('查询结果调试:', {
        totalMemos: result.memos.length,
        paginationTotal: result.pagination.total
      });
      res.status(200).json(result);
    } catch (error) {
      console.error('获取备忘录列表失败:', error);
      res.status(500).json({ 
        error: '获取备忘录列表失败', 
        message: error.message 
      });
    }
  }

  // 创建新备忘录
  static async createMemo(req, res) {
    try {
      // 生成备忘录编号
      if (!req.body.memo_number) {
        req.body.memo_number = Memo.generateMemoNumber();
      }

      // 设置默认检测日期为今天
      if (!req.body.inspection_date) {
        req.body.inspection_date = new Date().toISOString().split('T')[0];
      }

      // 设置创建者
      req.body.created_by = req.user.userId;

      const newMemo = await Memo.create(req.body);
      res.status(201).json(newMemo);
    } catch (error) {
      console.error('创建备忘录失败:', error);
      res.status(500).json({ 
        error: '创建备忘录失败', 
        message: error.message 
      });
    }
  }

  // 获取单个备忘录
  static async getMemoById(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;
      const userRole = req.user?.role;
      const memo = await Memo.findById(id, userId, userRole);
      
      if (!memo) {
        return res.status(404).json({ error: '备忘录不存在' });
      }

      res.status(200).json(memo);
    } catch (error) {
      console.error('获取备忘录失败:', error);
      res.status(500).json({ 
        error: '获取备忘录失败', 
        message: error.message 
      });
    }
  }

  // 复制备忘录
  static async copyMemo(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;
      const userRole = req.user?.role;
      const copiedMemo = await Memo.copy(id, userId, userRole);
      res.status(201).json(copiedMemo);
    } catch (error) {
      console.error('复制备忘录失败:', error);
      res.status(500).json({ 
        error: '复制备忘录失败', 
        message: error.message 
      });
    }
  }

  // 删除备忘录
  static async deleteMemo(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;
      const userRole = req.user?.role;
      const deletedMemo = await Memo.delete(id, userId, userRole);
      
      if (!deletedMemo) {
        return res.status(404).json({ error: '备忘录不存在' });
      }

      // 如果有签名图片文件，也要删除
      if (deletedMemo.tester_signature_path) {
        const filePath = path.join(__dirname, '..', deletedMemo.tester_signature_path);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      res.status(204).send();
    } catch (error) {
      console.error('删除备忘录失败:', error);
      res.status(500).json({ 
        error: '删除备忘录失败', 
        message: error.message 
      });
    }
  }

  // 更新备忘录
  static async updateMemo(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;
      const userRole = req.user?.role;
      const updateData = req.body;
      
      const updatedMemo = await Memo.update(id, updateData, userId, userRole);
      
      res.status(200).json({
        message: '备忘录更新成功',
        memo: updatedMemo
      });
    } catch (error) {
      console.error('更新备忘录失败:', error);
      res.status(500).json({ 
        error: '更新备忘录失败', 
        message: error.message 
      });
    }
  }

  // 生成PDF
  static async generatePDF(req, res) {
    // 使用互斥锁确保同一时间只有一个PDF在生成
    pdfGenerationMutex = pdfGenerationMutex.then(async () => {
      return await MemoController._generatePDFInternal(req, res);
    });
    
    return pdfGenerationMutex;
  }

  // 内部PDF生成方法
  static async _generatePDFInternal(req, res) {
    let browser = null;
    try {
      const { id } = req.params;
      const userId = req.user?.userId;
      const userRole = req.user?.role;
      const memo = await Memo.findById(id, userId, userRole);
      
      if (!memo) {
        return res.status(404).json({ error: '备忘录不存在' });
      }
      
      // 检查签字状态
      if (!memo.representative_signature) {
        return res.status(400).json({ 
          error: '备忘录尚未签字', 
          message: '只有已签字的备忘录才能生成PDF，请先完成签字。'
        });
      }

      // 读取HTML模板
      const templatePath = path.join(__dirname, '../templates/memo-template.html');
      let htmlTemplate = fs.readFileSync(templatePath, 'utf-8');

      // 格式化日期显示
      const formatDateForPDF = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        return `${year}年${month}月${day}日`;
      };

      // 预处理变量
      const recommendations = memo.recommendations || '';
      const nonConformanceStatus = memo.non_conformance_status || 0;
      
      // 替换模板中的数据
      htmlTemplate = htmlTemplate
        .replace(/{{memo_number}}/g, memo.memo_number || '')
        .replace(/{{user_unit_name}}/g, memo.user_unit_name || '')
        .replace(/{{installation_location}}/g, memo.installation_location || '')
        .replace(/{{equipment_type}}/g, memo.equipment_type || '')
        .replace(/{{product_number}}/g, memo.product_number || '')
        .replace(/{{registration_cert_no}}/g, memo.registration_cert_no || '')
        .replace(/{{inspection_date}}/g, memo.inspection_date || '')
        .replace(/{{inspection_date_formatted}}/g, formatDateForPDF(memo.inspection_date))
        .replace(/{{signing_date}}/g, memo.signing_date || '')
        .replace(/{{signing_date_formatted}}/g, formatDateForPDF(memo.signing_date))
        .replace(/{{recommendations}}/g, nonConformanceStatus === 0 ? '' : recommendations)
        .replace(/{{non_conformance_status_raw}}/g, nonConformanceStatus);

      // 根据不符合情况和建议内容长度动态调整
      let recommendationsDisplay = '';
      let recommendationsClass = 'auto-size';
      let nonConformanceCellClass = '';
      
      // 如果选择"无"，清空建议内容但保持区域显示
      if (nonConformanceStatus === 0) {
        nonConformanceCellClass = 'expanded'; // 扩大单元格填满页面
      } else {
        // 根据建议内容长度自动调整字体大小
        const textLength = recommendations.length;
        if (textLength > 1000) {
          recommendationsClass = 'size-tiny';
        } else if (textLength > 700) {
          recommendationsClass = 'size-smaller';
        } else if (textLength > 450) {
          recommendationsClass = 'size-small';
        }
        
        // 如果建议内容为空但非"无"状态，也扩大单元格
        if (recommendations.trim() === '') {
          nonConformanceCellClass = 'expanded';
        }
      }
      
      htmlTemplate = htmlTemplate
        .replace(/{{recommendations_display}}/g, recommendationsDisplay)
        .replace(/{{recommendations_class}}/g, recommendationsClass)
        .replace(/{{non_conformance_cell_class}}/g, nonConformanceCellClass);

      // 处理检测人员签名图片（使用用户默认签名）
      if (memo.tester_signature_path) {
        try {
          const imagePath = path.join(__dirname, '..', memo.tester_signature_path);
          console.log(`尝试读取签名图片: ${imagePath}`);
          
          if (fs.existsSync(imagePath)) {
            const imageData = fs.readFileSync(imagePath);
            const imageBase64 = `data:image/png;base64,${imageData.toString('base64')}`;
            htmlTemplate = htmlTemplate.replace(/{{tester_signature}}/g, 
              `<img src="${imageBase64}" alt="检测人员签名" class="signature-image">`);
            console.log(`成功读取签名图片: ${memo.memo_number}`);
          } else {
            console.log(`签名图片文件不存在: ${imagePath}`);
            htmlTemplate = htmlTemplate.replace(/{{tester_signature}}/g, '');
          }
        } catch (error) {
          console.error(`读取签名图片失败: ${error.message}`);
          htmlTemplate = htmlTemplate.replace(/{{tester_signature}}/g, '');
        }
      } else {
        htmlTemplate = htmlTemplate.replace(/{{tester_signature}}/g, '');
      }

      // 处理使用单位代表签名
      if (memo.representative_signature) {
        const signatureImg = `<img src="${memo.representative_signature}" alt="使用单位代表签名" class="signature-image">`;
        htmlTemplate = htmlTemplate.replace(/{{representative_signature_display}}/g, signatureImg);
      } else {
        htmlTemplate = htmlTemplate.replace(/{{representative_signature_display}}/g, '');
      }

      // 启动Puppeteer
      browser = await puppeteer.launch({
        headless: true,
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium-browser',
        args: [
          '--no-sandbox', 
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      });
      const page = await browser.newPage();
      
      // 设置页面内容
      await page.setContent(htmlTemplate, { waitUntil: 'networkidle0' });

      // 生成PDF
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20px',
          bottom: '20px',
          left: '20px',
          right: '20px'
        }
      });

      // 设置响应头
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 
        `attachment; filename="memo-${memo.memo_number}.pdf"`);
      
      res.send(pdfBuffer);
    } catch (error) {
      console.error('生成PDF失败:', error);
      res.status(500).json({ 
        error: '生成PDF失败', 
        message: error.message 
      });
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  // 批量签字
  static async batchSign(req, res) {
    try {
      const { memo_ids, representative_signature, signing_date } = req.body;
      
      if (!memo_ids || !Array.isArray(memo_ids) || memo_ids.length === 0) {
        return res.status(400).json({ error: '请选择要签字的备忘录' });
      }
      
      if (!representative_signature) {
        return res.status(400).json({ error: '请提供签字信息' });
      }

      const updatedMemos = [];
      
      // 批量更新备忘录签字信息
      for (const memoId of memo_ids) {
        const updatedMemo = await Memo.updateSignature(memoId, {
          representative_signature,
          signing_date: signing_date || new Date().toISOString().split('T')[0]
        });
        
        if (updatedMemo) {
          updatedMemos.push(updatedMemo);
        }
      }
      
      res.status(200).json({
        message: `成功为 ${updatedMemos.length} 份备忘录签字`,
        updated_memos: updatedMemos
      });
    } catch (error) {
      console.error('批量签字失败:', error);
      res.status(500).json({ 
        error: '批量签字失败', 
        message: error.message 
      });
    }
  }
}

module.exports = MemoController;