import axios from 'axios'

// 创建axios实例，配置基础URL和超时
const api = axios.create({
  baseURL: 'http://localhost:8000', // 后端服务器地址，根据实际情况调整
  timeout: 30000, // 30秒超时
  headers: {
    'Content-Type': 'application/json'
  }
})

// 上传视频接口
export const uploadVideo = async (file, onUploadProgress) => {
  try {
    const formData = new FormData()
    formData.append('file', file) // 字段名必须是 'file'

    const response = await api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent) => {
        if (onUploadProgress) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          )
          const uploadSpeed = progressEvent.rate // 上传速度（字节/秒）
          const uploadedBytes = progressEvent.loaded
          const totalBytes = progressEvent.total

          onUploadProgress({
            percentCompleted,
            uploadSpeed,
            uploadedBytes,
            totalBytes
          })
        }
      }
    })

    return {
      success: true,
      data: response.data.data
    }
  } catch (error) {
    console.error('Upload error:', error)

    // 处理不同类型的错误
    if (error.response) {
      // 服务器返回了错误响应
      const errorData = error.response.data
      return {
        success: false,
        error: errorData.error || 'UPLOAD_FAILED',
        message: getErrorMessage(errorData.error)
      }
    } else if (error.request) {
      // 请求发出但没有收到响应
      return {
        success: false,
        error: 'NETWORK_ERROR',
        message: '网络连接失败，请检查网络设置'
      }
    } else {
      // 其他错误
      return {
        success: false,
        error: 'UNKNOWN_ERROR',
        message: '未知错误，请稍后重试'
      }
    }
  }
}

// 触发检测接口 - 对应 POST /detect/{task_id}
export const triggerDetection = async (taskId) => {
  try {
    const response = await api.post(`/detect/${taskId}`)
    return {
      success: true,
      data: response.data.data
    }
  } catch (error) {
    console.error('Detection trigger error:', error)
    if (error.response) {
      const errorData = error.response.data
      return {
        success: false,
        error: errorData.error || 'DETECT_FAILED',
        message: getErrorMessage(errorData.error)
      }
    } else if (error.request) {
      return {
        success: false,
        error: 'NETWORK_ERROR',
        message: '网络连接失败，请检查网络设置'
      }
    } else {
      return {
        success: false,
        error: 'UNKNOWN_ERROR',
        message: '未知错误，请稍后重试'
      }
    }
  }
}

// 获取检测结果接口 - 对应 GET /detections/{task_id}
export const getDetections = async (taskId) => {
  try {
    const response = await api.get(`/detections/${taskId}`)
    return {
      success: true,
      data: response.data.data
    }
  } catch (error) {
    console.error('Fetch detections error:', error)
    if (error.response) {
      const errorData = error.response.data
      return {
        success: false,
        error: errorData.error || 'DETECTIONS_NOT_FOUND',
        message: getErrorMessage(errorData.error)
      }
    } else if (error.request) {
      return {
        success: false,
        error: 'NETWORK_ERROR',
        message: '网络连接失败，请检查网络设置'
      }
    } else {
      return {
        success: false,
        error: 'UNKNOWN_ERROR',
        message: '未知错误，请稍后重试'
      }
    }
  }
}

// 错误信息映射
const getErrorMessage = (errorCode) => {
  const errorMessages = {
    // 上传相关错误
    'UPLOAD_INVALID_FILE': '文件格式不支持或文件过大',
    'UPLOAD_SAVE_FAILED': '保存失败，请重试',

    // 检测相关错误
    'TASK_NOT_FOUND': '任务不存在，请重新上传视频',
    'DETECT_FAILED': '检测失败，请重试',
    'DETECTIONS_NOT_FOUND': '检测结果不存在',

    // 通用错误
    'INTERNAL_ERROR': '服务器错误，请稍后重试',
    'NETWORK_ERROR': '网络连接失败，请检查网络设置',
    'UNKNOWN_ERROR': '未知错误，请稍后重试'
  }

  return errorMessages[errorCode] || '操作失败，请重试'
}

// 格式化文件大小
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 格式化上传速度
export const formatUploadSpeed = (bytesPerSecond) => {
  return formatFileSize(bytesPerSecond) + '/s'
}

export default api