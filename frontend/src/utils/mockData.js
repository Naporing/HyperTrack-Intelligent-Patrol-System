/**
 * Mock数据生成器 - 第3天用于测试Canvas绘制
 * 验证Canvas能正确绘制矩形框（若B的YOLO推理未完成）
 */

/**
 * 生成模拟的检测框数据用于测试
 * 包含3种电杆类型，覆盖不同位置和尺寸
 * @returns {Array} 模拟检测框数组
 */
export const generateMockBoxes = () => {
  return [
    {
      id: 1,
      xyxy: [100, 200, 300, 600], // 大型铁塔
      label: 'iron_pole'
    },
    {
      id: 2,
      xyxy: [400, 220, 500, 610], // 中型混凝土电杆
      label: 'concrete_pole'
    },
    {
      id: 3,
      xyxy: [650, 210, 820, 630], // 大型门型电杆
      label: 'iron_gantry_pole'
    }
  ];
};

/**
 * 生成边界测试用的mock数据
 * 测试各种边界情况：小框、大框、边缘框等
 * @returns {Array} 边界测试检测框数组
 */
export const generateBoundaryTestBoxes = () => {
  return [
    {
      id: 10,
      xyxy: [10, 10, 50, 50], // 小框在左上角
      label: 'iron_pole'
    },
    {
      id: 11,
      xyxy: [750, 550, 790, 590], // 小框在右下角
      label: 'concrete_pole'
    },
    {
      id: 12,
      xyxy: [0, 100, 800, 200], // 横跨整个画布的框
      label: 'iron_gantry_pole'
    }
  ];
};

/**
 * 获取电杆类型对应的颜色（与MVP文档规范一致）
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
 * 绘制单个检测框（第3天要求的函数骨架）
 * @param {CanvasRenderingContext2D} ctx Canvas上下文
 * @param {Object} box 检测框对象
 */
export const drawSingleBox = (ctx, box) => {
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
 * 测试Canvas绘制框的函数（第3天核心测试）
 * 使用mock数据验证Canvas能正确绘制矩形框
 * @param {HTMLCanvasElement} canvas Canvas元素
 * @param {string} testType 测试类型：'basic' | 'boundary' | 'empty'
 */
export const testCanvasDrawing = (canvas, testType = 'basic') => {
  if (!canvas) {
    console.error('Canvas元素不存在');
    return;
  }

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    console.error('无法获取Canvas上下文');
    return;
  }

  // 清空画布
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 根据测试类型选择mock数据
  let testBoxes = [];
  let testDescription = '';

  switch (testType) {
    case 'basic':
      testBoxes = generateMockBoxes();
      testDescription = '基础检测框测试';
      break;
    case 'boundary':
      testBoxes = generateBoundaryTestBoxes();
      testDescription = '边界条件测试';
      break;
    case 'empty':
      testDescription = '空数据测试';
      break;
    default:
      testBoxes = generateMockBoxes();
      testDescription = '基础检测框测试';
  }

  // 绘制所有检测框
  testBoxes.forEach(box => {
    drawSingleBox(ctx, box);
  });

  // 添加测试信息显示
  ctx.fillStyle = '#374151';
  ctx.font = '14px sans-serif';
  ctx.fillText(`测试类型: ${testDescription}`, 10, 30);
  ctx.fillText(`检测框数量: ${testBoxes.length}`, 10, 50);

  if (testBoxes.length > 0) {
    const labelCounts = testBoxes.reduce((acc, box) => {
      acc[box.label] = (acc[box.label] || 0) + 1;
      return acc;
    }, {});

    ctx.fillText('电杆类型分布:', 10, 70);
    Object.entries(labelCounts).forEach(([label, count], index) => {
      const color = getBoxColor(label);
      ctx.fillStyle = color;
      ctx.fillText(`• ${label}: ${count}个`, 20, 90 + index * 20);
    });
  }

  console.log(`✅ Canvas绘制测试完成 - ${testDescription}`);
  console.log(`📊 绘制了 ${testBoxes.length} 个检测框`);

  // 输出详细测试信息
  if (testBoxes.length > 0) {
    console.log('🎯 检测框详情:');
    testBoxes.forEach(box => {
      const [x1, y1, x2, y2] = box.xyxy;
      const width = x2 - x1;
      const height = y2 - y1;
      console.log(`  ${box.id}号框 (${box.label}): 位置(${x1},${y1}) 尺寸(${width}×${height})`);
    });
  }

  return {
    success: true,
    testType,
    boxCount: testBoxes.length,
    canvasSize: { width: canvas.width, height: canvas.height }
  };
};