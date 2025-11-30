import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AnnotationPanel from '../components/AnnotationPanel'
import VideoPlayer from '../components/VideoPlayer/index.tsx'
import CanvasOverlay from '../components/CanvasOverlay'
import { triggerDetection as triggerDetectionAPI, getDetections } from '../api'
import detectionCache from '../utils/detectionCache'

const InspectPage = () => {
  // URL参数和导航
  const { task_id } = useParams()
  const navigate = useNavigate()

  // Refs
  const videoPlayerRef = useRef(null)

  // 状态管理
  const [pageState, setPageState] = useState({
    taskId: null,
    detectStatus: 'loading', // 'loading' | 'detecting' | 'ready' | 'error'
    detections: [],
    error: null,
    generated: false,
    currentTime: 0, // 第4天：当前播放时间
    fps: 30, // 第4天：视频帧率
    videoMetadata: null, // 第4天：视频元数据
    videoLoading: false, // 视频加载状态
    videoError: null // 视频加载错误
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

  // 加载检测结果（优先使用内存缓存）
  const loadDetections = async (taskId) => {
    try {
      // 1. 先检查内存缓存
      const cachedDetections = detectionCache.get(taskId);
      if (cachedDetections) {
        setPageState(prev => ({
          ...prev,
          detections: cachedDetections
        }));
        console.log(`使用缓存数据，任务 ${taskId}`);
        return;
      }

      // 2. 缓存未命中，调用API获取数据
      console.log(`调用API获取数据，任务 ${taskId}`);
      const result = await getDetections(taskId);

      if (result.success) {
        const detectionsData = result.data;

        // 3. 将数据存入内存缓存
        detectionCache.set(taskId, detectionsData);

        setPageState(prev => ({
          ...prev,
          detections: detectionsData
        }));

        // 4. 打印缓存统计
        const stats = detectionCache.getStats();
        console.log('缓存统计:', stats);
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

  // 第4天：视频时间更新处理（用于Canvas同步绘制）
  const handleVideoTimeUpdate = (currentTime) => {
    setPageState(prev => ({ ...prev, currentTime }))
  }

  // 第4天：视频元数据加载完成处理
  const handleVideoLoadedMetadata = (metadata) => {
    setPageState(prev => ({
      ...prev,
      videoMetadata: metadata,
      videoLoading: false,
      fps: Math.round(metadata.duration > 0 ? metadata.duration : 30) // 简单估算fps，实际应从API获取
    }))
  }

  // 视频加载开始处理
  const handleVideoLoadStart = () => {
    setPageState(prev => ({
      ...prev,
      videoLoading: true,
      videoError: null
    }))
  }

  // 视频可以播放处理
  const handleVideoCanPlay = () => {
    setPageState(prev => ({
      ...prev,
      videoLoading: false,
      videoError: null
    }))
  }

  // 视频错误处理
  const handleVideoError = (errorMessage) => {
    setPageState(prev => ({
      ...prev,
      videoLoading: false,
      videoError: errorMessage
    }))
  }

  // 重试检测
  const handleRetry = () => {
    if (pageState.taskId) {
      triggerDetection(pageState.taskId)
    }
  }

  // 组件卸载时的清理（可选：清理当前任务的缓存）
  useEffect(() => {
    return () => {
      // 如果需要，可以在这里清理当前任务的缓存
      // if (pageState.taskId) {
      //   detectionCache.delete(pageState.taskId);
      // }
    };
  }, []);

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
          {pageState.detectStatus === 'ready' ? (
            // 检测完成后显示视频播放器和Canvas覆盖层（第4天完整功能）
            <>
              <VideoPlayer
                ref={videoPlayerRef}
                taskId={pageState.taskId}
                onTimeUpdate={handleVideoTimeUpdate}
                onLoadedMetadata={handleVideoLoadedMetadata}
                onLoadStart={handleVideoLoadStart}
                onCanPlay={handleVideoCanPlay}
                onError={handleVideoError}
                fps={pageState.fps}
              />
              <CanvasOverlay
                videoRef={videoPlayerRef.current?.getVideoElement()}
                detections={pageState.detections}
                fps={pageState.fps}
                currentTime={pageState.currentTime}
                useMockData={false}
              />
            </>
          ) : (
            // 检测中状态显示
            <div className="h-full flex items-center justify-center">
              <StatusDisplay />
            </div>
          )}

          {/* 任务信息显示 */}
          {pageState.taskId && (
            <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-3 py-2 rounded">
              <div className="text-sm">任务ID: {pageState.taskId}</div>
              {pageState.detectStatus === 'ready' && (
                <>
                  <div className="text-xs text-green-400">检测完成</div>
                  {pageState.videoLoading && (
                    <div className="text-xs text-blue-400 mt-1">
                      正在加载视频...
                    </div>
                  )}
                  {pageState.videoError && (
                    <div className="text-xs text-red-400 mt-1">
                      {pageState.videoError}
                    </div>
                  )}
                  {pageState.videoMetadata && !pageState.videoError && (
                    <div className="text-xs text-gray-300 mt-1">
                      {pageState.videoMetadata.videoWidth}×{pageState.videoMetadata.videoHeight} @ {pageState.fps}fps
                    </div>
                  )}
                  {!pageState.videoError && (
                    <div className="text-xs text-gray-300 mt-1">
                      时间: {pageState.currentTime.toFixed(1)}s | 帧: {Math.floor(pageState.currentTime * pageState.fps)}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 右侧30% - 标注面板区域 */}
      <div className="w-[30%] border-l border-gray-200 bg-white">
        <AnnotationPanel />
      </div>
    </div>
  )
}

export default InspectPage