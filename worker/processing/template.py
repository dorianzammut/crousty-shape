import numpy as np

from processing.features import ANGLE_DEFINITIONS

ANGLE_NAMES = [name for name, *_ in ANGLE_DEFINITIONS]


def build_template(normalized_reps: list[dict], n_points: int = 100) -> dict:
    """Build a reference template from normalized reps.

    For each angle, computes the median curve and tolerance bands
    (P25 / P75) across all reps.
    """
    if not normalized_reps:
        return {
            "n_points": n_points,
            "n_reps_used": 0,
            "primary_angle": None,
            "angles": {},
        }

    angles_template = {}

    for name in ANGLE_NAMES:
        # Stack all reps for this angle: matrix (n_reps x n_points)
        matrix = []
        for rep in normalized_reps:
            if name in rep["angles"]:
                matrix.append(rep["angles"][name])

        if not matrix:
            continue

        arr = np.array(matrix)  # shape (n_reps, n_points)

        reference = np.median(arr, axis=0)
        tol_low = np.percentile(arr, 25, axis=0)
        tol_high = np.percentile(arr, 75, axis=0)

        angles_template[name] = {
            "reference": [round(float(v), 1) for v in reference],
            "tolerance_low": [round(float(v), 1) for v in tol_low],
            "tolerance_high": [round(float(v), 1) for v in tol_high],
        }

    return {
        "n_points": n_points,
        "n_reps_used": len(normalized_reps),
        "primary_angle": None,  # will be set by caller
        "angles": angles_template,
    }
