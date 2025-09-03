<template>
  <div class="login-container">
    <div class="login-content">
      <div class="login-left">
        <div class="brand-section">
          <h1 class="system-title">电梯自行检测备忘录电子化系统</h1>
          <p class="system-subtitle">专业、高效、安全的电梯检测管理平台</p>
          <div class="feature-list">
            <div class="feature-item">
              <span class="feature-dot"></span>
              <span>智能化检测记录管理</span>
            </div>
            <div class="feature-item">
              <span class="feature-dot"></span>
              <span>电子签名认证系统</span>
            </div>
            <div class="feature-item">
              <span class="feature-dot"></span>
              <span>全流程数据追溯</span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="login-right">
        <div class="login-panel">
          <div class="panel-header">
            <h2>账号登录</h2>
            <p>请输入您的账号信息</p>
          </div>
      
      <el-form 
        ref="loginFormRef" 
        :model="loginForm" 
        :rules="loginRules" 
        class="login-form"
        @submit.prevent="handleLogin"
      >
          <el-form-item prop="username">
            <label class="form-label">用户名</label>
            <el-input
              v-model="loginForm.username"
              placeholder="请输入用户名"
              size="large"
              :disabled="loading"
            />
          </el-form-item>
          
          <el-form-item prop="password">
            <label class="form-label">密码</label>
            <el-input
              v-model="loginForm.password"
              type="password"
              placeholder="请输入密码"
              size="large"
              show-password
              :disabled="loading"
              @keyup.enter="handleLogin"
            />
          </el-form-item>
          
          <el-form-item class="login-button-item">
            <el-button 
              type="primary" 
              size="large" 
              class="login-button"
              :loading="loading"
              @click="handleLogin"
            >
              {{ loading ? '登录中...' : '立即登录' }}
            </el-button>
          </el-form-item>
        </el-form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ElMessage } from 'element-plus'

const router = useRouter()
const authStore = useAuthStore()

const loginFormRef = ref()
const loading = ref(false)

const loginForm = reactive({
  username: '',
  password: ''
})

const loginRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 20, message: '用户名长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不少于 6 个字符', trigger: 'blur' }
  ]
}

const handleLogin = async () => {
  if (!loginFormRef.value) return
  
  try {
    const valid = await loginFormRef.value.validate()
    if (!valid) return
    
    loading.value = true
    
    const success = await authStore.login({
      username: loginForm.username,
      password: loginForm.password
    })
    
    if (success) {
      router.push({ name: 'MemoList' })
    }
  } catch (error) {
    console.error('登录失败:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (authStore.isAuthenticated) {
    router.push({ name: 'MemoList' })
  }
})
</script>

<style scoped>
.login-container {
  height: 100vh;
  max-height: 100vh;
  background: #ffffff;
  display: flex;
  overflow: hidden;
}

.login-content {
  flex: 1;
  display: flex;
  position: relative;
  height: 100%;
  overflow: hidden;
}

.login-left {
  flex: 1.2;
  background: linear-gradient(135deg, #f8faff 0%, #e3f2fd 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 30px 40px;
  position: relative;
  overflow: hidden;
}

.login-left::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 1px;
  background: linear-gradient(to bottom, transparent, #e0e7ff, transparent);
}

.brand-section {
  max-width: 500px;
  width: 100%;
}

.system-title {
  font-size: 32px;
  font-weight: 700;
  color: #1e3a8a;
  margin: 0 0 12px 0;
  line-height: 1.3;
}

.system-subtitle {
  font-size: 16px;
  color: #64748b;
  margin: 0 0 30px 0;
  font-weight: 400;
}

.feature-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 16px;
  color: #475569;
}

.feature-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #3b82f6;
  flex-shrink: 0;
}

.login-right {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 30px 40px;
  background: #ffffff;
  overflow: hidden;
}

.login-panel {
  width: 100%;
  max-width: 400px;
}

.panel-header {
  text-align: center;
  margin-bottom: 30px;
}

.panel-header h2 {
  font-size: 28px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 8px 0;
}

.panel-header p {
  font-size: 16px;
  color: #6b7280;
  margin: 0;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 8px;
}

.login-form :deep(.el-form-item) {
  margin-bottom: 0;
}

.login-form :deep(.el-input__wrapper) {
  height: 48px;
  border-radius: 8px;
  border: 1.5px solid #e5e7eb;
  box-shadow: none;
  background: #ffffff;
  transition: all 0.2s ease;
}

.login-form :deep(.el-input__wrapper):hover {
  border-color: #3b82f6;
}

.login-form :deep(.el-input__wrapper.is-focus) {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.login-form :deep(.el-input__inner) {
  font-size: 15px;
  color: #1f2937;
}

.login-form :deep(.el-input__inner::placeholder) {
  color: #9ca3af;
}

.login-button-item {
  margin-top: 12px;
}

.login-button {
  width: 100%;
  height: 52px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 8px;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  border: none;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.25);
  transition: all 0.2s ease;
}

.login-button:hover {
  background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(59, 130, 246, 0.35);
}

.login-button:active {
  transform: translateY(0);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.25);
}


/* 响应式设计 */
@media (max-width: 1024px) {
  .login-content {
    flex-direction: column;
    height: 100%;
    overflow-y: auto;
  }
  
  .login-left {
    flex: none;
    padding: 40px 30px 20px;
  }
  
  .system-title {
    font-size: 28px;
  }
  
  .system-subtitle {
    font-size: 16px;
    margin-bottom: 30px;
  }
  
  .feature-list {
    display: none;
  }
  
  .login-right {
    flex: 1;
    padding: 20px 30px 40px;
  }
  
  .panel-header {
    margin-bottom: 30px;
  }
  
  .panel-header h2 {
    font-size: 24px;
  }
}

/* 移动端优先登录设计 */
@media (max-width: 768px) {
  .login-container {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    height: 100vh;
    overflow: hidden;
  }
  
  .login-content {
    flex-direction: column;
    height: 100vh;
    overflow-y: auto;
    position: relative;
  }
  
  .login-left {
    flex: none;
    min-height: 35vh;
    padding: 20px 16px 16px;
    text-align: center;
    position: relative;
  }
  
  .login-left::before {
    display: none;
  }
  
  .brand-section {
    max-width: 100%;
    position: relative;
  }
  
  .system-title {
    font-size: 22px;
    margin-bottom: 8px;
    position: relative;
    z-index: 1;
  }
  
  .system-subtitle {
    font-size: 14px;
    line-height: 1.5;
  }
  
  .login-right {
    flex: 1;
    background: white;
    padding: 16px;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    min-height: 65vh;
  }
  
  .login-panel {
    max-width: 100%;
    width: 100%;
    padding: 20px 16px;
    border-radius: 16px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    border: 1px solid #f0f0f0;
  }
  
  .panel-header {
    text-align: center;
    margin-bottom: 24px;
  }
  
  .panel-header h2 {
    font-size: 20px;
    margin-bottom: 8px;
    color: #303133;
  }
  
  .panel-header p {
    font-size: 14px;
    color: #606266;
  }
  
  /* 表单项移动端优化 - 移除嵌套边框 */
  .login-form :deep(.el-form-item) {
    margin-bottom: 20px;
  }
  
  .login-form :deep(.el-form-item__label) {
    font-size: 15px;
    font-weight: 600;
    color: #303133;
    padding-bottom: 8px;
  }
  
  .login-form :deep(.el-input) {
    height: 48px;
  }
  
  .login-form :deep(.el-input__wrapper) {
    height: 48px !important;
    border: 1px solid #dcdfe6 !important;
    border-radius: 8px !important;
    box-shadow: none !important;
    background: #fff !important;
  }
  
  .login-form :deep(.el-input__wrapper:hover) {
    border-color: #409eff !important;
  }
  
  .login-form :deep(.el-input__wrapper.is-focus) {
    border-color: #409eff !important;
    box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1) !important;
  }
  
  .login-form :deep(.el-input__inner) {
    height: 46px !important;
    font-size: 16px !important;
    border: none !important;
    padding: 0 16px !important;
    background: transparent !important;
  }
  
  /* 登录按钮优化 */
  .login-form :deep(.el-button--primary) {
    width: 100%;
    height: 50px;
    font-size: 16px;
    font-weight: 600;
    border-radius: 10px;
    background: linear-gradient(135deg, #409eff 0%, #3a8ee6 100%);
    border: none;
    box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
    margin-top: 8px;
    transition: all 0.3s ease;
  }
}

@media (max-width: 480px) {
  .login-left {
    min-height: 30vh;
    padding: 16px 12px 12px;
  }
  
  .system-title {
    font-size: 20px;
  }
  
  .system-subtitle {
    font-size: 13px;
  }
  
  .login-right {
    padding: 12px;
    min-height: 70vh;
  }
  
  .login-panel {
    padding: 16px 12px;
    border-radius: 12px;
  }
  
  .panel-header h2 {
    font-size: 18px;
  }
  
  :deep(.el-input) {
    height: 46px;
  }
  
  :deep(.el-input__inner) {
    height: 46px;
    font-size: 15px !important;
  }
  
  .login-form :deep(.el-button--primary) {
    height: 46px;
    font-size: 15px;
  }
}

/* 横屏模式优化 */
@media (max-width: 768px) and (orientation: landscape) {
  .login-container {
    flex-direction: row;
  }
  
  .login-content {
    flex-direction: row;
  }
  
  .login-left {
    flex: 0.4;
    min-height: 100vh;
    padding: 16px 12px;
  }
  
  .login-right {
    flex: 0.6;
    min-height: 100vh;
    padding: 16px 12px;
  }
  
  .system-title {
    font-size: 18px;
  }
  
  .system-subtitle {
    font-size: 12px;
  }
  
  .panel-header h2 {
    font-size: 16px;
    margin-bottom: 4px;
  }
  
  :deep(.el-form-item) {
    margin-bottom: 16px;
  }
}
</style>