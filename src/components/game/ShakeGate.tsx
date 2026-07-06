"use client";

import { TiltMotionGuide } from "@/components/game/TiltMotionGuide";

interface ShakeGateProps {
  progress: number;
}

export function ShakeGate({ progress }: ShakeGateProps) {
  const size = 160;
  const stroke = 6;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progress);

  return (
    <div className="flex flex-col items-center gap-3">
      <TiltMotionGuide mode="shake" compact />
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--border)"
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--accent-teal)"
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-200"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-mono text-xl text-[var(--accent-teal)]">
            {Math.round(progress * 100)}%
          </span>
        </div>
      </div>
    </div>
  );
}
