那我直接给你**按“最小更改版”改好的完整 MVP 文档**（只动了我们刚说那 3 处，其他一字未碰的思路来写）。

------

# 智能高铁巡检系统（MVP 版）

**基于 ultralytics/ultralytics（YOLOv8 官方） + video.js 的可运行最小版本**

> 核心目标（P0）：完成
>  **“上传 → 检测 → 播放 + 框 → 展示标注入口（假按键）→ 历史查看”**
>  重点：**稳定性、直观演示、开发周期可控（约 3–4 天）**。
>
> 真正的“截图 + 保存 + 人工好/坏判断 + 统计信息”等，统一放入 **P1 加分项**。

------

# 一、MVP 核心功能（P0）

------

## ✅ 1. 视频上传 + 后端检测（P0）

### 前端（P0）

- 选择并上传本地 MP4（建议 ≤100MB）。
- 调用 `/upload` 接口，后端返回 `task_id` 和视频元信息（fps、duration 等至少一部分）。
- 将视频保存至本地：

```bash
./data/videos/{task_id}/video.mp4
```

> 出错时（网络错误 / 文件过大 / 服务端异常），需要有**用户可见的提示**，而不是默默失败。

### 后端（P0）

- 接收上传的视频文件。
- 使用 **best.onnx** 模型执行 YOLOv8 推理：

```python
from ultralytics import YOLO

model = YOLO("models/best.onnx")
# P0 阶段使用 YOLO 默认推理配置，不显式修改 conf / iou 等参数
# 如需显式指定，可保留可配置位（但默认仍使用库默认值）：
# results = model(frame, conf=默认, iou=默认)
results = model(frame)
```

#### YOLO 推理配置（P0）

- P0 阶段**不做阈值调参**，直接使用 ultralytics YOLOv8 的默认参数：
  - 默认置信度阈值（`conf`）；
  - 默认 NMS / IoU 阈值（`iou`）。
- 实现建议：
  - 代码层面可以预留 `conf` / `iou` 参数，但默认不传（即使用库默认值）；
  - P1 阶段根据实际误检/漏检情况再调参，并在文档中记录最终采用的阈值。

#### 模型输出说明（重要）

- 模型只输出 **3 种电杆类型标签**：
  - `iron_pole`：钢制电杆
  - `concrete_pole`：混凝土电杆
  - `iron_gantry_pole`：钢制门型电杆
- **没有任何“好/坏”“故障/正常”等标签**，模型只负责“找到电杆 + 类型分类”。

#### 检测帧采样策略（P0）

- **简化策略：**
  - 视频帧率为 30fps，统一每帧进行检测，无需考虑每隔帧进行采样的策略。
  - **每帧检测**，不做进一步的采样或降负载处理，保证推理的精度。

#### 检测结果保存

- 按上述采样策略对视频进行检测，将结果保存为 JSON：

```bash
./data/detections/{task_id}.json
```

示例**单帧结构**（P0）：

```json
{
  "frame_index": 0,
  "time": 0.0,
  "boxes": [
    { "id": 1, "xyxy": [100, 200, 300, 600], "label": "iron_pole" },
    { "id": 2, "xyxy": [400, 220, 500, 610], "label": "concrete_pole" },
    { "id": 3, "xyxy": [650, 210, 820, 630], "label": "iron_gantry_pole" }
  ]
}
```

##### detections JSON 顶层结构约定（P0）

- P0 约定：`./data/detections/{task_id}.json` 顶层是**数组**，每个元素代表一帧检测结果：

```json
[
  {
    "frame_index": 0,
    "time": 0.0,
    "boxes": [
      { "id": 1, "xyxy": [100, 200, 300, 600], "label": "iron_pole" }
    ]
  },
  {
    "frame_index": 1,
    "time": 0.0333,
    "boxes": []
  }
]
```

- `/detections/{task_id}` 接口返回结构：

```json
{
  "success": true,
  "data": [
    {
      "frame_index": 0,
      "time": 0.0,
      "boxes": [ ... ]
    },
    {
      "frame_index": 1,
      "time": 0.0333,
      "boxes": [ ... ]
    }
  ]
}
```

- 前端在 CanvasOverlay 中，将 `data` 这一整段数组保存在内存，根据 `currentTime` 查找对应 `frame_index/time` 使用。

**关于 `box_id`（字段 `id`）生成规则：**

- `id` 为**帧内索引**：
  - 对每一帧，从 `1` 开始顺序编号（例如这一帧有 3 个框，则是 `1,2,3`）；
  - `id` 在**当前帧内唯一**，但在整个视频内**不保证全局唯一**。
- 真正标识一个检测目标（尤其在 P1 真实标注中），依赖三元组：
  - `(task_id, frame_index, box_id)`；
- P0 / P1 阶段**都不做跨帧目标跟踪**，即不保证“同一根电杆在不同帧拥有相同 id”。

> 说明：
>
> - `label` 只可能是 `iron_pole` / `concrete_pole` / `iron_gantry_pole` 三类之一；
> - **不出现 `good` / `fault` 等字段**。

上传接口返回示例：

```json
{
  "success": true,
  "data": {
    "task_id": "local_f3a9c2",
    "fps": 30.0,
    "frame_count": 450,
    "duration": 18.0,
    "width": 1920,
    "height": 1080
  }
}
```

### 统一错误格式（P0 简化版）

为便于前端处理，**所有核心接口约定统一错误结构**：

- 成功时（推荐）：

```json
{ "success": true, "data": { ... } }
```

- 失败时（必须）：

```json
{ "success": false, "error": "UPLOAD_FAILED" }
```

#### P0 阶段的最小错误码集合（示例）

P0 不追求极其完整的错误码体系，但建议前后端至少约定以下几个错误码：

- 通用：
  - `INTERNAL_ERROR`：未知异常 / 未分类后端错误。
- 上传相关：
  - `UPLOAD_INVALID_FILE`：文件格式不支持或为空；
  - `UPLOAD_SAVE_FAILED`：保存到磁盘失败。
- 检测相关：
  - `TASK_NOT_FOUND`：`task_id` 对应任务不存在；
  - `DETECT_FAILED`：模型推理失败；
  - `DETECTIONS_NOT_FOUND`：检测结果 JSON 不存在。
- 历史相关：
  - `HISTORY_LOAD_FAILED`：历史任务列表加载失败。

> 说明：
>
> - P0 阶段前端可以先对所有错误统一给出“失败，请稍后重试”类提示；
> - P1 阶段再根据错误码做更精细的提示文案和处理逻辑。

关键接口（至少）：

- `/upload`
- `/detect/{task_id}`
- `/detections/{task_id}`
- `/history`

需要在后端用 `try/except` 包裹核心逻辑，发生异常时：

1. 打日志（traceback）到后端；
2. 返回统一错误 JSON（不要直接 500 + HTML）。

前端在收到 `success: false` 时，显示简单提示（alert / toast），比如：

- “视频上传失败，请检查视频文件或稍后重试。”
- “检测出错，请稍后重试或更换视频。”

------

#### HTTP 状态 & 上传约束（P0）

- P0 简化约定：
  - 所有接口（包括失败）统一返回 **HTTP 200** 状态码，使用 `success` / `error` 字段区分是否成功；
  - 如需更精确的 REST 语义，可在 P1 再调整为：
    - 4xx（如 400/404）表示客户端错误；
    - 5xx 表示服务器错误。
- `/upload` 上传约束（P0 建议）：
  - 仅接受 `video/mp4`，后端检查 MIME 和文件扩展名；
  - 最大支持文件大小，例如 `100MB`，超出时返回：
    - `{ "success": false, "error": "UPLOAD_INVALID_FILE" }`；
  - 客户端以 `multipart/form-data` 方式上传，**文件字段名统一为 `file`**
     （例如 HTML 中 `<input type="file" name="file" />`）。
  - task_id 生成策略：
    - 前缀 `local_` + 6–8 位小写字母数字（例如 `local_f3a9c2`）；
    - 保证在 `tasks` 表中唯一。

------

## ✅ 2. 视频播放 + 检测框渲染（video.js，P0）

前端使用：

- **video.js** 播放后台存储的视频文件；
- **canvas overlay** 覆盖在 video 元素上，用于绘制检测框；
- 根据视频当前播放时间，从 `/detections/{task_id}` 返回的 JSON 中查找对应帧的 `boxes`，并画框。

### P0 目标

- 基本播放控制：
  - 播放 / 暂停；
  - 拖动进度条；
  - 全屏播放；
  - 至少支持 1.0x / 2.0x 倍速。
- Canvas 绘制：
  - 对每个 `boxes` 中的框按 `xyxy` 坐标在视频上画矩形；
  - 可统一使用一种颜色，或按三类类型使用三种不同颜色；
  - 颜色仅用于表示“检测到电杆（及类型）”，**与好/坏无关**。

### Canvas 同步（P0 版本）

为减少错位和闪烁，P0 需做到：

- 在以下时机重新计算并设置 canvas 尺寸：
  - 视频元数据加载完成（`loadedmetadata`）；
  - 窗口 `resize`；
  - `fullscreenchange`；
- Canvas 的宽高和 video 的显示尺寸保持一致，同时考虑 `devicePixelRatio`，避免模糊。

性能方面，P0 采用**简单策略**：

- 在 `timeupdate` 事件中：
  - 查找当前时间对应的帧；
  - 清空 canvas；
  - 画出当前帧所有 bbox；
- 不做预优化（如复杂的节流/批量重绘），**等实际测出卡顿再在 P1 优化**。

------

## ✅ 3. 基础人工标注入口（P0：假按键占位）

> P0 中只实现“标注入口的 UI 和交互反馈”，以展示系统设计完整性；
>  不做真正的截图、/annotate 接口调用和数据库记录。

### P0 要求（前端）

右侧标注区域结构：

- 展示当前时间点的检测目标列表（从当前帧 `boxes` 中生成），示例：

```text
时间：00:12.3
检测目标：
 - 1 号框（iron_pole）       [标注（演示）]
 - 2 号框（concrete_pole）   [标注（演示）]
```

- 每个目标提供一个“标注（演示版）”按钮。

点击“标注（演示版）”时：

- 不调用后端；
- 不截图；
- 不写数据库；
- 可以做任一简单可见反馈，例如：
  - `alert("标注功能将在后续版本（P1）中正式开放")`；
  - 将当前行高亮（临时状态）；
  - 在页面底部显示一行小字：“已点击标注（当前为演示版，不会保存）”。

“已标注列表”在 P0 可选，只需占位文案，例如：

```text
已标注记录（演示版）：
未来版本将展示这里的人工标注截图和好/坏状态
```

> 真正的“截图 + 保存 + 好/坏状态 + 历史回看”等，统一在 **P1 基础人工标注** 中实现。
>  届时标注数据行可采用 `(task_id, frame_index, box_id, screenshot_path, status, created_at)` 等结构。

------

## ✅ 4. 历史记录页（最小版本，P0，列表 + 跳转播放）

P0 目标：

- **在历史页只展示任务列表，不直接播放视频，不需要封面图预览；**
- 点击某条记录后**跳转到 InspectPage**，在 InspectPage 中用 video.js 播放视频 + 显示检测框。

### 后端（P0）

- `/history` 返回所有任务的简要信息，最少包含：

```json
{
  "success": true,
  "data": [
    {
      "task_id": "local_f3a9c2",
      "created_at": "2025-11-16T10:00:00"
    },
    {
      "task_id": "local_93bd21",
      "created_at": "2025-11-16T10:20:00"
    }
  ]
}
```

> 不在 `/history` 中返回视频内容本身，视频统一通过 `/videos/{task_id}` 在 InspectPage 播放。

### 前端（P0）

**HistoryPage：**

- 以列表形式展示任务，例如：

```text
任务 ID：local_f3a9c2
时间：2025/11/16 10:00
[进入查看]

任务 ID：local_93bd21
时间：2025/11/16 10:20
[进入查看]
```

- 不在 HistoryPage 中嵌 `<video>` 进行播放，避免一页多个播放器导致卡顿。
- 点击 **[进入查看]**：
  - `navigate("/inspect/" + task_id)`
  - 跳转到 **InspectPage(task_id)**

**InspectPage：**

- 对“历史任务”和“刚上传完的任务”统一使用同一个页面：
  - 根据 URL 中的 `task_id`：
    - 播放 `/videos/{task_id}` 对应的视频；
    - 调用 `/detections/{task_id}` 加载检测结果；
  - CanvasOverlay 画框；
  - 右侧显示“标注（演示）”入口。

> 结论：
>
> - 历史视频的展示方式 = **HistoryPage 选任务 → InspectPage 播放视频 + 显示检测框**；
> - 不在历史页直接播放多个视频，保证实现简单、性能稳定。

------

# 二、接口行为与系统结构（P0）

### 🟦 整体目录结构规范

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

---

## 🟦 后端目录结构

```bash
backend/
  main.py
  /models/best.onnx
  /data/
    /videos/{task_id}/video.mp4
    /detections/{task_id}.json
    /attachments/{task_id}/*.jpg   # 预留给 P1 标注使用，P0 为空
  railway.db
```

------

## 🟦 数据库设计（P0）

P0 只需要一张**任务表**，用于：

- 在 `/history` 中列出任务；
- 存储 `/upload` 返回的元信息（fps、duration 等）；
- 为后续 P1 标注 / 统计做基础。

**表：`tasks`**

```sql
CREATE TABLE IF NOT EXISTS tasks (
  task_id      TEXT PRIMARY KEY,         -- 例如 local_f3a9c2
  video_path   TEXT NOT NULL,            -- ./data/videos/{task_id}/video.mp4
  fps          REAL,
  frame_count  INTEGER,
  duration     REAL,                     -- 秒
  width        INTEGER,
  height       INTEGER,
  line_name    TEXT,                     -- 预留给 P1（线路名称），P0 可为 NULL
  created_at   TEXT NOT NULL             -- ISO8601 字符串，例如 2025-11-16T10:00:00
);
```

- P0 阶段不单独建 detections / annotations 表：
  - 检测结果直接存 JSON 文件：`./data/detections/{task_id}.json`；
  - 标注相关表放到 P1 再设计（如 `annotations` 表）。

> **P1 预留（不在 P0 实现）：`annotations` 表**
>
> - `task_id TEXT`
> - `frame_index INTEGER`
> - `box_id INTEGER`
> - `screenshot_path TEXT`
> - `status TEXT`  -- good / fault / unknown
> - `created_at TEXT`

------

### ID 与时间格式规范（P0）

- `task_id` 规范：
  - 字符串，不含 `/` 等特殊字符；
  - 约定格式：`local_` + 6–8 位小写字母数字（例如 `local_f3a9c2`）；
  - 作为 `tasks.task_id` 主键，同时作为 `videos/{task_id}`、`detections/{task_id}.json` 路径的一部分。
- 时间字段：
  - 后端统一使用 ISO8601 字符串（可为本地时间，建议固定时区），例如：
    - `2025-11-16T10:00:00`；
  - `/history` 中返回的 `created_at` 即为该格式；
  - 前端可根据需要在 UI 中本地格式化显示。

------

## 🟦 P0 必须的 API 及行为约定

| 接口                    | 方法 | 说明                                                    |
| ----------------------- | ---- | ------------------------------------------------------- |
| `/upload`               | POST | 上传视频，返回 `task_id` 与元信息（统一 success/error） |
| `/detect/{task_id}`     | POST | 对指定任务视频进行模型推理，生成 3 类电杆类型 JSON      |
| `/detections/{task_id}` | GET  | 返回 `detections/{task_id}.json` 的内容                 |
| `/videos/{task_id}`     | GET  | 返回 `videos/{task_id}/video.mp4`，供前端 video.js 播放 |
| `/history`              | GET  | 列出所有任务的基础信息（task_id + created_at 等）       |

### `/detect/{task_id}` 语义（重要）

为避免歧义，P0 约定 `/detect/{task_id}` 行为如下：

- **同步调用**：
  - 前端调用该接口时，后端在同一个请求中完成检测（或复用结果）后再返回；
  - 不涉及消息队列或异步任务管理。
- **幂等 & 结果复用**：
  - 若 `./data/detections/{task_id}.json` **不存在**：
    - 后端读取 `./data/videos/{task_id}/video.mp4`；
    - 执行一轮完整检测，生成 JSON 文件；
    - 返回 `{ "success": true, "data": { "generated": true } }`。
  - 若 JSON **已存在**：
    - 不重复运行模型推理，直接视为“已检测完成”；
    - 返回 `{ "success": true, "data": { "generated": false, "already_exists": true } }`。
- 因此：
  - `/detect/{task_id}` 可以被前端**多次调用**；
  - 重复调用不会导致重复的长时间推理，只在第一次真正跑模型。

> P1 若需要“强制重新检测”，可以另设参数或新接口（例如 `/redetect/{task_id}`），P0 暂不实现。

### 视频与静态资源访问（P0）

- 后端提供只读接口 `/videos/{task_id}`，用于返回本地视频文件：
  - 检查 `./data/videos/{task_id}/video.mp4` 是否存在：
    - 存在 → 使用 `FileResponse` 返回，MIME 类型 `video/mp4`；
    - 不存在 → 返回 `{ "success": false, "error": "TASK_NOT_FOUND" }`，HTTP 状态码仍为 200，与其它接口保持一致。
- 前端 `VideoPlayer` 组件中，视频 src 统一设为：

```text
src = "/videos/" + task_id
```

- 该接口只读，不允许通过此路径写入或覆盖文件。
- 基础播放支持可直接使用 FastAPI 的 `FileResponse`，满足 HTTP Range（分段）请求的基本需求即可。

### 后端错误处理（P0）

- 上述所有接口外层都需要 `try/except`；
- 异常时返回 `{ "success": false, "error": "SOME_CODE" }`，错误码从前文 P0 最小错误码集合中选取；
- 正常时返回 `{ "success": true, "data": {...} }`。

> P0 不实现自动磁盘清理；若磁盘不足，可手动删除旧任务对应的视频与 JSON。
>  后续可在 P1 中增加“删除任务”接口与定期清理策略。

------

## 🟧 前端（React + Vite + video.js）

```bash
frontend/
  src/
    pages/
      UploadPage.jsx
      InspectPage.jsx
      HistoryPage.jsx
    components/
      VideoPlayer.jsx     // 封装 video.js 播放逻辑
      CanvasOverlay.jsx   // 根据 JSON 绘制检测框
      AnnotationPanel.jsx // 仅提供“标注”假按键 UI，不做真实保存
```

### P0 前端流程

1. **UploadPage**
   - 选择 MP4 → 调 `/upload` → 成功后跳转 `InspectPage(task_id)`；
   - 上传失败 → 显示提示信息（根据 `success` / `error` 字段）。
2. **InspectPage**
   - 从 URL 中读取 `task_id`；
   - **InspectPage 加载时自动调用 `/detect/{task_id}`，无需用户点击按钮；**
     - 若第一次调用：等待检测完成；
     - 若检测已存在：`/detect` 会快速返回 `already_exists: true`。
   - `VideoPlayer`：播放 `/videos/{task_id}` 对应视频；
   - 检测完成后调 `/detections/{task_id}`，准备好 detections JSON；
   - `CanvasOverlay`：根据 `currentTime` 在视频上画出电杆框；
   - `AnnotationPanel`：展示当前帧的 bbox 列表，每一项带“标注（演示）”按钮（仅 UI）。
3. **HistoryPage**
   - 调 `/history` 显示任务列表（task_id + 时间）；
   - 点击列表项“进入查看” → `navigate("/inspect/" + task_id)`；
   - 历史视频的实际播放仍在 InspectPage 中完成。

------

# 三、MVP UI 要求（P0）

------

### 视频区（左侧）

- 占屏幕左侧约 70% 宽度；
- 使用 video.js 播放视频，CanvasOverlay 绝对定位覆盖在视频上方，实现 bbox 可视化。

### 标注区（右侧）

- 占屏幕右侧约 30% 宽度；
- 内容结构示例（P0）：

```text
时间：00:12.3

检测目标：
 - 1 号框（iron_pole）       [标注（演示）]
 - 2 号框（concrete_pole）   [标注（演示）]

已标注记录（演示版）：
 - 未来版本将在此展示人工标注截图与好/坏状态
```

> 标注按钮点击后可以让该行变成“已点击（演示版）”的样式，给评委直观感受。

### 历史页（P0）

- 简单列表布局，例如：

```text
任务 ID：local_f3a9c2
时间：2025/11/16 10:00
[进入查看]

任务 ID：local_93bd21
时间：2025/11/16 10:20
[进入查看]
```

- 点击“进入查看”跳转到 `InspectPage(task_id)`，在 InspectPage 中播放视频和展示检测框。

> 历史页本身不直接播放视频（不嵌 video.js），只负责任务选择和导航。

------

# 四、技术选型（固定）

- **后端：**
  - Python 3.10+
  - FastAPI
  - ultralytics==8.x（YOLOv8 官方）
  - onnxruntime
  - opencv-python-headless
  - SQLite（自动建表）
- **前端：**
  - React + Vite
  - video.js
  - Tailwind CSS
  - Heroicons（图标库，可选）

------

# 五、P0 / P1 清单总

## ✅ P0（本 MVP 文档内容）

- 上传、检测、播放、canvas 绘框；
- `/detect/{task_id}` 行为清晰：同步 + 幂等 + 复用检测结果；
- `box_id` 明确定义为“帧内索引”，不做跨帧跟踪；
- 标注入口为假按键 UI，只作演示；
- `/history` 列表（任务选择）+ 跳转 InspectPage 播放历史视频；
- 统一错误格式 + 一组最小错误码集合（P0 常用场景）；
- 使用 YOLO 默认置信度阈值 / NMS 阈值，并在文档中明确说明；
- 明确了数据库基础设计（`tasks` 表）、`/videos/{task_id}` 视频访问、JSON 顶层结构和采样策略；
- 不做真实标注与统计信息调参等复杂逻辑。

## ⭐ P1（后续加分项）

- 真正实现基础人工标注：
  - `/annotate`、`/annotations/{task_id}`；
  - 截图、保存到 `attachments`、写 DB；
  - 在 InspectPage 展示真实“已标注列表”；
  - 通过 `(task_id, frame_index, box_id, screenshot_path, status)` 精确定位标注对象；
  - 可选：增加 `status` 字段进行“好/坏/异常”判断。
- 检测统计信息：
  - 上传/检测前输入线路名称；
  - `/detect` 完成后统计总 bbox 数写入 DB；
  - 历史页展示“线路名 + 检测数量 + 封面图”等。
- 错误码 & 提示优化：
  - 扩展错误码表；
  - 前端根据错误码做精细化提示。
- 历史页 UI 提升（仍然不直接播放视频，只做更好的展示与导航）：
  - 卡片式布局、封面图预览、搜索/筛选。
- Canvas 性能与同步优化：
  - 针对高分辨率视频的节流策略；
  - 全屏/窗口缩放时的闪烁优化；
  - 更顺滑的渲染体验。
- YOLO 阈值调参：
  - 根据实际数据试验不同 `conf` / `iou` 组合；
  - 在文档中记录最终采用的阈值配置。

------

这版就可以当“最重的 MVP 定稿”用了

后面如果你要，我还能帮你把这份文档拆成「接口实现 checklist」或「前后端 todo 表」，方便直接开干。