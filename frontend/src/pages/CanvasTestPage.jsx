import React, { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  syncCanvasSize,
  drawTestBoxes,
  formatTime,
  getFrameIndex,
  clearCanvas
} from '../utils/canvasUtils'

const CanvasTestPage = () => {
  const canvasRef = useRef(null)
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 })
  const [testInfo, setTestInfo] = useState({ time: 0, fps: 30, frameIndex: 0 })

  useEffect(() => {
    // 初始化Canvas
    const canvas = canvasRef.current
    if (!canvas) return;

    // 设置Canvas基础尺寸
    canvas.width = canvasSize.width
    canvas.height = canvasSize.height

    // 绘制测试框
    drawTestBoxes(canvas)

    // 模拟视频时间更新
    const interval = setInterval(() => {
      setTestInfo(prev => {
        const newTime = (prev.time + 0.1) % 10 // 0-10秒循环
        return {
          ...prev,
          time: newTime,
          frameIndex: getFrameIndex(newTime, prev.fps)
        }
      })
    }, 100)

    return () => clearInterval(interval)
  }, [canvasSize])

  const handleClearCanvas = () => {
    const canvas = canvasRef.current
    if (canvas) {
      clearCanvas(canvas)
    }
  }

  const handleRedrawBoxes = () => {
    const canvas = canvasRef.current
    if (canvas) {
      drawTestBoxes(canvas)
    }
  }

  const handleResizeCanvas = () => {
    const newWidth = Math.floor(Math.random() * 400) + 600 // 600-1000
    const newHeight = Math.floor(Math.random() * 300) + 400 // 400-700
    setCanvasSize({ width: newWidth, height: newHeight })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 导航栏 */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-semibold text-gray-900">Canvas测试页面</h1>
            <div className="flex space-x-4">
              <Link
                to="/upload"
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                返回首页
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* 主要内容 */}
      <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 左侧Canvas区域 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Canvas绘制测试</h2>

            <div className="border-2 border-gray-200 rounded-lg p-4 mb-4">
              <canvas
                ref={canvasRef}
                className="w-full border border-gray-300 rounded"
                style={{ maxWidth: '100%', height: 'auto' }}
              />
            </div>

            <div className="flex space-x-2">
              <button
                onClick={handleRedrawBoxes}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                重绘测试框
              </button>
              <button
                onClick={handleClearCanvas}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
              >
                清空画布
              </button>
              <button
                onClick={handleResizeCanvas}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
              >
                随机尺寸
              </button>
            </div>
          </div>

          {/* 右侧信息区域 */}
          <div className="space-y-6">
            {/* Canvas信息 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Canvas信息</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700">Canvas尺寸:</span>
                  <span className="text-gray-600">{canvasSize.width} × {canvasSize.height}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700">设备像素比:</span>
                  <span className="text-gray-600">{window.devicePixelRatio || 1}</span>
                </div>
              </div>
            </div>

            {/* 模拟视频信息 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">模拟视频信息</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700">当前时间:</span>
                  <span className="text-gray-600">{formatTime(testInfo.time)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700">帧率:</span>
                  <span className="text-gray-600">{testInfo.fps} FPS</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700">当前帧:</span>
                  <span className="text-gray-600">{testInfo.frameIndex}</span>
                </div>
              </div>
            </div>

            {/* 检测框说明 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">测试说明</h3>
              <div className="space-y-2 text-sm text-blue-800">
                <p>• 红色框: iron_pole (钢制电杆)</p>
                <p>• 蓝色框: concrete_pole (混凝土电杆)</p>
                <p>• 绿色框: iron_gantry_pole (钢制门型电杆)</p>
                <p>• 框标签显示格式: [编号]号框 ([类型])</p>
                <p>• Canvas尺寸可动态调整，测试响应式效果</p>
              </div>
            </div>

            {/* 工具函数说明 */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">已实现工具函数</h3>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• syncCanvasSize() - 尺寸同步</li>
                <li>• formatTime() - 时间格式化</li>
                <li>• getFrameIndex() - 帧索引计算</li>
                <li>• drawBoxes() - 绘制检测框</li>
                <li>• getBoxColor() - 颜色映射</li>
                <li>• clearCanvas() - 清空画布</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CanvasTestPage