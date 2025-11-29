"""
坐标转换工具函数模块
用于处理视频分辨率到Canvas显示尺寸的坐标转换
"""

from typing import Tuple, List, Dict, Any
import math


class CoordinateTransformer:
    """
    坐标转换器 - 处理视频坐标系到Canvas坐标系的转换
    """

    def __init__(self, video_width: int, video_height: int,
                 canvas_width: int, canvas_height: int):
        """
        初始化坐标转换器

        Args:
            video_width: 视频原始宽度
            video_height: 视频原始高度
            canvas_width: Canvas显示宽度
            canvas_height: Canvas显示高度
        """
        self.video_width = video_width
        self.video_height = video_height
        self.canvas_width = canvas_width
        self.canvas_height = canvas_height

        # 计算缩放比例
        self.scale_x = canvas_width / video_width
        self.scale_y = canvas_height / video_height

        # 考虑视频可能被缩放以适应Canvas（保持宽高比）
        self.scale = min(self.scale_x, self.scale_y)

        # 计算实际绘制区域（考虑黑边）
        self.scaled_width = video_width * self.scale
        self.scaled_height = video_height * self.scale
        self.offset_x = (canvas_width - self.scaled_width) / 2
        self.offset_y = (canvas_height - self.scaled_height) / 2

    def transform_bbox(self, xyxy: List[int]) -> List[int]:
        """
        将边界框从视频坐标系转换到Canvas坐标系

        Args:
            xyxy: 视频坐标系中的边界框 [x1, y1, x2, y2]

        Returns:
            Canvas坐标系中的边界框 [x1, y1, x2, y2]
        """
        if len(xyxy) != 4:
            raise ValueError(f"边界框格式错误，需要4个坐标值，当前：{xyxy}")

        x1, y1, x2, y2 = xyxy

        # 应用缩放
        canvas_x1 = x1 * self.scale + self.offset_x
        canvas_y1 = y1 * self.scale + self.offset_y
        canvas_x2 = x2 * self.scale + self.offset_x
        canvas_y2 = y2 * self.scale + self.offset_y

        return [int(canvas_x1), int(canvas_y1), int(canvas_x2), int(canvas_y2)]

    def transform_point(self, x: int, y: int) -> Tuple[int, int]:
        """
        将点从视频坐标系转换到Canvas坐标系

        Args:
            x: 视频x坐标
            y: 视频y坐标

        Returns:
            Canvas坐标 (x, y)
        """
        canvas_x = x * self.scale + self.offset_x
        canvas_y = y * self.scale + self.offset_y

        return int(canvas_x), int(canvas_y)

    def get_video_info(self) -> Dict[str, Any]:
        """
        获取转换器的信息

        Returns:
            包含转换参数的字典
        """
        return {
            "video_size": (self.video_width, self.video_height),
            "canvas_size": (self.canvas_width, self.canvas_height),
            "scale": self.scale,
            "offset": (self.offset_x, self.offset_y),
            "scaled_size": (self.scaled_width, self.scaled_height)
        }


def create_transformer(video_metadata: Dict[str, Any],
                      canvas_element_info: Dict[str, Any]) -> CoordinateTransformer:
    """
    根据视频元数据和Canvas元素信息创建坐标转换器

    Args:
        video_metadata: 视频元信息，包含width和height
        canvas_element_info: Canvas元素信息，包含clientWidth和clientHeight

    Returns:
        坐标转换器实例
    """
    video_width = video_metadata.get('width', 1920)
    video_height = video_metadata.get('height', 1080)
    canvas_width = canvas_element_info.get('clientWidth', 800)
    canvas_height = canvas_element_info.get('clientHeight', 600)

    return CoordinateTransformer(video_width, video_height, canvas_width, canvas_height)


def validate_bbox_coordinates(bbox: List[int], max_width: int, max_height: int) -> bool:
    """
    验证边界框坐标是否有效

    Args:
        bbox: 边界框坐标 [x1, y1, x2, y2]
        max_width: 最大宽度
        max_height: 最大高度

    Returns:
        坐标是否有效
    """
    if len(bbox) != 4:
        return False

    x1, y1, x2, y2 = bbox

    # 检查坐标范围
    if x1 < 0 or y1 < 0 or x2 > max_width or y2 > max_height:
        return False

    # 检查边界框有效性
    if x1 >= x2 or y1 >= y2:
        return False

    return True


def calculate_bbox_area(bbox: List[int]) -> int:
    """
    计算边界框面积

    Args:
        bbox: 边界框坐标 [x1, y1, x2, y2]

    Returns:
        边界框面积
    """
    if len(bbox) != 4:
        return 0

    x1, y1, x2, y2 = bbox
    width = x2 - x1
    height = y2 - y1

    return width * height


def filter_small_bboxes(bboxes: List[Dict], min_area: int = 100) -> List[Dict]:
    """
    过滤掉面积过小的边界框

    Args:
        bboxes: 边界框列表，每个包含xyxy坐标
        min_area: 最小面积阈值

    Returns:
        过滤后的边界框列表
    """
    filtered_bboxes = []

    for bbox_data in bboxes:
        bbox = bbox_data.get('xyxy', [])
        area = calculate_bbox_area(bbox)

        if area >= min_area:
            filtered_bboxes.append(bbox_data)

    return filtered_bboxes


# 使用示例和测试函数
def test_coordinate_transformation():
    """
    测试坐标转换功能
    """
    # 创建转换器：1920x1080的视频，显示在800x600的Canvas上
    transformer = CoordinateTransformer(1920, 1080, 800, 600)

    # 测试边界框转换
    video_bbox = [100, 100, 300, 400]
    canvas_bbox = transformer.transform_bbox(video_bbox)

    print(f"视频坐标: {video_bbox}")
    print(f"Canvas坐标: {canvas_bbox}")
    print(f"转换器信息: {transformer.get_video_info()}")

    # 验证转换结果
    assert len(canvas_bbox) == 4, "转换后的边界框应该有4个坐标值"
    assert canvas_bbox[0] < canvas_bbox[2], "转换后的x1应该小于x2"
    assert canvas_bbox[1] < canvas_bbox[3], "转换后的y1应该小于y2"

    print("✅ 坐标转换测试通过")


if __name__ == "__main__":
    test_coordinate_transformation()