"use client";

import type { Axis } from "@/lib/game/constants";

interface AngleRevealProps {
  angle: number;
  axis: Axis;
}

export function AngleReveal({ angle, axis }: AngleRevealProps) {
  return (
    <div className="flex flex-col items-center gap-4 animate-pulse">
      <p className="text-zinc-500 uppercase tracking-widest text-sm">
        Target {axis}
      </p>
      <span className="font-mono text-8xl font-bold text-[#4FC3F7]">
        {Math.round(angle)}°
      </span>
      <p className="text-zinc-500 text-sm">Memorize this angle</p>
    </div>
  );
}
