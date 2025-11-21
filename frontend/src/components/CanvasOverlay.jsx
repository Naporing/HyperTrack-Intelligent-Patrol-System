import React, { useRef, useEffect, useState } from 'react';

// Canvas 绘图样式常量
const CANVAS_STYLES = {
  // 检测框颜色 - 三类电杆
  COLORS: {
    iron_pole: '#EF4444',      // 红色
    concrete_pole: '#3B82F6',  // 蓝色
    iron_gantry_pole: '#10B981' // 绿色
  },
  // 线条样式
  LINE_WIDTH: 2,
  FONT_SIZE: 14,
  FONT_FAMILY: 'Arial, sans-serif',
  // 透明度
  BOX_ALPHA: 0.8,
  TEXT_BG_ALPHA: 0.9
};

/**
 * CanvasOverlay 组件 - 用于在视频播放器上绘制检测框
 * @param {Object} props
 * @param {HTMLVideoElement} props.videoRef - video.js 视频元素引用
 * @param {Array} props.detections - 检测结果数据
 * @param {number} props.fps - 视频帧率
 * @param {number} props.currentTime - 当前播放时间
 */
const CanvasOverlay = ({ videoRef, detections = [], fps = 30, currentTime = 0 }) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  /**
   * 同步Canvas尺寸与视频播放器
   * 关键逻辑：处理devicePixelRatio，确保高DPI屏幕下绘制清晰
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
   * 绘制单个检测框
   * @param {Object} box - 检测框数据 {id, xyxy, label}
   */
  const drawBox = (box) => {
    if (!canvasRef.current) return;

    const ctx = canvasRef.current.getContext('2d');
    const [x1, y1, x2, y2] = box.xyxy;
    const color = CANVAS_STYLES.COLORS[box.label] || '#FF0000';

    // 绘制检测框边框
    ctx.strokeStyle = color;
    ctx.lineWidth = CANVAS_STYLES.LINE_WIDTH;
    ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);

    // 绘制标签背景
    const labelText = `${box.id}号框 ${box.label}`;
    ctx.font = `${CANVAS_STYLES.FONT_SIZE}px ${CANVAS_STYLES.FONT_FAMILY}`;
    const textMetrics = ctx.measureText(labelText);
    const textWidth = textMetrics.width;
    const textHeight = CANVAS_STYLES.FONT_SIZE + 4;

    // 标签背景框
    ctx.fillStyle = color + Math.round(CANVAS_STYLES.TEXT_BG_ALPHA * 255).toString(16).padStart(2, '0');
    ctx.fillRect(x1, y1 - textHeight, textWidth + 8, textHeight);

    // 标签文字
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(labelText, x1 + 4, y1 - 6);
  };

  /**
   * 清空画布
   */
  const clearCanvas = () => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    const canvas = canvasRef.current;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  /**
   * 绘制当前帧的所有检测框
   */
  const drawBoxes = () => {
    if (!videoRef || !detections.length) return;

    clearCanvas();

    // 根据当前时间计算帧索引
    const frameIndex = Math.floor(currentTime * fps);
    const frameData = detections.find(d => d.frame_index === frameIndex);

    if (frameData && frameData.boxes) {
      frameData.boxes.forEach(box => {
        drawBox(box);
      });
    }
  };

  /**
   * 监听全屏状态变化
   */
  const handleFullscreenChange = () => {
    const isCurrentlyFullscreen = !!(
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement
    );
    setIsFullscreen(isCurrentlyFullscreen);

    // 全屏状态变化时重新同步Canvas尺寸
    setTimeout(syncCanvasSize, 100);
  };

  /**
   * 监听窗口尺寸变化
   */
  const handleResize = () => {
    syncCanvasSize();
    drawBoxes();
  };

  useEffect(() => {
    if (!videoRef) return;

    // 监听视频元素事件
    const video = videoRef;

    // 视频元数据加载完成时同步尺寸
    video.addEventListener('loadedmetadata', syncCanvasSize);

    // 视频播放时间更新时重绘检测框
    video.addEventListener('timeupdate', drawBoxes);

    // 视频尺寸变化时重新同步
    video.addEventListener('resize', syncCanvasSize);

    // 监听全屏状态变化
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);

    // 监听窗口尺寸变化
    window.addEventListener('resize', handleResize);

    // 初始同步
    syncCanvasSize();

    return () => {
      // 清理事件监听
      video.removeEventListener('loadedmetadata', syncCanvasSize);
      video.removeEventListener('timeupdate', drawBoxes);
      video.removeEventListener('resize', syncCanvasSize);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      window.removeEventListener('resize', handleResize);
    };
  }, [videoRef, detections, fps, currentTime]);

  // 检测数据变化时重绘
  useEffect(() => {
    drawBoxes();
  }, [detections, currentTime]);

  return (
    <div
      ref={containerRef}
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