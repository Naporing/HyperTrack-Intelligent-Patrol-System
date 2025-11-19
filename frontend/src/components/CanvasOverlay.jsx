import React, { useEffect, useRef, useCallback } from 'react'

function CanvasOverlay({
  detections,
  currentTime,
  fps,
  getBoxColor,
  videoRef: externalVideoRef,
  onFrameDataChange
}) {
  const canvasRef = useRef(null)
  const videoRef = useRef(null)
  const lastFrameIndex = useRef(-1)
  const animationFrameRef = useRef(null)

  // 同步Canvas尺寸与视频
  const syncCanvasSize = useCallback(() => {
    const canvas = canvasRef.current
    const video = externalVideoRef?.current || document.querySelector('video')

    if (!video || !canvas || !video.videoWidth || !video.videoHeight) {
      return false
    }

    videoRef.current = video

    try {
      const dpr = window.devicePixelRatio || 1
      const rect = video.getBoundingClientRect()

      // 设置Canvas实际像素尺寸
      canvas.width = video.videoWidth * dpr
      canvas.height = video.videoHeight * dpr

      // 设置Canvas显示尺寸
      canvas.style.width = rect.width + 'px'
      canvas.style.height = rect.height + 'px'

      // 设置Canvas样式
      canvas.style.position = 'absolute'
      canvas.style.top = '0'
      canvas.style.left = '0'
      canvas.style.pointerEvents = 'none'

      // 缩放绘图上下文以适应高DPI显示
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.scale(dpr, dpr)
      }

      return true
    } catch (error) {
      console.warn('[CanvasOverlay] 尺寸同步失败:', error)
      return false
    }
  }, [externalVideoRef])

  // 绘制检测框
  const drawBoxes = useCallback(() => {
    const canvas = canvasRef.current
    const video = videoRef.current
    const ctx = canvas?.getContext('2d')

    if (!video || !canvas || !ctx || !Array.isArray(detections) || detections.length === 0) {
      return
    }

    try {
      // 计算当前帧索引
      const frameIndex = Math.floor(currentTime * fps)

      // 避免重复绘制同一帧
      if (frameIndex === lastFrameIndex.current) {
        return
      }
      lastFrameIndex.current = frameIndex

      // 清空画布
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // 查找当前帧的检测数据
      const frameData = detections.find(d => d.frame_index === frameIndex)

      if (!frameData || !Array.isArray(frameData.boxes) || frameData.boxes.length === 0) {
        // 通知当前帧无检测框
        if (onFrameDataChange) {
          onFrameDataChange(frameIndex, [])
        }
        return
      }

      // 获取视频显示比例
      const videoRect = video.getBoundingClientRect()
      const scaleX = videoRect.width / video.videoWidth
      const scaleY = videoRect.height / video.videoHeight

      // 绘制所有检测框
      frameData.boxes.forEach((box, index) => {
        if (!box.xyxy || !Array.isArray(box.xyxy) || box.xyxy.length !== 4) {
          console.warn(`[CanvasOverlay] 检测框 ${index} 数据格式不正确:`, box)
          return
        }

        const [x1, y1, x2, y2] = box.xyxy

        // 应用缩放
        const scaledX1 = x1 * scaleX
        const scaledY1 = y1 * scaleY
        const scaledX2 = x2 * scaleX
        const scaledY2 = y2 * scaleY

        // 获取颜色
        const color = typeof getBoxColor === 'function'
          ? getBoxColor(box.label)
          : '#00ff00' // 默认绿色

        // 绘制矩形框
        ctx.strokeStyle = color
        ctx.lineWidth = 2
        ctx.strokeRect(scaledX1, scaledY1, scaledX2 - scaledX1, scaledY2 - scaledY1)

        // 绘制标签背景
        ctx.fillStyle = color
        const labelText = `${box.id}号 ${box.label || 'unknown'}`
        ctx.font = '14px Arial'
        const textWidth = ctx.measureText(labelText).width

        ctx.fillRect(scaledX1, scaledY1 - 22, textWidth + 8, 20)

        // 绘制标签文字
        ctx.fillStyle = 'white'
        ctx.fillText(labelText, scaledX1 + 4, scaledY1 - 7)
      })

      // 通知当前帧检测框数据
      if (onFrameDataChange) {
        onFrameDataChange(frameIndex, frameData.boxes)
      }

    } catch (error) {
      console.error('[CanvasOverlay] 绘制检测框失败:', error)
    }
  }, [detections, currentTime, fps, getBoxColor, onFrameDataChange])

  // 高性能绘制函数
  const drawBoxesOptimized = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }

    animationFrameRef.current = requestAnimationFrame(() => {
      drawBoxes()
    })
  }, [drawBoxes])

  useEffect(() => {
    const video = externalVideoRef?.current || document.querySelector('video')
    const canvas = canvasRef.current

    if (!video || !canvas) {
      console.warn('[CanvasOverlay] 视频或Canvas元素未找到')
      return
    }

    // 初始化时同步尺寸
    syncCanvasSize()

    // 监听视频相关事件
    const handleLoadedMetadata = () => {
      console.log('[CanvasOverlay] 视频元数据已加载')
      syncCanvasSize()
    }

    const handlePlay = () => {
      console.log('[CanvasOverlay] 视频开始播放')
    }

    const handleResize = () => {
      console.log('[CanvasOverlay] 视频尺寸变化')
      syncCanvasSize()
    }

    const handleFullscreenChange = () => {
      console.log('[CanvasOverlay] 全屏状态变化')
      setTimeout(syncCanvasSize, 100) // 延迟处理全屏变化
    }

    const handleTimeUpdate = () => {
      drawBoxesOptimized()
    }

    // 添加事件监听
    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    video.addEventListener('play', handlePlay)
    video.addEventListener('resize', handleResize)
    video.addEventListener('fullscreenchange', handleFullscreenChange)
    video.addEventListener('timeupdate', handleTimeUpdate)
    window.addEventListener('resize', handleResize)

    // 清理函数
    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('resize', handleResize)
      video.removeEventListener('fullscreenchange', handleFullscreenChange)
      video.removeEventListener('timeupdate', handleTimeUpdate)
      window.removeEventListener('resize', handleResize)

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [externalVideoRef, syncCanvasSize, drawBoxesOptimized])

  // 当检测数据变化时重置帧索引
  useEffect(() => {
    lastFrameIndex.current = -1
  }, [detections])

  return (
    <canvas
      ref={canvasRef}
      className="absolute top-0 left-0 pointer-events-none z-10"
      style={{
        position: 'absolute',
        top: '0',
        left: '0',
        pointerEvents: 'none',
        zIndex: 10,
        background: 'transparent'
      }}
    />
  )
}

export default CanvasOverlay