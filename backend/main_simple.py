"""
简化版后端测试 - 跳过YOLO检测功能
用于验证前后端基本连接和API功能
"""

import json
import sqlite3
import secrets
from datetime import datetime
from pathlib import Path

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# 简化版FastAPI应用
app = FastAPI(
    title="智能高铁巡检系统 API (简化版)",
    description="AI驱动的电杆检测与标注系统 - 测试版",
    version="P0-20251117-Test"
)

# 添加CORS中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 数据库配置
DB_PATH = Path("./railway.db")

def get_db():
    """获取数据库连接"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

# 错误码定义
ERROR_CODES = {
    "INTERNAL_ERROR": "未知异常",
    "UPLOAD_INVALID_FILE": "文件格式不支持或过大",
    "UPLOAD_SAVE_FAILED": "保存失败",
    "TASK_NOT_FOUND": "任务不存在",
    "DETECT_FAILED": "检测功能暂时禁用",
    "DETECTIONS_NOT_FOUND": "检测结果不存在",
    "HISTORY_LOAD_FAILED": "历史记录加载失败"
}

def ResponseWrapper(success: bool, data=None, error=None):
    """统一响应格式包装器"""
    if success:
        return {"success": True, "data": data}
    else:
        return {"success": False, "error": error}

@app.post("/upload")
async def upload_video(file: UploadFile = File(...)):
    """
    上传视频文件 - 简化版
    """
    try:
        # 验证文件类型
        if file.content_type != "video/mp4":
            return ResponseWrapper(False, error="UPLOAD_INVALID_FILE")

        # 验证文件大小 (100MB)
        content = await file.read()
        file_size = len(content)

        if file_size > 100 * 1024 * 1024:  # 100MB
            return ResponseWrapper(False, error="UPLOAD_INVALID_FILE")

        # 生成任务ID
        task_id = f"local_{secrets.token_hex(3)}"

        # 创建任务目录
        task_dir = Path(f"./data/videos/{task_id}")
        task_dir.mkdir(parents=True, exist_ok=True)

        # 保存视频文件
        video_path = task_dir / "video.mp4"
        with open(video_path, "wb") as f:
            f.write(content)

        # 模拟视频信息
        fps = 30.0
        frame_count = 900
        duration = 30.0
        width = 1920
        height = 1080

        # 保存任务记录到数据库
        conn = get_db()
        cursor = conn.cursor()
        created_at = datetime.now().isoformat()

        cursor.execute(
            "INSERT INTO tasks VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (task_id, str(video_path), fps, frame_count, duration, width, height, None, created_at)
        )
        conn.commit()
        conn.close()

        return ResponseWrapper(True, data={
            "task_id": task_id,
            "fps": fps,
            "frame_count": frame_count,
            "duration": duration,
            "width": width,
            "height": height
        })

    except Exception as e:
        print(f"[ERROR] /upload: {str(e)}")
        return ResponseWrapper(False, error="INTERNAL_ERROR")

@app.post("/detect/{task_id}")
async def run_detection(task_id: str):
    """
    执行目标检测 - 简化版（返回模拟数据）
    """
    try:
        # 检查任务是否存在
        video_path = Path(f"./data/videos/{task_id}/video.mp4")
        if not video_path.exists():
            return ResponseWrapper(False, error="TASK_NOT_FOUND")

        # 简化版：直接返回成功，跳过实际检测
        return ResponseWrapper(True, data={
            "generated": True,
            "task_id": task_id
        })

    except Exception as e:
        print(f"[ERROR] /detect/{task_id}: {str(e)}")
        return ResponseWrapper(False, error="INTERNAL_ERROR")

@app.get("/detections/{task_id}")
async def get_detections(task_id: str):
    """
    获取检测结果 - 简化版（返回模拟数据）
    """
    try:
        # 检查任务是否存在
        video_path = Path(f"./data/videos/{task_id}/video.mp4")
        if not video_path.exists():
            return ResponseWrapper(False, error="TASK_NOT_FOUND")

        # 返回模拟的检测结果
        mock_detections = [
            {
                "frame_index": 0,
                "time": 0.0,
                "boxes": [
                    {
                        "id": 1,
                        "xyxy": [100, 200, 300, 600],
                        "label": "iron_pole"
                    },
                    {
                        "id": 2,
                        "xyxy": [400, 220, 500, 610],
                        "label": "concrete_pole"
                    }
                ]
            },
            {
                "frame_index": 30,
                "time": 1.0,
                "boxes": [
                    {
                        "id": 3,
                        "xyxy": [650, 210, 820, 630],
                        "label": "iron_gantry_pole"
                    }
                ]
            }
        ]

        return ResponseWrapper(True, data=mock_detections)

    except Exception as e:
        print(f"[ERROR] /detections/{task_id}: {str(e)}")
        return ResponseWrapper(False, error="INTERNAL_ERROR")

@app.get("/videos/{task_id}")
async def get_video(task_id: str):
    """
    流式返回视频文件
    """
    try:
        from fastapi.responses import FileResponse

        video_path = Path(f"./data/videos/{task_id}/video.mp4")
        if not video_path.exists():
            return ResponseWrapper(False, error="TASK_NOT_FOUND")

        return FileResponse(
            video_path,
            media_type="video/mp4",
            headers={"Accept-Ranges": "bytes"}
        )

    except Exception as e:
        print(f"[ERROR] /videos/{task_id}: {str(e)}")
        return ResponseWrapper(False, error="INTERNAL_ERROR")

@app.get("/history")
async def get_history():
    """
    获取任务历史记录
    """
    try:
        conn = get_db()
        cursor = conn.cursor()

        cursor.execute(
            "SELECT task_id, created_at FROM tasks ORDER BY created_at DESC"
        )
        rows = cursor.fetchall()
        conn.close()

        history = [
            {
                "task_id": row["task_id"],
                "created_at": row["created_at"]
            }
            for row in rows
        ]

        return ResponseWrapper(True, data=history)

    except Exception as e:
        print(f"[ERROR] /history: {str(e)}")
        return ResponseWrapper(False, error="HISTORY_LOAD_FAILED")

@app.get("/")
async def root():
    """
    API 根路径，返回基本信息
    """
    return {
        "message": "智能高铁巡检系统 API (简化版)",
        "version": "P0-20251117-Test",
        "status": "running"
    }

# 应用启动时确保必要目录存在
@app.on_event("startup")
async def startup_event():
    """应用启动时创建必要的目录和初始化数据库"""
    # 创建目录结构
    directories = [
        "./data/videos",
        "./data/detections",
        "./models"
    ]

    for directory in directories:
        Path(directory).mkdir(parents=True, exist_ok=True)

    # 初始化数据库表
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        # 创建tasks表
        cursor.execute("""
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
            )
        """)

        conn.commit()
        conn.close()
        print("[SUCCESS] 数据库初始化完成")

    except Exception as e:
        print(f"[ERROR] 数据库初始化失败: {e}")

    print("[INFO] 智能高铁巡检系统 API (简化版) 启动成功")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main_simple:app", host="0.0.0.0", port=8000, reload=True)