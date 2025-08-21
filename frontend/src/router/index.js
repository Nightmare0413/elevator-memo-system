import { createRouter, createWebHistory } from 'vue-router'
import MemoList from '@/views/MemoList.vue'
import MemoCreate from '@/views/MemoCreate.vue'
import MemoEdit from '@/views/MemoEdit.vue'

const routes = [
  {
    path: '/',
    name: 'MemoList',
    component: MemoList,
    meta: { title: '备忘录列表' }
  },
  {
    path: '/create',
    name: 'MemoCreate',
    component: MemoCreate,
    meta: { title: '新建备忘录' }
  },
  {
    path: '/edit/:id',
    name: 'MemoEdit',
    component: MemoEdit,
    meta: { title: '编辑备忘录' }
  },
  {
    path: '/memo/:id',
    name: 'MemoDetail',
    component: () => import('@/views/MemoDetail.vue'),
    meta: { title: '备忘录详情' }
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

// 路由守卫 - 设置页面标题
router.beforeEach((to, from, next) => {
  if (to.meta.title) {
    document.title = `${to.meta.title} - 电梯自行检测备忘录电子化系统`
  }
  next()
})

export default router