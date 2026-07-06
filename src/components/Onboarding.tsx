"use client";

import { useEffect, useState } from "react";
import { sensorManager } from "@/lib/sensors/manager";

interface OnboardingProps {
  onComplete: () => void;
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");

  const steps = [
    {
      index: "01 / Welcome",
      title: "SteadyHand",
      body: "Tilt your phone to a secret angle and hold perfectly still. One attempt per day.",
    },
    {
      index: "02 / How it works",
      title: "Shake, memorize, hold",
      body: "Move your phone to unlock the angle, memorize it, then hold steady for 10 seconds.",
    },
    {
      index: "03 / Sensors",
      title: "Motion access",
      body: "We need your device motion sensors to measure your steadiness.",
    },
  ];

  const handleMotionPermission = async () => {
    setError("");
    const granted = await sensorManager.ensurePermissionsAndActivate();
    if (!granted) {
      setError("Sensor permission denied. Enable motion access in Settings.");
      return;
    }
    localStorage.setItem("steadyhand_onboarded", "1");
    onComplete();
  };

  useEffect(() => {
    if (localStorage.getItem("steadyhand_onboarded")) {
      onComplete();
    }
  }, [onComplete]);

  const current = steps[step];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--bg)]/98 p-6">
      <div className="card max-w-sm w-full rounded-sm p-7 text-center space-y-5 animate-fade-up">
        <p className="section-label">{current?.index}</p>
        <h2 className="font-serif text-3xl text-[var(--fg)]">{current?.title}</h2>
        <p className="text-[var(--fg-muted)] text-sm leading-relaxed">
          {current?.body}
        </p>

        {error && (
          <p className="text-[var(--danger)] text-xs">{error}</p>
        )}

        {step < 2 ? (
          <button
            onClick={() => setStep(step + 1)}
            className="btn-primary w-full py-3"
          >
            Continue
          </button>
        ) : (
          <button
            onClick={() => void handleMotionPermission()}
            className="btn-primary w-full py-3"
          >
            Enable motion sensors
          </button>
        )}
      </div>
    </div>
  );
}
