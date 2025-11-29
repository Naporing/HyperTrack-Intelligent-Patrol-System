import React, { useRef, useEffect } from 'react';
import { getBoxColor } from '../utils/mockData';

/**
 * CanvasOverlay 组件 - 用于在视频播放器上绘制检测框
 * @param {Object} props
 * @param {HTMLVideoElement} props.videoRef - video.js 视频元素引用
 * @param {Array} props.detections - 检测结果数据（可选，用于mock测试）
 * @param {boolean} props.useMockData - 是否使用mock数据进行测试
 */
const CanvasOverlay = ({ videoRef, detections = [], useMockData = false }) => {
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
   * 绘制单个检测框
   * @param {CanvasRenderingContext2D} ctx - Canvas绘图上下文
   * @param {Object} box - 检测框对象
   */
  const drawSingleBox = (ctx, box) => {
    const { id, xyxy, label } = box;
    const [x1, y1, x2, y2] = xyxy;
    const color = getBoxColor(label);

    // 绘制矩形框
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);

    // 绘制标签背景
    const text = `${id}号框`;
    ctx.font = '12px sans-serif';
    const textWidth = ctx.measureText(text).width;

    ctx.fillStyle = color;
    ctx.fillRect(x1, y1 - 20, textWidth + 8, 20);

    // 绘制标签文字
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(text, x1 + 4, y1 - 6);
  };

  /**
   * 编写drawBoxes(ctx, boxes)函数实现
   * @param {CanvasRenderingContext2D} ctx - Canvas绘图上下文
   * @param {Array} boxes - 检测框数据数组
   */
  const drawBoxes = (ctx, boxes) => {
    if (!boxes || boxes.length === 0) {
      console.log('没有检测框需要绘制');
      return;
    }

    console.log(`正在绘制 ${boxes.length} 个检测框:`, boxes);

    // 清空画布
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // 绘制所有检测框
    boxes.forEach(box => {
      drawSingleBox(ctx, box);
    });
  };

  /**
   * 获取mock数据用于测试
   */
  const getMockData = () => {
    return [
      {
        id: 1,
        xyxy: [100, 150, 250, 500],
        label: 'iron_pole'
      },
      {
        id: 2,
        xyxy: [350, 180, 450, 520],
        label: 'concrete_pole'
      },
      {
        id: 3,
        xyxy: [550, 160, 700, 540],
        label: 'iron_gantry_pole'
      }
    ];
  };

  /**
   * 触发绘制（用于mock数据测试）
   */
  const triggerDrawing = () => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // 根据是否使用mock数据选择数据源
    let boxesToDraw = [];

    if (useMockData) {
      boxesToDraw = getMockData();
    } else if (detections && detections.length > 0) {
      // 从detections数据中提取当前帧的boxes
      boxesToDraw = detections;
    }

    drawBoxes(ctx, boxesToDraw);
  };

  /**
   * 监听全屏状态变化
   */
  const handleFullscreenChange = () => {
    // 全屏状态变化时重新同步Canvas尺寸
    setTimeout(() => {
      syncCanvasSize();
      triggerDrawing(); // 重新绘制
    }, 100);
  };

  /**
   * 监听窗口尺寸变化
   */
  const handleResize = () => {
    syncCanvasSize();
    triggerDrawing(); // 重新绘制
  };

  useEffect(() => {
    if (!videoRef) return;

    // 监听视频元素的loadedmetadata事件，设置canvas.width/height
    videoRef.addEventListener('loadedmetadata', () => {
      syncCanvasSize();
      triggerDrawing(); // 初始绘制
    });

    // 监听resize和fullscreenchange事件，同步canvas尺寸
    window.addEventListener('resize', handleResize);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);

    return () => {
      // 清理事件监听
      videoRef.removeEventListener('loadedmetadata', syncCanvasSize);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
    };
  }, [videoRef]);

  // 当detections或useMockData变化时重新绘制
  useEffect(() => {
    triggerDrawing();
  }, [detections, useMockData]);

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