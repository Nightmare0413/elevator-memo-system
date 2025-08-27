<template>
  <div class="memo-list">
    <!-- 搜索和操作栏 -->
    <el-card class="search-card">
      <!-- 搜索行 -->
      <div class="search-row">
        <el-row :gutter="12" align="middle">
          <el-col :xs="24" :sm="12" :md="4">
            <el-input
              v-model="filters.memo_number"
              placeholder="备忘录编号"
              clearable
              @input="handleFilterChange"
            >
              <template #prefix>
                <el-icon><Document /></el-icon>
              </template>
            </el-input>
          </el-col>
          <el-col :xs="24" :sm="12" :md="4">
            <el-input
              v-model="filters.user_unit_name"
              placeholder="使用单位名称"
              clearable
              @input="handleFilterChange"
            >
              <template #prefix>
                <el-icon><OfficeBuilding /></el-icon>
              </template>
            </el-input>
          </el-col>
          <el-col :xs="24" :sm="12" :md="4">
            <el-input
              v-model="filters.registration_cert_no"
              placeholder="使用登记证号"
              clearable
              @input="handleFilterChange"
            >
              <template #prefix>
                <el-icon><CreditCard /></el-icon>
              </template>
            </el-input>
          </el-col>
          <el-col :xs="24" :sm="12" :md="4">
            <el-date-picker
              v-model="filters.date"
              type="date"
              placeholder="检测日期"
              clearable
              @change="handleFilterChange"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              style="width: 100%;"
            >
              <template #prefix>
                <el-icon><Calendar /></el-icon>
              </template>
            </el-date-picker>
          </el-col>
          <el-col :xs="24" :sm="12" :md="3" v-if="isAdmin">
            <el-input
              v-model="filters.user_full_name"
              placeholder="创建人姓名"
              clearable
              @input="handleFilterChange"
            >
              <template #prefix>
                <el-icon><User /></el-icon>
              </template>
            </el-input>
          </el-col>
          <el-col :xs="24" :sm="24" :md="isAdmin ? 5 : 8">
            <div class="filter-actions">
              <el-button type="primary" @click="applyFilters" :icon="Search" size="default">
                筛选
              </el-button>
              <el-button @click="clearFilters" :icon="Refresh" size="default">
                清空
              </el-button>
            </div>
          </el-col>
        </el-row>
      </div>
      
      <!-- 操作按钮行 -->
      <div class="action-buttons-row">
        <el-button 
          type="primary" 
          @click="$router.push('/create')"
          :icon="Plus"
          size="default"
        >
          新建备忘录
        </el-button>
        <el-button 
          type="success"
          @click="showBatchSignDialog"
          :icon="Edit"
          :disabled="selectedMemos.length === 0"
          size="default"
        >
          批量签字
        </el-button>
        <el-button 
          type="warning"
          @click="batchGeneratePDF"
          :icon="Download"
          :disabled="selectedMemos.length === 0"
          :loading="batchPdfLoading"
          size="default"
        >
          批量PDF
        </el-button>
        <el-button 
          type="danger"
          @click="batchDelete"
          :icon="Delete"
          :disabled="selectedMemos.length === 0"
          :loading="batchDeleteLoading"
          size="default"
        >
          批量删除
        </el-button>
        <el-button 
          @click="refreshList"
          :icon="Refresh"
          :loading="loading"
          size="default"
        >
          刷新
        </el-button>
      </div>
    </el-card>


    <!-- 备忘录列表 -->
    <el-card class="list-card">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <span>备忘录列表</span>
            <span v-if="selectedMemos.length > 0" class="selected-count">
              已选择 {{ selectedMemos.length }} 项
            </span>
          </div>
          <span class="total-count">共 {{ pagination.total }} 条记录</span>
        </div>
      </template>

      <el-table
        ref="memoTable"
        :data="memoList"
        v-loading="loading"
        stripe
        style="width: 100%"
        @row-click="handleRowClick"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="memo_number" label="备忘录编号" min-width="150">
          <template #default="{ row }">
            <span @click="handleMemoNumberClick(row)" style="cursor: pointer;">
              {{ row.memo_number }}
            </span>
          </template>
        </el-table-column>
        
        <el-table-column prop="user_unit_name" label="使用单位" min-width="160" />
        
        <el-table-column prop="registration_cert_no" label="使用登记证号" min-width="140" />
        
        <el-table-column prop="equipment_type" label="设备品种" width="100" />
        
        <el-table-column prop="non_conformance_status" label="不符合情况" min-width="160">
          <template #default="{ row }">
            <el-tag 
              :type="getNonConformanceTagType(row.non_conformance_status)"
              size="small"
            >
              {{ getShortNonConformanceLabel(row.non_conformance_status) }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="inspection_date" label="检测日期" width="120">
          <template #default="{ row }">
            {{ formatDate(row.inspection_date) }}
          </template>
        </el-table-column>
        
        <el-table-column prop="signing_date" label="签字状态" width="120" class-name="no-right-border">
          <template #default="{ row }">
            <el-tag 
              v-if="row.representative_signature"
              type="success"
              size="small"
            >
              已签字
            </el-tag>
            <el-tag 
              v-else
              type="warning"
              size="small"
            >
              待签字
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="120" fixed="right" header-align="center">
          <template #default="{ row }">
            <div class="table-action-buttons">
              <el-button 
                size="small" 
                type="primary"
                @click.stop="editMemo(row.id)"
                :icon="Edit"
              >
                编辑
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
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.limit"
          :page-sizes="[20, 50, 100]"
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
import { useAuthStore } from '@/stores/auth'
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
  CopyDocument, 
  Download, 
  Delete,
  Edit,
  Document,
  OfficeBuilding,
  CreditCard,
  Calendar,
  User
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

export default {
  name: 'MemoList',
  components: {
    Search,
    Plus,
    Refresh,
    CopyDocument,
    Download,
    Delete,
    Edit,
    Document,
    OfficeBuilding,
    CreditCard,
    Calendar,
    User
  },
  data() {
    return {
      memoList: [],
      loading: false,
      filters: {
        memo_number: '',
        user_unit_name: '',
        registration_cert_no: '',
        date: '',
        user_full_name: '',
        search: ''
      },
      copyingIds: [],
      selectedMemos: [],
      batchPdfLoading: false,
      batchDeleteLoading: false,
      pagination: {
        page: 1,
        limit: 20, // 针对大数据量，增加默认分页大小
        total: 0,
        totalPages: 0
      }
    }
  },
  computed: {
    isAdmin() {
      const authStore = useAuthStore()
      return authStore.user?.role === 'admin'
    }
  },
  created() {
    this.fetchMemoList()
    // 针对大数据量，增加防抖时间到800ms，减少不必要的查询
    this.handleFilterChange = debounce(this.applyFilters, 800)
  },
  mounted() {
    // 检查是否从签字页面返回，并处理批量签字结果
    this.checkBatchSignResult()
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

    // 获取简短的不符合情况标签（用于表格显示）
    getShortNonConformanceLabel(status) {
      const shortLabelMap = {
        0: '无',
        1: '存在不符合',
        2: '严重不符合'
      }
      return shortLabelMap[status] || '未知'
    },

    // 获取备忘录列表
    async fetchMemoList() {
      this.loading = true
      try {
        const params = {
          page: this.pagination.page,
          limit: this.pagination.limit,
          ...this.filters
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

    // 应用筛选条件
    async applyFilters() {
      this.pagination.page = 1
      await this.fetchMemoList()
    },

    // 清空筛选条件
    clearFilters() {
      this.filters = {
        memo_number: '',
        user_unit_name: '',
        registration_cert_no: '',
        date: '',
        user_full_name: '',
        search: ''
      }
      this.applyFilters()
    },

    // 筛选条件变化处理
    handleFilterChange() {
      // 由debounce处理
    },

    // 刷新列表
    async refreshList() {
      await this.fetchMemoList()
      ElMessage.success('列表已刷新')
    },

    // 编辑备忘录
    editMemo(id) {
      this.$router.push(`/edit/${id}`)
    },

    // 行点击事件 - 切换选中状态
    handleRowClick(row) {
      this.$refs.memoTable.toggleRowSelection(row)
    },

    // 处理备忘录编号点击事件
    handleMemoNumberClick(row) {
      // 切换选中状态
      this.$refs.memoTable.toggleRowSelection(row)
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

    // 批量生成PDF
    async batchGeneratePDF() {
      if (this.selectedMemos.length === 0) {
        ElMessage.warning('请选择要生成PDF的备忘录')
        return
      }
      
      this.batchPdfLoading = true
      let successCount = 0
      let failedCount = 0
      
      try {
        for (let i = 0; i < this.selectedMemos.length; i++) {
          const memo = this.selectedMemos[i]
          try {
            // 顺序生成PDF，避免并发问题
            const response = await memoApi.generatePDF(memo.id)
            const filename = `${memo.memo_number}.pdf`
            downloadFile(response, filename)
            successCount++
            
            // 如果不是最后一个，稍微延迟一下避免并发问题
            if (i < this.selectedMemos.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 500))
            }
          } catch (error) {
            console.error(`生成PDF失败 - ${memo.memo_number}:`, error)
            failedCount++
          }
        }
        
        if (successCount > 0) {
          ElMessage.success(`成功生成 ${successCount} 个PDF文件${failedCount > 0 ? `，失败 ${failedCount} 个` : ''}`)
        } else {
          ElMessage.error('批量生成PDF失败')
        }
      } catch (error) {
        console.error('批量生成PDF失败:', error)
        ElMessage.error('批量生成PDF失败')
      } finally {
        this.batchPdfLoading = false
      }
    },

    // 批量删除
    async batchDelete() {
      if (this.selectedMemos.length === 0) {
        ElMessage.warning('请选择要删除的备忘录')
        return
      }
      
      try {
        await ElMessageBox.confirm(
          `此操作将永久删除选中的 ${this.selectedMemos.length} 份备忘录，是否继续？`,
          '警告',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )
        
        this.batchDeleteLoading = true
        
        for (const memo of this.selectedMemos) {
          await memoApi.deleteMemo(memo.id)
        }
        
        ElMessage.success(`成功删除 ${this.selectedMemos.length} 份备忘录`)
        this.clearSelection()
        await this.fetchMemoList()
      } catch (error) {
        if (error !== 'cancel') {
          console.error('批量删除失败:', error)
          ElMessage.error('批量删除失败')
        }
      } finally {
        this.batchDeleteLoading = false
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
    },

    // 处理表格选择变化
    handleSelectionChange(selection) {
      this.selectedMemos = selection
    },

    // 清除选择
    clearSelection() {
      this.$refs.memoTable.clearSelection()
      this.selectedMemos = []
    },

    // 显示批量签字对话框
    showBatchSignDialog() {
      if (this.selectedMemos.length === 0) {
        ElMessage.warning('请选择要签字的备忘录')
        return
      }
      
      // 检查选中的备忘录中是否有已签字的
      const alreadySignedCount = this.selectedMemos.filter(memo => memo.representative_signature).length
      
      if (alreadySignedCount > 0) {
        ElMessageBox.confirm(
          `选中的备忘录中有 ${alreadySignedCount} 份已经签字，是否继续？这将覆盖现有签字。`,
          '提示',
          {
            confirmButtonText: '继续',
            cancelButtonText: '取消',
            type: 'warning'
          }
        ).then(() => {
          this.goToSignaturePage()
        }).catch(() => {})
      } else {
        this.goToSignaturePage()
      }
    },

    // 跳转到签字页面
    goToSignaturePage() {
      // 保存选中的备忘录ID到localStorage
      const selectedIds = this.selectedMemos.map(memo => memo.id)
      localStorage.setItem('batch_sign_memo_ids', JSON.stringify(selectedIds))
      
      // 跳转到签字页面
      this.$router.push({
        path: '/signature',
        query: { 
          returnTo: this.$route.fullPath,
          batch: 'true'
        }
      })
    },

    // 检查批量签字结果
    checkBatchSignResult() {
      const batchSignResult = localStorage.getItem('batch_sign_result')
      if (batchSignResult) {
        const result = JSON.parse(batchSignResult)
        ElMessage.success(`批量签字完成，成功为 ${result.count} 份备忘录签字`)
        localStorage.removeItem('batch_sign_result')
        localStorage.removeItem('batch_sign_memo_ids')
        this.clearSelection()
        this.fetchMemoList()
      }
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


.search-row {
  margin-bottom: 16px;
}

.filter-actions {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.filter-actions .el-button {
  margin: 0;
  flex: 1;
}

.action-buttons-row {
  display: flex;
  justify-content: center;
  gap: 16px;
  flex-wrap: wrap;
  align-items: center;
  padding: 0 20px;
}

.action-buttons-row .el-button {
  margin: 0;
  min-width: 100px;
  padding: 8px 16px;
}

.list-card .card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 15px;
}

.selected-count {
  color: #409eff;
  font-size: 14px;
  font-weight: 500;
  background: #ecf5ff;
  padding: 2px 8px;
  border-radius: 12px;
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

/* 移除签字状态列右侧边框 */
:deep(.no-right-border) {
  border-right: none !important;
}

:deep(.no-right-border .cell) {
  border-right: none !important;
}

/* 表格操作列按钮在同一行显示 */
.table-action-buttons {
  display: flex;
  gap: 6px;
  justify-content: center;
  align-items: center;
  white-space: nowrap;
}

/* 筛选输入框样式优化 */
.search-row :deep(.el-input) {
  transition: all 0.3s ease;
}

.search-row :deep(.el-input__wrapper) {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
}

.search-row :deep(.el-input__wrapper:hover) {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.search-row :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.15);
  border-color: #409eff;
}

/* 创建人姓名筛选器特殊样式 */
.search-row :deep(.el-input__prefix) {
  color: #409eff;
  transition: all 0.3s ease;
}

.search-row :deep(.el-input:hover .el-input__prefix) {
  color: #337ecc;
}

.table-action-buttons .el-button {
  margin: 0;
  padding: 3px 6px;
  font-size: 11px;
  min-width: auto;
}


/* 移动端优先设计 - 针对手机用户优化 */
@media (max-width: 768px) {
  .memo-list {
    padding: 4px;
    max-width: 100vw;
    overflow-x: hidden;
  }
  
  .search-card {
    margin-bottom: 8px;
    border-radius: 8px;
  }
  
  .search-card :deep(.el-card__body) {
    padding: 12px;
  }
  
  .search-row {
    margin-bottom: 10px;
  }
  
  /* 筛选器垂直布局，每行一个 */
  .search-row .el-col {
    margin-bottom: 8px;
  }
  
  .search-row .el-input,
  .search-row .el-date-picker {
    width: 100% !important;
    font-size: 16px; /* 防止iOS缩放 */
  }
  
  .filter-actions {
    margin-top: 8px;
  }
  
  .filter-actions .el-button {
    height: 44px;
    font-size: 16px;
    font-weight: 500;
  }
  
  /* 操作按钮行优化 */
  .action-buttons-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    padding: 0 8px;
    margin-bottom: 8px;
  }
  
  .action-buttons-row .el-button {
    margin: 0;
    height: 44px;
    font-size: 15px;
    font-weight: 500;
    border-radius: 8px;
    flex: none;
  }
  
  /* 列表卡片 */
  .list-card {
    border-radius: 8px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  }
  
  .list-card :deep(.el-card__body) {
    padding: 8px;
  }
  
  .list-card :deep(.el-card__header) {
    padding: 12px;
    border-bottom: 1px solid #f0f0f0;
  }
  
  .list-card .card-header {
    font-size: 16px;
    font-weight: 600;
  }
  
  .selected-count {
    font-size: 13px;
    padding: 4px 8px;
  }
  
  .total-count {
    font-size: 13px;
    font-weight: 500;
  }
  
  /* 表格完全重构为移动端卡片式布局 */
  :deep(.el-table) {
    border: none;
    background: transparent;
  }
  
  :deep(.el-table__header-wrapper) {
    display: none; /* 隐藏表头 */
  }
  
  :deep(.el-table__body-wrapper) {
    border: none;
  }
  
  :deep(.el-table__body) {
    width: 100%;
  }
  
  :deep(.el-table__row) {
    display: block;
    margin-bottom: 12px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    border: 1px solid #f0f0f0;
    overflow: hidden;
  }
  
  :deep(.el-table__row:hover) {
    background-color: white;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  }
  
  :deep(.el-table__row td) {
    display: block;
    border: none;
    padding: 0;
    text-align: left;
  }
  
  /* 选择框单独一行 */
  :deep(.el-table__row td:first-child) {
    position: absolute;
    top: 8px;
    right: 8px;
    z-index: 10;
    width: auto;
    background: rgba(255, 255, 255, 0.9);
    border-radius: 4px;
    padding: 4px;
  }
  
  /* 备忘录卡片内容布局 */
  :deep(.el-table__row td:nth-child(2)) {
    padding: 12px;
    padding-top: 40px; /* 为选择框留空间 */
    font-size: 16px;
    font-weight: 600;
    color: #303133;
    border-bottom: 1px solid #f5f5f5;
  }
  
  :deep(.el-table__row td:nth-child(2):before) {
    content: '编号: ';
    font-size: 12px;
    color: #909399;
    font-weight: normal;
  }
  
  :deep(.el-table__row td:nth-child(3)) {
    padding: 8px 12px;
    font-size: 14px;
    color: #606266;
    border-bottom: 1px solid #f5f5f5;
  }
  
  :deep(.el-table__row td:nth-child(3):before) {
    content: '使用单位: ';
    font-size: 12px;
    color: #909399;
    font-weight: 500;
  }
  
  :deep(.el-table__row td:nth-child(4)) {
    padding: 8px 12px;
    font-size: 14px;
    color: #606266;
    border-bottom: 1px solid #f5f5f5;
  }
  
  :deep(.el-table__row td:nth-child(4):before) {
    content: '登记证号: ';
    font-size: 12px;
    color: #909399;
    font-weight: 500;
  }
  
  :deep(.el-table__row td:nth-child(5)) {
    padding: 8px 12px;
    font-size: 14px;
    color: #606266;
    border-bottom: 1px solid #f5f5f5;
  }
  
  :deep(.el-table__row td:nth-child(5):before) {
    content: '设备品种: ';
    font-size: 12px;
    color: #909399;
    font-weight: 500;
  }
  
  :deep(.el-table__row td:nth-child(6)),
  :deep(.el-table__row td:nth-child(7)),
  :deep(.el-table__row td:nth-child(8)) {
    display: inline-block;
    width: 33.33%;
    padding: 8px 12px;
    font-size: 13px;
    vertical-align: top;
    border-bottom: 1px solid #f5f5f5;
  }
  
  :deep(.el-table__row td:nth-child(6):before) {
    content: '不符合情况';
    display: block;
    font-size: 11px;
    color: #909399;
    margin-bottom: 4px;
  }
  
  :deep(.el-table__row td:nth-child(7):before) {
    content: '检测日期';
    display: block;
    font-size: 11px;
    color: #909399;
    margin-bottom: 4px;
  }
  
  :deep(.el-table__row td:nth-child(8):before) {
    content: '签字状态';
    display: block;
    font-size: 11px;
    color: #909399;
    margin-bottom: 4px;
  }
  
  /* 操作按钮区域 */
  :deep(.el-table__row td:last-child) {
    padding: 12px;
    background: #fafafa;
    text-align: center;
  }
  
  .table-action-buttons {
    display: flex;
    gap: 12px;
    justify-content: center;
  }
  
  .table-action-buttons .el-button {
    flex: 1;
    margin: 0;
    height: 40px;
    font-size: 15px;
    font-weight: 500;
    border-radius: 6px;
  }
  
  /* 标签优化 */
  :deep(.el-tag) {
    font-size: 12px;
    padding: 4px 8px;
    border-radius: 4px;
    font-weight: 500;
  }
  
  /* 分页优化 */
  .pagination-container {
    margin-top: 16px;
    padding: 0 8px;
  }
  
  :deep(.el-pagination) {
    justify-content: center;
    flex-wrap: wrap;
  }
  
  :deep(.el-pagination .el-pagination__total) {
    order: -1;
    width: 100%;
    text-align: center;
    margin-bottom: 12px;
    font-size: 14px;
    color: #606266;
  }
  
  :deep(.el-pagination .el-pagination__sizes) {
    display: none;
  }
  
  :deep(.el-pagination .el-pagination__jump) {
    display: none;
  }
  
  :deep(.el-pagination .el-pager),
  :deep(.el-pagination .btn-prev),
  :deep(.el-pagination .btn-next) {
    margin: 2px;
  }
  
  :deep(.el-pagination .el-pager li),
  :deep(.el-pagination .btn-prev),
  :deep(.el-pagination .btn-next) {
    min-width: 40px;
    height: 40px;
    line-height: 38px;
    font-size: 15px;
    border-radius: 6px;
  }
}

/* 超小屏幕优化 */
@media (max-width: 480px) {
  .memo-list {
    padding: 2px;
  }
  
  .action-buttons-row {
    grid-template-columns: 1fr;
    gap: 6px;
  }
  
  .action-buttons-row .el-button {
    height: 40px;
    font-size: 14px;
  }
  
  :deep(.el-table__row td:nth-child(2)) {
    font-size: 15px;
    padding-top: 36px;
  }
  
  :deep(.el-table__row td:nth-child(6)),
  :deep(.el-table__row td:nth-child(7)),
  :deep(.el-table__row td:nth-child(8)) {
    width: 50%;
    font-size: 12px;
  }
  
  :deep(.el-table__row td:nth-child(8)) {
    width: 100%;
  }
  
  .table-action-buttons .el-button {
    height: 36px;
    font-size: 14px;
  }
}
</style>