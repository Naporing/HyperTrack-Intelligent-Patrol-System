# Claude Code 项目记忆：智能高铁巡检系统 MVP（AI 执行指令集）

**版本：P0-20251117 | 类型：机器执行规范 | 目标受众：Claude Code AI**

---

## 一、项目强制约束（不可违背）

### 1.1 P0 功能红线

- **api规范**：严格执行docs\api.md文件中的要求，不能轻易修改此文件中的内容！试图修改api时返回警告标注
- **严禁修改文件目录**：禁止对项目中文件和文件夹进行位置移动，禁止添加新的文件夹
- **使用中文交流**：全程与用户用中文沟通
- **仅检测三类电杆**：`iron_pole`, `concrete_pole`, `iron_gantry_pole`
- **无状态判断**：禁止生成 `good`/`fault`/`bad` 等任何状态字段
- **标注功能仅限 UI 占位**：禁止调用后端 `/annotate` 接口，禁止保存截图或数据库写入
- **历史页禁止直接播放**：HistoryPage 只能跳转，不能嵌套 `<video>` 标签
- **YOLO 参数禁止调优**：必须使用 ultralytics 库默认值，`conf`/`iou` 参数不得显式传入
禁止使用表情符号，用中文代替

### 1.2 统一返回格式（所有接口强制）
```python
# 成功响应模板
{
  "success": True,
  "data": { ... }  # 具体数据结构见第三节
}

# 失败响应模板
{
  "success": False,
  "error": "ERROR_CODE"  # 必须是字符串，从预定义错误码集合选择
}
```

### 1.3 HTTP 状态码
- **P0 阶段所有接口返回 HTTP 200**，无论成功或失败
- 禁止返回 4xx/5xx 状态码，错误信息通过 `success/error` 字段传递

---

## 二、技术栈锁定（版本必须一致）

### 2.1 后端技术栈
```python
# requirements.txt 必须精确锁定
fastapi==0.115.0
uvicorn[standard]==0.32.0
ultralytics==8.3.0  # 必须保证 YOLOv8 可用
onnxruntime==1.19.2
opencv-python-headless==4.10.0.84
python-multipart==0.0.12  # 用于文件上传
```

### 2.2 前端技术栈

```json
// package.json 必须包含
{
  "dependencies": {
    "react": "^18.3.1",
    "video.js": "^8.19.1",
    "tailwindcss": "^3.4.14",
    "axios": "^1.7.7"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.3",
    "vite": "^5.4.10"
  }
}
```

### 2.3整体目录结构规范（严格遵守目录结构）

```
project-root/
├── backend/
│   ├── main.py                 # FastAPI 主入口
│   ├── models/
│   │   └── best.onnx          # YOLOv8 模型文件
│   └── data/
│       ├── videos/{task_id}/video.mp4
│       └── detections/{task_id}.json
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── UploadPage.jsx
│   │   │   ├── InspectPage.jsx
│   │   │   └── HistoryPage.jsx
│   │   └── components/
│   │       ├── VideoPlayer.jsx
│   │       ├── CanvasOverlay.jsx
│   │       └── AnnotationPanel.jsx
│   └── package.json
├── docs/                       # 项目文档（C 归总）
│   ├── api.md                  # 接口契约（A 维护）
│   ├── ui-decisions.md         # UI 评审记录（C 维护）
│   ├── risk-board.md           # 风险看板（C 维护）
│   └── claude-prompts.md       # 共享 Prompt（D 维护）
├── railway.db                  # SQLite 数据库
└── README.md
```

### 2.4 关键库使用规范

- **FastAPI**：必须使用 `FileResponse` 返回视频流，自动支持 HTTP Range
- **ultralytics**：模型加载必须使用单例模式，禁止每次请求重新加载
- **video.js**：必须使用 `videojs` 实例化，禁止原生 `<video>` 标签
- **Canvas**：必须处理 `devicePixelRatio`，禁止直接使用 CSS 像素值

---

## 三、API 接口契约（精确到字段）

### 3.1 `/upload` - POST
**请求格式**：
```http
POST /upload HTTP/1.1
Content-Type: multipart/form-data

file: <binary>  # 字段名必须是 file，类型必须是 video/mp4
```

**成功响应**：
```json
{
  "success": true,
  "data": {
    "task_id": "local_f3a9c2",  # 格式: local_[a-z0-9]{6,8}
    "fps": 30.0,
    "frame_count": 450,
    "duration": 18.0,
    "width": 1920,
    "height": 1080
  }
}
```

**错误码**：
- `UPLOAD_INVALID_FILE`: MIME 类型非 video/mp4 或文件 > 100MB
- `UPLOAD_SAVE_FAILED`: 磁盘写入失败

**后端实现约束**：
- 必须创建目录 `./data/videos/{task_id}/`
- 视频文件必须保存为 `./data/videos/{task_id}/video.mp4`
- `task_id` 生成必须使用 `secrets.token_hex(3)` 或类似方案，确保唯一性

---

### 3.2 `/detect/{task_id}` - POST
**路径参数**：`task_id` (string)

**成功响应**：
```json
{
  "success": true,
  "data": {
    "generated": true,  # 或 false
    "task_id": "local_f3a9c2"
  }
}
```

**幂等性逻辑**：
```python
# 伪代码 - AI 生成时必须遵循
json_path = Path(f"./data/detections/{task_id}.json")
if json_path.exists():
    return {"success": True, "data": {"generated": False, "already_exists": True}}
else:
    run_inference(video_path, json_path)  # 执行推理
    return {"success": True, "data": {"generated": True, "task_id": task_id}}
```

**错误码**：
- `TASK_NOT_FOUND`: `./data/videos/{task_id}/video.mp4` 不存在
- `DETECT_FAILED`: 模型推理失败（显存不足/文件损坏）

---

### 3.3 `/detections/{task_id}` - GET
**路径参数**：`task_id` (string)

**成功响应**：
```json
{
  "success": true,
  "data": [
    {
      "frame_index": 0,
      "time": 0.0,
      "boxes": [
        {
          "id": 1,
          "xyxy": [100, 200, 300, 600],  # 必须是整数数组，长度为4
          "label": "iron_pole"  # 枚举值，必须三类之一
        }
      ]
    },
    {
      "frame_index": 1,
      "time": 0.0333,
      "boxes": []
    }
  ]
}
```

**文件读取逻辑**：
```python
# AI 生成代码时必须这样实现
json_path = Path(f"./data/detections/{task_id}.json")
if not json_path.exists():
    return {"success": False, "error": "DETECTIONS_NOT_FOUND"}
with open(json_path, "r") as f:
    data = json.load(f)
return {"success": True, "data": data}
```

**错误码**：
- `DETECTIONS_NOT_FOUND`: JSON 文件不存在

---

### 3.4 `/videos/{task_id}` - GET
**路径参数**：`task_id` (string)

**成功响应**：`FileResponse` 视频流，`Content-Type: video/mp4`

**失败响应**：
```json
{
  "success": false,
  "error": "TASK_NOT_FOUND"
}
```

**实现模板**：
```python
from fastapi.responses import FileResponse
from pathlib import Path

@app.get("/videos/{task_id}")
async def get_video(task_id: str):
    video_path = Path(f"./data/videos/{task_id}/video.mp4")
    if not video_path.exists():
        return {"success": False, "error": "TASK_NOT_FOUND"}
    return FileResponse(video_path, media_type="video/mp4")
```

---

### 3.5 `/history` - GET
**成功响应**：
```json
{
  "success": true,
  "data": [
    {
      "task_id": "local_f3a9c2",
      "created_at": "2025-11-16T10:00:00"  # ISO8601 格式
    }
  ]
}
```

**查询 SQL**：
```sql
SELECT task_id, created_at FROM tasks ORDER BY created_at DESC
```

---

## 四、前端组件规范

### 4.1 文件上传（UploadPage）
**AI 生成代码时必须包含**：
- 文件输入字段 `name="file"`
- MIME 类型检查 `accept="video/mp4"`
- 最大文件大小限制 100MB（前端先检查）
- 上传进度条（使用 `axios.onUploadProgress`）
- 错误提示根据 `error` 字段显示

**跳转逻辑**：
```javascript
// 成功响应后必须立即执行
if (response.data.success) {
  const taskId = response.data.data.task_id;
  navigate(`/inspect/${taskId}`);
}
```

---

### 4.2 视频播放（VideoPlayer）
**video.js 初始化模板**：
```javascript
import videojs from 'video.js';

const player = videojs(videoRef.current, {
  controls: true,
  autoplay: false,
  preload: 'auto',
  playbackRates: [1, 2]  # P0 只支持 1x 和 2x
});
```

**视频源设置**：
```javascript
player.src({ type: 'video/mp4', src: `/videos/${taskId}` });
```

---

### 4.3 Canvas 覆盖层（CanvasOverlay）
**尺寸同步算法**：
```javascript
function syncCanvasSize(video, canvas) {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = video.videoWidth * dpr;
  canvas.height = video.videoHeight * dpr;
  canvas.style.width = video.clientWidth + 'px';
  canvas.style.height = video.clientHeight + 'px';
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
}
```

**绘制触发时机**：
- `video.addEventListener('loadedmetadata', syncCanvasSize)`
- `video.addEventListener('resize', syncCanvasSize)`
- `video.addEventListener('fullscreenchange', syncCanvasSize)`
- `video.addEventListener('timeupdate', drawBoxes)`

**坐标转换**：
```javascript
// AI 生成时必须包含
const frameIndex = Math.floor(video.currentTime * fps);
const frameData = detections.find(d => d.frame_index === frameIndex);
if (frameData) {
  frameData.boxes.forEach(box => {
    const [x1, y1, x2, y2] = box.xyxy;
    ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
  });
}
```

---

### 4.4 标注面板（AnnotationPanel）
**结构规范**：
```jsx
<div className="annotation-panel">
  <div>时间：{formatTime(currentTime)}</div>
  <div>检测目标：</div>
  <ul>
    {currentBoxes.map(box => (
      <li key={box.id}>
        {box.id}号框 ({box.label})
        <button onClick={() => alert('标注功能将在后续版本开放')}>
          标注（演示）
        </button>
      </li>
    ))}
  </ul>
  <div>已标注记录（演示版）：未来版本展示截图与状态</div>
</div>
```

**颜色规范**（三类电杆）：
- `iron_pole`: 红色 `#EF4444`
- `concrete_pole`: 蓝色 `#3B82F6`
- `iron_gantry_pole`: 绿色 `#10B981`

---

## 五、数据库操作规范

### 5.1 SQLite 连接
```python
import sqlite3
from pathlib import Path

DB_PATH = Path("./railway.db")

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn
```

### 5.2 tasks 表初始化
```python
INIT_SQL = """
CREATE TABLE IF NOT EXISTS tasks (
  task_id TEXT PRIMARY KEY,
  video_path TEXT NOT NULL,
  fps REAL,
  frame_count INTEGER,
  duration REAL,
  width INTEGER,
  height INTEGER,
  line_name TEXT,
  created_at TEXT NOT NULL
);
"""
```

### 5.3 插入操作
```python
# AI 生成时必须使用参数化查询
cursor.execute(
    "INSERT INTO tasks VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    (task_id, video_path, fps, frame_count, duration, width, height, None, created_at)
)
```

---

## 六、错误处理与日志规范

### 6.1 错误捕获模板（所有接口必须）
```python
try:
    # 业务逻辑
    return {"success": True, "data": result}
except Exception as e:
    # AI 生成时必须包含日志
    print(f"[ERROR] {endpoint_name}: {str(e)}")
    return {"success": False, "error": "INTERNAL_ERROR"}
```

### 6.2 预定义错误码集合
```python
ERROR_CODES = {
    # 通用
    "INTERNAL_ERROR": "未知异常",
    # 上传
    "UPLOAD_INVALID_FILE": "文件格式不支持或过大",
    "UPLOAD_SAVE_FAILED": "保存失败",
    # 检测
    "TASK_NOT_FOUND": "任务不存在",
    "DETECT_FAILED": "检测失败",
    "DETECTIONS_NOT_FOUND": "检测结果不存在",
    # 历史
    "HISTORY_LOAD_FAILED": "历史记录加载失败"
}
```

---

## 七、性能与优化规范

### 7.1 推理性能
- **帧采样策略**：每帧都检测，禁止跳帧
- **帧率基准**：30fps 视频推理速度 > 0.5x 实时（即 1 秒视频 < 2 秒推理）
- **内存限制**：单视频推理峰值内存 < 4GB

### 7.2 前端性能
- **Canvas 绘制**：在 `timeupdate` 事件中执行，禁止每帧都遍历全部 detections
- **数据缓存**：`/detections/{task_id}` 返回的数组必须缓存在内存，禁止重复请求
- **重绘触发**：只允许在 `timeupdate`/`resize`/`fullscreenchange` 时重绘

### 7.3 接口性能
- `/upload`：100MB 文件上传 < 30 秒
- `/detections`：JSON 文件读取 < 1 秒（100MB 以内）
- `/history`：查询 < 100ms

---

## 八、测试与验证流程

### 8.1 单元测试模板
**后端接口测试（Postman）**：
```http
POST /upload
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary

------WebKitFormBoundary
Content-Disposition: form-data; name="file"; filename="test.mp4"
Content-Type: video/mp4

<binary>
```

**预期响应**：
```json
{"success": true, "data": {"task_id": "local_...", "fps": 30, ...}}
```

### 8.2 端到端测试用例
1. **上传 → 检测流程**：
   - 选择 `test.mp4` (50MB, 30fps, 10秒)
   - 调用 `/upload` → 获得 `task_id`
   - 调用 `/detect/{task_id}` → 返回 `generated: true`
   - 检查 `./data/detections/{task_id}.json` 存在且格式正确

2. **播放 → 绘框流程**：
   - InspectPage 加载 `task_id`
   - video.js 播放 `/videos/{task_id}`
   - Canvas 在 `currentTime=5.0s` 时显示对应帧的 boxes
   - 框坐标与视频内容偏差 < 2px

3. **历史跳转流程**：
   - HistoryPage 调用 `/history` → 显示任务列表
   - 点击“进入查看” → `navigate("/inspect/{task_id}")`
   - InspectPage 正确加载视频和检测框

---

## 九、代码审查标记

### 9.1 联调完成标记
```python
# 后端接口文件中必须添加
@app.post("/upload")
async def upload(...):
    # ... 实现代码
    pass  # SYNCED: 与 UploadPage 联调通过 2025-11-XX
```

```javascript
// 前端组件文件中必须添加
function UploadPage() {
  // ... 实现代码
  // SYNCED: /upload 接口联调通过 2025-11-XX
}
```

### 9.2 每日审查清单（C 执行）
- [ ] 所有接口返回格式是否统一？
- [ ] 所有 JSON 文件路径是否正确？
- [ ] 所有 Canvas 尺寸是否同步？
- [ ] 所有错误码是否在预定义集合？
- [ ] 所有联调标记是否添加？

---

## 十、部署命令（必须可执行）

### 10.1 后端部署
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 10.2 前端部署
```bash
cd frontend
npm install
npm run dev -- --host
```

### 10.3 数据库初始化
```bash
python -c "
import sqlite3
conn = sqlite3.connect('railway.db')
conn.execute('''CREATE TABLE IF NOT EXISTS tasks (
  task_id TEXT PRIMARY KEY,
  video_path TEXT NOT NULL,
  fps REAL,
  frame_count INTEGER,
  duration REAL,
  width INTEGER,
  height INTEGER,
  line_name TEXT,
  created_at TEXT NOT NULL
);''')
conn.close()
print('✅ 数据库初始化完成')
"
```

---

## 十一、AI 代码生成约束

### 11.1 禁止生成的代码
- ❌ 任何 P1 功能（真实标注、统计、删除接口）
- ❌ 任何未定义的接口路由
- ❌ 任何非三类标签的检测输出
- ❌ 任何跨帧目标跟踪逻辑

### 11.2 必须生成的代码
- ✅ 所有接口的 `try/except` 包装
- ✅ 所有文件路径的 `Path.exists()` 检查
- ✅ 所有 Canvas 的 `devicePixelRatio` 处理
- ✅ 所有 JSON 文件的 UTF-8 编码声明

### 11.3 代码风格

- **后端**：官方标准开发格式
- **前端**：官方标准开发格式
- **变量命名**：`task_id`, `frame_index`, `box_id` 必须带下划线

---

**本记忆文档为 AI 生成代码的唯一依据。每次生成前，请先搜索相关关键词（如 `/upload`, `Canvas`, `task_id`），确保与全局规范一致。**