<template>
  <div class="memo-create">
    <el-card>
      <template #header>
        <div class="card-header">
          <el-icon><Plus /></el-icon>
          <span>新建备忘录</span>
        </div>
      </template>
      
      <MemoForm
        :is-edit="false"
        @submit="handleSubmit"
        @cancel="handleCancel"
      />
    </el-card>
  </div>
</template>

<script>
import { Plus } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import MemoForm from '@/components/MemoForm.vue'
import { memoApi } from '@/api/memo'

export default {
  name: 'MemoCreate',
  components: {
    Plus,
    MemoForm
  },
  methods: {
    // 处理表单提交
    async handleSubmit(formData) {
      try {
        const newMemo = await memoApi.createMemo(formData)
        ElMessage.success('备忘录创建成功')
        
        // 跳转到列表页面
        this.$router.push('/')
      } catch (error) {
        console.error('创建备忘录失败:', error)
        ElMessage.error('创建备忘录失败')
      }
    },

    // 取消操作
    handleCancel() {
      this.$router.push('/')
    }
  }
}
</script>

<style scoped>
.memo-create {
  max-width: 800px;
  margin: 0 auto;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: bold;
}

/* 移动端优化 */
@media (max-width: 768px) {
  .memo-create {
    padding: 8px;
    max-width: 100%;
    margin: 0;
    min-height: 100vh;
    box-sizing: border-box;
  }
  
  :deep(.el-card) {
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
    border: 1px solid #f0f0f0;
    min-height: calc(100vh - 16px);
    display: flex;
    flex-direction: column;
  }
  
  :deep(.el-card__header) {
    padding: 16px;
    background: #f8f9fa;
    border-bottom: 1px solid #f0f0f0;
    flex-shrink: 0;
  }
  
  :deep(.el-card__body) {
    padding: 0;
    flex: 1;
    overflow-y: auto;
    padding-bottom: 80px; /* 为底部按钮留出空间 */
  }
  
  .card-header {
    font-size: 18px;
    font-weight: 600;
    color: #303133;
  }
}

@media (max-width: 480px) {
  .memo-create {
    padding: 4px;
  }
  
  :deep(.el-card__header) {
    padding: 12px;
  }
  
  .card-header {
    font-size: 16px;
  }
}
</style>