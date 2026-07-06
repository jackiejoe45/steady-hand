import { GAME_CONFIG } from "@/lib/game/constants";
import type { TiltSample } from "@/lib/game/constants";

/** Minimum orientation change between readings to count as movement (degrees) */
const ORIENT_MOVE_THRESHOLD = 0.08;

export function isShakeDetected(motionValue: number): boolean {
  return (
    motionValue >= GAME_CONFIG.shakeRmsThreshold ||
    motionValue >= GAME_CONFIG.shakeRotationThreshold
  );
}

export function isOrientMoving(
  sample: TiltSample | null,
  prev: TiltSample | null,
): boolean {
  if (!sample || !prev) return false;
  const dp = sample.pitch - prev.pitch;
  const dr = sample.roll - prev.roll;
  return Math.hypot(dp, dr) >= ORIENT_MOVE_THRESHOLD;
}

export function isAnyMovement(
  motionValue: number,
  sample: TiltSample | null,
  prevSample: TiltSample | null,
): boolean {
  return isShakeDetected(motionValue) || isOrientMoving(sample, prevSample);
}
