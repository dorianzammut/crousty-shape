import numpy as np


def _angle_3points(a: dict, b: dict, c: dict) -> float:
    """Compute the angle at point b formed by points a-b-c, in degrees."""
    va = np.array([a["x"] - b["x"], a["y"] - b["y"], a["z"] - b["z"]])
    vc = np.array([c["x"] - b["x"], c["y"] - b["y"], c["z"] - b["z"]])

    cosine = np.dot(va, vc) / (np.linalg.norm(va) * np.linalg.norm(vc) + 1e-8)
    cosine = np.clip(cosine, -1.0, 1.0)
    return round(float(np.degrees(np.arccos(cosine))), 1)


def _get_landmark(landmarks: list, name: str) -> dict | None:
    """Find a landmark by name."""
    for lm in landmarks:
        if lm["name"] == name:
            return lm
    return None


# Angle definitions: (name, point_a, point_b_vertex, point_c)
ANGLE_DEFINITIONS = [
    ("left_knee", "LEFT_HIP", "LEFT_KNEE", "LEFT_ANKLE"),
    ("right_knee", "RIGHT_HIP", "RIGHT_KNEE", "RIGHT_ANKLE"),
    ("left_hip", "LEFT_SHOULDER", "LEFT_HIP", "LEFT_KNEE"),
    ("right_hip", "RIGHT_SHOULDER", "RIGHT_HIP", "RIGHT_KNEE"),
    ("left_elbow", "LEFT_SHOULDER", "LEFT_ELBOW", "LEFT_WRIST"),
    ("right_elbow", "RIGHT_SHOULDER", "RIGHT_ELBOW", "RIGHT_WRIST"),
    ("left_shoulder", "LEFT_ELBOW", "LEFT_SHOULDER", "LEFT_HIP"),
    ("right_shoulder", "RIGHT_ELBOW", "RIGHT_SHOULDER", "RIGHT_HIP"),
    ("trunk_inclination", "LEFT_SHOULDER", "LEFT_HIP", "LEFT_KNEE"),
]


def compute_features(skeleton: dict) -> dict:
    """Compute articular angles from skeleton data.

    Returns dict with per-frame angle values.
    """
    feature_frames = []

    for frame in skeleton["frames"]:
        if frame["landmarks"] is None:
            feature_frames.append({
                "timestamp": frame["timestamp"],
                "angles": None,
            })
            continue

        landmarks = frame["landmarks"]
        angles = {}

        for angle_name, a_name, b_name, c_name in ANGLE_DEFINITIONS:
            a = _get_landmark(landmarks, a_name)
            b = _get_landmark(landmarks, b_name)
            c = _get_landmark(landmarks, c_name)

            if a and b and c:
                angles[angle_name] = _angle_3points(a, b, c)
            else:
                angles[angle_name] = None

        feature_frames.append({
            "timestamp": frame["timestamp"],
            "angles": angles,
        })

    return {"frames": feature_frames}
