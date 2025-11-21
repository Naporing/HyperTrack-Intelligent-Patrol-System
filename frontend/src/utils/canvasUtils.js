/**
 * Canvas工具函数集合
 * 第一天创建基础工具函数，为后续Canvas绘制做准备
 */

/**
 * 同步Canvas尺寸与视频尺寸，处理devicePixelRatio避免模糊
 * @param {HTMLVideoElement} video 视频元素
 * @param {HTMLCanvasElement} canvas 画布元素
 */
export const syncCanvasSize = (video, canvas) => {
  if (!video || !canvas) return;

  const dpr = window.devicePixelRatio || 1;

  // 设置Canvas实际尺寸（考虑设备像素比）
  canvas.width = video.videoWidth * dpr;
  canvas.height = video.videoHeight * dpr;

  // 设置Canvas显示尺寸
  canvas.style.width = video.clientWidth + 'px';
  canvas.style.height = video.clientHeight + 'px';

  // 缩放上下文以适应设备像素比
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.scale(dpr, dpr);
  }
};

/**
 * 格式化时间显示 (秒数 -> MM:SS.ms)
 * @param {number} seconds 秒数
 * @returns {string} 格式化的时间字符串
 */
export const formatTime = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  const milliseconds = Math.floor((seconds % 1) * 100);

  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
};

/**
 * 根据当前时间和FPS计算帧索引
 * @param {number} currentTime 当前播放时间（秒）
 * @param {number} fps 视频帧率
 * @returns {number} 帧索引
 */
export const getFrameIndex = (currentTime, fps) => {
  return Math.floor(currentTime * fps);
};

/**
 * 清空Canvas
 * @param {HTMLCanvasElement} canvas 画布元素
 */
export const clearCanvas = (canvas) => {
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
};

/**
 * 获取电杆类型对应的颜色
 * @param {string} label 电杆类型标签
 * @returns {string} 颜色值
 */
export const getBoxColor = (label) => {
  const colorMap = {
    'iron_pole': '#EF4444',      // 红色
    'concrete_pole': '#3B82F6',  // 蓝色
    'iron_gantry_pole': '#10B981' // 绿色
  };

  return colorMap[label] || '#6B7280'; // 默认灰色
};

/**
 * 绘制检测框（基础版本，第三天会完善）
 * @param {CanvasRenderingContext2D} ctx Canvas上下文
 * @param {Array} boxes 检测框数组
 * @param {Object} options 配置选项
 */
export const drawBoxes = (ctx, boxes, options = {}) => {
  if (!ctx || !boxes || !Array.isArray(boxes)) return;

  const {
    lineWidth = 2,
    fontSize = 14,
    padding = 4
  } = options;

  boxes.forEach(box => {
    const { id, xyxy, label } = box;
    if (!xyxy || xyxy.length !== 4) return;

    const [x1, y1, x2, y2] = xyxy;
    const color = getBoxColor(label);

    // 绘制矩形框
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);

    // 绘制标签背景
    const text = `${id}号框 (${label})`;
    ctx.font = `${fontSize}px Arial`;
    const textWidth = ctx.measureText(text).width;

    ctx.fillStyle = color;
    ctx.fillRect(x1, y1 - fontSize - padding * 2, textWidth + padding * 2, fontSize + padding * 2);

    // 绘制标签文字
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(text, x1 + padding, y1 - padding);
  });
};

/**
 * 测试函数：绘制示例检测框
 * @param {HTMLCanvasElement} canvas 画布元素
 */
export const drawTestBoxes = (canvas) => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // 清空画布
  clearCanvas(canvas);

  // 模拟检测数据
  const testBoxes = [
    {
      id: 1,
      xyxy: [100, 200, 300, 600],
      label: 'iron_pole'
    },
    {
      id: 2,
      xyxy: [400, 220, 500, 610],
      label: 'concrete_pole'
    },
    {
      id: 3,
      xyxy: [650, 210, 820, 630],
      label: 'iron_gantry_pole'
    }
  ];

  drawBoxes(ctx, testBoxes);
};