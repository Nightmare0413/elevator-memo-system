<template>
  <div class="memo-list">
    <!-- 搜索和操作栏 -->
    <el-card class="search-card">
      <div class="search-bar">
        <el-row :gutter="20" align="middle">
          <el-col :span="16">
            <el-input
              v-model="searchKeyword"
              placeholder="搜索备忘录编号或使用单位名称"
              clearable
              @input="handleSearch"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </el-col>
          <el-col :span="8">
            <div class="action-buttons">
              <el-button 
                type="primary" 
                @click="$router.push('/create')"
                :icon="Plus"
              >
                新建备忘录
              </el-button>
              <el-button 
                @click="refreshList"
                :icon="Refresh"
                :loading="loading"
              >
                刷新
              </el-button>
            </div>
          </el-col>
        </el-row>
      </div>
    </el-card>

    <!-- 备忘录列表 -->
    <el-card class="list-card">
      <template #header>
        <div class="card-header">
          <span>备忘录列表</span>
          <span class="total-count">共 {{ pagination.total }} 条记录</span>
        </div>
      </template>

      <el-table
        :data="memoList"
        v-loading="loading"
        stripe
        style="width: 100%"
        @row-click="handleRowClick"
      >
        <el-table-column prop="memo_number" label="备忘录编号" min-width="150">
          <template #default="{ row }">
            <el-link type="primary" @click.stop="viewMemo(row.id)">
              {{ row.memo_number }}
            </el-link>
          </template>
        </el-table-column>
        
        <el-table-column prop="user_unit_name" label="使用单位" min-width="200" />
        
        <el-table-column prop="equipment_type" label="设备品种" width="120" />
        
        <el-table-column prop="non_conformance_status" label="不符合情况" width="140">
          <template #default="{ row }">
            <el-tag 
              :type="getNonConformanceTagType(row.non_conformance_status)"
              size="small"
            >
              {{ getNonConformanceLabel(row.non_conformance_status) }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="inspection_date" label="检测日期" width="120">
          <template #default="{ row }">
            {{ formatDate(row.inspection_date) }}
          </template>
        </el-table-column>
        
        <el-table-column prop="signing_date" label="签收日期" width="120">
          <template #default="{ row }">
            {{ row.signing_date ? formatDate(row.signing_date) : '未签收' }}
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button 
              size="small" 
              @click.stop="viewMemo(row.id)"
              :icon="View"
            >
              查看
            </el-button>
            <el-button 
              size="small" 
              type="success"
              @click.stop="copyMemo(row.id)"
              :icon="CopyDocument"
              :loading="copyingIds.includes(row.id)"
            >
              复制
            </el-button>
            <el-button 
              size="small" 
              type="warning"
              @click.stop="downloadPDF(row.id, row.memo_number)"
              :icon="Download"
              :loading="downloadingIds.includes(row.id)"
            >
              PDF
            </el-button>
            <el-button 
              size="small" 
              type="danger"
              @click.stop="deleteMemo(row.id)"
              :icon="Delete"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.limit"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script>
import { memoApi } from '@/api/memo'
import { 
  formatDate, 
  getNonConformanceLabel, 
  downloadFile,
  debounce 
} from '@/utils'
import { 
  Search, 
  Plus, 
  Refresh, 
  View, 
  CopyDocument, 
  Download, 
  Delete 
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

export default {
  name: 'MemoList',
  components: {
    Search,
    Plus,
    Refresh,
    View,
    CopyDocument,
    Download,
    Delete
  },
  data() {
    return {
      memoList: [],
      loading: false,
      searchKeyword: '',
      copyingIds: [],
      downloadingIds: [],
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0
      }
    }
  },
  created() {
    this.fetchMemoList()
    this.handleSearch = debounce(this.searchMemos, 500)
  },
  methods: {
    formatDate,
    getNonConformanceLabel,

    // 获取不符合情况标签类型
    getNonConformanceTagType(status) {
      const typeMap = {
        0: 'success',  // 无
        1: 'warning',  // 存在不符合
        2: 'danger'    // 存在较严重不符合
      }
      return typeMap[status] || 'info'
    },

    // 获取备忘录列表
    async fetchMemoList() {
      this.loading = true
      try {
        const params = {
          page: this.pagination.page,
          limit: this.pagination.limit,
          search: this.searchKeyword
        }
        
        const response = await memoApi.getMemos(params)
        this.memoList = response.memos
        this.pagination = response.pagination
      } catch (error) {
        console.error('获取备忘录列表失败:', error)
        ElMessage.error('获取备忘录列表失败')
      } finally {
        this.loading = false
      }
    },

    // 搜索备忘录
    async searchMemos() {
      this.pagination.page = 1
      await this.fetchMemoList()
    },

    // 刷新列表
    async refreshList() {
      await this.fetchMemoList()
      ElMessage.success('列表已刷新')
    },

    // 查看备忘录详情
    viewMemo(id) {
      this.$router.push(`/memo/${id}`)
    },

    // 行点击事件
    handleRowClick(row) {
      this.viewMemo(row.id)
    },

    // 复制备忘录
    async copyMemo(id) {
      this.copyingIds.push(id)
      try {
        await memoApi.copyMemo(id)
        ElMessage.success('复制成功')
        await this.fetchMemoList()
      } catch (error) {
        console.error('复制备忘录失败:', error)
        ElMessage.error('复制失败')
      } finally {
        this.copyingIds = this.copyingIds.filter(copyId => copyId !== id)
      }
    },

    // 删除备忘录
    async deleteMemo(id) {
      try {
        await ElMessageBox.confirm(
          '此操作将永久删除该备忘录，是否继续？',
          '警告',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )
        
        await memoApi.deleteMemo(id)
        ElMessage.success('删除成功')
        await this.fetchMemoList()
      } catch (error) {
        if (error !== 'cancel') {
          console.error('删除备忘录失败:', error)
          ElMessage.error('删除失败')
        }
      }
    },

    // 下载PDF
    async downloadPDF(id, memoNumber) {
      this.downloadingIds.push(id)
      try {
        const response = await memoApi.generatePDF(id)
        const filename = `${memoNumber}.pdf`
        downloadFile(response, filename)
        ElMessage.success('PDF下载成功')
      } catch (error) {
        console.error('下载PDF失败:', error)
        ElMessage.error('下载PDF失败')
      } finally {
        this.downloadingIds = this.downloadingIds.filter(downloadId => downloadId !== id)
      }
    },

    // 分页大小改变
    handleSizeChange(size) {
      this.pagination.limit = size
      this.pagination.page = 1
      this.fetchMemoList()
    },

    // 当前页改变
    handleCurrentChange(page) {
      this.pagination.page = page
      this.fetchMemoList()
    }
  }
}
</script>

<style scoped>
.memo-list {
  max-width: 1200px;
  margin: 0 auto;
}

.search-card {
  margin-bottom: 20px;
}

.search-bar {
  display: flex;
  align-items: center;
}

.action-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.list-card .card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.total-count {
  color: #909399;
  font-size: 14px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.el-table {
  cursor: pointer;
}

.el-table__row:hover {
  background-color: #f5f7fa;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .search-bar .el-col:first-child {
    margin-bottom: 10px;
  }
  
  .action-buttons {
    justify-content: flex-start;
  }
  
  .el-table {
    font-size: 12px;
  }
  
  .el-button {
    padding: 5px 10px;
    font-size: 12px;
  }
}
</style>