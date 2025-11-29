import React from 'react'
import { Link } from 'react-router-dom'

/**
 * HistoryPage 组件 - 历史任务查看页面（第5天任务，当前为占位符）
 * TODO: 第5天时由开发者C实现完整功能
 */
const HistoryPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">历史任务页面</h1>
        <p className="text-gray-600 mb-6">此页面将在第5天由开发者C实现</p>
        <Link
          to="/upload"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          返回上传页面
        </Link>
      </div>
    </div>
  )
}

export default HistoryPage