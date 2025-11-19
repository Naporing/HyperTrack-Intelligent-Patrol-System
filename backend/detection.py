import json
import os
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Any
import cv2
import numpy as np
from ultralytics import YOLO
import onnxruntime as ort


class DetectionEngine:
    """
    智能高铁巡检系统检测引擎
    负责视频中的电杆检测和推理
    """

    def __init__(self, model_path: str = "./models/best.onnx"):
        """
        初始化检测引擎

        Args:
            model_path: ONNX模型文件路径
        """
        self.model_path = Path(model_path)
        self.model = None
        self.class_names = ["iron_pole", "concrete_pole", "iron_gantry_pole"]
        self.is_model_loaded = False

    def load_model(self) -> bool:
        """
        加载YOLO模型

        Returns:
            bool: 模型加载是否成功
        """
        try:
            if not self.model_path.exists():
                print(f"[ERROR] Model file not found: {self.model_path}")
                return False

            # 检查模型文件大小
            model_size = self.model_path.stat().st_size
            if model_size < 1024 * 1024:  # 小于1MB可能损坏
                print(f"[ERROR] Model file too small, possibly corrupted: {model_size} bytes")
                return False

            # 使用ultralytics加载ONNX模型
            print(f"[INFO] Loading model: {self.model_path} ({model_size / (1024*1024):.1f}MB)")
            self.model = YOLO(str(self.model_path))
            self.is_model_loaded = True

            # 验证模型类别
            if hasattr(self.model, 'names'):
                print(f"[INFO] Model classes: {self.model.names}")

            print(f"[INFO] Model loaded successfully: {self.model_path}")
            return True

        except Exception as e:
            print(f"[ERROR] Failed to load model: {str(e)}")
            self.is_model_loaded = False
            return False

    def _validate_detection(self, box_data, frame_width: int, frame_height: int) -> bool:
        """
        验证检测结果的有效性

        Args:
            box_data: 检测框数据
            frame_width: 帧宽度
            frame_height: 帧高度

        Returns:
            bool: 检测结果是否有效
        """
        try:
            x1, y1, x2, y2 = box_data.xyxy[0].cpu().numpy()

            # 检查坐标是否在合理范围内
            if (x1 < 0 or y1 < 0 or x2 > frame_width or y2 > frame_height):
                return False

            # 检查框的大小是否合理（最小10x10像素）
            if (x2 - x1) < 10 or (y2 - y1) < 10:
                return False

            # 检查宽高比是否合理（避免极端细长的框）
            aspect_ratio = (y2 - y1) / (x2 - x1 + 1e-6)
            if aspect_ratio > 10 or aspect_ratio < 0.1:
                return False

            return True

        except Exception:
            return False

    def process_video(self, video_path: str, output_path: str) -> bool:
        """
        处理视频，执行目标检测

        Args:
            video_path: 输入视频文件路径
            output_path: 输出JSON检测结果文件路径

        Returns:
            bool: 处理是否成功
        """
        try:
            # 检查模型是否已加载
            if not self.is_model_loaded:
                if not self.load_model():
                    return False

            video_path = Path(video_path)
            output_path = Path(output_path)

            if not video_path.exists():
                print(f"[ERROR] Video file not found: {video_path}")
                return False

            # 创建输出目录
            output_path.parent.mkdir(parents=True, exist_ok=True)

            # 使用OpenCV打开视频
            cap = cv2.VideoCapture(str(video_path))
            if not cap.isOpened():
                print(f"[ERROR] Cannot open video: {video_path}")
                return False

            # 获取视频信息
            fps = cap.get(cv2.CAP_PROP_FPS)
            frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

            print(f"[INFO] Processing video: {fps}fps, {frame_count}frames, {width}x{height}")

            # 存储检测结果
            detection_results = []
            box_id_counter = 1
            total_detections = 0
            failed_frames = 0

            # 性能监控
            import time
            start_time = time.time()

            # 逐帧处理
            frame_index = 0
            while True:
                ret, frame = cap.read()
                if not ret:
                    break

                try:
                    # 计算当前帧的时间戳
                    timestamp = frame_index / fps if fps > 0 else 0.0

                    # 执行推理（使用ultralytics默认参数，不传入conf/iou）
                    results = self.model(frame)

                    # 解析检测结果
                    boxes = []
                    valid_detections = 0
                    invalid_detections = 0

                    for result in results:
                        if result.boxes is not None:
                            for box in result.boxes:
                                # 验证检测结果的有效性
                                if not self._validate_detection(box, width, height):
                                    invalid_detections += 1
                                    continue

                                # 获取边界框坐标和置信度
                                x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                                conf = box.conf[0].cpu().numpy()
                                cls = int(box.cls[0].cpu().numpy())

                                # 只保留三类电杆，且置信度合理的
                                if 0 <= cls < len(self.class_names) and conf > 0.1:
                                    boxes.append({
                                        "id": box_id_counter,
                                        "xyxy": [int(x1), int(y1), int(x2), int(y2)],
                                        "label": self.class_names[cls]
                                    })
                                    box_id_counter += 1
                                    valid_detections += 1

                    # 添加到结果列表
                    detection_results.append({
                        "frame_index": frame_index,
                        "time": round(timestamp, 4),
                        "boxes": boxes
                    })

                    total_detections += valid_detections

                except Exception as frame_error:
                    print(f"[WARNING] Failed to process frame {frame_index}: {str(frame_error)}")
                    failed_frames += 1
                    # 添加空结果保持帧索引连续性
                    detection_results.append({
                        "frame_index": frame_index,
                        "time": round(frame_index / fps if fps > 0 else 0.0, 4),
                        "boxes": []
                    })

                frame_index += 1

                # 进度提示和性能监控
                if frame_index % 50 == 0:  # 每50帧报告一次进度
                    elapsed_time = time.time() - start_time
                    fps_processing = frame_index / elapsed_time if elapsed_time > 0 else 0
                    progress_percent = (frame_index / frame_count) * 100 if frame_count > 0 else 0

                    print(f"[INFO] Progress: {frame_index}/{frame_count} ({progress_percent:.1f}%) "
                          f"| Processing FPS: {fps_processing:.1f} | "
                          f"Detections: {total_detections} | Failed: {failed_frames}")

            # 释放视频捕获对象
            cap.release()

            # 计算最终性能统计
            total_processing_time = time.time() - start_time
            video_duration = frame_count / fps if fps > 0 else 0
            processing_speed = video_duration / total_processing_time if total_processing_time > 0 else 0

            # 保存检测结果到JSON文件
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(detection_results, f, ensure_ascii=False, indent=2)

            # 验证输出文件
            output_file_size = Path(output_path).stat().st_size
            if output_file_size == 0:
                print(f"[ERROR] Output file is empty: {output_path}")
                return False

            print(f"[SUCCESS] Detection completed and saved to: {output_path}")
            print(f"[STATS] Video duration: {video_duration:.1f}s, Frames: {len(detection_results)}")
            print(f"[STATS] Total detections: {total_detections}, Failed frames: {failed_frames}")
            print(f"[STATS] Processing time: {total_processing_time:.1f}s, Speed: {processing_speed:.2f}x real-time")
            print(f"[STATS] Output file size: {output_file_size / (1024*1024):.1f}MB")

            # 性能检查
            if processing_speed < 0.5:
                print(f"[WARNING] Processing speed ({processing_speed:.2f}x) below required 0.5x real-time")

            return True

        except Exception as e:
            print(f"[ERROR] Video processing failed: {str(e)}")
            return False

    def get_video_metadata(self, video_path: str) -> Optional[Dict[str, Any]]:
        """
        提取视频元信息，协助/upload接口实现

        Args:
            video_path: 视频文件路径

        Returns:
            Dict: 包含视频元信息的字典，失败时返回None
        """
        try:
            video_path = Path(video_path)

            if not video_path.exists():
                print(f"[ERROR] Video file not found: {video_path}")
                return None

            # 使用OpenCV打开视频
            cap = cv2.VideoCapture(str(video_path))
            if not cap.isOpened():
                print(f"[ERROR] Cannot open video: {video_path}")
                return None

            # 获取视频信息
            fps = cap.get(cv2.CAP_PROP_FPS)
            frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

            # 计算时长
            duration = frame_count / fps if fps > 0 else 0

            # 释放资源
            cap.release()

            metadata = {
                "fps": round(fps, 2),
                "frame_count": frame_count,
                "duration": round(duration, 2),
                "width": width,
                "height": height
            }

            print(f"[INFO] Video metadata extracted: {metadata}")
            return metadata

        except Exception as e:
            print(f"[ERROR] Failed to extract video metadata: {str(e)}")
            return None


# 创建全局检测引擎实例（单例模式）
detection_engine = DetectionEngine()

# 便捷函数：获取视频元信息
def get_video_metadata(video_path: str) -> Optional[Dict[str, Any]]:
    """
    便捷函数：提取视频元信息
    用于协助开发者A实现/upload接口

    Args:
        video_path: 视频文件路径

    Returns:
        Dict: 视频元信息字典，失败时返回None
    """
    return detection_engine.get_video_metadata(video_path)


# SYNCED: 与 main.py /detect 接口联调通过 2025-11-18