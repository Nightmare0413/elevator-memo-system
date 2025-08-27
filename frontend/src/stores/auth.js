import { defineStore } from 'pinia'
import { auth } from '@/api/auth'
import { ElMessage } from 'element-plus'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: localStorage.getItem('token') || null,
    isAuthenticated: false
  }),

  getters: {
    isAdmin: (state) => state.user?.role === 'admin',
    isUser: (state) => state.user?.role === 'user',
    userInfo: (state) => state.user
  },

  actions: {
    async login(credentials) {
      try {
        const response = await auth.login(credentials)
        
        if (response.token && response.user) {
          this.token = response.token
          this.user = response.user
          this.isAuthenticated = true
          
          localStorage.setItem('token', response.token)
          localStorage.setItem('user', JSON.stringify(response.user))
          
          ElMessage.success('登录成功')
          return true
        }
        
        return false
      } catch (error) {
        console.error('登录失败:', error)
        ElMessage.error(error.response?.data?.error || '登录失败')
        return false
      }
    },

    async logout() {
      this.token = null
      this.user = null
      this.isAuthenticated = false
      
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      
      ElMessage.success('已退出登录')
    },

    async getCurrentUser() {
      try {
        if (!this.token) return false
        
        const response = await auth.getCurrentUser()
        if (response.user) {
          this.user = response.user
          this.isAuthenticated = true
          localStorage.setItem('user', JSON.stringify(response.user))
          return true
        }
        
        return false
      } catch (error) {
        console.error('获取用户信息失败:', error)
        this.logout()
        return false
      }
    },

    async checkAuth() {
      const token = localStorage.getItem('token')
      const user = localStorage.getItem('user')
      
      if (token && user) {
        this.token = token
        this.user = JSON.parse(user)
        this.isAuthenticated = true
        
        return await this.getCurrentUser()
      }
      
      return false
    },

    async register(userData) {
      try {
        const response = await auth.register(userData)
        ElMessage.success('用户注册成功')
        return response
      } catch (error) {
        console.error('注册失败:', error)
        ElMessage.error(error.response?.data?.error || '注册失败')
        throw error
      }
    }
  }
})