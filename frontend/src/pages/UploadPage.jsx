import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { uploadVideo, formatFileSize, formatUploadSpeed, triggerDetection } from '../api'

const UploadPage = () => {
  const [selectedFile, setSelectedFile] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState(null)
  const fileInputRef = useRef(null)
  const navigate = useNavigate()

  // 文件验证
  const validateFile = (file) => {
    // 检查文件类型
    if (file.type !== 'video/mp4') {
      return {
        valid: false,
        error: '文件格式不支持，请选择MP4视频文件'
      }
    }

    // 检查文件大小 (100MB)
    const maxSize = 100 * 1024 * 1024
    if (file.size > maxSize) {
      return {
        valid: false,
        error: `文件过大，请选择小于100MB的文件（当前文件大小：${formatFileSize(file.size)}）`
      }
    }

    return { valid: true }
  }

  // 处理文件选择
  const handleFileSelect = (file) => {
    setError(null)
    setUploadProgress(null)

    const validation = validateFile(file)
    if (!validation.valid) {
      setError(validation.error)
      return
    }

    setSelectedFile(file)
  }

  // 拖拽事件处理
  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  // 文件输入变化
  const handleFileInputChange = (e) => {
    const files = e.target.files
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  // 上传处理
  const handleUpload = async () => {
    if (!selectedFile) return

    setIsUploading(true)
    setError(null)
    setUploadProgress(null)

    try {
      const result = await uploadVideo(selectedFile, (progress) => {
        setUploadProgress(progress)
      })

      if (result.success) {
        // 上传成功，获取taskId并跳转
        const taskId = result.data.task_id

        // 自动触发检测
        triggerDetection(taskId).catch(err => {
          console.error('检测触发失败:', err)
        })

        // 跳转到检查页面
        navigate(`/inspect/${taskId}`)
      } else {
        // 上传失败，显示错误
        setError(result.error || '上传失败，请重试')
        setUploadProgress(null)
      }
    } catch (err) {
      console.error('Upload error:', err)
      setError('上传过程中发生错误，请重试')
      setUploadProgress(null)
    } finally {
      setIsUploading(false)
    }
  }

  // 重置选择
  const handleReset = () => {
    setSelectedFile(null)
    setUploadProgress(null)
    setError(null)
    setIsUploading(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* 页面标题 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            智能高铁巡检系统
          </h1>
          <p className="text-gray-600">
            上传MP4视频文件，系统将自动检测铁路电杆
          </p>
        </div>

        {/* 上传区域 */}
        <div className="bg-white rounded-lg shadow-md p-8">
          {/* 拖拽上传区域 */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            } ${isUploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !isUploading && fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="video/mp4"
              onChange={handleFileInputChange}
              className="hidden"
              disabled={isUploading}
            />

            <div className="space-y-4">
              {/* 上传图标 */}
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>

              {/* 提示文字 */}
              <div>
                <p className="text-lg font-medium text-gray-900">
                  {isUploading ? '正在上传...' : '点击选择或拖拽MP4视频文件'}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  支持格式：MP4，最大文件大小：100MB
                </p>
              </div>
            </div>
          </div>

          {/* 文件信息显示 */}
          {selectedFile && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {selectedFile.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
                {!isUploading && (
                  <button
                    onClick={handleReset}
                    className="ml-4 text-red-600 hover:text-red-800 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* 上传进度条 */}
          {uploadProgress && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-900">
                  上传进度
                </span>
                <span className="text-sm text-gray-500">
                  {uploadProgress.percentCompleted}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress.percentCompleted}%` }}
                />
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-xs text-gray-500">
                  已上传: {formatFileSize(uploadProgress.uploadedBytes)}
                </span>
                <span className="text-xs text-gray-500">
                  速度: {formatUploadSpeed(uploadProgress.uploadSpeed)}
                </span>
              </div>
            </div>
          )}

          {/* 错误提示 */}
          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* 操作按钮 */}
          <div className="mt-6 flex justify-center">
            <button
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
              className={`px-6 py-3 rounded-md font-medium text-white transition-colors ${
                !selectedFile || isUploading
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
              }`}
            >
              {isUploading ? '上传中...' : '开始上传'}
            </button>
          </div>
        </div>

        {/* 使用说明 */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-sm font-medium text-blue-900 mb-2">使用说明</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• 支持的格式：MP4视频文件</li>
            <li>• 文件大小限制：最大100MB</li>
            <li>• 上传成功后系统将自动检测铁路电杆</li>
            <li>• 检测完成后可在检查页面查看结果</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default UploadPage