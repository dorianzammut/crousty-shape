import numpy as np

from processing.features import ANGLE_DEFINITIONS

ANGLE_NAMES = [name for name, *_ in ANGLE_DEFINITIONS]


def normalize_reps(reps_data: dict, features: dict, n_points: int = 100) -> list[dict]:
    """Normalize each valid rep to n_points via linear interpolation.

    Returns a list of normalized reps, each containing angles resampled
    to exactly n_points values.
    """
    valid_reps = reps_data["valid_reps"]
    frames = features["frames"]
    normalized = []

    for rep in valid_reps:
        start = rep["start_frame"]
        end = rep["end_frame"]
        rep_frames = frames[start:end + 1]
        n_raw = len(rep_frames)

        if n_raw < 2:
            continue

        angles_dict = {}
        for name in ANGLE_NAMES:
            raw_values = []
            for f in rep_frames:
                if f["angles"] is not None and f["angles"].get(name) is not None:
                    raw_values.append(f["angles"][name])
                else:
                    raw_values.append(np.nan)

            arr = np.array(raw_values)

            # Interpolate NaN gaps
            nans = np.isnan(arr)
            if np.all(nans):
                angles_dict[name] = [0.0] * n_points
                continue
            if np.any(nans):
                indices = np.arange(len(arr))
                arr[nans] = np.interp(indices[nans], indices[~nans], arr[~nans])

            # Resample to n_points
            x_old = np.linspace(0, 1, n_raw)
            x_new = np.linspace(0, 1, n_points)
            resampled = np.interp(x_new, x_old, arr)
            angles_dict[name] = [round(float(v), 1) for v in resampled]

        normalized.append({
            "rep_index": rep["rep_index"],
            "angles": angles_dict,
        })

    return normalized
