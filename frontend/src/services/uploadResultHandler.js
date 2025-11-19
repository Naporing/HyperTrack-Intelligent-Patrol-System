/**
 * 上传结果处理服务
 * 统一处理上传成功/失败/取消结果
 */

class UploadResultHandler {
  constructor() {
    this.uploadHistory = this.loadUploadHistory()
  }

  /**
   * 加载上传历史记录
   */
  loadUploadHistory() {
    try {
      const stored = localStorage.getItem('uploadHistory')
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.warn('Failed to load upload history:', error)
      return []
    }
  }

  /**
   * 保存上传历史记录
   */
  saveUploadHistory(history) {
    try {
      localStorage.setItem('uploadHistory', JSON.stringify(history))
    } catch (error) {
      console.warn('Failed to save upload history:', error)
    }
  }

  /**
   * 添加上传记录到历史
   */
  addUploadRecord(record) {
    const newRecord = {
      ...record,
      id: Date.now().toString(),
      timestamp: new Date().toISOString()
    }

    // 保持最近20条记录
    this.uploadHistory.unshift(newRecord)
    if (this.uploadHistory.length > 20) {
      this.uploadHistory = this.uploadHistory.slice(0, 20)
    }

    this.saveUploadHistory(this.uploadHistory)
    return newRecord
  }

  /**
   * 处理上传成功
   */
  handleSuccess(result, file, navigate) {
    const successRecord = {
      type: 'success',
      fileName: file.name,
      fileSize: file.size,
      taskId: result.data.task_id,
      videoInfo: result.data,
      uploadTime: new Date().toISOString()
    }

    // 添加到历史记录
    this.addUploadRecord(successRecord)

    // 记录到控制台
    console.log('✅ 上传成功:', successRecord)

    // 显示成功提示
    this.showSuccessNotification(successRecord)

    // 延迟跳转，让用户看到成功状态
    setTimeout(() => {
      navigate(`/inspect/${result.data.task_id}`)
    }, 1500)

    return successRecord
  }

  /**
   * 处理上传失败
   */
  handleError(error, file) {
    const errorRecord = {
      type: 'error',
      fileName: file ? file.name : 'unknown',
      fileSize: file ? file.size : 0,
      error: error.message || '上传失败',
      errorType: this.categorizeError(error),
      uploadTime: new Date().toISOString()
    }

    // 添加到历史记录
    this.addUploadRecord(errorRecord)

    // 记录到控制台
    console.error('❌ 上传失败:', errorRecord)

    // 显示错误提示
    this.showErrorNotification(errorRecord)

    return errorRecord
  }

  /**
   * 处理上传取消
   */
  handleCancel(file) {
    const cancelRecord = {
      type: 'cancelled',
      fileName: file ? file.name : 'unknown',
      fileSize: file ? file.size : 0,
      message: '用户取消上传',
      uploadTime: new Date().toISOString()
    }

    // 添加到历史记录
    this.addUploadRecord(cancelRecord)

    console.log('⏹️ 上传取消:', cancelRecord)

    return cancelRecord
  }

  /**
   * 错误分类
   */
  categorizeError(error) {
    if (!error) return 'unknown'

    const message = error.message?.toLowerCase() || ''

    if (message.includes('network') || message.includes('connection')) {
      return 'network'
    } else if (message.includes('timeout')) {
      return 'timeout'
    } else if (message.includes('file') || message.includes('format') || message.includes('size')) {
      return 'file_validation'
    } else if (message.includes('server') || message.includes('500')) {
      return 'server_error'
    } else if (message.includes('取消') || message.includes('cancel')) {
      return 'cancelled'
    } else {
      return 'unknown'
    }
  }

  /**
   * 显示成功通知
   */
  showSuccessNotification(record) {
    // 这里可以集成通知库，如 react-toastify
    console.log('🎉 上传成功通知:', {
      title: '上传成功',
      message: `${record.fileName} 已成功上传`,
      taskId: record.taskId
    })

    // 简单的页面提示
    if (typeof window !== 'undefined') {
      // 创建临时提示元素
      const toast = document.createElement('div')
      toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transform transition-all duration-300 translate-x-full'
      toast.innerHTML = `
        <div class="flex items-center">
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <div>
            <div class="font-medium">上传成功!</div>
            <div class="text-sm opacity-90">正在跳转到检测页面...</div>
          </div>
        </div>
      `
      document.body.appendChild(toast)

      // 动画显示
      setTimeout(() => {
        toast.classList.remove('translate-x-full')
      }, 100)

      // 自动移除
      setTimeout(() => {
        toast.classList.add('translate-x-full')
        setTimeout(() => {
          document.body.removeChild(toast)
        }, 300)
      }, 3000)
    }
  }

  /**
   * 显示错误通知
   */
  showErrorNotification(record) {
    const errorMessages = {
      network: '网络连接失败，请检查网络设置',
      timeout: '上传超时，请重试',
      file_validation: '文件验证失败，请检查文件格式和大小',
      server_error: '服务器错误，请稍后重试',
      cancelled: '上传已取消',
      unknown: '上传失败，请重试'
    }

    const friendlyMessage = errorMessages[record.errorType] || errorMessages.unknown

    console.log('❌ 错误通知:', {
      title: '上传失败',
      message: friendlyMessage,
      details: record.error
    })

    // 简单的页面错误提示
    if (typeof window !== 'undefined') {
      const toast = document.createElement('div')
      toast.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transform transition-all duration-300 translate-x-full'
      toast.innerHTML = `
        <div class="flex items-start">
          <svg class="w-5 h-5 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <div class="flex-1">
            <div class="font-medium">上传失败</div>
            <div class="text-sm opacity-90">${friendlyMessage}</div>
            ${record.fileName ? `<div class="text-xs opacity-75 mt-1">文件: ${record.fileName}</div>` : ''}
          </div>
          <button onclick="this.parentElement.parentElement.remove()" class="ml-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
      `
      document.body.appendChild(toast)

      // 动画显示
      setTimeout(() => {
        toast.classList.remove('translate-x-full')
      }, 100)

      // 自动移除（错误消息显示更长时间）
      setTimeout(() => {
        toast.classList.add('translate-x-full')
        setTimeout(() => {
          if (document.body.contains(toast)) {
            document.body.removeChild(toast)
          }
        }, 300)
      }, 8000)
    }
  }

  /**
   * 获取上传历史记录
   */
  getUploadHistory() {
    return this.uploadHistory
  }

  /**
   * 清除上传历史记录
   */
  clearHistory() {
    this.uploadHistory = []
    this.saveUploadHistory([])
  }

  /**
   * 获取上传统计信息
   */
  getUploadStats() {
    const stats = {
      total: this.uploadHistory.length,
      successful: this.uploadHistory.filter(r => r.type === 'success').length,
      failed: this.uploadHistory.filter(r => r.type === 'error').length,
      cancelled: this.uploadHistory.filter(r => r.type === 'cancelled').length
    }

    stats.successRate = stats.total > 0 ? (stats.successful / stats.total * 100).toFixed(1) : 0

    return stats
  }
}

// 创建单例实例
const uploadResultHandler = new UploadResultHandler()

export default uploadResultHandler