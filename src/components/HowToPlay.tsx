"use client";

import { useState } from "react";

interface HowToPlayProps {
  open: boolean;
  onClose: () => void;
}

const STEPS = [
  {
    index: "01 / Goal",
    title: "Hit the angle",
    body: "Each day has one secret angle between 15° and 75°. Tilt your phone to match it and hold perfectly still for 10 seconds.",
  },
  {
    index: "02 / Unlock",
    title: "Shake to reveal",
    body: "Move your phone continuously for 2.5 seconds to unlock today's angle. The angle flashes briefly — memorize it before it disappears.",
  },
  {
    index: "03 / Lock in",
    title: "Find and hold",
    body: "Tilt to the target angle and stay within ±2° for half a second to lock. Then hold steady for the full 10-second timer.",
  },
  {
    index: "04 / Score",
    title: "Lower is better",
    body: "Your score is mean absolute deviation (MAD) in degrees. Drift outside tolerance is penalized 3×. Sign in to save your daily score.",
  },
  {
    index: "05 / Modes",
    title: "Daily vs practice",
    body: "You get one ranked daily attempt per day. Practice mode gives random angles with no leaderboard — use it to warm up.",
  },
  {
    index: "06 / Hard mode",
    title: "No safety net",
    body: "Enable hard mode in settings. The angle dial vanishes a few seconds into targeting — you must rely on muscle memory alone.",
  },
];

export function HowToPlay({ open, onClose }: HowToPlayProps) {
  const [step, setStep] = useState(0);

  if (!open) return null;

  const current = STEPS[step]!;
  const isLast = step === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--bg)]/95 p-6">
      <div className="card max-w-sm w-full rounded-sm p-7 text-center space-y-5 animate-fade-up">
        <p className="section-label">{current.index}</p>
        <h2 className="font-serif text-3xl text-[var(--fg)]">{current.title}</h2>
        <p className="text-[var(--fg-muted)] text-sm leading-relaxed">
          {current.body}
        </p>

        <div className="flex justify-center gap-1.5">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 w-1.5 rounded-full transition-colors ${
                i === step ? "bg-[var(--accent-teal)]" : "bg-[var(--border-strong)]"
              }`}
            />
          ))}
        </div>

        <div className="flex gap-2">
          {step > 0 && (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="btn-secondary flex-1 py-3"
            >
              Back
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              if (isLast) {
                setStep(0);
                onClose();
              } else {
                setStep(step + 1);
              }
            }}
            className="btn-primary flex-1 py-3"
          >
            {isLast ? "Done" : "Next"}
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            setStep(0);
            onClose();
          }}
          className="text-xs text-[var(--fg-subtle)] hover:text-[var(--fg-muted)]"
        >
          Skip tutorial
        </button>
      </div>
    </div>
  );
}
