// 格式化日期
export function formatDate(date, format = 'YYYY-MM-DD') {
  if (!date) return ''
  
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  
  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
}

// 获取今天日期（YYYY-MM-DD格式）
export function getTodayDate() {
  return formatDate(new Date())
}

// 下载文件
export function downloadFile(blob, filename) {
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  window.URL.revokeObjectURL(url)
  document.body.removeChild(a)
}

// 不符合情况选项
export const nonConformanceOptions = [
  { label: '无', value: 0 },
  { label: '存在不符合', value: 1 },
  { label: '存在较严重不符合', value: 2 }
]

// 获取不符合情况标签
export function getNonConformanceLabel(value) {
  const option = nonConformanceOptions.find(opt => opt.value === value)
  return option ? option.label : '未知'
}

// 验证表单字段
export const validators = {
  required: (message = '此字段为必填项') => {
    return { required: true, message, trigger: 'blur' }
  },
  
  memoNumber: () => {
    return { 
      pattern: /^MEMO-\d{8}-\d+$/, 
      message: '备忘录编号格式不正确', 
      trigger: 'blur' 
    }
  }
}

// 文件大小格式化
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 防抖函数
export function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}