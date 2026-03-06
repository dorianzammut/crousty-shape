/**
 * Real-time rep detection state machine + trajectory-based scoring.
 *
 * Rep score = similarity between the user's actual trajectory (resampled
 * to 100 points) and the template's reference curve.  This is the same
 * normalise-then-compare approach used in gesture recognition.
 */

// ── Types ────────────────────────────────────────────────────────────────────

export interface ExerciseTemplate {
  n_points: number;
  primary_angle: string;
  angles: Record<string, {
    reference: number[];
    tolerance_low: number[];
    tolerance_high: number[];
  }>;
}

export interface RepDetectorState {
  phase: 'idle' | 'descending' | 'ascending';
  primaryAngle: string;
  lastValue: number;
  smoothedValue: number;
  currentMin: number;
  currentMax: number;
  amplitudeThreshold: number;
  repCount: number;
  lastRepScore: number;
  repProgress: number;
  valleyIndex: number;
  framesSinceLastTransition: number;
  cycleFrameCount: number;
  completedDescending: boolean;
  angleWeights: Record<string, number>;
  referenceAmplitude: number;
  /** Angle snapshots collected during the current rep cycle. */
  cycleAngles: Record<string, number>[];
}

export interface FrameResult {
  repCompleted: boolean;
  repScore: number;             // 0-100
  repProgress: number;          // 0.0-1.0
  templateIndex: number;        // 0-99
  angleConformity: Record<string, 'good' | 'close' | 'bad'>;
}

// ── Constants ────────────────────────────────────────────────────────────────

const EMA_ALPHA = 0.3;
const REVERSAL_THRESHOLD = 10;
const AMPLITUDE_FRACTION = 0.25;
const MIN_FRAMES_IN_PHASE = 5;
const MIN_CYCLE_FRAMES = 12;

/** Maximum half-bandwidth (degrees) used for score computation.
 *  40° accounts for body-type and camera-angle differences. */
const MAX_SCORE_HALF_BAND = 40;

// ── Factory ──────────────────────────────────────────────────────────────────

export function createRepDetector(template: ExerciseTemplate): RepDetectorState {
  const primary = template.primary_angle;
  const ref = template.angles[primary].reference;

  let valleyIndex = 0;
  let minVal = Infinity;
  for (let i = 0; i < ref.length; i++) {
    if (ref[i] < minVal) {
      minVal = ref[i];
      valleyIndex = i;
    }
  }

  const refMax = Math.max(...ref);
  const refMin = Math.min(...ref);
  const referenceAmplitude = refMax - refMin;
  const amplitudeThreshold = referenceAmplitude * AMPLITUDE_FRACTION;
  const angleWeights = computeAngleWeights(template);

  return {
    phase: 'idle',
    primaryAngle: primary,
    lastValue: 0,
    smoothedValue: 0,
    currentMin: Infinity,
    currentMax: -Infinity,
    amplitudeThreshold,
    repCount: 0,
    lastRepScore: 0,
    repProgress: 0,
    valleyIndex,
    framesSinceLastTransition: 0,
    cycleFrameCount: 0,
    completedDescending: false,
    referenceAmplitude,
    angleWeights,
    cycleAngles: [],
  };
}

// ── Frame processing ─────────────────────────────────────────────────────────

export function processFrame(
  state: RepDetectorState,
  angles: Record<string, number>,
  template: ExerciseTemplate,
): FrameResult {
  const primaryVal = angles[state.primaryAngle];
  if (primaryVal === undefined) {
    return { repCompleted: false, repScore: 0, repProgress: state.repProgress, templateIndex: 0, angleConformity: {} };
  }

  // EMA smoothing
  if (state.phase === 'idle' && state.smoothedValue === 0) {
    state.smoothedValue = primaryVal;
  } else {
    state.smoothedValue = EMA_ALPHA * primaryVal + (1 - EMA_ALPHA) * state.smoothedValue;
  }
  const val = state.smoothedValue;

  state.framesSinceLastTransition++;
  state.cycleFrameCount++;

  // Collect angle snapshot for trajectory comparison
  if (state.phase !== 'idle') {
    state.cycleAngles.push({ ...angles });
  }

  // ── State machine ──────────────────────────────────────────────────────
  let repCompleted = false;
  let repScore = 0;

  switch (state.phase) {
    case 'idle': {
      if (state.lastValue !== 0) {
        const diff = val - state.lastValue;
        if (diff < -2) {
          state.phase = 'descending';
          state.currentMin = val;
          state.currentMax = state.lastValue;
          state.framesSinceLastTransition = 0;
          state.cycleFrameCount = 0;
          state.cycleAngles = [];
        } else if (diff > 2) {
          state.phase = 'ascending';
          state.currentMax = val;
          state.currentMin = state.lastValue;
          state.framesSinceLastTransition = 0;
          state.cycleFrameCount = 0;
          state.cycleAngles = [];
        }
      }
      state.lastValue = val;
      break;
    }

    case 'descending': {
      if (val < state.currentMin) state.currentMin = val;
      if (state.framesSinceLastTransition >= MIN_FRAMES_IN_PHASE &&
          val > state.currentMin + REVERSAL_THRESHOLD) {
        state.phase = 'ascending';
        state.currentMax = val;
        state.completedDescending = true;
        state.framesSinceLastTransition = 0;
      }
      state.lastValue = val;
      break;
    }

    case 'ascending': {
      if (val > state.currentMax) state.currentMax = val;
      if (state.framesSinceLastTransition >= MIN_FRAMES_IN_PHASE &&
          val < state.currentMax - REVERSAL_THRESHOLD) {
        const amplitude = state.currentMax - state.currentMin;
        if (state.completedDescending &&
            amplitude >= state.amplitudeThreshold &&
            state.cycleFrameCount >= MIN_CYCLE_FRAMES) {
          repCompleted = true;
          state.repCount++;
          // Score = trajectory similarity (resample + compare)
          repScore = computeRepSimilarity(state.cycleAngles, template, state.angleWeights, state.primaryAngle);
          state.lastRepScore = repScore;
        }
        // Reset for next rep
        state.phase = 'descending';
        state.currentMin = val;
        state.currentMax = val;
        state.completedDescending = false;
        state.framesSinceLastTransition = 0;
        state.cycleFrameCount = 0;
        state.cycleAngles = [];
      }
      state.lastValue = val;
      break;
    }
  }

  // ── Template index mapping (for visual feedback only) ───────────────────
  const templateIndex = mapToTemplateIndex(state, val, template);

  // ── Per-frame conformity (visual feedback — skeleton colors) ────────────
  const angleConformity: Record<string, 'good' | 'close' | 'bad'> = {};

  for (const angleName of Object.keys(template.angles)) {
    const angleVal = angles[angleName];
    if (angleVal === undefined) continue;

    const def = template.angles[angleName];
    const low = def.tolerance_low[templateIndex];
    const high = def.tolerance_high[templateIndex];
    const rawHalfBand = (high - low) * 0.5;

    if (angleVal >= low && angleVal <= high) {
      angleConformity[angleName] = 'good';
    } else if (angleVal >= low - rawHalfBand && angleVal <= high + rawHalfBand) {
      angleConformity[angleName] = 'close';
    } else {
      angleConformity[angleName] = 'bad';
    }
  }

  // ── Rep progress ───────────────────────────────────────────────────────
  const nPoints = template.angles[state.primaryAngle].reference.length || 100;
  state.repProgress = templateIndex / (nPoints - 1);

  return {
    repCompleted,
    repScore: repCompleted ? repScore : 0,
    repProgress: state.repProgress,
    templateIndex,
    angleConformity,
  };
}

// ── Trajectory scoring ──────────────────────────────────────────────────────

/**
 * Compare the user's rep trajectory against the template reference.
 *
 * 1. Resample each angle's collected values to n_points (100) via linear interpolation
 * 2. At each of the 100 points, score the distance from reference (capped halfBand)
 * 3. Weighted average across all angles
 *
 * This is the same normalise-then-compare approach the worker uses to BUILD
 * the template — now applied in reverse for real-time scoring.
 */
function computeRepSimilarity(
  cycleAngles: Record<string, number>[],
  template: ExerciseTemplate,
  angleWeights: Record<string, number>,
  primaryAngle: string,
): number {
  const nPoints = template.n_points || 100;
  if (cycleAngles.length < 2) return 0;

  // ── Phase alignment ─────────────────────────────────────────────────────
  // The state machine collects peak→valley→peak (descending then ascending).
  // The template is valley→peak→valley (built valley-to-valley by the worker).
  // Rotate the collected trajectory so the valley is at index 0 to match.
  const primaryValues = cycleAngles.map(a => a[primaryAngle]);
  let valleyFrame = 0;
  let minPrimary = Infinity;
  for (let i = 0; i < primaryValues.length; i++) {
    if (primaryValues[i] < minPrimary) {
      minPrimary = primaryValues[i];
      valleyFrame = i;
    }
  }
  // Rotate: [valley→peak (ascending), peak→valley (descending)]
  const aligned = [...cycleAngles.slice(valleyFrame), ...cycleAngles.slice(0, valleyFrame)];

  // ── Score each angle ────────────────────────────────────────────────────
  let totalWeightedScore = 0;
  let totalWeight = 0;

  for (const [angleName, def] of Object.entries(template.angles)) {
    const w = angleWeights[angleName] ?? 0;
    if (w === 0) continue;

    const values: number[] = [];
    for (const snapshot of aligned) {
      if (snapshot[angleName] !== undefined) {
        values.push(snapshot[angleName]);
      }
    }
    if (values.length < 2) continue;

    // Resample to nPoints (same as worker normalize)
    const resampled = resample(values, nPoints);

    // Compare each resampled point against the template
    let angleScore = 0;
    for (let i = 0; i < nPoints; i++) {
      const val = resampled[i];
      const refVal = def.reference[i];
      const low = def.tolerance_low[i];
      const high = def.tolerance_high[i];
      const hb = Math.min((high - low) * 0.5, MAX_SCORE_HALF_BAND);
      const dist = Math.abs(val - refVal);

      if (dist <= hb) {
        // Inside band: 100 at center → 60 at edge
        angleScore += hb > 0 ? 100 - 40 * (dist / hb) : 100;
      } else if (dist <= hb * 2) {
        // Transition: 60 → 0
        angleScore += 60 - 60 * ((dist - hb) / Math.max(hb, 5));
      }
      // else 0
    }
    angleScore /= nPoints;

    totalWeightedScore += angleScore * w;
    totalWeight += w;
  }

  return totalWeight > 0 ? Math.round(totalWeightedScore / totalWeight) : 0;
}

/**
 * Resample an array of values to a target length using linear interpolation.
 * Same approach as worker/processing/normalize.py.
 */
function resample(values: number[], targetLength: number): number[] {
  const result: number[] = [];
  const srcLen = values.length;
  for (let i = 0; i < targetLength; i++) {
    const srcPos = (i / (targetLength - 1)) * (srcLen - 1);
    const lo = Math.floor(srcPos);
    const hi = Math.min(lo + 1, srcLen - 1);
    const frac = srcPos - lo;
    result.push(values[lo] * (1 - frac) + values[hi] * frac);
  }
  return result;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function computeAngleWeights(template: ExerciseTemplate): Record<string, number> {
  const amplitudes: Record<string, number> = {};
  let totalAmplitude = 0;

  for (const [name, def] of Object.entries(template.angles)) {
    const ref = def.reference;
    const amp = Math.max(...ref) - Math.min(...ref);
    amplitudes[name] = amp;
    totalAmplitude += amp;
  }

  const weights: Record<string, number> = {};
  if (totalAmplitude === 0) {
    const n = Object.keys(template.angles).length;
    for (const name of Object.keys(template.angles)) {
      weights[name] = 1 / n;
    }
  } else {
    for (const [name, amp] of Object.entries(amplitudes)) {
      weights[name] = amp / totalAmplitude;
    }
  }
  return weights;
}

function mapToTemplateIndex(
  _state: RepDetectorState,
  currentValue: number,
  template: ExerciseTemplate,
): number {
  const ref = template.angles[_state.primaryAngle].reference;
  let bestIdx = 0;
  let bestDist = Infinity;
  for (let i = 0; i < ref.length; i++) {
    const dist = Math.abs(ref[i] - currentValue);
    if (dist < bestDist) {
      bestDist = dist;
      bestIdx = i;
    }
  }
  return bestIdx;
}

/** Map a rep score (0-100) to a quality label. */
export function scoreToQuality(score: number): 'perfect' | 'good' | 'bad' {
  if (score >= 80) return 'perfect';
  if (score >= 50) return 'good';
  return 'bad';
}
