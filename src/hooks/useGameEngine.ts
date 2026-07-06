"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { GAME_CONFIG, type Axis, type TiltSample } from "@/lib/game/constants";
import { isAnyMovement } from "@/lib/sensors/shake";
import {
  computeWeightedMAD,
  downsample,
  getTiltValue,
  isInTolerance,
} from "@/lib/game/scoring";

export type GamePhase =
  | "idle"
  | "shakeGate"
  | "angleReveal"
  | "targeting"
  | "hold"
  | "complete";

interface UseGameEngineOptions {
  targetAngle: number;
  axis: Axis;
  isPractice: boolean;
  sample: TiltSample | null;
  shakeRms: number;
  portraitValid: boolean;
  onPhaseChange?: (phase: GamePhase) => void;
  onComplete?: (score: number, samples: TiltSample[]) => void;
}

function setNumberIfChanged(
  setter: (v: number) => void,
  next: number,
  ref: { current: number },
) {
  if (ref.current !== next) {
    ref.current = next;
    setter(next);
  }
}

function setBoolIfChanged(
  setter: (v: boolean) => void,
  next: boolean,
  ref: { current: boolean },
) {
  if (ref.current !== next) {
    ref.current = next;
    setter(next);
  }
}

export function useGameEngine({
  targetAngle,
  axis,
  isPractice,
  sample,
  shakeRms,
  portraitValid,
  onPhaseChange,
  onComplete,
}: UseGameEngineOptions) {
  const [phase, setPhase] = useState<GamePhase>("idle");
  const [score, setScore] = useState<number | null>(null);
  const [holdRemaining, setHoldRemaining] = useState<number>(GAME_CONFIG.holdDuration);
  const [lockProgress, setLockProgress] = useState(0);
  const [inTolerance, setInTolerance] = useState(false);
  const [currentTilt, setCurrentTilt] = useState(0);
  const [shakeProgress, setShakeProgress] = useState(0);

  const samplesRef = useRef<TiltSample[]>([]);
  const holdSamplesRef = useRef<TiltSample[]>([]);
  const shakeStartRef = useRef<number | null>(null);
  const lockStartRef = useRef<number | null>(null);
  const holdStartRef = useRef<number | null>(null);
  const outOfToleranceRef = useRef(0);
  const revealTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shakeTransitionedRef = useRef(false);
  const prevSampleRef = useRef<TiltSample | null>(null);
  const lastSampleTimestampRef = useRef(0);
  const shakeProgressRef = useRef(0);
  const lockProgressRef = useRef(0);
  const holdRemainingRef = useRef(GAME_CONFIG.holdDuration);
  const inToleranceRef = useRef(false);
  const currentTiltRef = useRef(0);

  const sampleRef = useRef(sample);
  const shakeRmsRef = useRef(shakeRms);
  sampleRef.current = sample;
  shakeRmsRef.current = shakeRms;

  const onPhaseChangeRef = useRef(onPhaseChange);
  const onCompleteRef = useRef(onComplete);
  onPhaseChangeRef.current = onPhaseChange;
  onCompleteRef.current = onComplete;

  const activeTargetRef = useRef({ targetAngle, axis });

  useEffect(() => {
    activeTargetRef.current = { targetAngle, axis };
  }, [targetAngle, axis]);

  const setPhaseAndNotify = useCallback((p: GamePhase) => {
    setPhase(p);
    onPhaseChangeRef.current?.(p);
  }, []);

  const reset = useCallback(() => {
    setPhase("idle");
    setScore(null);
    setHoldRemaining(GAME_CONFIG.holdDuration);
    setLockProgress(0);
    setInTolerance(false);
    setShakeProgress(0);
    samplesRef.current = [];
    holdSamplesRef.current = [];
    shakeStartRef.current = null;
    lockStartRef.current = null;
    holdStartRef.current = null;
    outOfToleranceRef.current = 0;
    shakeTransitionedRef.current = false;
    prevSampleRef.current = null;
    lastSampleTimestampRef.current = 0;
    shakeProgressRef.current = 0;
    lockProgressRef.current = 0;
    holdRemainingRef.current = GAME_CONFIG.holdDuration;
    inToleranceRef.current = false;
    currentTiltRef.current = 0;
    if (revealTimerRef.current) clearTimeout(revealTimerRef.current);
  }, []);

  const start = useCallback(
    (override?: { targetAngle: number; axis: Axis }) => {
      reset();
      activeTargetRef.current = override ?? { targetAngle, axis };
      setPhaseAndNotify("shakeGate");
    },
    [reset, setPhaseAndNotify, targetAngle, axis],
  );

  useEffect(() => {
    if (phase !== "shakeGate") {
      prevSampleRef.current = null;
      if (shakeProgressRef.current !== 0) {
        shakeProgressRef.current = 0;
        setShakeProgress(0);
      }
      return;
    }

    const interval = window.setInterval(() => {
      const moving = isAnyMovement(
        shakeRmsRef.current,
        sampleRef.current,
        prevSampleRef.current,
      );

      if (sampleRef.current) {
        prevSampleRef.current = { ...sampleRef.current };
      }

      if (moving) {
        if (!shakeStartRef.current) shakeStartRef.current = Date.now();
        const elapsed = (Date.now() - shakeStartRef.current) / 1000;
        const progress = Math.min(1, elapsed / GAME_CONFIG.shakeDuration);
        setNumberIfChanged(setShakeProgress, progress, shakeProgressRef);

        if (
          elapsed >= GAME_CONFIG.shakeDuration &&
          !shakeTransitionedRef.current
        ) {
          shakeTransitionedRef.current = true;
          setPhaseAndNotify("angleReveal");
          revealTimerRef.current = setTimeout(() => {
            setPhaseAndNotify("targeting");
          }, GAME_CONFIG.revealDurationMs);
        }
      } else {
        shakeStartRef.current = null;
        setNumberIfChanged(setShakeProgress, 0, shakeProgressRef);
      }
    }, 50);

    return () => window.clearInterval(interval);
  }, [phase, setPhaseAndNotify]);

  useEffect(() => {
    if (!sample || phase === "idle" || phase === "complete") return;
    if (sample.timestamp === lastSampleTimestampRef.current) return;
    lastSampleTimestampRef.current = sample.timestamp;

    const { targetAngle: activeTarget, axis: activeAxis } =
      activeTargetRef.current;

    const tilt = getTiltValue(sample, activeAxis);
    setNumberIfChanged(setCurrentTilt, tilt, currentTiltRef);
    samplesRef.current.push(sample);

    if (phase === "targeting" || phase === "hold") {
      const inTol = isInTolerance(tilt, activeTarget);
      setBoolIfChanged(setInTolerance, inTol, inToleranceRef);

      if (phase === "targeting") {
        if (inTol) {
          outOfToleranceRef.current = 0;
          if (!lockStartRef.current) lockStartRef.current = Date.now();
          const lockElapsed = (Date.now() - lockStartRef.current) / 1000;
          const progress = Math.min(1, lockElapsed / GAME_CONFIG.lockDuration);
          setNumberIfChanged(setLockProgress, progress, lockProgressRef);

          if (lockElapsed >= GAME_CONFIG.lockDuration) {
            setPhaseAndNotify("hold");
            holdStartRef.current = Date.now();
            holdSamplesRef.current = [];
          }
        } else {
          outOfToleranceRef.current += 1;
          if (outOfToleranceRef.current >= 4) {
            lockStartRef.current = null;
            setNumberIfChanged(setLockProgress, 0, lockProgressRef);
          }
        }
      }

      if (phase === "hold") {
        holdSamplesRef.current.push(sample);
        const elapsed = holdStartRef.current
          ? (Date.now() - holdStartRef.current) / 1000
          : 0;
        const remaining = Math.max(0, GAME_CONFIG.holdDuration - elapsed);
        setNumberIfChanged(setHoldRemaining, remaining, holdRemainingRef);

        if (remaining <= 0) {
          const downsampled = downsample(holdSamplesRef.current);
          const mad = computeWeightedMAD(
            downsampled,
            activeTarget,
            activeAxis,
          );
          setScore(mad);
          setPhaseAndNotify("complete");
          onCompleteRef.current?.(mad, downsampled);
        }
      }
    }
  }, [sample, phase, setPhaseAndNotify]);

  return {
    phase,
    score,
    holdRemaining,
    lockProgress,
    inTolerance,
    currentTilt,
    shakeProgress,
    portraitValid,
    isPractice,
    start,
    reset,
  };
}
