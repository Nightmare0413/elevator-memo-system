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
        
        <el-form-item v-if="isEditing">
          <el-button type="primary" @click="saveProfile" :loading="saving">
            保存修改
          </el-button>
          <el-button @click="cancelEdit">
            取消
          </el-button>
        </el-form-item>
        
        <el-form-item v-if="!isEditing">
          <el-button type="primary" @click="startEdit">
            编辑信息
          </el-button>
          <el-button @click="showPasswordDialog = true">
            修改密码
          </el-button>
          <el-button @click="goHome" class="back-button">
            <el-icon><ArrowLeft /></el-icon>
            返回主页
          </el-button>
        </el-form-item>
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

@media (max-width: 768px) {
  .profile-container {
    margin: 0 10px;
  }
}
</style>