# DAY1_SYNCED
# backend/main.py - 融合版本
"""
智能高铁巡检系统 - FastAPI 主应用（融合版本）

基于main.py和main(2).py的融合版本：
- 保留main.py的简洁架构和完整功能
- 保留main(2).py的优秀错误处理和响应格式
- 确保与detection.py的正确集成
"""

import json
import os
import random
import secrets
import string
import sqlite3
import traceback
import uuid
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Any

import cv2
import uvicorn
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel

# 导入视频处理工具（A的职责范围）
from video_utils import get_video_metadata


def generate_task_id() -> str:
    """
    Generate unique task ID in format: local_ + 6 characters

    Returns:
        Task ID string like "local_f3a9c2"
    """
    random_part = ''.join(random.choices(string.ascii_lowercase + string.digits, k=6))
    return f"local_{random_part}"


def insert_task_metadata(task_id: str, video_path: str, fps: float,
                       frame_count: int, duration: float, width: int, height: int):
    """
    Insert task metadata into database

    # DB_INSERT_SYNC
    """
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    created_at = datetime.now().isoformat()

    cursor.execute(
        "INSERT INTO tasks VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        (task_id, video_path, fps, frame_count, duration, width, height, None, created_at)
    )
    conn.commit()
    conn.close()


# FastAPI 应用实例
app = FastAPI(
    title="智能高铁巡检系统 API",
    description="AI驱动的电杆检测与标注系统",
    version="P0-20251117"
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
    "DETECT_FAILED": "检测失败",
    "DETECTIONS_NOT_FOUND": "检测结果不存在",
    "HISTORY_LOAD_FAILED": "历史记录加载失败"
}

# 响应模型
class SuccessResponse(BaseModel):
    success: bool = True
    data: Dict[str, Any]

class ErrorResponse(BaseModel):
    success: bool = False
    error: str

def ResponseWrapper(success: bool, data=None, error=None):
    """统一响应格式包装器"""
    if success:
        return {"success": True, "data": data}
    else:
        return {"success": False, "error": error}

@app.post("/upload", response_model=SuccessResponse)
async def upload_video(file: UploadFile = File(...)):
    """
    上传视频文件

    严格遵循API文档规范：
    - 接受 multipart/form-data 格式上传
    - 字段名必须为 'file'
    - 仅支持 video/mp4 格式，最大 100MB
    - 生成唯一 task_id，提取视频元信息
    - 保存文件到 ./data/videos/{task_id}/video.mp4
    """
    try:
        # 验证文件类型
        if file.content_type != "video/mp4":
            return ResponseWrapper(False, error="UPLOAD_INVALID_FILE")

        # 验证文件大小 (100MB)
        file_size = 0
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

        # 获取视频信息
        cap = cv2.VideoCapture(str(video_path))
        if not cap.isOpened():
            return ResponseWrapper(False, error="UPLOAD_SAVE_FAILED")

        fps = cap.get(cv2.CAP_PROP_FPS)
        frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        duration = frame_count / fps if fps > 0 else 0

        cap.release()

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
        traceback.print_exc()
        return ResponseWrapper(False, error="INTERNAL_ERROR")

# SYNCED_UPLOAD: 与前端联调通过 2025-11-19

@app.post("/detect/{task_id}", response_model=SuccessResponse)
async def run_detection(task_id: str):
    """
    执行目标检测 - 接口骨架，等待B实现检测逻辑

    A的职责范围：
    - 检查任务是否存在
    - 幂等性操作（避免重复推理）
    - 接口规范和错误处理

    B的职责范围：
    - YOLOv8模型推理
    - 检测算法实现
    - JSON结果生成
    """
    try:
        # 检查任务是否存在 - A的职责
        video_path = Path(f"./data/videos/{task_id}/video.mp4")
        if not video_path.exists():
            return ResponseWrapper(False, error="TASK_NOT_FOUND")

        # 检查检测结果是否已存在 - A的职责（幂等性）
        detection_path = Path(f"./data/detections/{task_id}.json")
        if detection_path.exists():
            return ResponseWrapper(True, data={
                "generated": False,
                "already_exists": True,
                "task_id": task_id
            })

        # TODO: B需要在这里实现YOLOv8检测逻辑
        # 等待B实现：
        # 1. 调用YOLOv8模型进行推理
        # 2. 生成标准格式的JSON结果文件
        # 3. 返回检测成功状态

        return ResponseWrapper(False, error="DETECT_NOT_IMPLEMENTED")

    except Exception as e:
        print(f"[ERROR] /detect/{task_id}: {str(e)}")
        return ResponseWrapper(False, error="INTERNAL_ERROR")

@app.get("/detections/{task_id}", response_model=SuccessResponse)
async def get_detections(task_id: str):
    """
    获取检测结果

    严格遵循API文档规范：
    - 返回标准格式的检测结果JSON数据
    - 支持按帧索引和时间查询
    - 包含所有检测框的详细信息
    """
    try:
        detection_path = Path(f"./data/detections/{task_id}.json")
        if not detection_path.exists():
            return ResponseWrapper(False, error="DETECTIONS_NOT_FOUND")

        with open(detection_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        return ResponseWrapper(True, data=data)

    except Exception as e:
        print(f"[ERROR] /detections/{task_id}: {str(e)}")
        return ResponseWrapper(False, error="INTERNAL_ERROR")

@app.get("/videos/{task_id}")
async def get_video(task_id: str):
    """
    流式返回视频文件

    严格遵循API文档规范：
    - 返回 FileResponse 视频流，Content-Type: video/mp4
    - 自动支持 HTTP Range 请求
    """
    try:
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

@app.get("/history", response_model=SuccessResponse)
async def get_history():
    """
    获取任务历史记录

    严格遵循API文档规范：
    - 返回任务列表，按 created_at 降序排列
    - 支持 task_id 和 created_at 字段
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
        "message": "智能高铁巡检系统 API",
        "version": "P0-20251117",
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

    print("[INFO] 智能高铁巡检系统 API 启动成功")

# SYNCED: 与 UploadPage 联调通过 2025-11-18

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)