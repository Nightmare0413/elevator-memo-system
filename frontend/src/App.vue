<template>
  <div id="app">
    <el-container>
      <el-header class="header" v-if="!isLoginPage">
        <div class="header-content">
          <h1 class="title" @click="goHome">电梯自行检测备忘录电子化系统</h1>
          
          <div class="user-info" v-if="authStore.isAuthenticated">
            <el-dropdown @command="handleCommand">
              <span class="user-dropdown">
                <el-icon><User /></el-icon>
                {{ authStore.user?.full_name || authStore.user?.username }}
                <el-icon class="el-icon--right"><ArrowDown /></el-icon>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item v-if="authStore.isAdmin" command="userManagement">
                    <el-icon><Setting /></el-icon>
                    用户管理
                  </el-dropdown-item>
                  <el-dropdown-item command="profile">
                    <el-icon><User /></el-icon>
                    个人信息
                  </el-dropdown-item>
                  <el-dropdown-item divided command="logout">
                    <el-icon><SwitchButton /></el-icon>
                    退出登录
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
      </el-header>
      
      <el-main :class="['main-content', { 'login-main': isLoginPage }]">
        <router-view />
      </el-main>
      
      <el-footer class="footer" v-if="!isLoginPage">
        <div class="footer-content">
          <p>&copy; 2025 武汉迈创智元科技有限公司</p>
        </div>
      </el-footer>
    </el-container>
  </div>
</template>

<script setup>
import { onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { User, ArrowDown, Setting, SwitchButton } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// 检测是否为登录页面
const isLoginPage = computed(() => route.name === 'Login')

const goHome = () => {
  router.push({ name: 'MemoList' })
}

const handleCommand = (command) => {
  switch (command) {
    case 'userManagement':
      router.push({ name: 'UserManagement' })
      break
    case 'profile':
      router.push({ name: 'Profile' })
      break
    case 'logout':
      authStore.logout()
      router.push({ name: 'Login' })
      break
  }
}

onMounted(async () => {
  // 检查用户认证状态
  await authStore.checkAuth()
})
</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  height: 100vh;
}

body {
  margin: 0;
  padding: 0;
  /* 移动端优化 */
  -webkit-text-size-adjust: 100%;
  -webkit-tap-highlight-color: transparent;
  overscroll-behavior: none;
}

.header {
  background-color: #409EFF;
  color: white;
  padding: 0;
  height: 80px !important;
  display: flex;
  align-items: center;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 0 20px;
}

.user-info {
  display: flex;
  align-items: center;
}

.user-dropdown {
  display: flex;
  align-items: center;
  gap: 4px;
  color: white;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.user-dropdown:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.title {
  margin: 0;
  font-size: 24px;
  font-weight: bold;
  cursor: pointer;
  transition: color 0.3s ease;
}

.title:hover {
  color: #ecf5ff;
}

.main-content {
  padding: 20px;
  background-color: #f5f5f5;
  min-height: calc(100vh - 140px);
}

.login-main {
  padding: 0;
  background-color: #ffffff;
  height: 100vh;
  min-height: 100vh;
}

.footer {
  background-color: #303133;
  color: white;
  text-align: center;
  height: 60px !important;
  display: flex;
  align-items: center;
  justify-content: center;
}

.footer-content p {
  margin: 0;
  font-size: 14px;
}

/* 全局样式 */
.el-card {
  margin-bottom: 20px;
  border-radius: 8px;
}

.el-button {
  margin-right: 8px;
  margin-bottom: 8px;
}

.el-form-item {
  margin-bottom: 18px;
}

/* 移动端优先的响应式设计 */
@media (max-width: 768px) {
  .header {
    height: 60px !important; /* 减少头部高度节省空间 */
    position: sticky; /* 固定头部 */
    top: 0;
    z-index: 1000;
  }
  
  .header-content {
    padding: 0 12px; /* 减少左右边距 */
  }
  
  .title {
    font-size: 16px; /* 进一步减小字体 */
    line-height: 1.2;
    max-width: 60%; /* 限制标题宽度 */
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .user-dropdown {
    font-size: 14px; /* 减小用户下拉菜单字体 */
    padding: 6px 8px;
  }
  
  .main-content {
    padding: 8px; /* 减少内边距 */
    min-height: calc(100vh - 120px); /* 调整最小高度 */
  }
  
  .login-main {
    padding: 0;
    background-color: #ffffff;
    height: 100vh;
    min-height: 100vh;
  }
  
  .footer {
    height: 50px !important; /* 减少底部高度 */
  }
  
  .footer-content p {
    font-size: 12px; /* 减小底部文字 */
  }
  
  /* 全局移动端按钮优化 */
  .el-button {
    margin-right: 6px;
    margin-bottom: 6px;
    min-height: 44px; /* 确保触摸友好的按钮高度 */
    padding: 8px 16px;
  }
  
  .el-form-item {
    margin-bottom: 16px;
  }
  
  /* 移动端卡片优化 */
  .el-card {
    margin-bottom: 12px;
    border-radius: 6px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
}

/* 小屏幕手机优化 */
@media (max-width: 480px) {
  .header {
    height: 56px !important;
  }
  
  .title {
    font-size: 14px;
    max-width: 55%;
  }
  
  .user-dropdown {
    font-size: 13px;
    padding: 4px 6px;
  }
  
  .main-content {
    padding: 6px;
  }
  
  .el-button {
    font-size: 14px;
    padding: 6px 12px;
  }
}
</style>