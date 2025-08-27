<template>
  <div class="memo-detail">
    <el-card v-loading="loading">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <el-icon><Document /></el-icon>
            <span>备忘录详情</span>
            <span v-if="memo.memo_number" class="memo-number">
              {{ memo.memo_number }}
            </span>
          </div>
          <div class="header-actions">
            <el-button 
              type="primary"
              @click="downloadPDF"
              :icon="Download"
              :loading="downloading"
            >
              下载PDF
            </el-button>
            <el-button 
              @click="goBack"
              :icon="ArrowLeft"
            >
              返回列表
            </el-button>
          </div>
        </div>
      </template>
      
      <div v-if="!loading && memo.id" class="memo-content">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="备忘录编号">
            {{ memo.memo_number }}
          </el-descriptions-item>
          
          <el-descriptions-item label="创建时间">
            {{ formatDateTime(memo.created_at) }}
          </el-descriptions-item>
          
          <el-descriptions-item label="使用单位名称" :span="2">
            {{ memo.user_unit_name }}
          </el-descriptions-item>
          
          <el-descriptions-item label="安装地点" :span="2">
            {{ memo.installation_location }}
          </el-descriptions-item>
          
          <el-descriptions-item label="设备品种">
            {{ memo.equipment_type }}
          </el-descriptions-item>
          
          <el-descriptions-item label="产品编号">
            {{ memo.product_number }}
          </el-descriptions-item>
          
          <el-descriptions-item label="使用登记证编号" :span="2">
            {{ memo.registration_cert_no }}
          </el-descriptions-item>
          
          <el-descriptions-item label="不符合情况" :span="memo.non_conformance_status === 0 ? 1 : 2">
            <el-tag 
              :type="getNonConformanceTagType(memo.non_conformance_status)"
              size="small"
            >
              {{ getNonConformanceLabel(memo.non_conformance_status) }}
            </el-tag>
          </el-descriptions-item>
          
          <el-descriptions-item 
            v-if="memo.non_conformance_status !== 0 && memo.recommendations" 
            label="相关建议" 
            :span="2"
          >
            <div class="recommendations-content">
              {{ memo.recommendations }}
            </div>
          </el-descriptions-item>
          
          <el-descriptions-item label="检测日期">
            {{ formatDate(memo.inspection_date) }}
          </el-descriptions-item>
          
          <el-descriptions-item label="签收日期">
            {{ memo.signing_date ? formatDate(memo.signing_date) : '未签收' }}
          </el-descriptions-item>
          
          <el-descriptions-item label="更新时间">
            {{ formatDateTime(memo.updated_at) }}
          </el-descriptions-item>
        </el-descriptions>

        <!-- 签名部分 -->
        <div class="signatures-section">
          <el-row :gutter="20">
            <!-- 检测人员签名 -->
            <el-col :span="12">
              <el-card class="signature-card">
                <template #header>
                  <span>检测人员签名</span>
                </template>
                <div class="signature-content">
                  <div v-if="memo.tester_signature_path" class="signature-image-wrapper">
                    <img 
                      :src="getImageUrl(memo.tester_signature_path)" 
                      alt="检测人员签名"
                      class="signature-image"
                    />
                  </div>
                  <div v-else class="no-signature">
                    <el-text type="info">暂无签名</el-text>
                  </div>
                </div>
              </el-card>
            </el-col>
            
            <!-- 使用单位代表签名 -->
            <el-col :span="12">
              <el-card class="signature-card">
                <template #header>
                  <span>使用单位代表签名</span>
                </template>
                <div class="signature-content">
                  <div v-if="memo.representative_signature" class="signature-image-wrapper">
                    <img 
                      :src="memo.representative_signature" 
                      alt="使用单位代表签名"
                      class="signature-image"
                    />
                  </div>
                  <div v-else class="no-signature">
                    <el-text type="info">暂无签名</el-text>
                  </div>
                </div>
              </el-card>
            </el-col>
          </el-row>
        </div>
      </div>
      
      <div v-if="loading" class="loading-container">
        <el-text>加载中...</el-text>
      </div>
    </el-card>
  </div>
</template>

<script>
import { 
  Document, 
  Download, 
  ArrowLeft 
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { memoApi } from '@/api/memo'
import { 
  formatDate, 
  getNonConformanceLabel,
  downloadFile
} from '@/utils'

export default {
  name: 'MemoDetail',
  components: {
    Document,
    Download,
    ArrowLeft
  },
  data() {
    return {
      memo: {},
      loading: false,
      downloading: false
    }
  },
  async created() {
    await this.fetchMemo()
  },
  methods: {
    formatDate,
    getNonConformanceLabel,

    // 格式化日期时间
    formatDateTime(dateTime) {
      if (!dateTime) return ''
      
      const d = new Date(dateTime)
      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      const hours = String(d.getHours()).padStart(2, '0')
      const minutes = String(d.getMinutes()).padStart(2, '0')
      
      return `${year}-${month}-${day} ${hours}:${minutes}`
    },

    // 获取不符合情况标签类型
    getNonConformanceTagType(status) {
      const typeMap = {
        0: 'success',  // 无
        1: 'warning',  // 存在不符合
        2: 'danger'    // 存在较严重不符合
      }
      return typeMap[status] || 'info'
    },

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

    // 获取图片URL
    getImageUrl(path) {
      if (path.startsWith('/')) {
        return `http://localhost:3000${path}`
      }
      return path
    },

    // 下载PDF
    async downloadPDF() {
      if (!this.memo.id) return
      
      this.downloading = true
      try {
        const response = await memoApi.generatePDF(this.memo.id)
        const filename = `${this.memo.memo_number}.pdf`
        downloadFile(response, filename)
        ElMessage.success('PDF下载成功')
      } catch (error) {
        console.error('下载PDF失败:', error)
        ElMessage.error('下载PDF失败')
      } finally {
        this.downloading = false
      }
    },

    // 返回列表
    goBack() {
      this.$router.push('/')
    }
  }
}
</script>

<style scoped>
.memo-detail {
  max-width: 1000px;
  margin: 0 auto;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: bold;
}

.memo-number {
  color: #409EFF;
  font-weight: normal;
  font-size: 14px;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.memo-content {
  padding: 0;
}

.signatures-section {
  margin-top: 30px;
}

.signature-card {
  height: 200px;
}

.signature-content {
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.signature-image-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  background-color: #fafafa;
}

.signature-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.no-signature {
  color: #909399;
  font-style: italic;
}

.loading-container {
  text-align: center;
  padding: 40px 0;
}

.recommendations-content {
  background-color: #f8f9fa;
  padding: 12px;
  border-radius: 4px;
  border-left: 4px solid #409EFF;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .card-header {
    flex-direction: column;
    gap: 10px;
  }
  
  .header-actions {
    width: 100%;
    justify-content: center;
  }
  
  .header-actions .el-button {
    flex: 1;
  }
  
  :deep(.el-descriptions) {
    font-size: 12px;
  }
  
  .signatures-section .el-col {
    margin-bottom: 20px;
  }
}
</style>