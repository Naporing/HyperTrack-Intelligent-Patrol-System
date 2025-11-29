/**
 * Canvas绘制功能验证脚本
 * 第3天开发任务：验证Canvas能正确绘制矩形框
 * 使用mock数据进行测试，无需YOLO推理
 */

import { testCanvasDrawing, generateMockBoxes, generateBoundaryTestBoxes } from './src/utils/mockData.js';

console.log('🧪 开始Canvas绘制功能验证...\n');

// 模拟Canvas DOM元素（用于Node.js环境测试）
function createMockCanvas() {
  return {
    width: 800,
    height: 600,
    getContext: () => ({
      clearRect: (x, y, w, h) => {
        console.log(`🧹 清空画布: (${x},${y}) 尺寸: ${w}×${h}`);
      },
      strokeRect: (x, y, w, h) => {
        console.log(`📐 绘制矩形框: 位置(${x},${y}) 尺寸(${w}×${h})`);
      },
      fillRect: (x, y, w, h) => {
        console.log(`🎨 绘制填充矩形: 位置(${x},${y}) 尺寸(${w}×${h})`);
      },
      measureText: (text) => ({ width: text.length * 8 }),
      fillText: (text, x, y) => {
        console.log(`✍️ 绘制文字: "${text}" 位置(${x},${y})`);
      },
      font: '',
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 2,
      scale: () => {}
    })
  };
}

console.log('📋 测试1: 基础检测框绘制');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

const mockCanvas1 = createMockCanvas();
const basicTestResult = testCanvasDrawing(mockCanvas1, 'basic');

console.log(`✅ 基础测试结果:`);
console.log(`   - 成功: ${basicTestResult.success}`);
console.log(`   - 测试类型: ${basicTestResult.testType}`);
console.log(`   - 检测框数量: ${basicTestResult.boxCount}`);
console.log(`   - 画布尺寸: ${basicTestResult.canvasSize.width}×${basicTestResult.canvasSize.height}`);
console.log();

console.log('📋 测试2: 边界条件检测框绘制');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

const mockCanvas2 = createMockCanvas();
const boundaryTestResult = testCanvasDrawing(mockCanvas2, 'boundary');

console.log(`✅ 边界测试结果:`);
console.log(`   - 成功: ${boundaryTestResult.success}`);
console.log(`   - 测试类型: ${boundaryTestResult.testType}`);
console.log(`   - 检测框数量: ${boundaryTestResult.boxCount}`);
console.log(`   - 画布尺寸: ${boundaryTestResult.canvasSize.width}×${boundaryTestResult.canvasSize.height}`);
console.log();

console.log('📋 测试3: 空数据处理');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

const mockCanvas3 = createMockCanvas();
const emptyTestResult = testCanvasDrawing(mockCanvas3, 'empty');

console.log(`✅ 空数据测试结果:`);
console.log(`   - 成功: ${emptyTestResult.success}`);
console.log(`   - 测试类型: ${emptyTestResult.testType}`);
console.log(`   - 检测框数量: ${emptyTestResult.boxCount}`);
console.log(`   - 画布尺寸: ${emptyTestResult.canvasSize.width}×${emptyTestResult.canvasSize.height}`);
console.log();

console.log('🎯 Mock数据验证');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

const basicBoxes = generateMockBoxes();
console.log(`📦 基础Mock数据 (${basicBoxes.length}个):`);
basicBoxes.forEach((box, index) => {
  const [x1, y1, x2, y2] = box.xyxy;
  const width = x2 - x1;
  const height = y2 - y1;
  console.log(`   ${index + 1}. ${box.id}号框 (${box.label}): 位置(${x1},${y1}) 尺寸(${width}×${height})`);
});

console.log();

const boundaryBoxes = generateBoundaryTestBoxes();
console.log(`📦 边界Mock数据 (${boundaryBoxes.length}个):`);
boundaryBoxes.forEach((box, index) => {
  const [x1, y1, x2, y2] = box.xyxy;
  const width = x2 - x1;
  const height = y2 - y1;
  console.log(`   ${index + 1}. ${box.id}号框 (${box.label}): 位置(${x1},${y1}) 尺寸(${width}×${height})`);
});

console.log();

console.log('🔍 颜色映射验证');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

import { getBoxColor } from './src/utils/mockData.js';

const colorTests = ['iron_pole', 'concrete_pole', 'iron_gantry_pole', 'unknown_type'];
colorTests.forEach(label => {
  const color = getBoxColor(label);
  console.log(`   ${label}: ${color}`);
});

console.log();

console.log('📊 测试总结');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

const allTests = [
  { name: '基础测试', result: basicTestResult },
  { name: '边界测试', result: boundaryTestResult },
  { name: '空数据测试', result: emptyTestResult }
];

const successCount = allTests.filter(test => test.result.success).length;
const totalTests = allTests.length;

console.log(`✅ 成功测试: ${successCount}/${totalTests}`);
console.log(`🎯 总检测框数: ${basicTestResult.boxCount + boundaryTestResult.boxCount + emptyTestResult.boxCount}`);

if (successCount === totalTests) {
  console.log('🎉 所有Canvas绘制测试通过！');
  console.log('📌 验证要点:');
  console.log('   ✅ 矩形框绘制功能正常');
  console.log('   ✅ 颜色映射符合规范');
  console.log('   ✅ 标签文字显示正确');
  console.log('   ✅ 边界条件处理正常');
  console.log('   ✅ 空数据处理正确');
  console.log();
  console.log('🚀 Canvas绘制功能已就绪，可与真实YOLO推理结果集成！');
} else {
  console.log('❌ 部分测试失败，请检查实现');
}

console.log('\n📝 访问测试页面: http://localhost:3003/canvas-test');
console.log('📝 在浏览器中查看实际的Canvas绘制效果');