import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getHistory } from '../api'

/**
 * HistoryPage 组件 - 历史任务查看页面
 * 展示任务列表，点击可跳转到InspectPage进行详细查看
 */
const HistoryPage = () => {
  const navigate = useNavigate()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // 加载历史任务列表
  useEffect(() => {
    const loadHistory = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await getHistory()

        if (response.data && response.data.success) {
          setTasks(response.data.data || [])
        } else {
          setError(response.data?.error || '加载历史记录失败')
        }
      } catch (err) {
        console.error('加载历史记录失败:', err)
        setError('网络错误，请稍后重试')
      } finally {
        setLoading(false)
      }
    }

    loadHistory()
  }, [])

  /**
   * 格式化时间显示
   */
  const formatDateTime = (isoString) => {
    if (!isoString) return '未知时间'

    try {
      const date = new Date(isoString)
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch (error) {
      return '时间格式错误'
    }
  }

  /**
   * 跳转到任务详情页
   */
  const handleViewTask = (taskId) => {
    navigate(`/inspect/${taskId}`)
  }

  /**
   * 返回上传页
   */
  const handleBackToUpload = () => {
    navigate('/upload')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 导航栏 */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-semibold text-gray-900">历史任务</h1>
            <button
              onClick={handleBackToUpload}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              返回上传
            </button>
          </div>
        </div>
      </nav>

      {/* 主要内容 */}
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-md rounded-lg">
          {/* 页面标题 */}
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              检测任务历史记录
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              点击任务可查看详细的检测结果和视频播放
            </p>
          </div>

          {/* 内容区域 */}
          <div className="p-6">
            {loading ? (
              /* 加载状态 */
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">正在加载历史记录...</p>
                </div>
              </div>
            ) : error ? (
              /* 错误状态 */
              <div className="text-center py-12">
                <div className="text-red-600 mb-4">
                  <svg className="mx-auto h-12 w-12 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-gray-900 font-medium mb-2">加载失败</p>
                <p className="text-gray-600 text-sm mb-4">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  重新加载
                </button>
              </div>
            ) : tasks.length === 0 ? (
              /* 空状态 */
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-gray-900 font-medium mb-2">暂无历史任务</p>
                <p className="text-gray-600 text-sm mb-4">
                  还没有上传和检测过视频
                </p>
                <button
                  onClick={handleBackToUpload}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  开始上传视频
                </button>
              </div>
            ) : (
              /* 任务列表 */
              <div className="space-y-4">
                {tasks.map((task) => (
                  <div
                    key={task.task_id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900 mb-1">
                          任务 ID: {task.task_id}
                        </h3>
                        <p className="text-sm text-gray-600">
                          创建时间: {formatDateTime(task.created_at)}
                        </p>
                      </div>

                      <div className="flex items-center space-x-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          已完成
                        </span>
                        <button
                          onClick={() => handleViewTask(task.task_id)}
                          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                          进入查看
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 统计信息 */}
        {!loading && !error && tasks.length > 0 && (
          <div className="mt-6 bg-white shadow-md rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">统计信息</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{tasks.length}</div>
                <div className="text-sm text-gray-600">总任务数</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{tasks.length}</div>
                <div className="text-sm text-gray-600">已完成</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">0</div>
                <div className="text-sm text-gray-600">处理中</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default HistoryPage