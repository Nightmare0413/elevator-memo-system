<template>
  <div class="profile-container">
    <el-card class="profile-card">
      <template #header>
        <div class="card-header">
          <span>个人信息</span>
        </div>
      </template>
      
      <el-form 
        :model="profileForm" 
        :rules="rules"
        ref="profileFormRef"
        label-width="120px"
        class="profile-form"
      >
        <el-form-item label="用户名">
          <el-input v-model="profileForm.username" disabled />
        </el-form-item>
        
        <el-form-item label="真实姓名" prop="full_name">
          <el-input v-model="profileForm.full_name" :disabled="!isEditing" />
        </el-form-item>
        
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="profileForm.phone" :disabled="!isEditing" placeholder="请输入手机号（可选）" />
        </el-form-item>
        
        <el-form-item label="角色">
          <el-tag :type="profileForm.role === 'admin' ? 'danger' : 'primary'">
            {{ profileForm.role === 'admin' ? '管理员' : '普通用户' }}
          </el-tag>
        </el-form-item>
        
        <el-form-item label="注册时间">
          <el-input :value="formatDate(profileForm.created_at)" disabled />
        </el-form-item>
        
        <el-form-item v-if="isEditing" class="edit-actions-group">
          <div class="edit-actions-buttons">
            <el-button type="primary" @click="saveProfile" :loading="saving" class="edit-action-button">
              保存修改
            </el-button>
            <el-button @click="cancelEdit" class="edit-action-button">
              取消
            </el-button>
          </div>
        </el-form-item>
        
        <div v-if="!isEditing" class="mobile-buttons-container">
          <el-button type="primary" @click="startEdit" class="mobile-primary-button">
            编辑信息
          </el-button>
          <div class="mobile-secondary-buttons">
            <el-button @click="showPasswordDialog = true" class="mobile-secondary-button">
              修改密码
            </el-button>
            <el-button @click="goHome" class="mobile-secondary-button back-button">
              <el-icon><ArrowLeft /></el-icon>
              返回主页
            </el-button>
          </div>
        </div>
      </el-form>
    </el-card>
    
    <!-- 修改密码对话框 -->
    <el-dialog 
      v-model="showPasswordDialog" 
      title="修改密码" 
      width="400px"
      @close="resetPasswordForm"
    >
      <el-form 
        :model="passwordForm" 
        :rules="passwordRules"
        ref="passwordFormRef"
        label-width="100px"
      >
        <el-form-item label="当前密码" prop="currentPassword">
          <el-input 
            v-model="passwordForm.currentPassword" 
            type="password" 
            show-password
            placeholder="请输入当前密码"
          />
        </el-form-item>
        
        <el-form-item label="新密码" prop="newPassword">
          <el-input 
            v-model="passwordForm.newPassword" 
            type="password" 
            show-password
            placeholder="请输入新密码"
          />
        </el-form-item>
        
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input 
            v-model="passwordForm.confirmPassword" 
            type="password" 
            show-password
            placeholder="请再次输入新密码"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showPasswordDialog = false">取消</el-button>
        <el-button type="primary" @click="changePassword" :loading="changingPassword">
          确认修改
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { auth } from '@/api/auth'
import { ArrowLeft } from '@element-plus/icons-vue'

const router = useRouter()
const authStore = useAuthStore()

const isEditing = ref(false)
const saving = ref(false)
const showPasswordDialog = ref(false)
const changingPassword = ref(false)

const profileFormRef = ref()
const passwordFormRef = ref()

// 个人信息表单
const profileForm = reactive({
  username: '',
  full_name: '',
  phone: '',
  role: '',
  created_at: ''
})

// 原始数据备份
const originalProfile = reactive({})

// 密码修改表单
const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// 表单验证规则
const rules = {
  full_name: [
    { required: true, message: '请输入真实姓名', trigger: 'blur' }
  ],
  phone: [
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号格式', trigger: 'blur' }
  ]
}

const passwordRules = {
  currentPassword: [
    { required: true, message: '请输入当前密码', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== passwordForm.newPassword) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

// 返回主页
const goHome = () => {
  router.push({ name: 'MemoList' })
}

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleString('zh-CN')
}

// 加载用户信息
const loadUserProfile = async () => {
  try {
    const response = await auth.getCurrentUser()
    const userData = response.user
    
    Object.assign(profileForm, userData)
    Object.assign(originalProfile, userData)
  } catch (error) {
    ElMessage.error('加载用户信息失败')
  }
}

// 开始编辑
const startEdit = () => {
  isEditing.value = true
}

// 取消编辑
const cancelEdit = () => {
  Object.assign(profileForm, originalProfile)
  isEditing.value = false
}

// 保存个人信息
const saveProfile = async () => {
  if (!profileFormRef.value) return
  
  try {
    await profileFormRef.value.validate()
    saving.value = true
    
    const response = await auth.updateProfile({
      full_name: profileForm.full_name,
      phone: profileForm.phone
    })
    
    // 更新store中的用户信息
    if (authStore.updateUser) {
      authStore.updateUser(response.user)
    }
    Object.assign(originalProfile, profileForm)
    
    isEditing.value = false
    ElMessage.success('个人信息更新成功')
  } catch (error) {
    if (error.errors) {
      // 表单验证错误
      return
    }
    ElMessage.error(error.message || '更新个人信息失败')
  } finally {
    saving.value = false
  }
}

// 修改密码
const changePassword = async () => {
  if (!passwordFormRef.value) return
  
  try {
    await passwordFormRef.value.validate()
    changingPassword.value = true
    
    // TODO: 实现修改密码API
    ElMessage.success('密码修改成功')
    showPasswordDialog.value = false
    resetPasswordForm()
  } catch (error) {
    if (error.errors) {
      // 表单验证错误
      return
    }
    ElMessage.error(error.message || '修改密码失败')
  } finally {
    changingPassword.value = false
  }
}

// 重置密码表单
const resetPasswordForm = () => {
  Object.assign(passwordForm, {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  if (passwordFormRef.value) {
    passwordFormRef.value.resetFields()
  }
}

onMounted(() => {
  loadUserProfile()
})
</script>

<style scoped>
.profile-container {
  max-width: 600px;
  margin: 0 auto;
}

.profile-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 18px;
  font-weight: bold;
}

/* 桌面端返回按钮样式 */
@media (min-width: 769px) {
  .back-button {
    background: #f5f7fa;
    border-color: #dcdfe6;
    color: #606266;
  }

  .back-button:hover {
    background: #ecf5ff;
    border-color: #409eff;
    color: #409eff;
  }
}

.profile-form {
  padding: 20px 0;
}

.el-form-item {
  margin-bottom: 20px;
}

.el-input:disabled {
  background-color: #f5f7fa;
}

.el-tag {
  font-size: 14px;
}

/* 编辑操作按钮样式 */
.edit-actions-buttons {
  display: flex;
  gap: 12px;
  justify-content: center;
  max-width: 320px;
  margin: 0 auto;
}

.edit-action-button {
  flex: 1;
  height: 40px;
  font-size: 14px;
  border-radius: 6px;
  min-width: 0;
  max-width: 150px;
}

/* 移动端按钮容器 */
.mobile-buttons-container {
  margin-top: 30px;
  padding: 0 20px;
}

/* 主按钮样式 */
.mobile-primary-button {
  width: 100%;
  height: 44px;
  font-size: 16px;
  font-weight: 500;
  border-radius: 8px;
  margin-bottom: 16px;
}

/* 次要按钮容器 */
.mobile-secondary-buttons {
  display: flex;
  gap: 12px;
  justify-content: space-between;
}

/* 次要按钮样式 */
.mobile-secondary-button {
  flex: 1;
  height: 40px;
  font-size: 14px;
  border-radius: 6px;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  color: #495057;
}

.mobile-secondary-button:hover {
  background: #e9ecef;
  border-color: #dee2e6;
}

.mobile-secondary-button.back-button {
  background: #fff;
  border-color: #dee2e6;
}

.mobile-secondary-button.back-button:hover {
  background: #f8f9fa;
  border-color: #adb5bd;
}

@media (max-width: 768px) {
  .profile-container {
    margin: 0 15px;
    max-width: none;
  }
  
  .profile-card {
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
  
  /* 移动端表单样式调整 */
  .profile-form {
    padding: 20px 0 10px 0;
  }
  
  .profile-form .el-form-item {
    margin-bottom: 20px;
  }
  
  .profile-form :deep(.el-form-item__label) {
    text-align: left !important;
    justify-content: flex-start !important;
    padding-right: 12px;
    font-weight: 500;
    color: #333;
    width: 80px !important;
    min-width: 80px !important;
    flex-shrink: 0;
  }
  
  .profile-form :deep(.el-form-item__content) {
    flex: 1;
    margin-left: 0 !important;
  }
  
  .profile-form :deep(.el-input__wrapper) {
    border-radius: 6px;
  }
  
  /* 编辑操作按钮移动端样式 */
  .edit-actions-group :deep(.el-form-item__content) {
    margin-left: 0 !important;
  }
  
  .edit-actions-buttons {
    gap: 10px;
    padding: 0 15px;
    max-width: 300px;
  }
  
  .edit-action-button {
    height: 44px;
    font-size: 15px;
  }
  
  /* 移动端按钮容器调整 */
  .mobile-buttons-container {
    margin-top: 20px;
    padding: 0 15px 20px;
  }
  
  .mobile-primary-button {
    height: 46px;
    font-size: 16px;
    font-weight: 600;
    box-shadow: 0 2px 4px rgba(64, 158, 255, 0.3);
  }
  
  .mobile-secondary-buttons {
    gap: 10px;
  }
  
  .mobile-secondary-button {
    height: 42px;
    font-size: 14px;
  }
  
  /* 小屏幕优化 */
  @media (max-width: 480px) {
    .profile-container {
      margin: 0 10px;
    }
    
    .edit-actions-buttons {
      gap: 8px;
      padding: 0 10px;
      max-width: 280px;
    }
    
    .profile-form :deep(.el-form-item__label) {
      width: 70px !important;
      min-width: 70px !important;
    }
    
    .edit-action-button {
      height: 42px;
      font-size: 14px;
    }
    
    .mobile-buttons-container {
      padding: 0 10px 15px;
    }
    
    .mobile-primary-button {
      height: 44px;
      font-size: 15px;
    }
    
    .mobile-secondary-button {
      height: 40px;
      font-size: 13px;
    }
    
    .mobile-secondary-buttons {
      gap: 8px;
    }
  }
  
  /* 超小屏幕优化 */
  @media (max-width: 360px) {
    .profile-container {
      margin: 0 8px;
    }
    
    .edit-actions-buttons {
      gap: 6px;
      padding: 0 8px;
      max-width: 260px;
    }
    
    .profile-form :deep(.el-form-item__label) {
      width: 65px !important;
      min-width: 65px !important;
      font-size: 13px;
    }
    
    .edit-action-button {
      height: 40px;
      font-size: 13px;
    }
    
    .mobile-primary-button {
      height: 42px;
      font-size: 14px;
    }
    
    .mobile-secondary-button {
      height: 38px;
      font-size: 12px;
    }
    
    .mobile-secondary-buttons {
      gap: 6px;
    }
  }
}
</style>