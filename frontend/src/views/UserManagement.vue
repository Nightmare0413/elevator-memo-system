<template>
  <div class="user-management">
    <el-card>
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <el-button @click="goHome" class="back-button">
              <el-icon><ArrowLeft /></el-icon>
              返回主页
            </el-button>
          </div>
          <div class="header-center">
            <h3>用户管理</h3>
          </div>
          <div class="header-right">
            <el-button type="primary" @click="showCreateDialog = true">
              <el-icon><Plus /></el-icon>
              添加用户
            </el-button>
          </div>
        </div>
      </template>

      <div class="search-bar">
        <el-row :gutter="20" class="search-row">
          <el-col :xs="24" :sm="16" :md="8">
            <el-input
              v-model="searchForm.search"
              placeholder="搜索用户名、姓名或手机号"
              clearable
              @clear="loadUsers"
              @keyup.enter="handleSearch"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </el-col>
          <el-col :xs="24" :sm="8" :md="4">
            <div class="search-buttons">
              <el-button type="primary" @click="handleSearch" class="search-btn">搜索</el-button>
              <el-button @click="resetSearch" class="reset-btn">重置</el-button>
            </div>
          </el-col>
        </el-row>
      </div>

      <!-- 桌面端表格 -->
      <el-table :data="users" style="width: 100%" v-loading="loading" class="desktop-table">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="username" label="用户名" />
        <el-table-column prop="full_name" label="真实姓名" />
        <el-table-column prop="phone" label="手机号" />
        <el-table-column prop="role" label="角色">
          <template #default="scope">
            <el-tag :type="scope.row.role === 'admin' ? 'danger' : 'primary'">
              {{ scope.row.role === 'admin' ? '管理员' : '普通用户' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="is_active" label="状态">
          <template #default="scope">
            <el-tag :type="scope.row.is_active ? 'success' : 'info'">
              {{ scope.row.is_active ? '活跃' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间">
          <template #default="scope">
            {{ formatDate(scope.row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="scope">
            <el-dropdown @command="(command) => handleAction(command, scope.row)">
              <el-button type="primary" size="small">
                操作<el-icon class="el-icon--right"><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item 
                    command="editUser"
                    :disabled="scope.row.id === currentUser?.id"
                  >
                    编辑用户
                  </el-dropdown-item>
                  <el-dropdown-item 
                    command="deactivate"
                    :disabled="scope.row.id === currentUser?.id || !scope.row.is_active"
                  >
                    停用账户
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>

      <!-- 移动端卡片布局 -->
      <div class="mobile-user-list">
        <div 
          v-for="user in users" 
          :key="user.id" 
          class="mobile-user-card"
        >
          <div class="mobile-user-header">
            <div class="mobile-user-info">
              <div class="mobile-user-name">{{ user.full_name }}</div>
              <div class="mobile-user-username">@{{ user.username }}</div>
            </div>
            <div class="mobile-user-id">#{{ user.id }}</div>
          </div>
          
          <div class="mobile-user-body">
            <div class="mobile-user-row">
              <span class="mobile-user-label">手机号:</span>
              <span class="mobile-user-value">{{ user.phone || '未设置' }}</span>
            </div>
            <div class="mobile-user-row">
              <span class="mobile-user-label">角色:</span>
              <span class="mobile-user-value">
                <el-tag :type="user.role === 'admin' ? 'danger' : 'primary'" size="small">
                  {{ user.role === 'admin' ? '管理员' : '普通用户' }}
                </el-tag>
              </span>
            </div>
            <div class="mobile-user-row">
              <span class="mobile-user-label">状态:</span>
              <span class="mobile-user-value">
                <el-tag :type="user.is_active ? 'success' : 'info'" size="small">
                  {{ user.is_active ? '活跃' : '停用' }}
                </el-tag>
              </span>
            </div>
            <div class="mobile-user-row">
              <span class="mobile-user-label">创建时间:</span>
              <span class="mobile-user-value">{{ formatDate(user.created_at) }}</span>
            </div>
          </div>
          
          <div class="mobile-user-actions">
            <el-button 
              type="primary"
              size="default"
              @click="handleAction('editUser', user)"
              :disabled="user.id === currentUser?.id"
            >
              编辑
            </el-button>
            <el-button 
              type="danger"
              size="default"
              @click="handleAction('deactivate', user)"
              :disabled="user.id === currentUser?.id || !user.is_active"
            >
              停用
            </el-button>
          </div>
        </div>
      </div>

      <div class="pagination" v-if="pagination.total > 0">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.limit"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 创建用户对话框 -->
    <el-dialog v-model="showCreateDialog" title="添加用户" width="500px">
      <el-form ref="createFormRef" :model="createForm" :rules="createRules" label-width="80px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="createForm.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input 
            v-model="createForm.password" 
            type="password" 
            placeholder="请输入密码"
            show-password 
          />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="createForm.phone" placeholder="请输入手机号（可选）" />
        </el-form-item>
        <el-form-item label="真实姓名" prop="full_name">
          <el-input v-model="createForm.full_name" placeholder="请输入真实姓名" />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="createForm.role" placeholder="请选择角色" @change="handleRoleChange">
            <el-option label="普通用户" value="user" />
            <el-option label="管理员" value="admin" />
          </el-select>
        </el-form-item>

        <!-- 电子签名上传 - 仅普通用户显示 -->
        <el-form-item 
          v-if="createForm.role === 'user'" 
          label="电子签名" 
          prop="signature"
          required
        >
          <div class="signature-upload">
            <el-upload
              ref="signatureUploadRef"
              :before-upload="beforeSignatureUpload"
              :on-success="handleSignatureUploadSuccess"
              :on-error="handleSignatureUploadError"
              :show-file-list="false"
              accept="image/*"
              action="#"
              :http-request="customSignatureUpload"
            >
              <el-button type="primary" :loading="signatureUploading">
                <el-icon><Upload /></el-icon>
                上传电子签名
              </el-button>
            </el-upload>
            
            <div v-if="createForm.signaturePreview" class="signature-preview">
              <img 
                :src="createForm.signaturePreview" 
                alt="电子签名预览"
                class="signature-image"
              />
              <el-button 
                size="small" 
                type="danger" 
                @click="removeSignature"
              >
                删除
              </el-button>
            </div>
            
            <div class="upload-tip">
              <el-text size="small" type="info">
                支持 jpg、png、gif 格式，文件大小不超过 5MB。普通用户必须上传电子签名。
              </el-text>
            </div>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" :loading="createLoading" @click="handleCreateUser">
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- 编辑用户对话框 -->
    <el-dialog v-model="showEditDialog" title="编辑用户信息" width="600px">
      <el-form ref="editFormRef" :model="editUserForm" :rules="editUserRules" label-width="100px">
        <el-form-item label="用户名">
          <el-input :value="selectedUser?.username" disabled />
        </el-form-item>
        
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="editUserForm.phone" placeholder="请输入手机号（可选）" />
        </el-form-item>
        
        <el-form-item label="真实姓名" prop="full_name">
          <el-input v-model="editUserForm.full_name" placeholder="请输入真实姓名" />
        </el-form-item>
        
        <el-form-item label="角色" prop="role">
          <el-select v-model="editUserForm.role" placeholder="请选择角色" @change="handleEditUserRoleChange">
            <el-option label="普通用户" value="user" />
            <el-option label="管理员" value="admin" />
          </el-select>
        </el-form-item>
        
        <!-- 电子签名编辑 - 仅普通用户显示 -->
        <el-form-item 
          v-if="editUserForm.role === 'user'" 
          label="电子签名"
          prop="signature"
        >
          <div class="signature-upload">
            <el-upload
              ref="editSignatureUploadRef"
              :before-upload="beforeEditSignatureUpload"
              :on-success="handleEditSignatureUploadSuccess"
              :on-error="handleEditSignatureUploadError"
              :show-file-list="false"
              accept="image/*"
              action="#"
              :http-request="customEditSignatureUpload"
            >
              <el-button type="primary" :loading="editUserSignatureUploading">
                <el-icon><Upload /></el-icon>
                {{ editUserForm.signaturePreview ? '重新上传签名' : '上传电子签名' }}
              </el-button>
            </el-upload>
            
            <div v-if="editUserForm.signaturePreview" class="signature-preview">
              <img 
                :src="editUserForm.signaturePreview" 
                alt="电子签名预览"
                class="signature-image"
              />
              <el-button 
                size="small" 
                type="danger" 
                @click="removeEditSignature"
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
      </el-form>
      <template #footer>
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button type="primary" :loading="roleLoading" @click="handleUpdateUser">
          确定修改
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { auth } from '@/api/auth'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, ArrowDown, ArrowLeft, Upload } from '@element-plus/icons-vue'

const router = useRouter()
const authStore = useAuthStore()
const currentUser = computed(() => authStore.user)

const users = ref([])
const loading = ref(false)
const showCreateDialog = ref(false)
const showEditDialog = ref(false)
const createLoading = ref(false)
const roleLoading = ref(false)
const selectedUser = ref(null)
const newRole = ref('')
const signatureUploading = ref(false)
const signatureUploadRef = ref()
const editUserSignatureUploading = ref(false)

const editUserForm = reactive({
  phone: '',
  full_name: '',
  role: '',
  signatureFile: null,
  signaturePreview: null
})

const searchForm = reactive({
  search: ''
})

const pagination = reactive({
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0
})

const createForm = reactive({
  username: '',
  password: '',
  phone: '',
  full_name: '',
  role: 'user',
  signature: '', // 添加signature字段用于验证
  signatureFile: null,
  signaturePreview: null
})

const createRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 20, message: '用户名长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不少于 6 个字符', trigger: 'blur' }
  ],
  phone: [
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号格式', trigger: 'blur' }
  ],
  full_name: [
    { required: true, message: '请输入真实姓名', trigger: 'blur' }
  ],
  role: [
    { required: true, message: '请选择角色', trigger: 'change' }
  ],
  signature: [
    { 
      validator: (rule, value, callback) => {
        // 只有普通用户才需要验证签名
        if (createForm.role === 'user') {
          if (!createForm.signatureFile) {
            callback(new Error('普通用户必须上传电子签名'))
            return
          }
        }
        // 管理员或已上传签名的普通用户都通过验证
        callback()
      },
      trigger: ['blur', 'change']
    }
  ]
}

const editUserRules = {
  phone: [
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号格式', trigger: 'blur' }
  ],
  full_name: [
    { required: true, message: '请输入真实姓名', trigger: 'blur' }
  ],
  role: [
    { required: true, message: '请选择角色', trigger: 'change' }
  ]
}

const createFormRef = ref()
const editFormRef = ref()

// 返回主页
const goHome = () => {
  router.push({ name: 'MemoList' })
}

const loadUsers = async () => {
  try {
    loading.value = true
    const params = {
      page: pagination.page,
      limit: pagination.limit,
      search: searchForm.search
    }
    
    const response = await auth.getAllUsers(params)
    users.value = response.users || []
    
    if (response.pagination) {
      pagination.total = response.pagination.total
      pagination.totalPages = response.pagination.totalPages
    }
  } catch (error) {
    console.error('获取用户列表失败:', error)
    ElMessage.error('获取用户列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  loadUsers()
}

const resetSearch = () => {
  searchForm.search = ''
  pagination.page = 1
  loadUsers()
}

const handleSizeChange = (val) => {
  pagination.limit = val
  pagination.page = 1
  loadUsers()
}

const handleCurrentChange = (val) => {
  pagination.page = val
  loadUsers()
}

const handleCreateUser = async () => {
  if (!createFormRef.value) return
  
  try {
    // 对于管理员角色，先清除签名验证
    if (createForm.role === 'admin') {
      createFormRef.value.clearValidate('signature')
    }
    
    // 调试信息
    console.log('提交用户数据:', {
      role: createForm.role,
      hasSignatureFile: !!createForm.signatureFile,
      signaturePreview: !!createForm.signaturePreview
    })
    
    const valid = await createFormRef.value.validate()
    if (!valid) {
      console.error('表单验证失败')
      return
    }
    
    createLoading.value = true
    
    // 创建用户基本信息
    const userData = {
      username: createForm.username,
      password: createForm.password,
      phone: createForm.phone,
      full_name: createForm.full_name,
      role: createForm.role
    }
    
    const result = await authStore.register(userData)
    
    console.log('用户创建结果:', result)
    
    // 如果是普通用户且有签名文件，上传签名
    if (createForm.role === 'user' && createForm.signatureFile && result.user) {
      const formData = new FormData()
      formData.append('signature', createForm.signatureFile)
      formData.append('is_default', 'true')
      
      console.log('开始上传签名，用户ID:', result.user.id)
      
      try {
        const signatureResult = await auth.uploadUserSignature(result.user.id, formData)
        console.log('签名上传成功:', signatureResult)
        ElMessage.success('用户创建成功，签名已上传')
      } catch (signatureError) {
        console.error('签名上传失败:', signatureError)
        ElMessage.warning('用户创建成功，但签名上传失败，请稍后重试')
      }
    } else {
      ElMessage.success('用户创建成功')
    }
    
    showCreateDialog.value = false
    resetCreateForm()
    loadUsers()
  } catch (error) {
    console.error('创建用户失败:', error)
  } finally {
    createLoading.value = false
  }
}

const resetCreateForm = () => {
  Object.assign(createForm, {
    username: '',
    password: '',
    phone: '',
    full_name: '',
    role: 'user',
    signature: '', // 重置signature字段
    signatureFile: null,
    signaturePreview: null
  })
}

// 角色变更处理
const handleRoleChange = () => {
  if (createForm.role === 'admin') {
    // 如果选择管理员，清除签名
    createForm.signatureFile = null
    createForm.signaturePreview = null
    createForm.signature = '' // 清空signature字段
    
    // 清除签名验证错误
    setTimeout(() => {
      if (createFormRef.value) {
        createFormRef.value.clearValidate('signature')
      }
    }, 100)
  } else {
    // 如果选择普通用户，触发签名验证
    setTimeout(() => {
      if (createFormRef.value) {
        createFormRef.value.validateField('signature')
      }
    }, 100)
  }
}

// 签名上传前验证
const beforeSignatureUpload = (file) => {
  const isImage = file.type.startsWith('image/')
  const isLt5M = file.size / 1024 / 1024 < 5

  if (!isImage) {
    ElMessage.error('只能上传图片文件!')
    return false
  }
  if (!isLt5M) {
    ElMessage.error('图片大小不能超过 5MB!')
    return false
  }
  return true
}

// 自定义签名上传
const customSignatureUpload = async (options) => {
  const { file } = options
  
  try {
    signatureUploading.value = true
    
    // 创建预览
    const reader = new FileReader()
    reader.onload = (e) => {
      createForm.signaturePreview = e.target.result
      // 保存文件对象
      createForm.signatureFile = file
      // 更新signature字段用于验证
      createForm.signature = file.name
      
      // 触发验证清除错误状态
      setTimeout(() => {
        if (createFormRef.value) {
          createFormRef.value.clearValidate('signature')
        }
      }, 100)
    }
    reader.readAsDataURL(file)
    
    options.onSuccess({ url: 'temp' })
  } catch (error) {
    console.error('签名上传失败:', error)
    options.onError(error)
  } finally {
    signatureUploading.value = false
  }
}

// 签名上传成功
const handleSignatureUploadSuccess = () => {
  ElMessage.success('签名上传成功')
  
  // 触发验证清除错误状态
  setTimeout(() => {
    if (createFormRef.value) {
      createFormRef.value.validateField('signature')
    }
  }, 100)
}

// 签名上传失败
const handleSignatureUploadError = () => {
  ElMessage.error('签名上传失败')
  createForm.signatureFile = null
  createForm.signaturePreview = null
}

// 删除签名
const removeSignature = () => {
  createForm.signatureFile = null
  createForm.signaturePreview = null
  createForm.signature = '' // 清空signature字段
  
  // 如果是普通用户，触发验证；如果是管理员，清除验证
  setTimeout(() => {
    if (createFormRef.value) {
      if (createForm.role === 'admin') {
        createFormRef.value.clearValidate('signature')
      } else {
        createFormRef.value.validateField('signature')
      }
    }
  }, 100)
}

// 编辑用户时角色变更处理
const handleEditUserRoleChange = () => {
  if (editUserForm.role === 'admin') {
    // 如果选择管理员，清除签名
    editUserForm.signatureFile = null
    editUserForm.signaturePreview = null
  }
}

// 编辑签名上传前验证
const beforeEditSignatureUpload = (file) => {
  const isImage = file.type.startsWith('image/')
  const isLt5M = file.size / 1024 / 1024 < 5

  if (!isImage) {
    ElMessage.error('只能上传图片文件!')
    return false
  }
  if (!isLt5M) {
    ElMessage.error('图片大小不能超过 5MB!')
    return false
  }
  return true
}

// 自定义编辑签名上传
const customEditSignatureUpload = async (options) => {
  const { file } = options
  
  try {
    editUserSignatureUploading.value = true
    
    // 创建预览
    const reader = new FileReader()
    reader.onload = (e) => {
      editUserForm.signaturePreview = e.target.result
    }
    reader.readAsDataURL(file)
    
    // 保存文件对象
    editUserForm.signatureFile = file
    
    options.onSuccess({ url: 'temp' })
  } catch (error) {
    console.error('签名上传失败:', error)
    options.onError(error)
  } finally {
    editUserSignatureUploading.value = false
  }
}

// 编辑签名上传成功
const handleEditSignatureUploadSuccess = () => {
  ElMessage.success('签名上传成功')
}

// 编辑签名上传失败
const handleEditSignatureUploadError = () => {
  ElMessage.error('签名上传失败')
  editUserForm.signatureFile = null
  editUserForm.signaturePreview = null
}

// 删除编辑签名
const removeEditSignature = () => {
  editUserForm.signatureFile = null
  editUserForm.signaturePreview = null
}

const handleAction = async (command, user) => {
  selectedUser.value = user
  
  if (command === 'editUser') {
    // 填充编辑表单数据
    editUserForm.phone = user.phone || ''
    editUserForm.full_name = user.full_name || ''
    editUserForm.role = user.role
    editUserForm.signatureFile = null
    editUserForm.signaturePreview = null
    
    // 如果是普通用户，加载现有签名
    if (user.role === 'user') {
      try {
        const response = await auth.getUserSignaturesList(user.id)
        const signatures = response.signatures || []
        const defaultSignature = signatures.find(sig => sig.is_default)
        if (defaultSignature) {
          const filePath = defaultSignature.file_path.startsWith('/') 
            ? defaultSignature.file_path 
            : `/${defaultSignature.file_path}`
          editUserForm.signaturePreview = `${import.meta.env.VITE_API_BASE_URL || '/api'}${filePath}`
        }
      } catch (error) {
        console.error('加载用户签名失败:', error)
      }
    }
    
    showEditDialog.value = true
  } else if (command === 'deactivate') {
    handleDeactivateUser(user)
  }
}

const handleUpdateUser = async () => {
  if (!editFormRef.value) return
  
  try {
    const valid = await editFormRef.value.validate()
    if (!valid) return
    
    roleLoading.value = true
    
    // 更新用户基本信息
    const updateData = {
      phone: editUserForm.phone,
      full_name: editUserForm.full_name,
      role: editUserForm.role
    }
    
    await auth.updateUser(selectedUser.value.id, updateData)
    
    // 如果是普通用户且有新的签名文件，上传签名
    if (editUserForm.role === 'user' && editUserForm.signatureFile) {
      const formData = new FormData()
      formData.append('signature', editUserForm.signatureFile)
      formData.append('is_default', 'true')
      
      try {
        await auth.uploadUserSignature(selectedUser.value.id, formData)
      } catch (signatureError) {
        console.error('签名上传失败:', signatureError)
        ElMessage.warning('用户信息更新成功，但签名上传失败')
      }
    }
    
    ElMessage.success('用户信息更新成功')
    showEditDialog.value = false
    loadUsers()
  } catch (error) {
    console.error('更新用户信息失败:', error)
    ElMessage.error('更新用户信息失败')
  } finally {
    roleLoading.value = false
  }
}

const handleDeactivateUser = async (user) => {
  try {
    await ElMessageBox.confirm(
      `确定要停用用户"${user.username}"吗？`,
      '确认操作',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await auth.deactivateUser(user.id)
    ElMessage.success('用户已停用')
    loadUsers()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('停用用户失败:', error)
    }
  }
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN')
}

onMounted(() => {
  loadUsers()
})
</script>

<style scoped>
.user-management {
  padding: 20px;
}

:deep(.el-card) {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #dcdfe6;
}

:deep(.el-card__header) {
  background: #f5f7fa;
  color: #303133;
  padding: 16px 20px;
  border-bottom: 1px solid #ebeef5;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.header-left {
  display: flex;
  align-items: center;
  flex: 1;
}

.header-center {
  display: flex;
  justify-content: center;
  align-items: center;
  flex: 1;
}

.header-right {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  flex: 1;
}

.card-header h3 {
  margin: 0;
  color: #303133;
  font-size: 16px;
  font-weight: 600;
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

.search-bar {
  margin-bottom: 20px;
}

.search-bar .el-row {
  align-items: center;
}

.search-bar .el-button {
  margin-left: 8px;
}

.search-buttons {
  display: flex;
  gap: 8px;
  align-items: center;
}

.search-buttons .el-button {
  margin: 0;
}


.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.signature-upload {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.signature-preview {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background-color: #f5f7fa;
}

.signature-image {
  max-width: 200px;
  max-height: 100px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.upload-tip {
  margin-top: 8px;
}

/* 桌面端显示表格 */
@media (min-width: 769px) {
  .mobile-user-list {
    display: none !important;
  }
}

/* 移动端优化 */
@media (max-width: 768px) {
  .user-management {
    padding: 10px;
  }
  
  /* 隐藏桌面端表格，显示移动端卡片 */
  .desktop-table {
    display: none !important;
  }
  
  .mobile-user-list {
    display: block !important;
    width: 100%;
  }
  
  .mobile-user-card {
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
    border: 1px solid #f0f0f0;
    margin-bottom: 12px;
    overflow: hidden;
    transition: all 0.2s ease;
  }
  
  .mobile-user-card:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
    transform: translateY(-1px);
  }
  
  .mobile-user-header {
    padding: 16px;
    background: linear-gradient(135deg, #f8f9fa 0%, #f1f3f4 100%);
    border-bottom: 1px solid #f0f0f0;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .mobile-user-info {
    flex: 1;
  }
  
  .mobile-user-name {
    font-size: 16px;
    font-weight: 600;
    color: #303133;
    margin-bottom: 4px;
  }
  
  .mobile-user-username {
    font-size: 13px;
    color: #909399;
  }
  
  .mobile-user-id {
    font-size: 12px;
    color: #c0c4cc;
    background: #f5f5f5;
    padding: 4px 8px;
    border-radius: 4px;
  }
  
  .mobile-user-body {
    padding: 16px;
  }
  
  .mobile-user-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    font-size: 14px;
  }
  
  .mobile-user-row:last-child {
    margin-bottom: 0;
  }
  
  .mobile-user-label {
    color: #909399;
    font-size: 13px;
    font-weight: 500;
    min-width: 70px;
  }
  
  .mobile-user-value {
    flex: 1;
    color: #303133;
    text-align: right;
    font-size: 13px;
  }
  
  .mobile-user-actions {
    padding: 16px;
    background: #fafafa;
    border-top: 1px solid #f0f0f0;
    display: flex;
    gap: 12px;
    justify-content: center;
  }
  
  .mobile-user-actions .el-button {
    flex: 1;
    height: 40px;
    font-size: 14px;
    font-weight: 500;
    border-radius: 8px;
  }
  
  .card-header {
    gap: 8px;
    align-items: center;
  }
  
  .header-left,
  .header-center,
  .header-right {
    flex: 1;
  }
  
  .header-left .el-button,
  .header-right .el-button {
    font-size: 10px;
    padding: 4px 8px;
  }
  
  .header-center h3 {
    font-size: 16px;
    text-align: center;
    font-weight: bold;
  }
  
  .search-bar {
    padding: 16px;
    margin: 16px 0;
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }
  
  .search-bar :deep(.el-col) {
    margin-bottom: 12px;
  }
  
  .search-bar :deep(.el-input) {
    width: 100%;
  }
  
  .search-bar :deep(.el-input__inner) {
    height: 48px;
    line-height: 48px;
    font-size: 16px !important;
    border-radius: 8px;
    border: 2px solid #e1e5e9;
  }
  
  .search-bar :deep(.el-input__inner:focus) {
    border-color: #409eff;
    box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
  }
  
  .search-bar .el-button {
    width: 100%;
    height: 48px;
    font-size: 16px;
    font-weight: 500;
    border-radius: 8px;
    margin: 0 0 8px 0;
  }
  
  .signature-image {
    max-width: 150px;
    max-height: 75px;
  }
  
  /* 移动端对话框优化 - 横向布局 */
  :deep(.el-dialog) {
    margin: 16px;
    max-width: calc(100vw - 32px);
    border-radius: 16px;
  }
  
  :deep(.el-dialog__header) {
    padding: 20px 20px 16px;
    background: #f8f9fa;
    border-bottom: 1px solid #f0f0f0;
  }
  
  :deep(.el-dialog__title) {
    font-size: 18px;
    font-weight: 600;
  }
  
  :deep(.el-dialog__body) {
    padding: 16px 20px;
  }
  
  /* 表单项横向布局 */
  :deep(.el-form-item) {
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    flex-wrap: nowrap;
  }
  
  :deep(.el-form-item__label) {
    font-size: 14px;
    font-weight: 600;
    color: #303133;
    margin-bottom: 0;
    padding: 0 12px 0 0 !important;
    text-align: left !important;
    width: 100px !important;
    flex-shrink: 0;
  }
  
  :deep(.el-form-item__content) {
    margin-left: 0 !important;
    flex: 1;
    min-width: 0;
  }
  
  :deep(.el-input__inner),
  :deep(.el-select .el-input__inner) {
    height: 44px;
    line-height: 44px;
    font-size: 15px !important;
    border-radius: 8px;
    border: 2px solid #e1e5e9;
  }
  
  :deep(.el-input__inner:focus),
  :deep(.el-select .el-input__inner:focus) {
    border-color: #409eff;
    box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
  }
  
  /* 签名上传区域特殊处理 */
  :deep(.el-form-item:has(.signature-upload)) {
    flex-wrap: wrap;
  }
  
  :deep(.el-form-item:has(.signature-upload) .el-form-item__content) {
    width: 100%;
    margin-top: 8px;
  }
  
  :deep(.el-table) {
    font-size: 14px;
    border-radius: 8px;
    overflow: hidden;
  }
  
  :deep(.el-table th.el-table__cell),
  :deep(.el-table td.el-table__cell) {
    padding: 12px 8px;
    border-bottom: 1px solid #f0f0f0;
  }
  
  :deep(.el-table__row:hover) {
    background-color: #f8f9fa;
  }
  
  :deep(.el-table th.el-table__cell) {
    background: #f8f9fa;
    font-weight: 600;
    color: #303133;
  }
}

@media (max-width: 480px) {
  .user-management {
    padding: 8px;
  }
  
  .header-left .el-button,
  .header-right .el-button {
    font-size: 9px;
    padding: 3px 6px;
  }
  
  .header-center h3 {
    font-size: 15px;
    font-weight: bold;
  }
  
  .search-buttons {
    flex-direction: column;
    gap: 8px;
    width: 100%;
  }
  
  .search-btn,
  .reset-btn {
    width: 100%;
    margin: 0;
  }
  
  :deep(.el-table th.el-table__cell),
  :deep(.el-table td.el-table__cell) {
    padding: 8px 4px;
    font-size: 13px;
  }
  
  /* 分页组件优化 */
  .pagination {
    margin-top: 16px;
    margin-bottom: 20px;
    padding: 0 8px;
  }
  
  :deep(.el-pagination) {
    justify-content: center;
    flex-wrap: wrap;
  }
  
  :deep(.el-pagination .el-pagination__total) {
    order: -1;
    width: 100%;
    text-align: center;
    margin-bottom: 12px;
    font-size: 14px;
    color: #606266;
  }
  
  :deep(.el-pagination .el-pagination__sizes) {
    font-size: 13px;
    margin: 0 4px;
  }
  
  :deep(.el-pagination .el-pagination__jump) {
    font-size: 13px;
    margin-left: 8px;
  }
  
  :deep(.el-pagination .el-pager li),
  :deep(.el-pagination .btn-prev),
  :deep(.el-pagination .btn-next) {
    min-width: 36px;
    height: 36px;
    line-height: 34px;
    font-size: 14px;
    border-radius: 6px;
    margin: 2px;
  }
}
</style>