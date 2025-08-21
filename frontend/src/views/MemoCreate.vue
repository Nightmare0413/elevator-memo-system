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
</style>