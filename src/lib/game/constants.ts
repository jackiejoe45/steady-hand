export const GAME_CONFIG = {
  /** Target angle range (degrees) */
  angleMin: 15,
  angleMax: 75,
  /** Hold window tolerance (±degrees) */
  tolerance: 2,
  /** Seconds to hold within tolerance before lock */
  lockDuration: 0.5,
  /** Hold timer duration (seconds) */
  holdDuration: 10,
  /** Angle reveal flash duration (ms) */
  revealDurationMs: 1750,
  /** Hard mode: how long the dial stays visible after targeting starts (ms) */
  hardModeIndicatorMs: 3000,
  /** Shake gate duration (seconds) */
  shakeDuration: 2.5,
  /** Minimum RMS acceleration for shake gate (m/s²) — linear accel preferred */
  shakeRmsThreshold: 0.25,
  /** Fallback rotation-rate threshold (deg/s) when linear accel unavailable */
  shakeRotationThreshold: 2,
  /** Sample rate for MAD calculation (Hz) */
  sampleRateHz: 50,
  /** Drift weight multiplier when outside tolerance */
  driftWeight: 3,
  /** Portrait constraint: max deviation from vertical (degrees) */
  portraitMaxTilt: 30,
  /** Tremor SD threshold for surface detection (degrees) — both axes must freeze below this */
  tremorSdThreshold: 0.01,
  /** Minimum duration of dual-axis freeze to flag surface (seconds) */
  tremorMinDuration: 1.0,
  /** Scores below this MAD are disallowed from the leaderboard (handheld floor) */
  minLeaderboardMad: 0.03,
} as const;

export type Axis = "pitch" | "roll";

export interface TiltSample {
  timestamp: number;
  pitch: number;
  roll: number;
}

export interface ScoredSample extends TiltSample {
  deviation: number;
  inTolerance: boolean;
  weight: number;
}
