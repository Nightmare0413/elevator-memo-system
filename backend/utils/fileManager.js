const fs = require('fs');
const path = require('path');

class FileManager {
  // 清理过期的临时文件
  static async cleanupTempFiles() {
    const uploadsDir = path.join(__dirname, '../uploads/signatures');
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7天
    
    try {
      const files = await fs.promises.readdir(uploadsDir);
      const now = Date.now();
      
      for (const file of files) {
        const filePath = path.join(uploadsDir, file);
        const stats = await fs.promises.stat(filePath);
        
        // 删除7天前的未使用文件
        if (now - stats.mtime.getTime() > maxAge) {
          // 检查文件是否还在数据库中被引用
          const isReferenced = await this.isFileReferenced(file);
          if (!isReferenced) {
            await fs.promises.unlink(filePath);
            console.log(`Cleaned up old file: ${file}`);
          }
        }
      }
    } catch (error) {
      console.error('Error cleaning up temp files:', error);
    }
  }
  
  // 检查文件是否在数据库中被引用
  static async isFileReferenced(filename) {
    const pool = require('../config/database');
    
    try {
      // 检查备忘录表中的签名路径
      const memoQuery = `
        SELECT COUNT(*) FROM memos 
        WHERE tester_signature_path LIKE $1
      `;
      const memoResult = await pool.query(memoQuery, [`%${filename}%`]);
      
      // 检查用户签名表
      const signatureQuery = `
        SELECT COUNT(*) FROM user_signatures 
        WHERE filename = $1
      `;
      const signatureResult = await pool.query(signatureQuery, [filename]);
      
      const totalRefs = parseInt(memoResult.rows[0].count) + parseInt(signatureResult.rows[0].count);
      return totalRefs > 0;
    } catch (error) {
      console.error('Error checking file references:', error);
      return true; // 出错时保守地认为文件被引用
    }
  }
  
  // 压缩图片文件（针对签名图片）
  static async compressImage(inputPath, outputPath, quality = 0.8) {
    // 这里可以集成 sharp 或其他图片压缩库
    // 目前先做文件复制
    try {
      await fs.promises.copyFile(inputPath, outputPath);
      return true;
    } catch (error) {
      console.error('Error compressing image:', error);
      return false;
    }
  }
  
  // 获取目录大小
  static async getDirectorySize(dirPath) {
    let size = 0;
    
    try {
      const files = await fs.promises.readdir(dirPath);
      
      for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stats = await fs.promises.stat(filePath);
        
        if (stats.isFile()) {
          size += stats.size;
        } else if (stats.isDirectory()) {
          size += await this.getDirectorySize(filePath);
        }
      }
    } catch (error) {
      console.error('Error calculating directory size:', error);
    }
    
    return size;
  }
  
  // 检查磁盘空间
  static async checkDiskSpace() {
    const uploadsDir = path.join(__dirname, '../uploads');
    const size = await this.getDirectorySize(uploadsDir);
    
    // 转换为MB
    const sizeMB = (size / (1024 * 1024)).toFixed(2);
    console.log(`Uploads directory size: ${sizeMB} MB`);
    
    // 如果超过1GB，发出警告
    if (size > 1024 * 1024 * 1024) {
      console.warn('Uploads directory size exceeds 1GB, consider cleanup');
    }
    
    return { size, sizeMB };
  }
}

module.exports = FileManager;