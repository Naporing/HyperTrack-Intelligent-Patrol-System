import React, { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import CanvasOverlay from '../components/CanvasOverlay'
import { generateMockBoxes } from '../utils/mockData'

/**
 * CanvasTestPage - 第3天基础Canvas绘制测试
 * 简化版本，仅验证Canvas能正确绘制矩形框（若B的YOLO推理未完成）
 */
const CanvasTestPage = () => {
  const videoRef = useRef(null)

  /**
   * 初始化模拟视频元素
   */
  useEffect(() => {
    if (videoRef.current) {
      // 设置模拟视频尺寸
      videoRef.current.clientWidth = 800;
      videoRef.current.clientHeight = 600;
      videoRef.current.videoWidth = 800;
      videoRef.current.videoHeight = 600;

      // 触发loadedmetadata事件
      const event = new Event('loadedmetadata');
      videoRef.current.dispatchEvent(event);
    }
  }, []);

  // 使用基础mock数据进行测试
  const mockDetections = generateMockBoxes();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 导航栏 */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-semibold text-gray-900">Canvas绘制测试 - 第3天验证</h1>
            <div className="flex space-x-4">
              <Link
                to="/upload"
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                返回上传页面
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* 主要内容 */}
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Canvas基础绘制测试</h2>

          <p className="text-gray-600 mb-6">
            验证Canvas能够正确绘制检测框。使用mock数据测试3种电杆类型：铁塔、混凝土电杆、门型电杆。
          </p>

          {/* Canvas测试区域 */}
          <div className="relative bg-black rounded-lg overflow-hidden" style={{ width: '800px', height: '600px', maxWidth: '100%', margin: '0 auto' }}>
            {/* 模拟视频元素 */}
            <video
              ref={videoRef}
              className="w-full h-full"
              style={{ display: 'block' }}
              muted
            />

            {/* Canvas覆盖层 */}
            <CanvasOverlay
              videoRef={videoRef}
              detections={mockDetections}
              useMockData={true}
            />
          </div>

          {/* 测试说明 */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">测试说明</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• 红色框：iron_pole（铁塔）</li>
              <li>• 蓝色框：concrete_pole（混凝土电杆）</li>
              <li>• 绿色框：iron_gantry_pole（门型电杆）</li>
              <li>• 若能正确显示3个检测框，说明Canvas绘制功能正常</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CanvasTestPage