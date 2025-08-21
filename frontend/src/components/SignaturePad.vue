<template>
  <div class="signature-pad-container">
    <div class="signature-canvas-wrapper">
      <vue-signature-pad
        ref="signaturePad"
        :width="canvasWidth"
        :height="canvasHeight"
        :options="signatureOptions"
        @onBeginStroke="handleBeginStroke"
        @onEndStroke="handleEndStroke"
      />
    </div>
    
    <div class="signature-actions">
      <el-button 
        size="small"
        @click="clear"
        :icon="Refresh"
      >
        清除
      </el-button>
      <el-button 
        size="small"
        type="primary"
        @click="save"
        :icon="Check"
        :disabled="isEmpty"
      >
        保存签名
      </el-button>
    </div>
    
    <div class="signature-info">
      <el-text size="small" type="info">
        请在上方区域内进行签名
      </el-text>
    </div>
  </div>
</template>

<script>
import VueSignaturePad from 'vue-signature-pad'
import { Refresh, Check } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

export default {
  name: 'SignaturePad',
  components: {
    VueSignaturePad,
    Refresh,
    Check
  },
  props: {
    initialSignature: {
      type: String,
      default: ''
    },
    width: {
      type: Number,
      default: 400
    },
    height: {
      type: Number,
      default: 200
    }
  },
  emits: ['signature-updated'],
  data() {
    return {
      isEmpty: true,
      canvasWidth: this.width,
      canvasHeight: this.height,
      signatureOptions: {
        backgroundColor: 'rgb(255, 255, 255)',
        penColor: 'rgb(0, 0, 0)',
        minWidth: 1,
        maxWidth: 3,
        throttle: 16,
        minDistance: 5,
        dotSize: function() {
          return (this.minWidth + this.maxWidth) / 2;
        },
        velocityFilterWeight: 0.7
      }
    }
  },
  mounted() {
    this.initializeCanvas()
    this.loadInitialSignature()
    
    // 监听窗口大小变化
    window.addEventListener('resize', this.handleResize)
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.handleResize)
  },
  watch: {
    initialSignature(newVal) {
      if (newVal) {
        this.loadSignature(newVal)
      } else {
        this.clear()
      }
    }
  },
  methods: {
    // 初始化画布
    initializeCanvas() {
      this.handleResize()
    },

    // 加载初始签名
    loadInitialSignature() {
      if (this.initialSignature) {
        this.loadSignature(this.initialSignature)
      }
    },

    // 处理窗口大小变化
    handleResize() {
      const container = this.$el?.querySelector('.signature-canvas-wrapper')
      if (container) {
        const containerWidth = container.clientWidth
        this.canvasWidth = Math.min(containerWidth - 20, this.width)
        
        // 保持宽高比
        this.canvasHeight = Math.floor(this.canvasWidth * (this.height / this.width))
      }
    },

    // 开始绘制
    handleBeginStroke() {
      this.isEmpty = false
    },

    // 结束绘制
    handleEndStroke() {
      this.save()
    },

    // 清除签名
    clear() {
      if (this.$refs.signaturePad) {
        this.$refs.signaturePad.clearSignature()
        this.isEmpty = true
        this.$emit('signature-updated', '')
      }
    },

    // 保存签名
    save() {
      if (this.$refs.signaturePad && !this.isEmpty) {
        const { isEmpty, data } = this.$refs.signaturePad.saveSignature()
        
        if (!isEmpty) {
          this.$emit('signature-updated', data)
          ElMessage.success('签名已保存')
        } else {
          this.isEmpty = true
          this.$emit('signature-updated', '')
        }
      }
    },

    // 加载签名
    loadSignature(signatureData) {
      if (this.$refs.signaturePad && signatureData) {
        this.$refs.signaturePad.fromDataURL(signatureData)
        this.isEmpty = false
      }
    },

    // 获取签名数据
    getData() {
      if (this.$refs.signaturePad && !this.isEmpty) {
        const { isEmpty, data } = this.$refs.signaturePad.saveSignature()
        return isEmpty ? '' : data
      }
      return ''
    },

    // 检查是否为空
    checkIsEmpty() {
      if (this.$refs.signaturePad) {
        this.isEmpty = this.$refs.signaturePad.isEmpty()
      }
      return this.isEmpty
    }
  }
}
</script>

<style scoped>
.signature-pad-container {
  width: 100%;
  max-width: 500px;
}

.signature-canvas-wrapper {
  border: 2px dashed #dcdfe6;
  border-radius: 8px;
  padding: 10px;
  background-color: #fafafa;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 220px;
}

:deep(.vue-signature-pad) {
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  background-color: white;
}

.signature-actions {
  margin-top: 10px;
  display: flex;
  gap: 10px;
  justify-content: flex-start;
}

.signature-info {
  margin-top: 5px;
  text-align: center;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .signature-canvas-wrapper {
    min-height: 180px;
    padding: 5px;
  }
  
  .signature-actions {
    justify-content: center;
  }
  
  .signature-actions .el-button {
    flex: 1;
  }
}
</style>