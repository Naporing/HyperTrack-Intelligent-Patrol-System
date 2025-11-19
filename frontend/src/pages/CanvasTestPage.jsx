import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import CanvasOverlay from '../components/CanvasOverlay'
import { generateMockDetections, getBoxColor } from '../utils/canvasUtils'

/**
 * Canvas 绘制测试页面
 * 用于验证 CanvasOverlay 组件的绘制功能
 */
function CanvasTestPage() {
  const navigate = useNavigate()
  const videoRef = useRef(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [fps] = useState(30)
  const [mockDetections] = useState([])
  const [currentFrameData, setCurrentFrameData] = useState([])
  const [isPlaying, setIsPlaying] = useState(false)

  // 生成Mock检测数据
  useEffect(() => {
    const detections = generateMockDetections(450, fps)
    setMockDetections(detections)
    console.log('[CanvasTestPage] 生成Mock检测数据:', detections.length, '帧')
  }, [fps])

  // 处理视频时间更新
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime)
    }
  }

  // 处理帧数据变化
  const handleFrameDataChange = (frameIndex, boxes) => {
    setCurrentFrameData(boxes)
    console.log(`[CanvasTestPage] 帧 ${frameIndex} 检测框:`, boxes.length)
  }

  // 控制视频播放
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  // 跳转到指定时间
  const jumpToTime = (time) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time
      setCurrentTime(time)
    }
  }

  // 生成测试视频URL（使用在线测试视频）
  const testVideoUrl = 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4'

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* 页面标题 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800">
              🎨 Canvas 绘制测试页面
            </h1>
            <button
              onClick={() => navigate('/upload')}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              返回上传页面
            </button>
          </div>
          <p className="text-gray-600 mt-2">
            测试 CanvasOverlay 组件的检测框绘制功能
          </p>
        </div>

        {/* 视频播放区域 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">视频播放区</h2>
          <div className="relative bg-black rounded" style={{ paddingBottom: '56.25%' }}>
            {/* 测试视频 */}
            <video
              ref={videoRef}
              className="absolute top-0 left-0 w-full h-full"
              controls
              onTimeUpdate={handleTimeUpdate}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              src={testVideoUrl}
            >
              <source src={testVideoUrl} type="video/mp4" />
              您的浏览器不支持视频播放
            </video>

            {/* Canvas 覆盖层 */}
            {mockDetections.length > 0 && (
              <CanvasOverlay
                detections={mockDetections}
                currentTime={currentTime}
                fps={fps}
                getBoxColor={getBoxColor}
                videoRef={videoRef}
                onFrameDataChange={handleFrameDataChange}
              />
            )}
          </div>
        </div>

        {/* 控制面板 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">控制面板</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={togglePlay}
              className={`px-4 py-2 rounded font-medium ${
                isPlaying
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {isPlaying ? '暂停' : '播放'}
            </button>

            <button
              onClick={() => jumpToTime(5)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              跳到 5s
            </button>

            <button
              onClick={() => jumpToTime(10)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              跳到 10s
            </button>

            <button
              onClick={() => jumpToTime(15)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              跳到 15s
            </button>
          </div>
        </div>

        {/* 状态显示 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* 视频状态 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">视频状态</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">当前时间:</span>
                <span className="font-mono">{currentTime.toFixed(2)}s</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">帧率:</span>
                <span className="font-mono">{fps} fps</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">当前帧:</span>
                <span className="font-mono">{Math.floor(currentTime * fps)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">播放状态:</span>
                <span className={`font-medium ${isPlaying ? 'text-green-600' : 'text-gray-500'}`}>
                  {isPlaying ? '播放中' : '已暂停'}
                </span>
              </div>
            </div>
          </div>

          {/* 检测框状态 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">检测框状态</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Mock数据:</span>
                <span className="font-mono">{mockDetections.length} 帧</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">当前检测框:</span>
                <span className="font-mono">{currentFrameData.length} 个</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">颜色类型:</span>
                <span className="font-mono">3 种</span>
              </div>
            </div>
          </div>
        </div>

        {/* 当前检测框列表 */}
        {currentFrameData.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">当前检测框详情</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      类型
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      坐标
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      颜色
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentFrameData.map((box, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {box.id}号
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {box.label}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="font-mono">
                          [{box.xyxy[0]}, {box.xyxy[1]}, {box.xyxy[2]}, {box.xyxy[3]}]
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div
                            className="w-4 h-4 rounded"
                            style={{ backgroundColor: getBoxColor(box.label) }}
                          ></div>
                          <span className="ml-2 text-sm text-gray-600">{getBoxColor(box.label)}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 测试说明 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-3">🧪 测试说明</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• 此页面使用在线测试视频验证 Canvas 绘制功能</li>
            <li>• Mock 数据每30帧随机生成 1-3 个检测框</li>
            <li>• 支持三种电杆类型：iron_pole(红)、concrete_pole(蓝)、iron_gantry_pole(绿)</li>
            <li>• 可以通过控制按钮测试不同时间点的检测框显示</li>
            <li>• Canvas 会自动同步视频尺寸，支持全屏和窗口缩放</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default CanvasTestPage