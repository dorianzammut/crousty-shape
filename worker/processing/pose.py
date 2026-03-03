import mediapipe as mp

mp_pose = mp.solutions.pose

# MediaPipe Pose landmark names (33 landmarks)
LANDMARK_NAMES = [lm.name for lm in mp_pose.PoseLandmark]


def extract_skeleton(frames: list, fps: float, skip: int) -> dict:
    """Run MediaPipe Pose on each frame and return skeleton data.

    Returns dict with list of frame entries, each containing timestamp and 33 landmarks.
    """
    skeleton_frames = []

    with mp_pose.Pose(
        static_image_mode=False,
        model_complexity=1,
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5,
    ) as pose:
        for i, frame in enumerate(frames):
            frame_rgb = frame[:, :, ::-1]  # BGR to RGB
            results = pose.process(frame_rgb)

            timestamp = round((i * skip) / fps, 3) if fps > 0 else 0

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
