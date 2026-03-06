import mediapipe as mp

mp_pose = mp.solutions.pose

# MediaPipe Pose landmark names (33 landmarks)
LANDMARK_NAMES = [lm.name for lm in mp_pose.PoseLandmark]


def extract_skeleton(frame_iter, fps: float, skip: int) -> dict:
    """Run MediaPipe Pose on each frame and return skeleton data.

    Accepts a generator/iterable of (frame_idx, frame) tuples so that
    only one frame needs to be in memory at a time.

    Returns dict with list of frame entries, each containing timestamp and 33 landmarks.
    """
    skeleton_frames = []

    with mp_pose.Pose(
        static_image_mode=False,
        model_complexity=1,
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5,
    ) as pose:
        for frame_idx, frame in frame_iter:
            frame_rgb = frame[:, :, ::-1]  # BGR to RGB
            results = pose.process(frame_rgb)

            timestamp = round(frame_idx / fps, 3) if fps > 0 else 0

            if results.pose_landmarks:
                landmarks = []
                for lm_idx, lm in enumerate(results.pose_landmarks.landmark):
                    landmarks.append({
                        "name": LANDMARK_NAMES[lm_idx],
                        "x": round(lm.x, 5),
                        "y": round(lm.y, 5),
                        "z": round(lm.z, 5),
                        "visibility": round(lm.visibility, 3),
                    })
                skeleton_frames.append({
                    "timestamp": timestamp,
                    "landmarks": landmarks,
                })
            else:
                skeleton_frames.append({
                    "timestamp": timestamp,
                    "landmarks": None,
                })

    return {"frames": skeleton_frames}
