/**
 * Port of worker/processing/features.py — computes 9 articular angles
 * from MediaPipe 33-landmark pose data.
 */

// MediaPipe landmark indices
const LM = {
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
} as const;

interface Point3D {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

// Same 9 angle definitions as the worker
const ANGLE_DEFINITIONS: [string, number, number, number][] = [
  ['left_knee',          LM.LEFT_HIP,       LM.LEFT_KNEE,      LM.LEFT_ANKLE],
  ['right_knee',         LM.RIGHT_HIP,      LM.RIGHT_KNEE,     LM.RIGHT_ANKLE],
  ['left_hip',           LM.LEFT_SHOULDER,   LM.LEFT_HIP,       LM.LEFT_KNEE],
  ['right_hip',          LM.RIGHT_SHOULDER,  LM.RIGHT_HIP,      LM.RIGHT_KNEE],
  ['left_elbow',         LM.LEFT_SHOULDER,   LM.LEFT_ELBOW,     LM.LEFT_WRIST],
  ['right_elbow',        LM.RIGHT_SHOULDER,  LM.RIGHT_ELBOW,    LM.RIGHT_WRIST],
  ['left_shoulder',      LM.LEFT_ELBOW,      LM.LEFT_SHOULDER,  LM.LEFT_HIP],
  ['right_shoulder',     LM.RIGHT_ELBOW,     LM.RIGHT_SHOULDER, LM.RIGHT_HIP],
  ['trunk_inclination',  LM.LEFT_SHOULDER,   LM.LEFT_HIP,       LM.LEFT_KNEE],
];

/** Compute the angle at point b formed by a-b-c, in degrees (3D). */
export function angle3Points(a: Point3D, b: Point3D, c: Point3D): number {
  const vax = a.x - b.x, vay = a.y - b.y, vaz = a.z - b.z;
  const vcx = c.x - b.x, vcy = c.y - b.y, vcz = c.z - b.z;

  const dot = vax * vcx + vay * vcy + vaz * vcz;
  const magA = Math.sqrt(vax * vax + vay * vay + vaz * vaz);
  const magC = Math.sqrt(vcx * vcx + vcy * vcy + vcz * vcz);

  const cosine = Math.max(-1, Math.min(1, dot / (magA * magC + 1e-8)));
  return Math.round(Math.acos(cosine) * (180 / Math.PI) * 10) / 10;
}

/**
 * Compute all 9 angles from a 33-landmark array (MediaPipe format).
 * Returns null if any required landmark has visibility < 0.5.
 */
export function computeAngles(landmarks: Point3D[]): Record<string, number> | null {
  if (!landmarks || landmarks.length < 33) return null;

  const angles: Record<string, number> = {};

  for (const [name, aIdx, bIdx, cIdx] of ANGLE_DEFINITIONS) {
    const a = landmarks[aIdx];
    const b = landmarks[bIdx];
    const c = landmarks[cIdx];

    if (!a || !b || !c) return null;
    if ((a.visibility ?? 0) < 0.5 || (b.visibility ?? 0) < 0.5 || (c.visibility ?? 0) < 0.5) {
      return null;
    }

    angles[name] = angle3Points(a, b, c);
  }

  return angles;
}

/** List of angle names in the same order as ANGLE_DEFINITIONS. */
export const ANGLE_NAMES = ANGLE_DEFINITIONS.map(d => d[0]);

/**
 * Mapping: angle name → [landmark index A, vertex B, landmark index C].
 * Useful for coloring skeleton segments per angle.
 */
export const ANGLE_LANDMARKS: Record<string, [number, number, number]> = {};
for (const [name, a, b, c] of ANGLE_DEFINITIONS) {
  ANGLE_LANDMARKS[name] = [a, b, c];
}
