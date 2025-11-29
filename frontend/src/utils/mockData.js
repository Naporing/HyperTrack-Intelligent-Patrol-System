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
      xyxy: [100, 200, 300, 600], // 铁塔
      label: 'iron_pole'
    },
    {
      id: 2,
      xyxy: [400, 220, 500, 610], // 混凝土电杆
      label: 'concrete_pole'
    },
    {
      id: 3,
      xyxy: [650, 210, 820, 630], // 门型电杆
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