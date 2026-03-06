import os
import tempfile
import urllib.request
import cv2


def download_video(url: str) -> str:
    """Download video from URL to a temporary file."""
    suffix = ".mp4"
    fd, path = tempfile.mkstemp(suffix=suffix)
    os.close(fd)
    urllib.request.urlretrieve(url, path)
    return path


def get_video_metadata(path: str, skip: int = 2) -> dict:
    """Read video metadata without loading frames into memory."""
    cap = cv2.VideoCapture(path)
    if not cap.isOpened():
        raise ValueError(f"Cannot open video: {path}")

    fps = cap.get(cv2.CAP_PROP_FPS)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    duration = total_frames / fps if fps > 0 else 0
    cap.release()

    return {
        "fps": fps,
        "duration": round(duration, 2),
        "resolution": [width, height],
        "total_frames": total_frames,
        "skip": skip,
    }


def iter_frames(path: str, skip: int = 2):
    """Yield video frames one at a time, skipping every `skip` frames.

    Only one frame is in memory at any time (~6 MB instead of ~3 GB).
    """
    cap = cv2.VideoCapture(path)
    if not cap.isOpened():
        raise ValueError(f"Cannot open video: {path}")

    frame_idx = 0
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        if frame_idx % skip == 0:
            yield frame_idx, frame
        frame_idx += 1

    cap.release()
