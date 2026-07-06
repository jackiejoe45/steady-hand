"use client";

import type { Axis } from "@/lib/game/constants";

interface AngleRevealProps {
  angle: number;
  axis: Axis;
}

export function AngleReveal({ angle, axis }: AngleRevealProps) {
  return (
    <div className="flex flex-col items-center gap-3 animate-fade-up">
      <p className="section-label">03 / Memorize</p>
      <p className="text-[var(--fg-muted)] text-xs capitalize">{axis} target</p>
      <span className="font-serif text-7xl text-[var(--accent-teal)]">
        {Math.round(angle)}°
      </span>
      <p className="text-[var(--fg-subtle)] text-xs italic">
        Lock it in before you tilt
      </p>
    </div>
  );
}
