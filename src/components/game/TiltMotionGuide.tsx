"use client";

import type { Axis } from "@/lib/game/constants";
import {
  getAxisIntroHint,
  getRevealHint,
  getShakeHint,
  getTargetingHint,
  type TiltMotionHint,
} from "@/lib/game/tilt-hints";

type GuideMode = "intro" | "shake" | "reveal" | "targeting";

interface TiltMotionGuideProps {
  mode: GuideMode;
  axis?: Axis;
  targetAngle?: number;
  currentAngle?: number;
  compact?: boolean;
}

function resolveHint({
  mode,
  axis = "pitch",
  targetAngle = 45,
  currentAngle = 0,
}: TiltMotionGuideProps): TiltMotionHint {
  switch (mode) {
    case "shake":
      return getShakeHint();
    case "reveal":
      return getRevealHint(axis, targetAngle);
    case "targeting":
      return getTargetingHint(axis, targetAngle, currentAngle);
    case "intro":
    default:
      return getAxisIntroHint(axis);
  }
}

function DirectionArrow({ arrow }: { arrow: NonNullable<TiltMotionHint["arrow"]> }) {
  if (arrow === "hold") {
    return (
      <span className="motion-arrow motion-arrow--hold text-[var(--accent-green)]">
        ●
      </span>
    );
  }

  const glyphs = {
    up: "↑",
    down: "↓",
    left: "←",
    right: "→",
  } as const;

  return (
    <span className={`motion-arrow motion-arrow--${arrow}`}>
      {glyphs[arrow]}
    </span>
  );
}

export function TiltMotionGuide(props: TiltMotionGuideProps) {
  const { mode, compact = false } = props;
  const hint = resolveHint(props);
  const size = compact ? 88 : 108;

  const animClass =
    mode === "shake"
      ? "phone-motion phone-motion--shake"
      : mode === "targeting"
        ? "phone-motion"
        : hint.kind === "pitch"
          ? "phone-motion phone-motion--pitch"
          : "phone-motion phone-motion--roll";

  const style = {
    ["--phone-tilt-x" as string]: `${hint.rotateX}deg`,
    ["--phone-tilt-z" as string]: `${hint.rotateZ}deg`,
  };

  return (
    <div
      className={`flex flex-col items-center ${compact ? "gap-2" : "gap-3"}`}
    >
      <div className="relative flex items-center justify-center" style={{ width: size + 40, height: size + 24 }}>
        {mode === "targeting" && hint.arrow && hint.arrow !== "hold" && (
          <DirectionArrow arrow={hint.arrow} />
        )}

        <div className="phone-stage" style={{ width: size, height: size }}>
          <div className={animClass} style={style}>
            <svg
              viewBox="0 0 48 80"
              width={size * 0.42}
              height={size * 0.7}
              className="phone-body"
              aria-hidden
            >
              <rect
                x="4"
                y="2"
                width="40"
                height="76"
                rx="8"
                fill="var(--bg-soft)"
                stroke="var(--border-strong)"
                strokeWidth="1.5"
              />
              <rect
                x="16"
                y="8"
                width="16"
                height="4"
                rx="2"
                fill="var(--border)"
              />
              <circle cx="24" cy="68" r="3" fill="var(--border)" />
              <line
                x1="24"
                y1="20"
                x2="24"
                y2="56"
                stroke="var(--accent-teal)"
                strokeWidth="2"
                strokeLinecap="round"
                opacity="0.5"
              />
              <circle cx="24" cy="38" r="4" fill="var(--accent-teal)" />
            </svg>
          </div>
        </div>
      </div>

      <div className="text-center max-w-[14rem]">
        <p
          className={`${compact ? "text-[0.65rem]" : "text-xs"} tracking-wide text-[var(--accent-teal)]`}
        >
          {hint.label}
        </p>
        {!compact && (
          <p className="text-[0.65rem] text-[var(--fg-subtle)] mt-1 leading-relaxed">
            {hint.detail}
          </p>
        )}
      </div>
    </div>
  );
}
