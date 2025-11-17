# HyperTrack - 智能高铁巡检系统 MVP

基于 AI 的智能高铁电杆巡检系统，使用 YOLOv8 进行自动化检测和标注。

## 项目概述

本项目是一个智能高铁巡检系统的 MVP 版本，专门用于检测和识别三类电杆：
- `iron_pole` - 铁质电杆
- `concrete_pole` - 混凝土电杆
- `iron_gantry_pole` - 铁架电杆

### 核心功能

- **视频上传**: 支持 MP4 格式视频文件上传
- **AI 检测**: 基于 YOLOv8 模型的电杆自动识别
- **可视化**: 实时显示检测框和标注信息
- **历史记录**: 查看和管理历史巡检任务

## 技术栈

### 后端
- **FastAPI** 0.115.0 - Web 框架
- **Ultralytics** 8.3.0 - YOLOv8 模型
- **OpenCV** 4.10.0.84 - 图像处理
- **SQLite** - 数据存储

### 前端
- **React** 18.3.1 - 用户界面
- **Video.js** 8.19.1 - 视频播放
- **Tailwind CSS** 3.4.14 - 样式框架
- **Axios** 1.7.7 - HTTP 客户端

## 项目结构

```
patrol-system/
├── backend/           # 后端服务
│   ├── main.py       # FastAPI 主入口
│   ├── models/       # AI 模型文件
│   └── data/         # 数据存储
├── frontend/         # 前端应用
│   └── src/          # 源代码
├── docs/             # 项目文档
└── railway.db        # SQLite 数据库
```

## 快速开始

### 环境要求
- Python 3.8+
- Node.js 16+
- npm 8+

### 安装步骤

#### 1. 克隆项目
```bash
git clone git@github.com:Naporing/HyperTrack-Intelligent-Patrol-System.git
cd HyperTrack-Intelligent-Patrol-System
```

#### 2. 后端设置
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
```

#### 3. 前端设置
```bash
cd ../frontend
npm install
```

#### 4. 启动服务

**启动后端服务**:
```bash
cd backend
venv\Scripts\activate
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

**启动前端服务**:
```bash
cd frontend
npm run dev
```

### 访问地址
- 前端应用: http://localhost:5173
- 后端 API: http://localhost:8000
- API 文档: http://localhost:8000/docs

## 使用说明

1. **上传视频**: 在上传页面选择 MP4 格式的巡检视频
2. **自动检测**: 系统自动进行电杆检测分析
3. **查看结果**: 在巡检页面查看检测框和标注信息
4. **历史管理**: 在历史页面管理之前的巡检任务

## 开发规范

本项目严格遵循 [CLAUDE.md](./CLAUDE.md) 中定义的开发规范和约束条件。

## 版本信息

- **当前版本**: P0-20251117
- **状态**: MVP 开发阶段

## 贡献指南

请参考项目文档中的开发规范，确保所有代码符合预定义的标准和约束。

## 许可证

本项目仅用于演示和学习目的。
