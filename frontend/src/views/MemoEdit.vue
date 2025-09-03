<template>
  <div class="memo-edit">
    <el-card v-loading="loading">
      <template #header>
        <div class="card-header">
          <el-icon><Edit /></el-icon>
          <span>编辑备忘录</span>
          <span v-if="memo.memo_number" class="memo-number">
            ({{ memo.memo_number }})
          </span>
        </div>
      </template>
      
      <MemoForm
        v-if="!loading && memo.id"
        :is-edit="true"
        :memo-data="memo"
        @submit="handleSubmit"
        @cancel="handleCancel"
      />
      
      <div v-if="loading" class="loading-container">
        <el-text>加载中...</el-text>
      </div>
    </el-card>
  </div>
</template>

<script>
import { Edit } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import MemoForm from '@/components/MemoForm.vue'
import { memoApi } from '@/api/memo'

export default {
  name: 'MemoEdit',
  components: {
    Edit,
    MemoForm
  },
  data() {
    return {
      memo: {},
      loading: false
    }
  },
  async created() {
    await this.fetchMemo()
  },
  methods: {
    // 获取备忘录数据
    async fetchMemo() {
      const id = this.$route.params.id
      if (!id) {
        ElMessage.error('无效的备忘录ID')
        this.$router.push('/')
        return
      }

      this.loading = true
      try {
        this.memo = await memoApi.getMemoById(id)
      } catch (error) {
        console.error('获取备忘录失败:', error)
        ElMessage.error('获取备忘录失败')
        this.$router.push('/')
      } finally {
        this.loading = false
      }
    },

    // 处理表单提交
    async handleSubmit(formData) {
      try {
        await memoApi.updateMemo(this.memo.id, formData)
        ElMessage.success('备忘录更新成功')
        this.$router.push('/')
      } catch (error) {
        console.error('更新备忘录失败:', error)
        ElMessage.error('更新备忘录失败')
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
.memo-edit {
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

.memo-number {
  color: #909399;
  font-weight: normal;
  font-size: 14px;
}

.loading-container {
  text-align: center;
  padding: 40px 0;
}
</style>