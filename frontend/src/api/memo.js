import request from '@/utils/request'

export const memoApi = {
  // 获取备忘录列表
  getMemos(params) {
    return request.get('/api/memos', { params })
  },

  // 获取单个备忘录
  getMemoById(id) {
    return request.get(`/api/memos/${id}`)
  },

  // 创建备忘录
  createMemo(data) {
    return request.post('/api/memos', data)
  },

  // 复制备忘录
  copyMemo(id) {
    return request.post(`/api/memos/${id}/copy`)
  },

  // 删除备忘录
  deleteMemo(id) {
    return request.delete(`/api/memos/${id}`)
  },

  // 生成PDF
  generatePDF(id) {
    return request.get(`/api/memos/${id}/pdf`, {
      responseType: 'blob'
    })
  },

  // 上传检测人员签名
  uploadTesterSignature(file) {
    const formData = new FormData()
    formData.append('signature', file)
    return request.post('/api/upload/tester-signature', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  }
}