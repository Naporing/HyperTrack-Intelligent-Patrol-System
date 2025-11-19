import React from 'react'

function AnnotationPanel({ currentTime, boxes, formatTime, getBoxColor }) {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 annotation-panel">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">
        检测信息
      </h3>

      <div className="mb-4">
        <div className="text-sm text-gray-600">
          <span className="font-medium">当前时间：</span>
          {formatTime(currentTime)}
        </div>
      </div>

      <div className="mb-4">
        <div className="text-sm font-medium text-gray-700 mb-2">
          检测目标 ({boxes.length})
        </div>
        {boxes.length === 0 ? (
          <div className="text-sm text-gray-500">
            当前帧未检测到目标
          </div>
        ) : (
          <ul className="space-y-2">
            {boxes.map(box => (
              <li
                key={box.id}
                className="flex items-center justify-between p-2 bg-gray-50 rounded"
              >
                <div className="flex items-center space-x-2">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: getBoxColor(box.label) }}
                  />
                  <span className="text-sm text-gray-700">
                    {box.id}号框 ({box.label})
                  </span>
                </div>
                <button
                  onClick={() => alert('标注功能将在后续版本开放')}
                  className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  标注（演示）
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="border-t pt-4">
        <div className="text-sm text-gray-600 mb-2">
          <div className="font-medium">已标注记录（演示版）</div>
          <div className="text-xs text-gray-500 mt-1">
            未来版本将展示截图与状态信息
          </div>
        </div>
      </div>

      <div className="mt-4 text-xs text-gray-500">
        <div className="font-medium mb-1">检测类型说明：</div>
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: '#EF4444' }} />
            <span>iron_pole (铁杆)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: '#3B82F6' }} />
            <span>concrete_pole (水泥杆)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: '#10B981' }} />
            <span>iron_gantry_pole (钢架杆)</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AnnotationPanel