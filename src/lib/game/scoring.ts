import { GAME_CONFIG, type Axis, type ScoredSample, type TiltSample } from "./constants";

export function getTiltValue(sample: TiltSample, axis: Axis): number {
  return axis === "pitch" ? sample.pitch : sample.roll;
}

export function isInTolerance(current: number, target: number): boolean {
  return Math.abs(current - target) <= GAME_CONFIG.tolerance;
}

export function isPortraitValid(pitch: number): boolean {
  // beta near 90° is portrait upright; allow ±30° from vertical
  return Math.abs(pitch - 90) <= GAME_CONFIG.portraitMaxTilt;
}

/** Weighted mean absolute deviation — lower is better */
export function computeWeightedMAD(
  samples: TiltSample[],
  target: number,
  axis: Axis,
): number {
  if (samples.length === 0) return 999;

  let weightedSum = 0;
  let totalWeight = 0;

  for (const sample of samples) {
    const value = getTiltValue(sample, axis);
    const deviation = Math.abs(value - target);
    const inTol = isInTolerance(value, target);
    const weight = inTol ? 1 : GAME_CONFIG.driftWeight;
    weightedSum += deviation * weight;
    totalWeight += weight;
  }

  const mad = totalWeight > 0 ? weightedSum / totalWeight : 999;
  return Math.round(mad * 100) / 100;
}

export function scoreSamples(
  samples: TiltSample[],
  target: number,
  axis: Axis,
): ScoredSample[] {
  return samples.map((sample) => {
    const value = getTiltValue(sample, axis);
    const deviation = Math.abs(value - target);
    const inTolerance = isInTolerance(value, target);
    return {
      ...sample,
      deviation,
      inTolerance,
      weight: inTolerance ? 1 : GAME_CONFIG.driftWeight,
    };
  });
}

/** Downsample readings to target Hz */
export function downsample(
  samples: TiltSample[],
  targetHz: number = GAME_CONFIG.sampleRateHz,
): TiltSample[] {
  if (samples.length <= 1) return samples;
  const intervalMs = 1000 / targetHz;
  const result: TiltSample[] = [];
  let lastTs = samples[0]!.timestamp - intervalMs;

  for (const sample of samples) {
    if (sample.timestamp - lastTs >= intervalMs) {
      result.push(sample);
      lastTs = sample.timestamp;
    }
  }
  return result;
}

/** Compute RMS of acceleration magnitude */
export function computeAccelerationRms(
  readings: { x: number; y: number; z: number }[],
): number {
  if (readings.length === 0) return 0;
  const sumSq = readings.reduce(
    (acc, r) => acc + r.x * r.x + r.y * r.y + r.z * r.z,
    0,
  );
  return Math.sqrt(sumSq / readings.length);
}

/** Tremor standard deviation over rolling window (degrees) */
export function computeTremorSd(
  samples: TiltSample[],
  axis: Axis,
  windowMs: number = 100,
): number {
  if (samples.length < 2) return 0;
  const latest = samples[samples.length - 1]!.timestamp;
  const window = samples.filter((s) => s.timestamp >= latest - windowMs);
  if (window.length < 2) return 0;

  const values = window.map((s) => getTiltValue(s, axis));
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance =
    values.reduce((acc, v) => acc + (v - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

/** Detect surface placement: low tremor SD sustained */
export function detectSurfaceCheat(
  samples: TiltSample[],
  axis: Axis,
): boolean {
  if (samples.length < 10) return false;

  const windowMs = 100;
  let lowTremorMs = 0;
  const step = 50;

  for (let i = 10; i < samples.length; i++) {
    const window = samples.slice(Math.max(0, i - 20), i + 1);
    const sd = computeTremorSd(window, axis, windowMs);
    if (sd < GAME_CONFIG.tremorSdThreshold) {
      lowTremorMs += step;
    } else {
      lowTremorMs = 0;
    }
    if (lowTremorMs >= GAME_CONFIG.tremorMinDuration * 1000) {
      return true;
    }
  }
  return false;
}

/** Percentile rank: lower score = better = higher percentile */
export function computePercentileRank(
  score: number,
  allScores: number[],
): number {
  if (allScores.length === 0) return 100;
  const better = allScores.filter((s) => s < score).length;
  const percentile = Math.round((better / allScores.length) * 100);
  return Math.max(1, Math.min(100, 100 - percentile));
}

/** Rank tier from total medal count */
export function getRankTier(medalCount: number): string {
  if (medalCount >= 50) return "diamond";
  if (medalCount >= 30) return "platinum";
  if (medalCount >= 15) return "gold";
  if (medalCount >= 5) return "silver";
  return "bronze";
}

/** Shared rank for tied scores */
export function computeRanks(
  entries: { userId: string; score: number }[],
): Map<string, number> {
  const sorted = [...entries].sort((a, b) => a.score - b.score);
  const ranks = new Map<string, number>();
  let rank = 1;
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i]!.score !== sorted[i - 1]!.score) {
      rank = i + 1;
    }
    ranks.set(sorted[i]!.userId, rank);
  }
  return ranks;
}
