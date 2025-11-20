import cv2
from pathlib import Path


def get_video_metadata(video_path: str) -> dict:
    """
    Extract video metadata using OpenCV

    Args:
        video_path: Path to the video file

    Returns:
        Dictionary containing video metadata:
        {
            "fps": float,
            "frame_count": int,
            "duration": float,
            "width": int,
            "height": int
        }
    """
    cap = cv2.VideoCapture(video_path)

    if not cap.isOpened():
        raise ValueError(f"Cannot open video file: {video_path}")

    try:
        fps = cap.get(cv2.CAP_PROP_FPS)
        frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

        duration = frame_count / fps if fps > 0 else 0.0

        return {
            "fps": float(fps),
            "frame_count": frame_count,
            "duration": float(duration),
            "width": width,
            "height": height
        }
    finally:
        cap.release()


