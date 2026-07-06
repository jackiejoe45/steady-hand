"use client";

import { useCallback, useEffect, useState } from "react";
import { Onboarding } from "@/components/Onboarding";
import { registerPushSubscription } from "@/lib/push";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("steadyhand_onboarded")) {
      setShowOnboarding(true);
    }
  }, []);

  const handleOnboardingComplete = useCallback(() => {
    setShowOnboarding(false);
    registerPushSubscription().catch(() => null);
  }, []);

  return (
    <>
      {showOnboarding && (
        <Onboarding onComplete={handleOnboardingComplete} />
      )}
      {children}
    </>
  );
}
