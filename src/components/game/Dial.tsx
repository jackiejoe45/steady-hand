"use client";

import { GAME_CONFIG } from "@/lib/game/constants";

interface DialProps {
  currentAngle: number;
  targetAngle: number;
  showTarget?: boolean;
  inTolerance?: boolean;
  size?: number;
}

export function Dial({
  currentAngle,
  targetAngle,
  showTarget = true,
  inTolerance = false,
  size = 280,
}: DialProps) {
  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.38;
  const tolerance = GAME_CONFIG.tolerance;

  const toRad = (deg: number) => ((deg - 90) * Math.PI) / 180;

  const arcPath = (startDeg: number, endDeg: number, r: number) => {
    const start = { x: cx + r * Math.cos(toRad(startDeg)), y: cy + r * Math.sin(toRad(startDeg)) };
    const end = { x: cx + r * Math.cos(toRad(endDeg)), y: cy + r * Math.sin(toRad(endDeg)) };
    const largeArc = endDeg - startDeg > 180 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
  };

  const needleAngle = currentAngle;
  const needleLen = radius * 0.85;
  const needleX = cx + needleLen * Math.cos(toRad(needleAngle));
  const needleY = cy + needleLen * Math.sin(toRad(needleAngle));

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Outer ring */}
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill="none"
        stroke="#1a1a2e"
        strokeWidth={3}
      />
      {/* Tick marks */}
      {Array.from({ length: 36 }, (_, i) => {
        const angle = i * 10;
        const inner = radius - (i % 3 === 0 ? 12 : 6);
        const x1 = cx + inner * Math.cos(toRad(angle));
        const y1 = cy + inner * Math.sin(toRad(angle));
        const x2 = cx + radius * Math.cos(toRad(angle));
        const y2 = cy + radius * Math.sin(toRad(angle));
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="#333"
            strokeWidth={i % 3 === 0 ? 2 : 1}
          />
        );
      })}
      {/* Tolerance arc */}
      {showTarget && (
        <path
          d={arcPath(
            targetAngle - tolerance,
            targetAngle + tolerance,
            radius + 8,
          )}
          fill="none"
          stroke={inTolerance ? "#4FC3F7" : "#4FC3F766"}
          strokeWidth={6}
          strokeLinecap="round"
        />
      )}
      {/* Target marker */}
      {showTarget && (
        <line
          x1={cx + (radius - 20) * Math.cos(toRad(targetAngle))}
          y1={cy + (radius - 20) * Math.sin(toRad(targetAngle))}
          x2={cx + (radius + 4) * Math.cos(toRad(targetAngle))}
          y2={cy + (radius + 4) * Math.sin(toRad(targetAngle))}
          stroke="#4FC3F7"
          strokeWidth={3}
        />
      )}
      {/* Needle */}
      <line
        x1={cx}
        y1={cy}
        x2={needleX}
        y2={needleY}
        stroke={inTolerance ? "#4FC3F7" : "#ffffff"}
        strokeWidth={3}
        strokeLinecap="round"
      />
      <circle cx={cx} cy={cy} r={6} fill="#4FC3F7" />
    </svg>
  );
}
