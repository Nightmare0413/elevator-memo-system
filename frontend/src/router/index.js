import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import MemoList from '@/views/MemoList.vue'
import MemoCreate from '@/views/MemoCreate.vue'
import MemoEdit from '@/views/MemoEdit.vue'
import Login from '@/views/Login.vue'
import UserManagement from '@/views/UserManagement.vue'
import Profile from '@/views/Profile.vue'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { title: '用户登录', requiresGuest: true }
  },
  {
    path: '/',
    name: 'MemoList',
    component: MemoList,
    meta: { title: '备忘录列表', requiresAuth: true }
  },
  {
    path: '/create',
    name: 'MemoCreate',
    component: MemoCreate,
    meta: { title: '新建备忘录', requiresAuth: true }
  },
  {
    path: '/edit/:id',
    name: 'MemoEdit',
    component: MemoEdit,
    meta: { title: '编辑备忘录', requiresAuth: true }
  },
  {
    path: '/signature',
    name: 'SignaturePage',
    component: () => import('@/views/SignaturePage.vue'),
    meta: { title: '电子签名', requiresAuth: true }
  },
  {
    path: '/memo/:id',
    name: 'MemoDetail',
    component: () => import('@/views/MemoDetail.vue'),
    meta: { title: '备忘录详情', requiresAuth: true }
  },
  {
    path: '/users',
    name: 'UserManagement',
    component: UserManagement,
    meta: { title: '用户管理', requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: Profile,
    meta: { title: '个人信息', requiresAuth: true }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue'),
    meta: { title: '页面不存在' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫 - 设置页面标题和认证检查
router.beforeEach(async (to, from, next) => {
  // 设置页面标题
  if (to.meta.title) {
    document.title = `${to.meta.title} - 电梯自行检测备忘录电子化系统`
  }

  const authStore = useAuthStore()
  
  // 检查认证状态
  if (!authStore.isAuthenticated && localStorage.getItem('token')) {
    await authStore.checkAuth()
  }

  // 需要认证的页面
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'Login', query: { redirect: to.fullPath } })
    return
  }

  // 需要管理员权限的页面
  if (to.meta.requiresAdmin && !authStore.isAdmin) {
    next({ name: 'MemoList' })
    return
  }

  // 只允许未登录用户访问的页面
  if (to.meta.requiresGuest && authStore.isAuthenticated) {
    next({ name: 'MemoList' })
    return
  }

  next()
})

export default router