"use client";

import { GAME_CONFIG } from "@/lib/game/constants";

interface HoldTimerProps {
  remaining: number;
  inTolerance: boolean;
}

export function HoldTimer({ remaining, inTolerance }: HoldTimerProps) {
  const progress = remaining / GAME_CONFIG.holdDuration;

  return (
    <div className="w-full space-y-2">
      <div className="flex justify-between font-mono text-xs text-[var(--fg-muted)]">
        <span className="section-label">Hold</span>
        <span className={inTolerance ? "text-[var(--success)]" : "text-[var(--accent-teal)]"}>
          {remaining.toFixed(1)}s
        </span>
      </div>
      <div className="h-1 rounded-full bg-[var(--border)] overflow-hidden">
        <div
          className={`h-full transition-all duration-100 ${
            inTolerance ? "bg-[var(--success)]" : "bg-[var(--accent-teal)]"
          }`}
          style={{ width: `${progress * 100}%` }}
        />
      </div>
      {!inTolerance && (
        <p className="text-[0.65rem] text-[var(--accent-teal)] text-center">
          Drifting — timer still running
        </p>
      )}
    </div>
  );
}
