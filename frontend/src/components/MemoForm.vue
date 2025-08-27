<template>
  <div class="memo-form">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="140px"
      label-position="left"
    >
      <!-- 备忘录编号 -->
      <el-form-item label="备忘录编号" prop="memo_number">
        <el-input
          v-model="formData.memo_number"
          placeholder="请输入备忘录编号"
          maxlength="20"
          show-word-limit
          style="width: 300px"
        />
      </el-form-item>

      <!-- 使用单位名称 -->
      <el-form-item label="使用单位名称" prop="user_unit_name">
        <el-input
          v-model="formData.user_unit_name"
          placeholder="请输入使用单位名称"
          maxlength="255"
          show-word-limit
        />
      </el-form-item>

      <!-- 安装地点 -->
      <el-form-item label="安装地点" prop="installation_location">
        <el-input
          v-model="formData.installation_location"
          type="textarea"
          :rows="2"
          placeholder="请输入安装地点"
          maxlength="500"
          show-word-limit
        />
      </el-form-item>

      <!-- 设备品种 -->
      <el-form-item label="设备品种" prop="equipment_type">
        <el-select
          v-model="formData.equipment_type"
          placeholder="请选择设备品种"
          style="width: 200px"
          clearable
        >
          <el-option label="曳引驱动乘客电梯" value="曳引驱动乘客电梯" />
          <el-option label="曳引驱动载货电梯" value="曳引驱动载货电梯" />
          <el-option label="杂物电梯" value="杂物电梯" />
          <el-option label="自动扶梯" value="自动扶梯" />
          <el-option label="自动人行道" value="自动人行道" />
          <el-option label="强制驱动载货电梯" value="强制驱动载货电梯" />
          <el-option label="液压乘客电梯" value="液压乘客电梯" />
          <el-option label="液压载货电梯" value="液压载货电梯" />
          <el-option label="防爆电梯" value="防爆电梯" />
          <el-option label="消防员电梯" value="消防员电梯" />
        </el-select>
      </el-form-item>

      <!-- 产品编号 -->
      <el-form-item label="产品编号" prop="product_number" required>
        <el-input
          v-model="formData.product_number"
          placeholder="请输入产品编号"
          style="width: 300px"
        />
      </el-form-item>

      <!-- 使用登记证编号 -->
      <el-form-item label="使用登记证编号" prop="registration_cert_no" required>
        <el-input
          v-model="formData.registration_cert_no"
          placeholder="请输入使用登记证编号"
          style="width: 300px"
        />
      </el-form-item>

      <!-- 不符合情况 -->
      <el-form-item label="不符合情况" prop="non_conformance_status">
        <el-radio-group v-model="formData.non_conformance_status">
          <el-radio :label="0">无</el-radio>
          <el-radio :label="1">该电梯存在不符合，建议立即整改。</el-radio>
          <el-radio :label="2">该电梯存在较严重的不符合，建议立即停用整改。</el-radio>
        </el-radio-group>
      </el-form-item>

      <!-- 相关建议 -->
      <el-form-item 
        v-if="formData.non_conformance_status !== 0" 
        label="相关建议" 
        prop="recommendations"
      >
        <el-input
          v-model="formData.recommendations"
          type="textarea"
          :rows="4"
          placeholder="请输入具体的整改建议和要求..."
          maxlength="1000"
          show-word-limit
        />
      </el-form-item>

      <!-- 检测人员签名 -->
      <el-form-item label="检测人员签名" prop="tester_signature_path" required>
        <div class="signature-upload">
          <!-- 普通用户只读模式 -->
          <div v-if="isUserSignatureReadonly">
            <div v-if="formData.tester_signature_path" class="signature-preview readonly">
              <img 
                :src="getImageUrl(formData.tester_signature_path)" 
                alt="检测人员签名"
                class="signature-image"
              />
              <div class="readonly-tip">
                <el-text size="small" type="info">
                  <el-icon><Lock /></el-icon>
                  普通用户签名已自动导入，无法修改
                </el-text>
              </div>
            </div>
            <div v-else class="no-signature-warning">
              <el-alert
                title="未找到默认签名"
                description="请联系管理员为您上传电子签名"
                type="warning"
                show-icon
                :closable="false"
              />
            </div>
          </div>
          
          <!-- 管理员可编辑模式 -->
          <div v-else>
            <el-upload
              ref="uploadRef"
              :before-upload="beforeUpload"
              :on-success="handleUploadSuccess"
              :on-error="handleUploadError"
              :show-file-list="false"
              accept="image/*"
              action="#"
              :http-request="customUpload"
            >
              <el-button type="primary" :icon="Upload" :loading="uploading">
                上传签名图片
              </el-button>
            </el-upload>
            
            <div v-if="formData.tester_signature_path" class="signature-preview">
              <img 
                :src="getImageUrl(formData.tester_signature_path)" 
                alt="检测人员签名"
                class="signature-image"
              />
              <el-button 
                size="small" 
                type="danger" 
                @click="removeSignature"
                :icon="Delete"
              >
                删除
              </el-button>
            </div>
            
            <div class="upload-tip">
              <el-text size="small" type="info">
                支持 jpg、png、gif 格式，文件大小不超过 5MB
              </el-text>
            </div>
          </div>
        </div>
      </el-form-item>


      <!-- 检测日期 -->
      <el-form-item label="检测日期" prop="inspection_date" required>
        <el-date-picker
          v-model="formData.inspection_date"
          type="date"
          placeholder="选择检测日期"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          style="width: 200px"
        />
      </el-form-item>


      <!-- 提交按钮 -->
      <el-form-item>
        <div class="form-actions">
          <el-button 
            type="primary" 
            @click="handleSubmit"
            :loading="submitting"
            :icon="Check"
          >
            {{ isEdit ? '更新备忘录' : '创建备忘录' }}
          </el-button>
          <el-button @click="handleCancel" :icon="Close">
            取消
          </el-button>
          <el-button 
            v-if="isEdit" 
            type="warning" 
            @click="generatePreview"
            :icon="View"
          >
            预览PDF
          </el-button>
        </div>
      </el-form-item>
    </el-form>
  </div>
</template>

<script>
import { getTodayDate, validators } from '@/utils'
import { memoApi } from '@/api/memo'
import { auth } from '@/api/auth'
import { useAuthStore } from '@/stores/auth'
import { 
  Upload, 
  Delete, 
  Check, 
  Close, 
  View,
  Lock
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

export default {
  name: 'MemoForm',
  components: {
    Upload,
    Delete,
    Check,
    Close,
    View,
    Lock
  },
  props: {
    isEdit: {
      type: Boolean,
      default: false
    },
    memoData: {
      type: Object,
      default: () => ({})
    }
  },
  emits: ['submit', 'cancel'],
  data() {
    return {
      formData: {
        memo_number: '',
        user_unit_name: '',
        installation_location: '',
        equipment_type: '',
        product_number: '',
        registration_cert_no: '',
        non_conformance_status: 0,
        recommendations: '',
        tester_signature_path: '',
        inspection_date: getTodayDate(),
      },
      rules: {
        user_unit_name: [validators.required('请输入使用单位名称')],
        installation_location: [validators.required('请输入安装地点')],
        equipment_type: [validators.required('请选择设备品种')],
        product_number: [validators.required('请输入产品编号')],
        registration_cert_no: [validators.required('请输入使用登记证编号')],
        non_conformance_status: [validators.required('请选择不符合情况')],
        tester_signature_path: [validators.required('请上传检测人员签名')],
        inspection_date: [validators.required('请选择检测日期')]
      },
      uploading: false,
      submitting: false,
      authStore: useAuthStore(),
      isUserSignatureReadonly: false,
      userDefaultSignature: null
    }
  },
  async created() {
    // 如果是编辑模式，填充表单数据
    if (this.isEdit && this.memoData) {
      Object.assign(this.formData, this.memoData)
    } else {
      // 新建模式，生成备忘录编号
      this.generateMemoNumber()
    }

    // 检查用户角色，如果是普通用户则加载默认签名
    await this.loadUserSignatureSettings()
  },
  
  mounted() {
    // 检查是否有从签名页面返回的签名数据
    this.checkForSignatureData()
  },
  methods: {
    // 生成备忘录编号（新格式：03TCC0120241253）
    generateMemoNumber() {
      const now = new Date()
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, '0')
      
      // 生成四位随机数
      const randomNum = Math.floor(Math.random() * 9000) + 1000 // 1000-9999
      
      // 格式：03TCC + 月份 + 年份 + 四位随机数
      this.formData.memo_number = `03TCC${month}${year}${randomNum}`
    },

    // 文件上传前验证
    beforeUpload(file) {
      const isImage = file.type.startsWith('image/')
      const isLt5M = file.size / 1024 / 1024 < 5

      if (!isImage) {
        ElMessage.error('只能上传图片文件!')
        return false
      }
      if (!isLt5M) {
        ElMessage.error('上传文件大小不能超过 5MB!')
        return false
      }
      return true
    },

    // 自定义上传
    async customUpload(options) {
      this.uploading = true
      try {
        const response = await memoApi.uploadTesterSignature(options.file)
        this.handleUploadSuccess(response)
      } catch (error) {
        this.handleUploadError(error)
      } finally {
        this.uploading = false
      }
    },

    // 上传成功
    handleUploadSuccess(response) {
      this.formData.tester_signature_path = response.filePath
      ElMessage.success('签名图片上传成功')
    },

    // 上传失败
    handleUploadError(error) {
      console.error('上传失败:', error)
      ElMessage.error('签名图片上传失败')
    },

    // 删除签名图片
    removeSignature() {
      this.formData.tester_signature_path = ''
    },

    // 获取图片URL
    getImageUrl(path) {
      console.log('getImageUrl 输入路径:', path)
      if (!path) {
        console.log('路径为空，返回空字符串')
        return ''
      }
      if (path.startsWith('http://') || path.startsWith('https://')) {
        console.log('完整URL，直接返回:', path)
        return path
      }
      if (path.startsWith('/')) {
        const result = `http://localhost:3000${path}`
        console.log('绝对路径，返回:', result)
        return result
      }
      // 处理相对路径，添加前缀
      const result = `http://localhost:3000/${path}`
      console.log('相对路径，返回:', result)
      return result
    },


    // 检查签名数据
    checkForSignatureData() {
      // 恢复表单数据
      const savedFormData = localStorage.getItem('memo_form_data')
      if (savedFormData) {
        try {
          const parsedData = JSON.parse(savedFormData)
          // 只恢复非编辑模式的数据，避免覆盖已有数据
          if (!this.isEdit || !this.memoData) {
            Object.assign(this.formData, parsedData)
          }
          localStorage.removeItem('memo_form_data')
        } catch (error) {
          console.error('恢复表单数据失败:', error)
        }
      }
      
    },

    // 加载用户签名设置
    async loadUserSignatureSettings() {
      try {
        const currentUser = this.authStore.user
        console.log('当前用户信息:', currentUser)
        if (!currentUser) return

        // 如果是普通用户，设置为只读并加载默认签名
        if (currentUser.role === 'user') {
          this.isUserSignatureReadonly = true
          console.log('普通用户，开始加载默认签名')
          
          // 获取用户的默认签名
          const response = await auth.getUserSignatures()
          console.log('签名API响应:', response)
          const signatures = response.signatures || []
          console.log('用户签名列表:', signatures)
          this.userDefaultSignature = signatures.find(sig => sig.is_default)
          console.log('找到的默认签名:', this.userDefaultSignature)
          
          // 如果有默认签名且当前没有签名路径，自动设置
          if (this.userDefaultSignature && !this.formData.tester_signature_path) {
            this.formData.tester_signature_path = this.userDefaultSignature.file_path
            console.log('自动设置签名路径:', this.formData.tester_signature_path)
          }
        } else {
          // 管理员可以自由上传签名
          console.log('管理员用户，可以自由上传签名')
          this.isUserSignatureReadonly = false
        }
      } catch (error) {
        console.error('加载用户签名设置失败:', error)
        // 如果获取签名失败，仍然设置为只读（对于普通用户）
        if (this.authStore.user?.role === 'user') {
          this.isUserSignatureReadonly = true
        }
      }
    },

    // 表单提交
    async handleSubmit() {
      try {
        await this.$refs.formRef.validate()
        
        this.submitting = true
        this.$emit('submit', this.formData)
      } catch (error) {
        ElMessage.error('请检查表单填写是否完整')
      } finally {
        this.submitting = false
      }
    },

    // 取消操作
    handleCancel() {
      this.$emit('cancel')
    },

    // 生成预览（仅编辑模式）
    async generatePreview() {
      if (!this.isEdit || !this.memoData.id) return
      
      try {
        const response = await memoApi.generatePDF(this.memoData.id)
        const blob = new Blob([response], { type: 'application/pdf' })
        const url = URL.createObjectURL(blob)
        window.open(url, '_blank')
      } catch (error) {
        console.error('生成预览失败:', error)
        ElMessage.error('生成预览失败')
      }
    }
  }
}
</script>

<style scoped>
.memo-form {
  max-width: 800px;
}

.signature-upload {
  width: 100%;
}

.signature-preview {
  margin-top: 10px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.signature-image {
  max-width: 200px;
  max-height: 100px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
}

.upload-tip {
  margin-top: 5px;
}

.signature-preview.readonly {
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  padding: 15px;
  margin-top: 10px;
}

.readonly-tip {
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 4px;
  color: #6c757d;
}

.readonly-tip .el-icon {
  font-size: 14px;
}

.no-signature-warning {
  margin-top: 10px;
}


.form-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-start;
}

/* 移动端优先表单设计 */
@media (max-width: 768px) {
  .memo-form {
    padding: 0;
    max-width: 100%;
  }
  
  :deep(.el-form) {
    max-width: 100%;
    padding: 16px;
    background: white;
    border-radius: 12px;
    margin-bottom: 12px;
  }
  
  /* 表单项优化 */
  :deep(.el-form-item) {
    margin-bottom: 20px;
  }
  
  :deep(.el-form-item__label) {
    font-size: 15px;
    font-weight: 600;
    color: #303133;
    line-height: 1.4;
    margin-bottom: 8px;
    padding: 0 !important;
    text-align: left !important;
    width: 100% !important;
  }
  
  :deep(.el-form-item__content) {
    margin-left: 0 !important;
    width: 100%;
  }
  
  /* 输入框优化 */
  :deep(.el-input),
  :deep(.el-textarea),
  :deep(.el-select),
  :deep(.el-date-picker) {
    width: 100% !important;
  }
  
  :deep(.el-input__inner),
  :deep(.el-textarea__inner),
  :deep(.el-select__input),
  :deep(.el-date-picker__editor) {
    font-size: 16px !important; /* 防止iOS缩放 */
    height: 48px;
    line-height: 48px;
    border-radius: 8px;
    border: 2px solid #e1e5e9;
    padding: 0 16px;
    transition: all 0.3s ease;
  }
  
  :deep(.el-input__inner:focus),
  :deep(.el-textarea__inner:focus),
  :deep(.el-select__input:focus) {
    border-color: #409eff;
    box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
  }
  
  :deep(.el-textarea .el-textarea__inner) {
    height: auto;
    min-height: 80px;
    padding: 12px 16px;
    line-height: 1.5;
    resize: vertical;
  }
  
  /* 选择框优化 */
  :deep(.el-select) {
    position: relative;
  }
  
  :deep(.el-select .el-input .el-input__inner) {
    height: 48px;
    line-height: 48px;
  }
  
  :deep(.el-select .el-input .el-input__suffix) {
    height: 48px;
    line-height: 48px;
  }
  
  /* 单选框优化 */
  :deep(.el-radio-group) {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    margin-top: 8px;
  }
  
  :deep(.el-radio) {
    margin: 0;
    padding: 12px 16px;
    border: 2px solid #e1e5e9;
    border-radius: 8px;
    background: white;
    transition: all 0.3s ease;
    min-height: 48px;
    display: flex;
    align-items: center;
  }
  
  :deep(.el-radio.is-checked) {
    border-color: #409eff;
    background: rgba(64, 158, 255, 0.05);
  }
  
  :deep(.el-radio__input) {
    margin-right: 8px;
  }
  
  :deep(.el-radio__label) {
    font-size: 15px;
    color: #303133;
    font-weight: 500;
  }
  
  /* 文件上传优化 */
  .signature-upload {
    margin-top: 12px;
  }
  
  :deep(.el-upload) {
    width: 100%;
  }
  
  :deep(.el-upload-dragger) {
    width: 100% !important;
    height: 120px;
    border: 2px dashed #d9d9d9;
    border-radius: 8px;
    background: #fafafa;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
  }
  
  :deep(.el-upload-dragger:hover) {
    border-color: #409eff;
    background: rgba(64, 158, 255, 0.02);
  }
  
  :deep(.el-upload-dragger .el-icon) {
    font-size: 32px;
    color: #c0c4cc;
    margin-bottom: 8px;
  }
  
  :deep(.el-upload-dragger .el-upload__text) {
    font-size: 14px;
    color: #606266;
    text-align: center;
  }
  
  /* 签名预览优化 */
  .signature-preview {
    margin-top: 12px;
    padding: 12px;
    background: #f8f9fa;
    border-radius: 8px;
    border: 1px solid #e9ecef;
  }
  
  .signature-image {
    max-width: 100%;
    max-height: 120px;
    border-radius: 6px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
  
  .upload-tip {
    margin-top: 8px;
    font-size: 13px;
    color: #909399;
    text-align: center;
  }
  
  /* 表单操作按钮 */
  .form-actions {
    display: flex;
    gap: 12px;
    justify-content: space-between;
    margin-top: 24px;
    padding: 16px;
    background: #f8f9fa;
    border-radius: 8px;
    position: sticky;
    bottom: 0;
    z-index: 100;
    box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
  }
  
  .form-actions .el-button {
    flex: 1;
    height: 48px;
    font-size: 16px;
    font-weight: 600;
    border-radius: 8px;
    margin: 0;
    min-width: 0;
  }
  
  .form-actions .el-button--primary {
    background: linear-gradient(135deg, #409eff 0%, #3a8ee6 100%);
    border: none;
    box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);
  }
  
  .form-actions .el-button--primary:hover {
    background: linear-gradient(135deg, #3a8ee6 0%, #337ecc 100%);
    transform: translateY(-1px);
  }
  
  /* 只读模式优化 */
  .readonly-tip {
    margin-top: 12px;
    padding: 12px;
    background: #e6f7ff;
    border: 1px solid #91d5ff;
    border-radius: 6px;
    color: #1890ff;
    font-size: 14px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .no-signature-warning {
    margin-top: 12px;
    padding: 12px;
    background: #fff7e6;
    border: 1px solid #ffd591;
    border-radius: 6px;
    color: #fa8c16;
    font-size: 14px;
  }
}

/* 超小屏幕优化 */
@media (max-width: 480px) {
  :deep(.el-form) {
    padding: 12px;
  }
  
  :deep(.el-form-item) {
    margin-bottom: 16px;
  }
  
  :deep(.el-form-item__label) {
    font-size: 14px;
  }
  
  :deep(.el-input__inner),
  :deep(.el-textarea__inner),
  :deep(.el-select__input) {
    height: 44px;
    line-height: 44px;
    font-size: 15px !important;
  }
  
  :deep(.el-select .el-input .el-input__inner) {
    height: 44px;
    line-height: 44px;
  }
  
  :deep(.el-radio) {
    padding: 10px 12px;
    min-height: 44px;
  }
  
  :deep(.el-upload-dragger) {
    height: 100px;
  }
  
  .form-actions .el-button {
    height: 44px;
    font-size: 15px;
  }
  
  :deep(.el-textarea__inner) {
    padding: 8px 12px;
    font-size: 14px;
    line-height: 1.4;
  }
  
  /* 选择器手机端优化 */
  :deep(.el-select) {
    width: 100% !important;
  }
  
  :deep(.el-date-picker) {
    width: 100% !important;
  }
  
  /* 单选按钮组手机端优化 */
  :deep(.el-radio-group) {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  :deep(.el-radio) {
    margin-right: 0;
    margin-bottom: 5px;
    font-size: 13px;
    line-height: 1.3;
  }
  
  :deep(.el-radio__label) {
    font-size: 13px;
    line-height: 1.3;
  }
  
  /* 签名相关手机端优化 */
  .signature-upload {
    width: 100%;
  }
  
  /* 表单操作按钮手机端优化 */
  .form-actions {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
    margin-top: 20px;
  }
  
  .form-actions .el-button {
    width: 100%;
    padding: 10px;
    font-size: 14px;
  }
  
  /* 上传提示手机端优化 */
  .upload-tip {
    text-align: left;
  }
  
  :deep(.el-upload) {
    width: 100%;
  }
  
  :deep(.el-upload .el-button) {
    width: 100%;
  }
}
</style>