<template>
  <div class="signature-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <h2>电子签名</h2>
          <p class="subtitle">请使用鼠标或触控设备进行签名</p>
          <p v-if="isBatchMode" class="batch-info">
            批量签字模式：将为 {{ batchMemoIds.length }} 份备忘录签字
          </p>
        </div>
      </template>
      
      <div class="signature-container">
        <canvas
          ref="signatureCanvas"
          :width="canvasWidth"
          :height="canvasHeight"
          @mousedown="startDrawing"
          @mousemove="draw"
          @mouseup="stopDrawing"
          @mouseleave="stopDrawing"
          @touchstart="handleTouchStart"
          @touchmove="handleTouchMove"
          @touchend="stopDrawing"
          class="signature-canvas"
        />
        
        <div class="signature-actions">
          <el-button 
            @click="clearCanvas"
            :icon="Refresh"
            size="large"
          >
            清除重签
          </el-button>
          <el-button 
            type="primary"
            @click="saveSignature"
            :icon="Check"
            size="large"
            :disabled="isEmpty"
            :loading="isSubmitting"
          >
            {{ isBatchMode ? '确认批量签字' : '确认签名' }}
          </el-button>
          <el-button 
            @click="goBack"
            :icon="ArrowLeft"
            size="large"
          >
            {{ isBatchMode ? '返回列表' : '返回表单' }}
          </el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script>
import { Refresh, Check, ArrowLeft } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { memoApi } from '@/api/memo'
import { getTodayDate } from '@/utils'

export default {
  name: 'SignaturePage',
  components: {
    Refresh,
    Check,
    ArrowLeft
  },
  data() {
    return {
      canvas: null,
      ctx: null,
      isDrawing: false,
      isEmpty: true,
      canvasWidth: 600,
      canvasHeight: 300,
      lastX: 0,
      lastY: 0,
      isBatchMode: false,
      batchMemoIds: [],
      isSubmitting: false
    }
  },
  mounted() {
    this.initCanvas()
    this.handleResize()
    window.addEventListener('resize', this.handleResize)
    this.checkBatchMode()
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.handleResize)
  },
  methods: {
    initCanvas() {
      this.canvas = this.$refs.signatureCanvas
      this.ctx = this.canvas.getContext('2d')
      
      // 设置画笔属性
      this.ctx.strokeStyle = '#000000'
      this.ctx.lineWidth = 2
      this.ctx.lineCap = 'round'
      this.ctx.lineJoin = 'round'
      
      // 设置背景色
      this.ctx.fillStyle = '#ffffff'
      this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight)
    },
    
    handleResize() {
      // 响应式调整画布大小
      const container = this.canvas?.parentElement
      if (container) {
        const maxWidth = Math.min(container.clientWidth - 40, 600)
        this.canvasWidth = maxWidth
        this.canvasHeight = Math.floor(maxWidth * 0.5)
        
        if (this.canvas) {
          this.canvas.width = this.canvasWidth
          this.canvas.height = this.canvasHeight
          this.initCanvas()
        }
      }
    },
    
    getEventPos(event) {
      const rect = this.canvas.getBoundingClientRect()
      const scaleX = this.canvas.width / rect.width
      const scaleY = this.canvas.height / rect.height
      
      let clientX, clientY
      
      if (event.touches && event.touches.length > 0) {
        clientX = event.touches[0].clientX
        clientY = event.touches[0].clientY
      } else {
        clientX = event.clientX
        clientY = event.clientY
      }
      
      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY
      }
    },
    
    startDrawing(event) {
      this.isDrawing = true
      this.isEmpty = false
      const pos = this.getEventPos(event)
      this.lastX = pos.x
      this.lastY = pos.y
      
      this.ctx.beginPath()
      this.ctx.moveTo(this.lastX, this.lastY)
      
      event.preventDefault()
    },
    
    draw(event) {
      if (!this.isDrawing) return
      
      const pos = this.getEventPos(event)
      
      this.ctx.beginPath()
      this.ctx.moveTo(this.lastX, this.lastY)
      this.ctx.lineTo(pos.x, pos.y)
      this.ctx.stroke()
      
      this.lastX = pos.x
      this.lastY = pos.y
      
      event.preventDefault()
    },
    
    stopDrawing() {
      if (this.isDrawing) {
        this.isDrawing = false
        this.ctx.beginPath()
      }
    },
    
    handleTouchStart(event) {
      this.startDrawing(event)
    },
    
    handleTouchMove(event) {
      this.draw(event)
    },
    
    clearCanvas() {
      this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight)
      this.ctx.fillStyle = '#ffffff'
      this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight)
      this.isEmpty = true
    },
    
    async saveSignature() {
      if (this.isEmpty) {
        ElMessage.warning('请先进行签名')
        return
      }
      
      this.isSubmitting = true
      
      try {
        // 将画布转换为base64数据
        const signatureData = this.canvas.toDataURL('image/png')
        
        if (this.isBatchMode) {
          // 批量签字模式
          await this.performBatchSign(signatureData)
        } else {
          // 单个签字模式
          if (this.$route.query.returnTo) {
            localStorage.setItem('signature_data', signatureData)
            ElMessage.success('签名已保存')
            this.$router.push(this.$route.query.returnTo)
          } else {
            ElMessage.success('签名已保存')
            this.goBack()
          }
        }
      } catch (error) {
        console.error('签字失败:', error)
        ElMessage.error('签字失败')
      } finally {
        this.isSubmitting = false
      }
    },
    
    // 检查是否为批量签字模式
    checkBatchMode() {
      this.isBatchMode = this.$route.query.batch === 'true'
      if (this.isBatchMode) {
        const savedIds = localStorage.getItem('batch_sign_memo_ids')
        if (savedIds) {
          this.batchMemoIds = JSON.parse(savedIds)
        }
      }
    },
    
    // 执行批量签字
    async performBatchSign(signatureData) {
      const requestData = {
        memo_ids: this.batchMemoIds,
        representative_signature: signatureData,
        signing_date: getTodayDate()
      }
      
      const response = await memoApi.batchSign(requestData)
      
      // 保存批量签字结果
      localStorage.setItem('batch_sign_result', JSON.stringify({
        count: response.updated_memos.length
      }))
      
      ElMessage.success(`批量签字成功，已为 ${response.updated_memos.length} 份备忘录签字`)
      
      // 返回列表页面
      if (this.$route.query.returnTo) {
        this.$router.push(this.$route.query.returnTo)
      } else {
        this.$router.push('/')
      }
    },
    
    goBack() {
      if (this.isBatchMode) {
        // 清除批量签字的缓存数据
        localStorage.removeItem('batch_sign_memo_ids')
      }
      
      if (this.$route.query.returnTo) {
        this.$router.push(this.$route.query.returnTo)
      } else {
        this.$router.go(-1)
      }
    }
  }
}
</script>

<style scoped>
.signature-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.card-header {
  text-align: center;
}

.card-header h2 {
  margin: 0 0 10px 0;
  color: #303133;
}

.subtitle {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.batch-info {
  margin: 10px 0 0 0;
  padding: 8px 12px;
  background: #f0f9ff;
  color: #409eff;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
}

.signature-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.signature-canvas {
  border: 2px dashed #dcdfe6;
  border-radius: 8px;
  background-color: #ffffff;
  cursor: crosshair;
  touch-action: none;
}

.signature-canvas:hover {
  border-color: #409EFF;
}

.signature-actions {
  display: flex;
  gap: 15px;
  justify-content: center;
  flex-wrap: wrap;
}

/* 移动端签名页面优化 */
@media (max-width: 768px) {
  .signature-page {
    padding: 8px;
    max-width: 100vw;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }
  
  :deep(.el-card) {
    border-radius: 12px;
    flex: 1;
    display: flex;
    flex-direction: column;
    margin-bottom: 8px;
  }
  
  :deep(.el-card__header) {
    padding: 16px;
    background: linear-gradient(135deg, #f8faff 0%, #e3f2fd 100%);
    border-bottom: 1px solid #f0f0f0;
  }
  
  :deep(.el-card__body) {
    padding: 16px;
    flex: 1;
    display: flex;
    flex-direction: column;
  }
  
  .card-header h2 {
    font-size: 20px;
    font-weight: 600;
    margin-bottom: 4px;
    color: #1e3a8a;
  }
  
  .subtitle {
    font-size: 14px;
    color: #64748b;
    margin: 0;
  }
  
  .batch-info {
    margin-top: 8px;
    padding: 10px 12px;
    background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
    color: #059669;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    border: 1px solid #a7f3d0;
  }
  
  .signature-container {
    gap: 16px;
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
  }
  
  .signature-canvas {
    width: 100% !important;
    height: 300px !important;
    max-width: 100%;
    border: 3px dashed #cbd5e1;
    border-radius: 12px;
    touch-action: none;
    background: #ffffff;
    cursor: crosshair;
    transition: all 0.3s ease;
    flex-shrink: 0;
  }
  
  .signature-canvas:active {
    border-color: #409eff;
    box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.1);
  }
  
  .signature-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    width: 100%;
    margin-top: auto;
    padding-top: 16px;
  }
  
  .signature-actions .el-button {
    margin: 0;
    height: 48px;
    font-size: 15px;
    font-weight: 600;
    border-radius: 10px;
    transition: all 0.3s ease;
  }
  
  .signature-actions .el-button--primary {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    border: none;
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
    color: white;
  }
  
  .signature-actions .el-button--primary:hover {
    background: linear-gradient(135deg, #059669 0%, #047857 100%);
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
  }
  
  .signature-actions .el-button--danger {
    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
    border: none;
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
    color: white;
  }
  
  .signature-actions .el-button--danger:hover {
    background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(239, 68, 68, 0.4);
  }
  
  .signature-actions .el-button:active {
    transform: scale(0.98);
  }
}

/* 超小屏幕优化 */
@media (max-width: 480px) {
  .signature-page {
    padding: 4px;
  }
  
  .card-header h2 {
    font-size: 18px;
  }
  
  .subtitle {
    font-size: 13px;
  }
  
  .signature-canvas {
    height: 250px !important;
    border-radius: 8px;
  }
  
  .signature-actions {
    grid-template-columns: 1fr;
    gap: 10px;
  }
  
  .signature-actions .el-button {
    height: 44px;
    font-size: 14px;
  }
  
  :deep(.el-card__header) {
    padding: 12px;
  }
  
  :deep(.el-card__body) {
    padding: 12px;
  }
}

/* 横屏模式优化 */
@media (max-width: 768px) and (orientation: landscape) {
  .signature-canvas {
    height: 200px !important;
  }
  
  .signature-actions {
    grid-template-columns: 1fr 1fr 1fr 1fr;
    gap: 8px;
  }
  
  .signature-actions .el-button {
    height: 40px;
    font-size: 13px;
  }
}
</style>