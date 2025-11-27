import React, { useRef, useEffect } from 'react';

/**
 * CanvasOverlay 组件 - 用于在视频播放器上绘制检测框
 * @param {Object} props
 * @param {HTMLVideoElement} props.videoRef - video.js 视频元素引用
 */
const CanvasOverlay = ({ videoRef }) => {
  const canvasRef = useRef(null);

  /**
   * 实现Canvas尺寸自适应逻辑
   * 监听video的loadedmetadata事件，设置canvas.width/height
   * 考虑devicePixelRatio避免模糊
   */
  const syncCanvasSize = () => {
    if (!videoRef || !canvasRef) return;

    const video = videoRef;
    const canvas = canvasRef;
    const dpr = window.devicePixelRatio || 1;

    // 设置Canvas实际尺寸（考虑设备像素比）
    canvas.width = video.clientWidth * dpr;
    canvas.height = video.clientHeight * dpr;

    // 设置Canvas显示尺寸（CSS尺寸）
    canvas.style.width = video.clientWidth + 'px';
    canvas.style.height = video.clientHeight + 'px';

    // 缩放绘图坐标系以适应设备像素比
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
  };

  /**
   * 编写drawBoxes(ctx, boxes)函数骨架，准备接收box数据
   * @param {CanvasRenderingContext2D} ctx - Canvas绘图上下文
   * @param {Array} boxes - 检测框数据数组
   */
  const drawBoxes = (ctx, boxes) => {
    // 函数骨架，准备接收box数据
    console.log('drawBoxes called with boxes:', boxes);
    // TODO: 后续实现具体的绘制逻辑
  };

  /**
   * 监听全屏状态变化
   */
  const handleFullscreenChange = () => {
    // 全屏状态变化时重新同步Canvas尺寸
    setTimeout(syncCanvasSize, 100);
  };

  /**
   * 监听窗口尺寸变化
   */
  const handleResize = () => {
    syncCanvasSize();
  };

  useEffect(() => {
    if (!videoRef) return;

    // 监听视频元素的loadedmetadata事件，设置canvas.width/height
    videoRef.addEventListener('loadedmetadata', syncCanvasSize);

    // 监听resize和fullscreenchange事件，同步canvas尺寸
    window.addEventListener('resize', handleResize);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);

    // 初始同步
    syncCanvasSize();

    return () => {
      // 清理事件监听
      videoRef.removeEventListener('loadedmetadata', syncCanvasSize);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
    };
  }, [videoRef]);

  return (
    <div
      className="canvas-overlay-container"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none', // 允许点击穿透到视频播放器
        zIndex: 10
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          width: '100%',
          height: '100%'
        }}
      />
    </div>
  );
};

export default CanvasOverlay;