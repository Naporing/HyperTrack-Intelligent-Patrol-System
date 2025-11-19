import React from 'react'

/**
 * 上传进度组件
 * @param {Object} props
 * @param {number} props.percentage - 进度百分比 (0-100)
 * @param {string} props.status - 状态描述文字
 * @param {number} props.loaded - 已上传字节数
 * @param {number} props.total - 总字节数
 * @param {string} props.speed - 上传速度 (如: "1.2 MB/s")
 * @param {string} props.remainingTime - 剩余时间 (如: "30秒")
 * @param {boolean} props.showDetails - 是否显示详细信息
 */
function UploadProgress({
  percentage = 0,
  status = '准备上传...',
  loaded = 0,
  total = 0,
  speed = null,
  remainingTime = null,
  showDetails = false
}) {
  // 格式化文件大小
  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  // 计算进度条颜色
  const getProgressColor = (percentage) => {
    if (percentage < 30) return 'bg-blue-600'
    if (percentage < 70) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  // 获取状态图标
  const getStatusIcon = () => {
    if (percentage === 0) {
      return (
        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
      )
    } else if (percentage < 100) {
      return (
        <svg className="animate-spin w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )
    } else {
      return (
        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      {/* 进度标题 */}
      <div className="flex items-center mb-3">
        {getStatusIcon()}
        <span className="ml-2 text-sm font-medium text-gray-700">上传进度</span>
        <span className="ml-auto text-sm font-semibold text-blue-600">{percentage}%</span>
      </div>

      {/* 进度条 */}
      <div className="mb-3">
        <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ease-out ${getProgressColor(percentage)}`}
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
      </div>

      {/* 状态文字 */}
      <div className="mb-2">
        <p className="text-sm text-gray-600">{status}</p>
      </div>

      {/* 详细信息 */}
      {showDetails && (total > 0 || speed || remainingTime) && (
        <div className="border-t border-gray-100 pt-3 mt-3">
          <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
            {loaded > 0 && total > 0 && (
              <div className="flex justify-between">
                <span>已上传:</span>
                <span className="font-medium text-gray-700">
                  {formatBytes(loaded)} / {formatBytes(total)}
                </span>
              </div>
            )}

            {speed && (
              <div className="flex justify-between">
                <span>速度:</span>
                <span className="font-medium text-gray-700">{speed}</span>
              </div>
            )}

            {remainingTime && (
              <div className="flex justify-between">
                <span>剩余时间:</span>
                <span className="font-medium text-gray-700">{remainingTime}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 简化信息（不显示详细信息时） */}
      {!showDetails && loaded > 0 && total > 0 && (
        <div className="text-xs text-gray-500">
          已上传 {formatBytes(loaded)} / {formatBytes(total)}
        </div>
      )}
    </div>
  )
}

// 上传卡片组件（用于UploadPage）
export function UploadProgressCard({
  percentage,
  status,
  loaded,
  total,
  speed,
  remainingTime,
  onCancel = null
}) {
  return (
    <div className="mt-6">
      <UploadProgress
        percentage={percentage}
        status={status}
        loaded={loaded}
        total={total}
        speed={speed}
        remainingTime={remainingTime}
        showDetails={true}
      />

      {/* 取消按钮 */}
      {onCancel && percentage < 100 && (
        <div className="mt-4">
          <button
            onClick={onCancel}
            className="w-full py-2 px-4 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-medium text-sm"
          >
            取消上传
          </button>
        </div>
      )}
    </div>
  )
}

// 内联进度条组件（用于其他页面）
export function InlineProgress({
  percentage = 0,
  status = '',
  size = 'medium' // 'small', 'medium', 'large'
}) {
  const sizeClasses = {
    small: 'h-1.5',
    medium: 'h-2',
    large: 'h-3'
  }

  return (
    <div className="w-full">
      {status && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-gray-600">{status}</span>
          <span className="text-xs font-medium text-gray-700">{percentage}%</span>
        </div>
      )}
      <div className={`w-full bg-gray-200 rounded-full ${sizeClasses[size]}`}>
        <div
          className="bg-blue-600 h-full rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  )
}

export default UploadProgress