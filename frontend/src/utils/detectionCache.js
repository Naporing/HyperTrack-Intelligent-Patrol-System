/**
 * Detections数据缓存工具 - 简化版本
 * 仅内存缓存，不做本地存储
 * 用于优化大量检测数据的性能（P0基础功能）
 */

// 简单的内存缓存 Map<taskId, detectionsData>
const cache = new Map();

/**
 * 缓存detections数据
 * @param {string} taskId - 任务ID
 * @param {Array} detections - 检测结果数组
 */
export const set = (taskId, detections) => {
  if (!taskId || !Array.isArray(detections)) {
    console.error('Invalid parameters for cache set');
    return;
  }

  cache.set(taskId, detections);
  console.log(`缓存任务 ${taskId}，数据量: ${detections.length} 帧`);
};

/**
 * 获取缓存的detections数据
 * @param {string} taskId - 任务ID
 * @returns {Array|null} 检测结果数组或null
 */
export const get = (taskId) => {
  if (!taskId) {
    return null;
  }

  const cached = cache.get(taskId);
  if (cached) {
    console.log(`命中缓存任务 ${taskId}`);
    return cached;
  } else {
    console.log(`缓存未命中任务 ${taskId}`);
    return null;
  }
};

/**
 * 检查是否已缓存
 * @param {string} taskId - 任务ID
 * @returns {boolean} 是否已缓存
 */
export const has = (taskId) => {
  return cache.has(taskId);
};

/**
 * 清除指定任务的缓存
 * @param {string} taskId - 任务ID
 */
export const deleteCache = (taskId) => {
  const deleted = cache.delete(taskId);
  if (deleted) {
    console.log(`清除任务 ${taskId} 的缓存`);
  }
  return deleted;
};

/**
 * 清空所有缓存
 */
export const clear = () => {
  const size = cache.size;
  cache.clear();
  console.log(`清空所有缓存，共清除 ${size} 个任务`);
};

/**
 * 获取缓存统计信息
 * @returns {Object} 缓存统计数据
 */
export const getStats = () => {
  return {
    cacheSize: cache.size,
    taskIds: Array.from(cache.keys())
  };
};

// 导出默认缓存对象
const detectionCache = {
  set,
  get,
  has,
  delete: deleteCache,
  clear,
  getStats
};

export default detectionCache;