"use client";

interface ShakeGateProps {
  progress: number;
}

export function ShakeGate({ progress }: ShakeGateProps) {
  const size = 200;
  const stroke = 8;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progress);

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#1a1a2e"
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#4FC3F7"
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-200"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-mono text-2xl text-[#4FC3F7]">
            {Math.round(progress * 100)}%
          </span>
        </div>
      </div>
      <p className="text-center text-zinc-400 max-w-xs">
        Move your phone continuously to confirm you&apos;re holding it
      </p>
    </div>
  );
}
