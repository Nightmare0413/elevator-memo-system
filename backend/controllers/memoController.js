const Memo = require('../models/Memo');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class MemoController {
  // 获取所有备忘录
  static async getAllMemos(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const search = req.query.search || '';

      const result = await Memo.findAll(page, limit, search);
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
      const memo = await Memo.findById(id);
      
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
      const copiedMemo = await Memo.copy(id);
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
      const deletedMemo = await Memo.delete(id);
      
      if (!deletedMemo) {
        return res.status(404).json({ error: '备忘录不存在' });
      }

      // 如果有签名图片文件，也要删除
      if (deletedMemo.tester_signature_path) {
        const relativePath = deletedMemo.tester_signature_path.startsWith('/')
          ? deletedMemo.tester_signature_path.slice(1)
          : deletedMemo.tester_signature_path;
        const filePath = path.join(__dirname, '..', relativePath);
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

  // 生成PDF
  static async generatePDF(req, res) {
    let browser = null;
    try {
      const { id } = req.params;
      const memo = await Memo.findById(id);
      
      if (!memo) {
        return res.status(404).json({ error: '备忘录不存在' });
      }

      // 读取HTML模板
      const templatePath = path.join(__dirname, '../templates/memo-template.html');
      let htmlTemplate = fs.readFileSync(templatePath, 'utf-8');

      // 替换模板中的数据
      htmlTemplate = htmlTemplate
        .replace(/{{memo_number}}/g, memo.memo_number || '')
        .replace(/{{user_unit_name}}/g, memo.user_unit_name || '')
        .replace(/{{installation_location}}/g, memo.installation_location || '')
        .replace(/{{equipment_type}}/g, memo.equipment_type || '')
        .replace(/{{product_number}}/g, memo.product_number || '')
        .replace(/{{registration_cert_no}}/g, memo.registration_cert_no || '')
        .replace(/{{inspection_date}}/g, memo.inspection_date || '')
        .replace(/{{signing_date}}/g, memo.signing_date || '');

      // 处理不符合情况
      const nonConformanceMap = {
        0: '无',
        1: '存在不符合',
        2: '存在较严重不符合'
      };
      htmlTemplate = htmlTemplate.replace(/{{non_conformance_status}}/g, 
        nonConformanceMap[memo.non_conformance_status] || '');

      // 处理签名图片
      if (memo.tester_signature_path) {
        const imagePath = path.join(__dirname, '..', memo.tester_signature_path);
        if (fs.existsSync(imagePath)) {
          const imageData = fs.readFileSync(imagePath);
          const imageBase64 = `data:image/png;base64,${imageData.toString('base64')}`;
          htmlTemplate = htmlTemplate.replace(/{{tester_signature}}/g, 
            `<img src="${imageBase64}" alt="检测人员签名" style="max-height: 50px;">`);
        } else {
          htmlTemplate = htmlTemplate.replace(/{{tester_signature}}/g, '');
        }
      } else {
        htmlTemplate = htmlTemplate.replace(/{{tester_signature}}/g, '');
      }

      // 处理手写签名
      if (memo.representative_signature) {
        htmlTemplate = htmlTemplate.replace(/{{representative_signature}}/g, 
          `<img src="${memo.representative_signature}" alt="使用单位代表签名" style="max-height: 50px;">`);
      } else {
        htmlTemplate = htmlTemplate.replace(/{{representative_signature}}/g, '');
      }

      // 启动Puppeteer
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
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
}

module.exports = MemoController;