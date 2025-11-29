import React from 'react'

/**
 * AnnotationPanel 组件 - 右侧标注区域
 * 展示当前帧的检测目标列表，提供标注入口（演示版）
 */
const AnnotationPanel = ({
  currentTime = 0,
  currentBoxes = [],
  onAnnotate = null
}) => {
  /**
   * 格式化时间显示
   */
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${Math.floor((seconds % 1) * 10)}`
  }

  /**
   * 处理标注按钮点击（演示版）
   */
  const handleAnnotate = (boxId) => {
    if (onAnnotate) {
      onAnnotate(boxId)
    } else {
      // 默认演示行为
      alert('标注功能将在后续版本（P1）中正式开放')
    }
  }

  return (
    <div className="annotation-panel bg-white shadow-md rounded-lg p-6 h-full">
      {/* 时间显示 */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-2">检测信息</h2>
        <div className="text-sm text-gray-600">
          时间：{formatTime(currentTime)}
        </div>
      </div>

      {/* 检测目标列表 */}
      <div className="mb-6">
        <h3 className="text-md font-medium text-gray-700 mb-3">检测目标：</h3>

        {currentBoxes.length === 0 ? (
          <div className="text-sm text-gray-500 italic">
            当前帧无检测目标
          </div>
        ) : (
          <ul className="space-y-3">
            {currentBoxes.map((box) => {
              const [x1, y1, x2, y2] = box.xyxy
              const width = x2 - x1
              const height = y2 - y1

              return (
                <li
                  key={box.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-md border border-gray-200"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {/* 类型标签 */}
                      <span className={`text-xs px-2 py-1 rounded font-medium ${
                        box.label === 'iron_pole' ? 'bg-red-100 text-red-800' :
                        box.label === 'concrete_pole' ? 'bg-blue-100 text-blue-800' :
                        box.label === 'iron_gantry_pole' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {box.label}
                      </span>

                      <span className="text-sm font-medium text-gray-700">
                        {box.id}号框
                      </span>
                    </div>

                    {/* 坐标信息 */}
                    <div className="text-xs text-gray-500 mt-1">
                      位置({x1},{y1}) 尺寸({width}×{height})
                    </div>
                  </div>

                  {/* 标注按钮 */}
                  <button
                    onClick={() => handleAnnotate(box.id)}
                    className="ml-4 px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                  >
                    标注（演示）
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* 已标注记录（演示版） */}
      <div className="border-t border-gray-200 pt-4">
        <h3 className="text-md font-medium text-gray-700 mb-2">已标注记录（演示版）</h3>
        <div className="text-sm text-gray-500 italic bg-yellow-50 p-3 rounded border border-yellow-200">
          未来版本将展示人工标注截图与好/坏状态
        </div>
      </div>
    </div>
  )
}

export default AnnotationPanel