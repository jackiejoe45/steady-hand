import type { Axis } from "./constants";
import { GAME_CONFIG } from "./constants";

export type MotionKind = "shake" | "pitch" | "roll";

export interface TiltMotionHint {
  kind: MotionKind;
  /** CSS rotateX for pitch demo (degrees) */
  rotateX: number;
  /** CSS rotateZ for roll demo (degrees) */
  rotateZ: number;
  label: string;
  detail: string;
  /** Arrow hint during live targeting */
  arrow?: "up" | "down" | "left" | "right" | "hold";
}

function pitchDemoRotation(targetAngle: number): number {
  // Upright portrait ≈ 90° pitch; lower target = lean top away from you
  return Math.max(0, Math.min(75, 90 - targetAngle));
}

export function getRevealHint(axis: Axis, targetAngle: number): TiltMotionHint {
  if (axis === "pitch") {
    const rotateX = pitchDemoRotation(targetAngle);
    return {
      kind: "pitch",
      rotateX,
      rotateZ: 0,
      label: "Lean top away",
      detail: `Pitch to about ${Math.round(targetAngle)}° — top moves back from your face`,
    };
  }

  return {
    kind: "roll",
    rotateX: 0,
    rotateZ: targetAngle,
    label: "Tilt to the right",
    detail: `Roll to about ${Math.round(targetAngle)}° — lower the right edge`,
  };
}

export function getTargetingHint(
  axis: Axis,
  targetAngle: number,
  currentAngle: number,
): TiltMotionHint {
  const base = getRevealHint(axis, targetAngle);
  const delta = targetAngle - currentAngle;
  const inTol = Math.abs(delta) <= GAME_CONFIG.tolerance;

  if (inTol) {
    return {
      ...base,
      label: "Hold steady",
      detail: "You're on target — stay still",
      arrow: "hold",
    };
  }

  if (axis === "pitch") {
    if (delta > 0) {
      return {
        ...base,
        rotateX: Math.max(0, pitchDemoRotation(currentAngle) - 12),
        label: "Tilt toward you",
        detail: "Raise the top edge — pitch is too low",
        arrow: "up",
      };
    }
    return {
      ...base,
      rotateX: Math.min(75, pitchDemoRotation(currentAngle) + 12),
      label: "Lean top away",
      detail: "Lower the top edge — pitch is too high",
      arrow: "down",
    };
  }

  if (delta > 0) {
    return {
      ...base,
      rotateZ: currentAngle - 12,
      label: "Tilt right",
      detail: "Lower the right edge — roll is too low",
      arrow: "right",
    };
  }

  return {
    ...base,
    rotateZ: currentAngle + 12,
    label: "Tilt left",
    detail: "Lower the left edge — roll is too high",
    arrow: "left",
  };
}

export function getShakeHint(): TiltMotionHint {
  return {
    kind: "shake",
    rotateX: 0,
    rotateZ: 0,
    label: "Move your phone",
    detail: "Wiggle or rotate it in any direction",
  };
}

export function getAxisIntroHint(axis: Axis): TiltMotionHint {
  if (axis === "pitch") {
    return {
      kind: "pitch",
      rotateX: 28,
      rotateZ: 0,
      label: "Pitch axis",
      detail: "Today you tilt forward and back",
    };
  }
  return {
    kind: "roll",
    rotateX: 0,
    rotateZ: 28,
    label: "Roll axis",
    detail: "Today you tilt side to side",
  };
}
