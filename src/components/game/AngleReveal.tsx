"use client";

import type { Axis } from "@/lib/game/constants";
import { TiltMotionGuide } from "@/components/game/TiltMotionGuide";

interface AngleRevealProps {
  angle: number;
  axis: Axis;
}

export function AngleReveal({ angle, axis }: AngleRevealProps) {
  return (
    <div className="flex flex-col items-center gap-3 animate-fade-up">
      <p className="section-label">03 / Memorize</p>
      <span className="font-serif text-6xl text-[var(--accent-teal)]">
        {Math.round(angle)}°
      </span>
      <TiltMotionGuide mode="reveal" axis={axis} targetAngle={angle} compact />
      <p className="text-[var(--fg-subtle)] text-xs italic">
        Lock it in before you tilt
      </p>
    </div>
  );
}
