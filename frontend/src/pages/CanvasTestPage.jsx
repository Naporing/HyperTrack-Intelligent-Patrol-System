import React, { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import CanvasOverlay from '../components/CanvasOverlay'
import { testCanvasDrawing, generateMockBoxes, generateBoundaryTestBoxes } from '../utils/mockData'

const CanvasTestPage = () => {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const [useMockData, setUseMockData] = useState(true)
  const [currentTest, setCurrentTest] = useState('basic')
  const [testResults, setTestResults] = useState(null)

  /**
   * 运行Canvas绘制测试
   */
  const runCanvasTest = (testType) => {
    console.log(`🧪 开始Canvas测试: ${testType}`)

    setTimeout(() => {
      const canvasOverlay = document.querySelector('.canvas-overlay-container canvas');
      if (!canvasOverlay) {
        console.error('❌ Canvas元素未找到');
        return;
      }

      const result = testCanvasDrawing(canvasOverlay, testType);
      setTestResults(result);
      setCurrentTest(testType);

      console.log(`✅ Canvas测试完成: ${testType}`, result);
    }, 500);
  };

  /**
   * 初始化模拟视频元素
   */
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.clientWidth = 800;
      videoRef.current.clientHeight = 600;
      videoRef.current.videoWidth = 800;
      videoRef.current.videoHeight = 600;

      const event = new Event('loadedmetadata');
      videoRef.current.dispatchEvent(event);
    }
  }, []);

  /**
   * 获取当前测试的检测框数据
   */
  const getCurrentTestData = () => {
    switch (currentTest) {
      case 'basic':
        return generateMockBoxes();
      case 'boundary':
        return generateBoundaryTestBoxes();
      default:
        return [];
    }
  };

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
                返回首页
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* 主要内容 */}
      <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* 控制面板 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">测试控制面板</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 测试类型选择 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                测试类型
              </label>
              <select
                value={currentTest}
                onChange={(e) => setCurrentTest(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="basic">基础检测框测试</option>
                <option value="boundary">边界条件测试</option>
                <option value="empty">空数据测试</option>
              </select>
            </div>

            {/* Mock数据开关 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mock数据模式
              </label>
              <div className="flex items-center h-10">
                <input
                  type="checkbox"
                  id="useMockData"
                  checked={useMockData}
                  onChange={(e) => setUseMockData(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="useMockData" className="ml-2 block text-sm text-gray-900">
                  使用Mock数据
                </label>
              </div>
            </div>

            {/* 运行测试按钮 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                运行测试
              </label>
              <button
                onClick={() => runCanvasTest(currentTest)}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                开始测试
              </button>
            </div>
          </div>

          {/* 快速测试按钮组 */}
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => runCanvasTest('basic')}
              className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
            >
              基础测试
            </button>
            <button
              onClick={() => runCanvasTest('boundary')}
              className="px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700"
            >
              边界测试
            </button>
            <button
              onClick={() => runCanvasTest('empty')}
              className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
            >
              空数据测试
            </button>
          </div>
        </div>

        {/* Canvas测试区域 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Canvas绘制区域</h2>

          {/* 模拟视频容器 */}
          <div className="relative bg-black rounded-lg overflow-hidden" style={{ width: '800px', height: '600px', maxWidth: '100%' }}>
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
              detections={useMockData ? getCurrentTestData() : []}
              useMockData={useMockData}
            />

            {/* 测试信息叠加 */}
            {testResults && (
              <div className="absolute top-4 right-4 bg-black bg-opacity-75 text-white p-3 rounded text-sm">
                <div>测试类型: {testResults.testType}</div>
                <div>检测框数量: {testResults.boxCount}</div>
                <div>画布尺寸: {testResults.canvasSize.width}×{testResults.canvasSize.height}</div>
              </div>
            )}
          </div>

          {/* 当前测试数据说明 */}
          <div className="mt-4 p-4 bg-gray-50 rounded">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">当前测试数据:</h3>
            {currentTest === 'basic' && (
              <div>
                <p className="text-sm text-gray-600">基础测试：3个标准检测框，覆盖3种电杆类型</p>
                <div className="flex flex-wrap gap-4 mt-2">
                  <span className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded">iron_pole (红色)</span>
                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">concrete_pole (蓝色)</span>
                  <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded">iron_gantry_pole (绿色)</span>
                </div>
              </div>
            )}
            {currentTest === 'boundary' && (
              <div>
                <p className="text-sm text-gray-600">边界测试：3个特殊位置检测框，测试边界情况</p>
                <div className="flex flex-wrap gap-4 mt-2">
                  <span className="text-xs px-2 py-1 bg-gray-100 text-gray-800 rounded">左上角小框</span>
                  <span className="text-xs px-2 py-1 bg-gray-100 text-gray-800 rounded">右下角小框</span>
                  <span className="text-xs px-2 py-1 bg-gray-100 text-gray-800 rounded">横跨画布框</span>
                </div>
              </div>
            )}
            {currentTest === 'empty' && (
              <div>
                <p className="text-sm text-gray-600">空数据测试：无检测框，验证画布清理功能</p>
              </div>
            )}
          </div>
        </div>

        {/* 测试结果说明 */}
        {testResults && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">测试结果</h2>

            {testResults.success ? (
              <div className="space-y-2">
                <div className="flex items-center">
                  <span className="text-green-600 mr-2">✅</span>
                  <span className="text-gray-700">Canvas绘制测试成功完成</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="bg-gray-50 p-4 rounded">
                    <h4 className="font-medium text-gray-700 mb-2">测试信息</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• 测试类型: {testResults.testType}</li>
                      <li>• 检测框数量: {testResults.boxCount}</li>
                      <li>• 画布宽度: {testResults.canvasSize.width}px</li>
                      <li>• 画布高度: {testResults.canvasSize.height}px</li>
                    </ul>
                  </div>

                  <div className="bg-gray-50 p-4 rounded">
                    <h4 className="font-medium text-gray-700 mb-2">验证要点</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• 矩形框位置正确</li>
                      <li>• 颜色符合规范</li>
                      <li>• 标签文字清晰</li>
                      <li>• 画布尺寸适配</li>
                    </ul>
                  </div>
                </div>

                {/* 检测框详情 */}
                {getCurrentTestData().length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium text-gray-700 mb-2">检测框详情:</h4>
                    <div className="bg-gray-50 p-4 rounded">
                      {getCurrentTestData().map(box => {
                        const [x1, y1, x2, y2] = box.xyxy;
                        const width = x2 - x1;
                        const height = y2 - y1;
                        const color = {
                          'iron_pole': '#EF4444',
                          'concrete_pole': '#3B82F6',
                          'iron_gantry_pole': '#10B981'
                        }[box.label] || '#6B7280';

                        return (
                          <div key={box.id} className="flex items-center justify-between py-2 border-b border-gray-200 last:border-b-0">
                            <span className="text-sm font-medium">{box.id}号框</span>
                            <div className="flex items-center gap-4 text-sm">
                              <span>{box.label}</span>
                              <div className="flex items-center gap-1">
                                <div
                                  className="w-4 h-4 border border-gray-400"
                                  style={{ backgroundColor: color }}
                                />
                                <span>位置({x1},{y1})</span>
                              </div>
                              <span className="text-gray-500">尺寸{width}×{height}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center text-red-600">
                <span className="mr-2">❌</span>
                <span>Canvas绘制测试失败</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default CanvasTestPage