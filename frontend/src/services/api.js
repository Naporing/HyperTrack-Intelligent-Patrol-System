/**
 * API 服务封装
 * 提供统一的HTTP请求接口和错误处理
 */

import axios from 'axios'

// 创建 axios 实例
const api = axios.create({
  baseURL: '',  // 使用相对路径，Vite 代理会处理
  timeout: 300000, // 5分钟超时
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    // 可以在这里添加 token 等
    console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`)
    return config
  },
  (error) => {
    console.error('[API] Request error:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    console.log(`[API] Response ${response.status}:`, response.data)
    return response
  },
  (error) => {
    console.error('[API] Response error:', error)

    // 处理网络错误
    if (!error.response) {
      error.message = '网络连接失败，请检查网络设置'
    } else {
      // 处理后端返回的错误信息
      const errorData = error.response.data
      if (errorData && errorData.error) {
        error.message = errorData.error
      } else {
        error.message = `请求失败 (${error.response.status})`
      }
    }

    return Promise.reject(error)
  }
)

// API 方法封装
export const apiService = {
  // 健康检查
  async healthCheck() {
    try {
      const response = await api.get('/')
      return {
        success: true,
        data: response.data,
        message: '服务运行正常'
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: '服务连接失败'
      }
    }
  },

  // 上传视频文件
  async uploadVideo(file, onUploadProgress) {
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await api.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          if (onUploadProgress && typeof onUploadProgress === 'function') {
            const progress = {
              loaded: progressEvent.loaded,
              total: progressEvent.total,
              percentage: Math.round((progressEvent.loaded * 100) / progressEvent.total),
              bytesPerSecond: this.calculateUploadSpeed(progressEvent),
              estimatedTimeRemaining: this.calculateEstimatedTime(progressEvent)
            }
            onUploadProgress(progress)
          }
        }
      })

      return {
        success: true,
        data: response.data.data,
        message: '上传成功'
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: '上传失败'
      }
    }
  },

  // 执行检测
  async detectObjects(taskId, onProgress) {
    try {
      // 模拟进度回调
      if (onProgress && typeof onProgress === 'function') {
        // 立即开始进度
        onProgress({ percentage: 0, status: '初始化...' })

        // 模拟检测进度
        const progressInterval = setInterval(() => {
          const randomProgress = Math.min(Math.floor(Math.random() * 20) + 10, 100)
          onProgress({
            percentage: randomProgress,
            status: '正在处理视频帧...'
          })
        }, 1000)

        const response = await api.post(`/detect/${taskId}`)

        clearInterval(progressInterval)
        onProgress({ percentage: 100, status: '检测完成' })

        return {
          success: true,
          data: response.data.data,
          message: '检测完成'
        }
      } else {
        const response = await api.post(`/detect/${taskId}`)
        return {
          success: true,
          data: response.data.data,
          message: '检测完成'
        }
      }
    } catch (error) {
      if (onProgress && typeof onProgress === 'function') {
        onProgress({ percentage: 0, status: '检测失败', error: error.message })
      }
      return {
        success: false,
        error: error.message,
        message: '检测失败'
      }
    }
  },

  // 获取检测结果
  async getDetections(taskId) {
    try {
      const response = await api.get(`/detections/${taskId}`)
      return {
        success: true,
        data: response.data.data,
        message: '获取检测结果成功'
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: '获取检测结果失败'
      }
    }
  },

  // 获取视频流
  async getVideo(taskId) {
    try {
      const response = await api.get(`/videos/${taskId}`, {
        responseType: 'blob'
      })
      return {
        success: true,
        data: response.data,
        message: '获取视频成功'
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: '获取视频失败'
      }
    }
  },

  // 获取历史记录
  async getHistory() {
    try {
      const response = await api.get('/history')
      return {
        success: true,
        data: response.data.data,
        message: '获取历史记录成功'
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: '获取历史记录失败'
      }
    }
  },

  // 工具方法：计算上传速度
  calculateUploadSpeed(progressEvent) {
    if (!progressEvent.estimated) return null

    const loaded = progressEvent.loaded
    const duration = progressEvent.timeStamp / 1000 // 转换为秒
    const bytesPerSecond = loaded / duration

    if (bytesPerSecond < 1024) {
      return `${bytesPerSecond.toFixed(1)} B/s`
    } else if (bytesPerSecond < 1024 * 1024) {
      return `${(bytesPerSecond / 1024).toFixed(1)} KB/s`
    } else {
      return `${(bytesPerSecond / (1024 * 1024)).toFixed(1)} MB/s`
    }
  },

  // 工具方法：计算剩余时间
  calculateEstimatedTime(progressEvent) {
    if (!progressEvent.total || !progressEvent.loaded) return null

    const remaining = progressEvent.total - progressEvent.loaded
    const speed = progressEvent.rate || 0

    if (speed === 0) return null

    const remainingSeconds = remaining / speed
    if (remainingSeconds < 60) {
      return `${Math.round(remainingSeconds)}秒`
    } else {
      const minutes = Math.floor(remainingSeconds / 60)
      const seconds = Math.round(remainingSeconds % 60)
      return `${minutes}分${seconds}秒`
    }
  },

  // 工具方法：取消请求
  createCancelToken() {
    return axios.CancelToken.source()
  },

  // 工具方法：检查是否取消
  isCancel(error) {
    return axios.isCancel(error)
  }
}

// 导出默认实例
export default api