import React, { useState, useCallback } from 'react'
import { useUploadState } from '../hooks/useUploadState'
import { UploadProgressCard } from '../components/UploadProgress'

function UploadPage() {
  const [isDragging, setIsDragging] = useState(false)

  // 使用自定义 Hook 管理上传状态
  const {
    selectedFile,
    uploading,
    uploadProgress,
    uploadStatus,
    uploadDetails,
    error,
    uploadResult,
    fileInputRef,
    handleFileSelect,
    handleFileInputChange,
    handleRemoveFile,
    handleUpload,
    handleCancelUpload,
    handleRetryUpload,
    resetUploadState,
    getUploadState,
    validateFile
  } = useUploadState()

  // 处理拖拽事件
  const handleDragEnter = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      const file = files[0]
      handleFileSelect(file)
    }
  }, [handleFileSelect])

  // 点击触发文件选择
  const handleFileSelectClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  // 格式化文件大小
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // 格式化文件名（显示前20个字符）
  const formatFileName = (name) => {
    if (name.length <= 20) return name
    return name.substring(0, 17) + '...'
  }

  // 获取当前状态
  const currentState = getUploadState()

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* 页面标题 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            智能高铁巡检系统
          </h1>
          <p className="text-gray-600">
            上传视频文件进行AI智能检测分析
          </p>
        </div>

        {/* 上传卡片 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-6 text-gray-700">
            📁 上传视频文件
          </h2>

          {/* 拖拽上传区域 */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragging
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400 bg-gray-50'
            }`}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleFileSelectClick}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="video/mp4"
              onChange={handleFileInputChange}
              className="hidden"
            />

            {/* 上传图标和文字 */}
            <div className="mb-4">
              {isDragging ? (
                <div className="flex flex-col items-center">
                  <svg className="w-16 h-16 text-blue-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-blue-600 font-medium">松开鼠标即可上传</p>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <svg className="w-16 h-16 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-gray-700 font-medium mb-1">拖拽视频文件到此处</p>
                  <p className="text-gray-500 text-sm">或者</p>
                  <button className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
                    点击选择文件
                  </button>
                </div>
              )}
            </div>

            {/* 文件格式要求 */}
            <div className="text-sm text-gray-500">
              支持 MP4 格式，文件大小不超过 100MB
            </div>
          </div>

          {/* 已选文件信息 */}
          {selectedFile && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="font-medium text-green-800">
                      {formatFileName(selectedFile.name)}
                    </p>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>文件大小: {formatFileSize(selectedFile.size)}</p>
                    <p>文件类型: MP4 视频</p>
                  </div>
                </div>
                <button
                  onClick={handleRemoveFile}
                  className="ml-4 p-2 text-red-600 hover:bg-red-100 rounded transition-colors"
                  title="移除文件"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* 错误信息 */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* 上传进度卡片 */}
          {uploading && (
            <UploadProgressCard
              percentage={uploadProgress}
              status={uploadStatus}
              loaded={uploadDetails.loaded}
              total={uploadDetails.total}
              speed={uploadDetails.speed}
              remainingTime={uploadDetails.remainingTime}
              onCancel={handleCancelUpload}
            />
          )}

          {/* 上传/重试按钮 */}
          {currentState.canRetry ? (
            <div className="mt-6 space-y-3">
              <button
                onClick={handleRetryUpload}
                className="w-full py-3 px-4 rounded-lg font-medium bg-orange-600 hover:bg-orange-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
              >
                <span className="flex items-center justify-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  重新上传
                </span>
              </button>
              <button
                onClick={resetUploadState}
                className="w-full py-2 px-4 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
              >
                选择新文件
              </button>
            </div>
          ) : (
            <button
              onClick={handleUpload}
              disabled={!currentState.canUpload}
              className={`w-full mt-6 py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                uploading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : !selectedFile
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg'
              }`}
            >
              {uploading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  上传中... {uploadProgress > 0 && `(${uploadProgress}%)`}
                </span>
              ) : !selectedFile ? (
                '请先选择视频文件'
              ) : (
                '开始上传'
              )}
            </button>
          )}
        </div>

        {/* 底部链接 */}
        <div className="mt-6 text-center space-y-2">
          <a
            href="/history"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 underline"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            查看历史记录
          </a>
        </div>

        {/* 上传历史记录 */}
        {uploadResult && (
          <div className="mt-8 bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium text-gray-800 mb-3">
              {uploadResult.type === 'success' ? '✅ 上传成功' :
               uploadResult.type === 'error' ? '❌ 上传失败' : '⏹️ 上传取消'}
            </h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p>文件名: {uploadResult.fileName}</p>
              <p>文件大小: {formatFileSize(uploadResult.fileSize)}</p>
              <p>时间: {new Date(uploadResult.timestamp || Date.now()).toLocaleString()}</p>
              {uploadResult.type === 'success' && (
                <p className="text-green-600">任务ID: {uploadResult.taskId}</p>
              )}
              {uploadResult.type === 'error' && (
                <p className="text-red-600">错误: {uploadResult.error}</p>
              )}
            </div>
          </div>
        )}

        {/* 使用提示 */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-800 mb-2">💡 使用提示</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• 支持拖拽上传或点击选择文件</li>
            <li>• 推荐上传清晰度较高的巡检视频</li>
            <li>• 系统会自动检测三类电杆：铁塔、水泥杆、钢构架</li>
            <li>• 上传成功后自动跳转到检测页面</li>
            <li>• 上传失败时可选择重试或选择新文件</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default UploadPage