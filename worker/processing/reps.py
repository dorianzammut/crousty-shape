import numpy as np
from scipy.signal import savgol_filter, find_peaks

from processing.features import ANGLE_DEFINITIONS

ANGLE_NAMES = [name for name, *_ in ANGLE_DEFINITIONS]


def detect_reps(features: dict) -> dict:
    """Auto-detect repetitions from feature frames.

    Selects the most cyclic angle (largest amplitude), smooths it,
    and finds valleys to segment reps.
    """
    frames = features["frames"]
    n_frames = len(frames)

    # Build per-angle signals, replacing None with NaN
    signals = {}
    for name in ANGLE_NAMES:
        values = []
        for f in frames:
            if f["angles"] is not None and f["angles"].get(name) is not None:
                values.append(f["angles"][name])
            else:
                values.append(np.nan)
        signals[name] = np.array(values)

    # Select primary angle = largest amplitude (ignoring NaN)
    best_angle = None
    best_amplitude = -1.0
    for name, sig in signals.items():
        valid = sig[~np.isnan(sig)]
        if len(valid) < 2:
            continue
        amplitude = float(np.max(valid) - np.min(valid))
        if amplitude > best_amplitude:
            best_amplitude = amplitude
            best_angle = name

    if best_angle is None:
        return {"reps": [], "primary_angle": None, "total_reps_detected": 0}

    raw = signals[best_angle]

    # Interpolate NaN gaps for smoothing
    nans = np.isnan(raw)
    if np.all(nans):
        return {"reps": [], "primary_angle": best_angle, "total_reps_detected": 0}
    if np.any(nans):
        indices = np.arange(len(raw))
        raw[nans] = np.interp(indices[nans], indices[~nans], raw[~nans])

    # Smooth with Savitzky-Golay (window must be odd and <= n_frames)
    win = min(31, n_frames if n_frames % 2 == 1 else n_frames - 1)
    if win >= 5:
        smoothed = savgol_filter(raw, window_length=win, polyorder=3)
    else:
        smoothed = raw

    # Detect valleys (negative peaks = rep boundaries)
    neg = -smoothed
    min_distance = max(5, n_frames // 20)
    valley_indices, _ = find_peaks(neg, distance=min_distance)

    # Each pair of consecutive valleys = 1 rep
    reps = []
    for i in range(len(valley_indices) - 1):
        start = int(valley_indices[i])
        end = int(valley_indices[i + 1])
        reps.append({
            "rep_index": i,
            "start_frame": start,
            "end_frame": end,
            "start_timestamp": frames[start]["timestamp"],
            "end_timestamp": frames[end]["timestamp"],
            "frame_count": end - start,
        })

    return {
        "reps": reps,
        "primary_angle": best_angle,
        "total_reps_detected": len(reps),
    }


def filter_reps(reps_data: dict, features: dict) -> dict:
    """Filter out invalid reps based on duration, amplitude, and landmark stability.

    Returns enriched dict with valid_reps list and metadata.
    """
    reps = reps_data["reps"]
    primary_angle = reps_data["primary_angle"]
    frames = features["frames"]

    if len(reps) == 0:
        return {
            "reps": [],
            "valid_reps": [],
            "primary_angle": primary_angle,
            "total_reps_detected": 0,
            "valid_reps_count": 0,
        }

    durations = [r["frame_count"] for r in reps]
    median_duration = float(np.median(durations))

    # Compute per-rep amplitude on primary angle
    amplitudes = []
    for r in reps:
        values = []
        for fi in range(r["start_frame"], r["end_frame"] + 1):
            if fi < len(frames):
                f = frames[fi]
                if f["angles"] is not None and f["angles"].get(primary_angle) is not None:
                    values.append(f["angles"][primary_angle])
        if values:
            amplitudes.append(max(values) - min(values))
        else:
            amplitudes.append(0.0)

    median_amplitude = float(np.median(amplitudes)) if amplitudes else 0.0

    valid = []
    for i, r in enumerate(reps):
        # Duration filter: within 50% of median
        if abs(r["frame_count"] - median_duration) > 0.5 * median_duration:
            continue

        # Amplitude filter: >= 50% of median amplitude
        if amplitudes[i] < 0.5 * median_amplitude:
            continue

        # Landmark stability: count frames with null landmarks (angles=None)
        null_count = 0
        total = 0
        for fi in range(r["start_frame"], r["end_frame"] + 1):
            if fi < len(frames):
                total += 1
                if frames[fi]["angles"] is None:
                    null_count += 1
        if total > 0 and null_count / total > 0.3:
            continue

        valid.append(r)

    return {
        "reps": reps,
        "valid_reps": valid,
        "primary_angle": primary_angle,
        "total_reps_detected": len(reps),
        "valid_reps_count": len(valid),
    }
