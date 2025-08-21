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
          placeholder="自动生成"
          readonly
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
          <el-option label="客梯" value="客梯" />
          <el-option label="货梯" value="货梯" />
          <el-option label="医用电梯" value="医用电梯" />
          <el-option label="观光电梯" value="观光电梯" />
          <el-option label="载货电梯" value="载货电梯" />
          <el-option label="其他" value="其他" />
        </el-select>
      </el-form-item>

      <!-- 产品编号 -->
      <el-form-item label="产品编号" prop="product_number">
        <el-input
          v-model="formData.product_number"
          placeholder="请输入产品编号"
          style="width: 300px"
        />
      </el-form-item>

      <!-- 使用登记证编号 -->
      <el-form-item label="使用登记证编号" prop="registration_cert_no">
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
          <el-radio :label="1">存在不符合</el-radio>
          <el-radio :label="2">存在较严重不符合</el-radio>
        </el-radio-group>
      </el-form-item>

      <!-- 检测人员签名 -->
      <el-form-item label="检测人员签名" prop="tester_signature">
        <div class="signature-upload">
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
      </el-form-item>

      <!-- 使用单位代表签名 -->
      <el-form-item label="使用单位代表签名" prop="representative_signature">
        <div class="electronic-signature">
          <SignaturePad 
            ref="signaturePadRef"
            @signature-updated="handleSignatureUpdated"
            :initial-signature="formData.representative_signature"
          />
          <div class="signature-actions">
            <el-button @click="clearSignature" :icon="Refresh">清除签名</el-button>
          </div>
        </div>
      </el-form-item>

      <!-- 检测日期 -->
      <el-form-item label="检测日期" prop="inspection_date">
        <el-date-picker
          v-model="formData.inspection_date"
          type="date"
          placeholder="选择检测日期"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          style="width: 200px"
        />
      </el-form-item>

      <!-- 签收日期 -->
      <el-form-item label="签收日期" prop="signing_date">
        <el-date-picker
          v-model="formData.signing_date"
          type="date"
          placeholder="签名后自动填入"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          style="width: 200px"
          readonly
        />
        <el-text size="small" type="info" style="margin-left: 10px">
          完成使用单位代表签名后自动填入当前日期
        </el-text>
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
import SignaturePad from '@/components/SignaturePad.vue'
import { 
  Upload, 
  Delete, 
  Refresh, 
  Check, 
  Close, 
  View 
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

export default {
  name: 'MemoForm',
  components: {
    SignaturePad,
    Upload,
    Delete,
    Refresh,
    Check,
    Close,
    View
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
        tester_signature_path: '',
        representative_signature: '',
        inspection_date: getTodayDate(),
        signing_date: ''
      },
      rules: {
        user_unit_name: [validators.required('请输入使用单位名称')],
        installation_location: [validators.required('请输入安装地点')],
        equipment_type: [validators.required('请选择设备品种')],
        non_conformance_status: [validators.required('请选择不符合情况')]
      },
      uploading: false,
      submitting: false
    }
  },
  created() {
    // 如果是编辑模式，填充表单数据
    if (this.isEdit && this.memoData) {
      Object.assign(this.formData, this.memoData)
    } else {
      // 新建模式，生成备忘录编号
      this.generateMemoNumber()
    }
  },
  methods: {
    // 生成备忘录编号
    generateMemoNumber() {
      const now = new Date()
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, '0')
      const day = String(now.getDate()).padStart(2, '0')
      const timestamp = now.getTime()
      
      this.formData.memo_number = `MEMO-${year}${month}${day}-${timestamp}`
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
      if (path.startsWith('/')) {
        return `http://localhost:3000${path}`
      }
      return path
    },

    // 签名更新
    handleSignatureUpdated(signatureData) {
      this.formData.representative_signature = signatureData
      
      // 如果签名完成且之前没有签收日期，自动设置签收日期
      if (signatureData && !this.formData.signing_date) {
        this.formData.signing_date = getTodayDate()
      } else if (!signatureData) {
        // 如果清除了签名，也清除签收日期
        this.formData.signing_date = ''
      }
    },

    // 清除电子签名
    clearSignature() {
      if (this.$refs.signaturePadRef) {
        this.$refs.signaturePadRef.clear()
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

.electronic-signature {
  width: 100%;
}

.signature-actions {
  margin-top: 10px;
}

.form-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-start;
}

/* 响应式设计 */
@media (max-width: 768px) {
  :deep(.el-form-item__label) {
    width: 120px !important;
  }
  
  .form-actions {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .form-actions .el-button {
    width: 100%;
  }
}
</style>