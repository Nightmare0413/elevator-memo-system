const cron = require('node-cron');
const FileManager = require('./fileManager');

class Scheduler {
  static init() {
    // 每天凌晨2点执行文件清理
    cron.schedule('0 2 * * *', async () => {
      console.log('Starting scheduled file cleanup...');
      await FileManager.cleanupTempFiles();
      await FileManager.checkDiskSpace();
      console.log('Scheduled file cleanup completed.');
    });
    
    // 每周日凌晨3点执行更全面的清理和统计
    cron.schedule('0 3 * * 0', async () => {
      console.log('Starting weekly maintenance...');
      
      // 更新数据库统计信息
      const pool = require('../config/database');
      try {
        await pool.query('ANALYZE memos');
        await pool.query('ANALYZE users'); 
        await pool.query('ANALYZE user_signatures');
        console.log('Database statistics updated.');
      } catch (error) {
        console.error('Error updating database statistics:', error);
      }
      
      console.log('Weekly maintenance completed.');
    });
    
    console.log('Scheduler initialized with file cleanup and maintenance tasks.');
  }
}

module.exports = Scheduler;