<template>
  <div id="app">
    <el-container>
      <el-header class="header">
        <div class="header-content">
          <h1 class="title">电梯自行检测备忘录电子化系统</h1>
          <div class="nav-menu">
            <el-menu mode="horizontal" :default-active="activeIndex" class="nav">
              <el-menu-item index="1" @click="$router.push('/')">
                <el-icon><List /></el-icon>
                备忘录管理
              </el-menu-item>
              <el-menu-item index="2" @click="$router.push('/create')">
                <el-icon><Plus /></el-icon>
                新建备忘录
              </el-menu-item>
            </el-menu>
          </div>
        </div>
      </el-header>
      
      <el-main class="main-content">
        <router-view />
      </el-main>
      
      <el-footer class="footer">
        <div class="footer-content">
          <p>&copy; 2024 电梯自行检测备忘录电子化系统</p>
        </div>
      </el-footer>
    </el-container>
  </div>
</template>

<script>
import { List, Plus } from '@element-plus/icons-vue'

export default {
  name: 'App',
  components: {
    List,
    Plus
  },
  data() {
    return {
      activeIndex: '1'
    }
  },
  mounted() {
    // 根据当前路由设置活跃菜单
    this.updateActiveIndex()
  },
  watch: {
    '$route'() {
      this.updateActiveIndex()
    }
  },
  methods: {
    updateActiveIndex() {
      const path = this.$route.path
      if (path === '/' || path.startsWith('/memo')) {
        this.activeIndex = '1'
      } else if (path === '/create' || path === '/edit') {
        this.activeIndex = '2'
      }
    }
  }
}
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

.title {
  margin: 0;
  font-size: 24px;
  font-weight: bold;
}

.nav {
  background-color: transparent;
  border-bottom: none;
}

.nav .el-menu-item {
  color: white;
  border-bottom: 2px solid transparent;
}

.nav .el-menu-item:hover,
.nav .el-menu-item.is-active {
  background-color: rgba(255, 255, 255, 0.1);
  border-bottom-color: white;
  color: white;
}

.main-content {
  padding: 20px;
  background-color: #f5f5f5;
  min-height: calc(100vh - 140px);
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

/* 响应式设计 */
@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    padding: 10px 20px;
  }
  
  .title {
    font-size: 18px;
    margin-bottom: 10px;
  }
  
  .nav {
    width: 100%;
  }
  
  .main-content {
    padding: 10px;
  }
}
</style>