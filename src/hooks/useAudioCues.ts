"use client";

import { useCallback, useRef } from "react";
import { GAME_CONFIG } from "@/lib/game/constants";

type CueEvent =
  | "shake"
  | "reveal"
  | "lock"
  | "drift"
  | "complete"
  | "medal";

const VIBRATE_PATTERNS: Record<CueEvent, number | number[]> = {
  shake: [50, 50, 50],
  reveal: 100,
  lock: [50, 30, 50],
  drift: 80,
  complete: [100, 50, 100, 50, 200],
  medal: [80, 40, 80, 40, 80],
};

export function useAudioCues() {
  const ctxRef = useRef<AudioContext | null>(null);

  const getCtx = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = new AudioContext();
    }
    return ctxRef.current;
  }, []);

  const playTone = useCallback(
    (freq: number, duration: number, type: OscillatorType = "sine") => {
      try {
        const ctx = getCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(
          0.001,
          ctx.currentTime + duration,
        );
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + duration);
      } catch {
        // Audio unavailable
      }
    },
    [getCtx],
  );

  const playCue = useCallback(
    (event: CueEvent) => {
      switch (event) {
        case "shake":
          playTone(220, 0.1);
          break;
        case "reveal":
          playTone(440, 0.3);
          break;
        case "lock":
          playTone(523, 0.15);
          setTimeout(() => playTone(659, 0.15), 100);
          break;
        case "drift":
          playTone(330, 0.2, "triangle");
          break;
        case "complete":
          [523, 659, 784].forEach((f, i) =>
            setTimeout(() => playTone(f, 0.25), i * 120),
          );
          break;
        case "medal":
          [784, 880, 988].forEach((f, i) =>
            setTimeout(() => playTone(f, 0.2), i * 100),
          );
          break;
      }

      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(VIBRATE_PATTERNS[event]);
      }
    },
    [playTone],
  );

  const startShakeLoop = useCallback(() => {
    const interval = setInterval(() => playTone(180, 0.05), 500);
    return () => clearInterval(interval);
  }, [playTone]);

  return { playCue, startShakeLoop };
}
