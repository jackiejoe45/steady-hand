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
  size = 200,
}: DialProps) {
  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.38;
  const tolerance = GAME_CONFIG.tolerance;

  const ring = "var(--dial-ring)";
  const tick = "var(--dial-tick)";
  const accent = inTolerance ? "var(--accent-teal)" : "color-mix(in srgb, var(--accent-teal) 40%, transparent)";
  const needle = inTolerance ? "var(--dial-needle-active)" : "var(--dial-needle)";

  const toRad = (deg: number) => ((deg - 90) * Math.PI) / 180;

  const arcPath = (startDeg: number, endDeg: number, r: number) => {
    const start = {
      x: cx + r * Math.cos(toRad(startDeg)),
      y: cy + r * Math.sin(toRad(startDeg)),
    };
    const end = {
      x: cx + r * Math.cos(toRad(endDeg)),
      y: cy + r * Math.sin(toRad(endDeg)),
    };
    const largeArc = endDeg - startDeg > 180 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
  };

  const needleLen = radius * 0.85;
  const needleX = cx + needleLen * Math.cos(toRad(currentAngle));
  const needleY = cy + needleLen * Math.sin(toRad(currentAngle));

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill="none"
        stroke={ring}
        strokeWidth={2}
      />
      {Array.from({ length: 36 }, (_, i) => {
        const angle = i * 10;
        const inner = radius - (i % 3 === 0 ? 10 : 5);
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
            stroke={tick}
            strokeWidth={i % 3 === 0 ? 1.5 : 0.75}
          />
        );
      })}
      {showTarget && (
        <path
          d={arcPath(
            targetAngle - tolerance,
            targetAngle + tolerance,
            radius + 6,
          )}
          fill="none"
          stroke={accent}
          strokeWidth={5}
          strokeLinecap="round"
        />
      )}
      {showTarget && (
        <line
          x1={cx + (radius - 16) * Math.cos(toRad(targetAngle))}
          y1={cy + (radius - 16) * Math.sin(toRad(targetAngle))}
          x2={cx + (radius + 3) * Math.cos(toRad(targetAngle))}
          y2={cy + (radius + 3) * Math.sin(toRad(targetAngle))}
          stroke="var(--accent-teal)"
          strokeWidth={2}
        />
      )}
      <line
        x1={cx}
        y1={cy}
        x2={needleX}
        y2={needleY}
        stroke={needle}
        strokeWidth={2.5}
        strokeLinecap="round"
      />
      <circle cx={cx} cy={cy} r={4} fill="#4FC3F7" />
    </svg>
  );
}
