#!/usr/bin/env python3
"""
检测引擎测试脚本
用于验证 DetectionEngine 的各项功能是否正常工作
"""

import sys
import os
import json
import numpy as np
from pathlib import Path

# 添加当前目录到 Python 路径
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    import cv2
    from detection import detection_engine
    print("成功 导入成功：检测引擎和依赖库")
except ImportError as e:
    print(f"失败 导入失败：{e}")
    sys.exit(1)

def test_model_loading():
    """测试模型加载功能"""
    print("\n=== 测试1：模型加载功能 ===")

    try:
        # 测试模型加载
        print("正在加载模型...")
        success = detection_engine.load_model()

        if success:
            print("成功 模型加载成功")
            print(f"   模型状态：{'已加载' if detection_engine.is_model_loaded else '未加载'}")
            print(f"   模型路径：{detection_engine.model_path}")
            print(f"   支持类别：{detection_engine.class_names}")

            # 检查模型属性
            if hasattr(detection_engine.model, 'names'):
                print(f"   模型类别映射：{detection_engine.model.names}")
            else:
                print("   警告 模型没有 names 属性")

        else:
            print("失败 模型加载失败")
            return False

    except Exception as e:
        print(f"失败 模型加载异常：{e}")
        return False

    return True

def test_single_frame_inference():
    """测试单帧推理功能"""
    print("\n=== 测试2：单帧推理功能 ===")

    if not detection_engine.is_model_loaded:
        print("失败 模型未加载，跳过推理测试")
        return False

    try:
        # 创建测试帧
        print("创建测试帧...")
        test_frame = np.zeros((480, 640, 3), dtype=np.uint8)

        # 添加一些模拟电杆的矩形
        cv2.rectangle(test_frame, (100, 50), (150, 400), (0, 255, 0), -1)
        cv2.rectangle(test_frame, (300, 100), (350, 420), (255, 0, 0), -1)

        print("执行单帧推理...")

        # 执行推理
        results = detection_engine.model(test_frame)

        # 解析结果
        boxes = []
        for result in results:
            if result.boxes is not None:
                for box in result.boxes:
                    x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                    conf = box.conf[0].cpu().numpy()
                    cls = int(box.cls[0].cpu().numpy())

                    if 0 <= cls < len(detection_engine.class_names):
                        boxes.append({
                            "xyxy": [int(x1), int(y1), int(x2), int(y2)],
                            "label": detection_engine.class_names[cls],
                            "conf": float(conf)
                        })

        print(f"成功 单帧推理完成，检测到 {len(boxes)} 个目标")
        for i, box in enumerate(boxes):
            print(f"   目标{i+1}: {box['label']} 置信度={box['conf']:.3f} 坐标={box['xyxy']}")

        return True

    except Exception as e:
        print(f"失败 单帧推理失败：{e}")
        return False

def test_detection_engine_methods():
    """测试检测引擎的各种方法"""
    print("\n=== 测试3：检测引擎方法 ===")

    try:
        # 测试验证方法
        print("测试 _validate_detection 方法...")

        # 创建一个模拟的box对象
        class MockBox:
            def __init__(self, xyxy, conf, cls):
                self.xyxy = xyxy
                self.conf = conf
                self.cls = cls

        # 测试有效检测框
        valid_box = MockBox(
            xyxy=[np.array([100, 100, 200, 200])],
            conf=np.array([0.8]),
            cls=np.array([0])
        )

        # 测试边界检查
        result = detection_engine._validate_detection(valid_box, 640, 480)
        print(f"有效检测结果验证：{result}")

        # 测试无效检测框（超出边界）
        invalid_box = MockBox(
            xyxy=[np.array([700, 500, 800, 600])],  # 超出 640x480
            conf=np.array([0.8]),
            cls=np.array([0])
        )

        result = detection_engine._validate_detection(invalid_box, 640, 480)
        print(f"无效检测结果验证：{result}")

        print("成功 检测引擎方法测试完成")
        return True

    except Exception as e:
        print(f"失败 检测引擎方法测试异常：{e}")
        return False

def test_error_handling():
    """测试错误处理"""
    print("\n=== 测试4：错误处理机制 ===")

    # 测试无效模型路径
    print("测试 无效模型路径...")
    try:
        invalid_engine = type(detection_engine)("invalid_path.onnx")
        success = invalid_engine.load_model()
        print(f"无效路径结果：{success} (应该是False)")
    except Exception as e:
        print(f"无效路径异常：{e}")

    print("成功 错误处理测试完成")
    return True

def main():
    """主测试函数"""
    print("开始检测引擎测试...")
    print("=" * 50)

    # 创建测试目录
    Path("test_data").mkdir(exist_ok=True)

    test_results = []

    # 执行各项测试
    print("执行测试 suite...")
    test_results.append(("模型加载", test_model_loading()))
    test_results.append(("单帧推理", test_single_frame_inference()))
    test_results.append(("检测引擎方法", test_detection_engine_methods()))
    test_results.append(("错误处理", test_error_handling()))

    # 汇总结果
    print("\n" + "=" * 50)
    print("测试结果汇总：")

    passed = 0
    total = len(test_results)

    for test_name, result in test_results:
        status = "成功 PASS" if result else "失败 FAIL"
        print(f"   {test_name:15} : {status}")
        if result:
            passed += 1

    print(f"\n总体结果：{passed}/{total} 测试通过")

    if passed == total:
        print("所有测试通过！检测引擎工作正常。")
        return 0
    else:
        print("部分测试失败，需要进一步检查。")
        return 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)