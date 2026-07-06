"use client";

import { useEffect, useState } from "react";

function isDesktopEnvironment(): boolean {
  if (typeof window === "undefined") return false;
  const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
  const narrow = window.matchMedia("(max-width: 767px)").matches;
  if (coarsePointer || narrow) return false;
  return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
}

export function DesktopGate({ children }: { children: React.ReactNode }) {
  const [blocked, setBlocked] = useState(false);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setBlocked(isDesktopEnvironment());
    setOrigin(window.location.origin);
  }, []);

  if (blocked) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[var(--bg)] px-6">
        <div className="max-w-md w-full text-center space-y-8 animate-fade-up">
          <p className="section-label">Mobile only</p>
          <div className="space-y-3">
            <h1 className="font-serif text-5xl tracking-tight text-[var(--fg)]">
              Steady<span className="text-[var(--accent-teal)]">Hand</span>
            </h1>
            <p className="text-[var(--fg-muted)] text-sm leading-relaxed">
              This is a phone game. Open it on your mobile browser to use motion
              sensors and play the daily challenge.
            </p>
          </div>
          <div className="editorial-rule" />
          <div className="card rounded-sm px-5 py-4 space-y-2">
            <p className="section-label">Open on your phone</p>
            <p className="font-mono text-sm text-[var(--accent)] break-all">
              {origin || "your-site-url"}
            </p>
          </div>
          <p className="text-xs text-[var(--fg-subtle)]">
            Tip: add to home screen after opening on mobile for the best
            experience.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
