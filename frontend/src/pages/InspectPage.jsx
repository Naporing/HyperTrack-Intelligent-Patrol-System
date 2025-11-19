import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import VideoPlayer from '../components/VideoPlayer'
import CanvasOverlay from '../components/CanvasOverlay'
import AnnotationPanel from '../components/AnnotationPanel'
import axios from 'axios'

function InspectPage() {
  const { taskId } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [detections, setDetections] = useState([])
  const [videoInfo, setVideoInfo] = useState(null)
  const [currentTime, setCurrentTime] = useState(0)

  useEffect(() => {
    const loadDetections = async () => {
      try {
        setLoading(true)

        // 首先触发检测
        const detectResponse = await axios.post(`/detect/${taskId}`)

        if (!detectResponse.data.success) {
          setError(detectResponse.data.error || '检测失败')
          return
        }

        // 然后获取检测结果
        const detectionsResponse = await axios.get(`/detections/${taskId}`)

        if (detectionsResponse.data.success) {
          setDetections(detectionsResponse.data.data)
        } else {
          setError(detectionsResponse.data.error || '加载检测结果失败')
        }
      } catch (err) {
        setError('加载数据失败，请检查网络连接')
        console.error('Load detections error:', err)
      } finally {
        setLoading(false)
      }
    }

    if (taskId) {
      loadDetections()
    }
  }, [taskId])

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getCurrentBoxes = () => {
    if (!videoInfo || !detections.length) return []

    const frameIndex = Math.floor(currentTime * videoInfo.fps)
    const frameData = detections.find(d => d.frame_index === frameIndex)
    return frameData ? frameData.boxes : []
  }

  const getBoxColor = (label) => {
    const colors = {
      iron_pole: '#EF4444',      // 红色
      concrete_pole: '#3B82F6',  // 蓝色
      iron_gantry_pole: '#10B981' // 绿色
    }
    return colors[label] || '#000000'
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-gray-600">正在加载数据...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded p-4">
            <p className="text-red-600">{error}</p>
            <button
              onClick={() => navigate('/upload')}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              返回上传页面
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          视频检测 - 任务ID: {taskId}
        </h1>
        <div className="flex gap-4">
          <button
            onClick={() => navigate('/upload')}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            返回上传
          </button>
          <button
            onClick={() => navigate('/history')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            历史记录
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="relative">
              <VideoPlayer
                taskId={taskId}
                onTimeUpdate={setCurrentTime}
                onLoadedMetadata={(info) => setVideoInfo(info)}
              />
              <CanvasOverlay
                detections={detections}
                currentTime={currentTime}
                fps={videoInfo?.fps || 30}
                getBoxColor={getBoxColor}
              />
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <AnnotationPanel
            currentTime={currentTime}
            boxes={getCurrentBoxes()}
            formatTime={formatTime}
            getBoxColor={getBoxColor}
          />
        </div>
      </div>
    </div>
  )
}

export default InspectPage