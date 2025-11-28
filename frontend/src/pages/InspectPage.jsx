import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AnnotationPanel from '../components/AnnotationPanel'
import { triggerDetection as triggerDetectionAPI, getDetections } from '../api'

const InspectPage = () => {
  // URL参数和导航
  const { task_id } = useParams()
  const navigate = useNavigate()

  // 状态管理
  const [pageState, setPageState] = useState({
    taskId: null,
    detectStatus: 'loading', // 'loading' | 'detecting' | 'ready' | 'error'
    detections: [],
    error: null,
    generated: false
  })

  // URL参数解析和验证
  useEffect(() => {
    if (!task_id) {
      navigate('/upload')
      return
    }

    // 验证task_id格式：local_[a-z0-9]{6,8}
    const taskIdPattern = /^local_[a-z0-9]{6,8}$/
    if (!taskIdPattern.test(task_id)) {
      console.error('Invalid task_id format:', task_id)
      navigate('/upload')
      return
    }

    setPageState(prev => ({ ...prev, taskId: task_id }))
  }, [task_id, navigate])

  // 自动检测触发逻辑
  useEffect(() => {
    if (pageState.taskId) {
      triggerDetection(pageState.taskId)
    }
  }, [pageState.taskId])

  // 触发检测（调用真实API）
  const triggerDetection = async (taskId) => {
    try {
      setPageState(prev => ({ ...prev, detectStatus: 'detecting' }))

      const result = await triggerDetectionAPI(taskId)

      if (result.success) {
        setPageState(prev => ({
          ...prev,
          detectStatus: 'ready',
          generated: result.data.generated
        }))
        // 加载检测结果
        loadDetections(taskId)
      } else {
        throw new Error(result.error || 'DETECT_FAILED')
      }
    } catch (error) {
      setPageState(prev => ({
        ...prev,
        detectStatus: 'error',
        error: error.message || '检测失败，请重试'
      }))
    }
  }

  // 加载检测结果（调用真实API）
  const loadDetections = async (taskId) => {
    try {
      const result = await getDetections(taskId)

      if (result.success) {
        setPageState(prev => ({
          ...prev,
          detections: result.data
        }))
      } else {
        throw new Error(result.error || 'DETECTIONS_NOT_FOUND')
      }
    } catch (error) {
      setPageState(prev => ({
        ...prev,
        error: `检测结果加载失败: ${error.message}`
      }))
    }
  }

  // 重试检测
  const handleRetry = () => {
    if (pageState.taskId) {
      triggerDetection(pageState.taskId)
    }
  }

  // 状态显示组件
  const StatusDisplay = () => {
    switch (pageState.detectStatus) {
      case 'loading':
        return (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <div className="text-gray-600">正在解析任务信息...</div>
            </div>
          </div>
        )

      case 'detecting':
        return (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-pulse flex space-x-4 mb-4">
                <div className="rounded-full bg-blue-400 h-3 w-3"></div>
                <div className="rounded-full bg-blue-400 h-3 w-3"></div>
                <div className="rounded-full bg-blue-400 h-3 w-3"></div>
              </div>
              <div className="text-gray-600">正在进行AI检测...</div>
              <div className="text-sm text-gray-400 mt-2">
                {pageState.generated ? '正在生成新的检测结果' : '检测结果已存在'}
              </div>
            </div>
          </div>
        )

      case 'ready':
        return (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="text-green-500 text-4xl mb-4">✓</div>
              <div className="text-gray-600">检测完成</div>
              <div className="text-sm text-gray-400 mt-2">
                共检测 {pageState.detections.length} 帧
              </div>
            </div>
          </div>
        )

      case 'error':
        return (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="text-red-500 text-4xl mb-4">✗</div>
              <div className="text-red-600 mb-4">{pageState.error}</div>
              <button
                onClick={handleRetry}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                重试
              </button>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* 左侧70% - 视频播放区域 */}
      <div className="w-[70%] p-4">
        <div className="h-full bg-gray-900 rounded-lg overflow-hidden relative">
          {/* 视频播放器占位符 */}
          <div className="h-full flex items-center justify-center">
            <StatusDisplay />
          </div>

          {/* 任务信息显示 */}
          {pageState.taskId && (
            <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-3 py-2 rounded">
              <div className="text-sm">任务ID: {pageState.taskId}</div>
              {pageState.detectStatus === 'ready' && (
                <div className="text-xs text-green-400">检测完成</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 右侧30% - 标注面板区域 */}
      <div className="w-[30%] border-l border-gray-200 bg-white">
        <AnnotationPanel
          taskId={pageState.taskId}
          detections={pageState.detections[0]?.boxes || []} // 传入第一帧的检测结果
          currentTime={0}
          detectStatus={pageState.detectStatus}
        />
      </div>
    </div>
  )
}

export default InspectPage