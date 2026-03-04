/**
 * Real-time rep detection state machine + per-frame scoring.
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
  frameScores: number[];
  repCount: number;
  lastRepScore: number;
  repProgress: number;
  valleyIndex: number;
  framesSinceLastTransition: number;
  /** Total frames accumulated across the current full cycle (descend + ascend). */
  cycleFrameCount: number;
  /** True after the first descending phase is complete (reached the bottom).
   *  A rep is only counted after a full cycle: descend → ascend. */
  completedDescending: boolean;
  /** Per-angle weights derived from reference amplitude. Higher amplitude = higher weight. */
  angleWeights: Record<string, number>;
}

export interface FrameResult {
  repCompleted: boolean;
  repScore: number;             // 0-100
  repProgress: number;          // 0.0-1.0
  templateIndex: number;        // 0-99
  angleConformity: Record<string, 'good' | 'close' | 'bad'>;
}

// ── Constants ────────────────────────────────────────────────────────────────

/**
 * EMA smoothing factor — 0.3 gives moderate smoothing.
 * With alpha=0.3 and ~3-8° jitter, single-frame spikes are dampened to ~1-2.5°.
 * Real movements (sustained direction) pass through with ~30% lag.
 */
const EMA_ALPHA = 0.3;

/**
 * Degrees of reversal on the SMOOTHED signal to confirm a direction change.
 * With alpha=0.3, jitter rarely exceeds 3° on the smoothed signal,
 * so 10° is safe from noise while remaining reachable during real reps.
 */
const REVERSAL_THRESHOLD = 10;

/**
 * Minimum amplitude as a fraction of the template's reference amplitude
 * to count a movement as a valid rep.
 */
const AMPLITUDE_FRACTION = 0.25;

/** Minimum frames in a single phase before allowing a transition (debounce). */
const MIN_FRAMES_IN_PHASE = 5;

/** Minimum total frames for a full rep cycle (descend + ascend).
 *  At ~20-30 fps, a real rep takes at least 0.5s = 12+ frames. */
const MIN_CYCLE_FRAMES = 12;

// ── Factory ──────────────────────────────────────────────────────────────────

export function createRepDetector(template: ExerciseTemplate): RepDetectorState {
  const primary = template.primary_angle;
  const ref = template.angles[primary].reference;

  // Find the valley (minimum) index in the reference curve
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
  const amplitudeThreshold = (refMax - refMin) * AMPLITUDE_FRACTION;

  // Compute per-angle weights based on reference amplitude.
  // Angles that move more during the exercise get more weight in scoring.
  const angleWeights = computeAngleWeights(template);

  return {
    phase: 'idle',
    primaryAngle: primary,
    lastValue: 0,
    smoothedValue: 0,
    currentMin: Infinity,
    currentMax: -Infinity,
    amplitudeThreshold,
    frameScores: [],
    repCount: 0,
    lastRepScore: 0,
    repProgress: 0,
    valleyIndex,
    framesSinceLastTransition: 0,
    cycleFrameCount: 0,
    completedDescending: false,
    angleWeights,
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

  // ── State machine ──────────────────────────────────────────────────────
  let repCompleted = false;
  let repScore = 0;

  switch (state.phase) {
    case 'idle': {
      // Wait for clear movement to pick initial direction
      if (state.lastValue !== 0) {
        const diff = val - state.lastValue;
        if (diff < -2) {
          state.phase = 'descending';
          state.currentMin = val;
          state.currentMax = state.lastValue;
          state.frameScores = [];
          state.framesSinceLastTransition = 0;
          state.cycleFrameCount = 0;
        } else if (diff > 2) {
          state.phase = 'ascending';
          state.currentMax = val;
          state.currentMin = state.lastValue;
          state.frameScores = [];
          state.framesSinceLastTransition = 0;
          state.cycleFrameCount = 0;
        }
      }
      state.lastValue = val;
      break;
    }

    case 'descending': {
      if (val < state.currentMin) state.currentMin = val;
      // Reversal: switch to ascending (only after debounce)
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
      // Reversal: switch to descending → rep counted only after a full cycle
      if (state.framesSinceLastTransition >= MIN_FRAMES_IN_PHASE &&
          val < state.currentMax - REVERSAL_THRESHOLD) {
        const amplitude = state.currentMax - state.currentMin;
        // Only count if: full descend+ascend cycle, enough amplitude, enough duration
        if (state.completedDescending &&
            amplitude >= state.amplitudeThreshold &&
            state.cycleFrameCount >= MIN_CYCLE_FRAMES) {
          repCompleted = true;
          state.repCount++;
          repScore = state.frameScores.length > 0
            ? Math.round(state.frameScores.reduce((a, b) => a + b, 0) / state.frameScores.length)
            : 0;
          state.lastRepScore = repScore;
        }
        // Reset for next rep
        state.phase = 'descending';
        state.currentMin = val;
        state.currentMax = val;
        state.frameScores = [];
        state.completedDescending = false;
        state.framesSinceLastTransition = 0;
        state.cycleFrameCount = 0;
      }
      state.lastValue = val;
      break;
    }
  }

  // ── Template index mapping ─────────────────────────────────────────────
  const templateIndex = mapToTemplateIndex(state, val, template);

  // ── Per-frame scoring (weighted by angle amplitude) ────────────────────
  const angleConformity: Record<string, 'good' | 'close' | 'bad'> = {};
  let weightedSum = 0;
  let weightSum = 0;

  for (const angleName of Object.keys(template.angles)) {
    const angleVal = angles[angleName];
    if (angleVal === undefined) continue;

    const def = template.angles[angleName];
    const low = def.tolerance_low[templateIndex];
    const high = def.tolerance_high[templateIndex];
    const bandwidth = (high - low) * 0.5;

    let status: 'good' | 'close' | 'bad';
    let frameScore: number;

    if (angleVal >= low && angleVal <= high) {
      status = 'good';
      frameScore = 100;
    } else if (angleVal >= low - bandwidth && angleVal <= high + bandwidth) {
      status = 'close';
      frameScore = 60;
    } else {
      status = 'bad';
      frameScore = 0;
    }

    angleConformity[angleName] = status;
    const w = state.angleWeights[angleName] ?? 0;
    weightedSum += frameScore * w;
    weightSum += w;
  }

  const frameAvg = weightSum > 0 ? weightedSum / weightSum : 0;
  if (state.phase !== 'idle') {
    state.frameScores.push(frameAvg);
  }

  // ── Rep progress (0-1) — based on template index position ──────────────
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

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Compute normalized weights for each angle based on the amplitude
 * (max - min) of its reference curve. Angles that move more during
 * the exercise contribute more to the score.
 *
 * Example for biceps curl:
 *   right_elbow (amplitude ~74°) → weight ~0.42
 *   left_elbow  (amplitude ~3°)  → weight ~0.02
 */
function computeAngleWeights(template: ExerciseTemplate): Record<string, number> {
  const amplitudes: Record<string, number> = {};
  let totalAmplitude = 0;

  for (const [name, def] of Object.entries(template.angles)) {
    const ref = def.reference;
    const max = Math.max(...ref);
    const min = Math.min(...ref);
    const amp = max - min;
    amplitudes[name] = amp;
    totalAmplitude += amp;
  }

  const weights: Record<string, number> = {};
  if (totalAmplitude === 0) {
    // Fallback: equal weights
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

/**
 * Map the current primary-angle value to the closest index in the template
 * reference curve (0 to n_points-1).
 *
 * Previous implementation split the curve at `valleyIndex`, but templates
 * built valley-to-valley can have the valley at index 3 out of 100,
 * making the "descending" half too small. Instead, we now search the entire
 * reference curve for the closest match — simple and robust.
 */
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
