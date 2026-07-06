"use client";

import { useEffect, useState } from "react";
import { requestSensorPermissions } from "@/lib/sensors/permissions";
import { sensorManager } from "@/lib/sensors/manager";

interface OnboardingProps {
  onComplete: () => void;
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: "Welcome to SteadyHand",
      body: "Tilt your phone to a secret angle and hold perfectly still. One attempt per day.",
    },
    {
      title: "How it works",
      body: "Move your phone to unlock the angle, memorize it, then hold steady for 10 seconds.",
    },
    {
      title: "Motion sensors",
      body: "We need access to your device motion sensors to measure your steadiness.",
    },
  ];

  const handleMotionPermission = () => {
    sensorManager.activate();
    localStorage.setItem("steadyhand_onboarded", "1");
    onComplete();
  };

  useEffect(() => {
    if (localStorage.getItem("steadyhand_onboarded")) {
      onComplete();
    }
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0a0f]/95 backdrop-blur-sm p-6">
      <div className="max-w-sm w-full rounded-2xl bg-zinc-900 border border-zinc-800 p-8 text-center space-y-6">
        <h2 className="text-xl font-bold">{steps[step]?.title}</h2>
        <p className="text-zinc-400 text-sm">{steps[step]?.body}</p>

        {step < 2 ? (
          <button
            onClick={() => setStep(step + 1)}
            className="w-full rounded-xl bg-[#4FC3F7] text-black py-3 font-medium"
          >
            Next
          </button>
        ) : (
          <button
            onClick={handleMotionPermission}
            className="w-full rounded-xl bg-[#4FC3F7] text-black py-3 font-medium"
          >
            Enable Motion Sensors
          </button>
        )}
      </div>
    </div>
  );
}
