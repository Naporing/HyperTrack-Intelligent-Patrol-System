import { useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiService } from '../services/api'
import uploadResultHandler from '../services/uploadResultHandler'

/**
 * 上传状态管理 Hook
 * 统一管理上传相关的所有状态和操作
 */
export function useUploadState() {
  const [selectedFile, setSelectedFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStatus, setUploadStatus] = useState('')
  const [uploadDetails, setUploadDetails] = useState({})
  const [error, setError] = useState('')
  const [uploadResult, setUploadResult] = useState(null)

  const navigate = useNavigate()
  const cancelTokenRef = useRef(null)
  const fileInputRef = useRef(null)

  /**
   * 文件验证函数
   */
  const validateFile = useCallback((file) => {
    if (!file) {
      return { valid: false, error: '请选择文件' }
    }
    if (file.type !== 'video/mp4') {
      return { valid: false, error: '请选择 MP4 格式的视频文件' }
    }
    if (file.size > 100 * 1024 * 1024) {
      return { valid: false, error: '文件大小不能超过 100MB' }
    }
    return { valid: true, error: null }
  }, [])

  /**
   * 重置上传状态
   */
  const resetUploadState = useCallback(() => {
    setSelectedFile(null)
    setUploading(false)
    setUploadProgress(0)
    setUploadStatus('')
    setUploadDetails({})
    setError('')
    setUploadResult(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  /**
   * 处理文件选择
   */
  const handleFileSelect = useCallback((file) => {
    const validation = validateFile(file)
    if (validation.valid) {
      setSelectedFile(file)
      setError('')
      setUploadProgress(0)
      setUploadStatus('')
      setUploadDetails({})
      setUploadResult(null)
    } else {
      setError(validation.error)
      setSelectedFile(null)
      setUploadResult({ type: 'error', error: validation.error })
    }
  }, [validateFile])

  /**
   * 处理文件输入变化
   */
  const handleFileInputChange = useCallback((event) => {
    const file = event.target.files[0]
    if (file) {
      handleFileSelect(file)
    }
  }, [handleFileSelect])

  /**
   * 移除选中的文件
   */
  const handleRemoveFile = useCallback(() => {
    resetUploadState()
  }, [resetUploadState])

  /**
   * 取消上传
   */
  const handleCancelUpload = useCallback(() => {
    if (cancelTokenRef.current) {
      cancelTokenRef.current.cancel('用户取消上传')
      cancelTokenRef.current = null
    }

    if (selectedFile) {
      const cancelRecord = uploadResultHandler.handleCancel(selectedFile)
      setUploadResult(cancelRecord)
    }

    setUploading(false)
    setUploadProgress(0)
    setUploadStatus('上传已取消')
  }, [selectedFile])

  /**
   * 上传文件
   */
  const handleUpload = useCallback(async () => {
    if (!selectedFile) {
      setError('请先选择文件')
      return
    }

    // 创建取消令牌
    cancelTokenRef.current = apiService.createCancelToken()

    setUploading(true)
    setError('')
    setUploadProgress(0)
    setUploadStatus('正在连接服务器...')

    try {
      // 上传进度回调
      const onUploadProgress = (progress) => {
        setUploadProgress(progress.percentage)
        setUploadDetails({
          loaded: progress.loaded,
          total: progress.total,
          speed: progress.bytesPerSecond,
          remainingTime: progress.estimatedTimeRemaining
        })

        // 根据进度更新状态
        if (progress.percentage < 10) {
          setUploadStatus('正在上传文件...')
        } else if (progress.percentage < 50) {
          setUploadStatus('正在传输数据...')
        } else if (progress.percentage < 90) {
          setUploadStatus('即将完成...')
        } else {
          setUploadStatus('处理服务器响应...')
        }
      }

      // 调用封装的 API 方法
      const result = await apiService.uploadVideo(selectedFile, onUploadProgress)

      if (result.success) {
        setUploadProgress(100)
        setUploadStatus('上传成功，正在跳转...')

        // 使用结果处理器处理成功
        const successRecord = uploadResultHandler.handleSuccess(result, selectedFile, navigate)
        setUploadResult(successRecord)

      } else {
        // 使用结果处理器处理失败
        const errorRecord = uploadResultHandler.handleError(
          { message: result.error },
          selectedFile
        )
        setUploadResult(errorRecord)
        setError(result.error || '上传失败')
        setUploadStatus('上传失败')
      }
    } catch (err) {
      // 检查是否是取消操作
      if (apiService.isCancel(err)) {
        const cancelRecord = uploadResultHandler.handleCancel(selectedFile)
        setUploadResult(cancelRecord)
        setUploadStatus('上传已取消')
      } else {
        // 使用结果处理器处理失败
        const errorRecord = uploadResultHandler.handleError(err, selectedFile)
        setUploadResult(errorRecord)
        setError(err.message || '上传失败，请检查网络连接')
        setUploadStatus('上传失败')
      }
      console.error('Upload error:', err)
    } finally {
      setUploading(false)
      cancelTokenRef.current = null
    }
  }, [selectedFile, navigate])

  /**
   * 重试上传
   */
  const handleRetryUpload = useCallback(() => {
    setError('')
    setUploadResult(null)
    if (selectedFile) {
      handleUpload()
    }
  }, [selectedFile, handleUpload])

  /**
   * 获取上传状态
   */
  const getUploadState = useCallback(() => {
    return {
      selectedFile,
      uploading,
      uploadProgress,
      uploadStatus,
      uploadDetails,
      error,
      uploadResult,
      canUpload: selectedFile && !uploading,
      canCancel: uploading,
      canRetry: !uploading && (error || (uploadResult && uploadResult.type === 'error'))
    }
  }, [selectedFile, uploading, uploadProgress, uploadStatus, uploadDetails, error, uploadResult])

  return {
    // 状态
    selectedFile,
    uploading,
    uploadProgress,
    uploadStatus,
    uploadDetails,
    error,
    uploadResult,

    // Refs
    fileInputRef,

    // 方法
    handleFileSelect,
    handleFileInputChange,
    handleRemoveFile,
    handleUpload,
    handleCancelUpload,
    handleRetryUpload,
    resetUploadState,
    getUploadState,

    // 工具方法
    validateFile
  }
}

export default useUploadState