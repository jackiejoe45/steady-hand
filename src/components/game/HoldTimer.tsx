"use client";

import { GAME_CONFIG } from "@/lib/game/constants";

interface HoldTimerProps {
  remaining: number;
  inTolerance: boolean;
}

export function HoldTimer({ remaining, inTolerance }: HoldTimerProps) {
  const progress = remaining / GAME_CONFIG.holdDuration;

  return (
    <div className="w-full max-w-xs space-y-3">
      <div className="flex justify-between font-mono text-sm text-zinc-400">
        <span>HOLD</span>
        <span className={inTolerance ? "text-[#4FC3F7]" : "text-amber-400"}>
          {remaining.toFixed(1)}s
        </span>
      </div>
      <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
        <div
          className={`h-full transition-all duration-100 ${
            inTolerance ? "bg-[#4FC3F7]" : "bg-amber-400"
          }`}
          style={{ width: `${progress * 100}%` }}
        />
      </div>
      {!inTolerance && (
        <p className="text-xs text-amber-400 text-center">
          Drifting — timer still running
        </p>
      )}
    </div>
  );
}
