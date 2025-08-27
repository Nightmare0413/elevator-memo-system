import request from '@/utils/request'

export const auth = {
  login(credentials) {
    return request.post('/api/users/login', credentials)
  },

  register(userData) {
    return request.post('/api/users/register', userData)
  },

  getCurrentUser() {
    return request.get('/api/users/me')
  },

  updateProfile(userData) {
    return request.put('/api/users/me', userData)
  },

  getAllUsers(params = {}) {
    return request.get('/api/users', { params })
  },

  updateUserRole(userId, role) {
    return request.put(`/api/users/${userId}/role`, { role })
  },

  // 更新用户完整信息（管理员功能）
  updateUser(userId, userData) {
    return request.put(`/api/users/${userId}`, userData)
  },

  deactivateUser(userId) {
    return request.delete(`/api/users/${userId}`)
  },

  uploadSignature(formData) {
    return request.post('/api/users/signatures', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },

  getUserSignatures() {
    return request.get('/api/users/signatures')
  },

  deleteSignature(signatureId) {
    return request.delete(`/api/users/signatures/${signatureId}`)
  },

  // 为特定用户上传签名（管理员功能）
  uploadUserSignature(userId, formData) {
    return request.post(`/api/users/${userId}/signatures`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },

  // 获取特定用户的签名列表（管理员功能）
  getUserSignaturesList(userId) {
    return request.get(`/api/users/${userId}/signatures`)
  }
}