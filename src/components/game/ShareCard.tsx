"use client";

import { useRef } from "react";
import { toPng } from "html-to-image";

interface ShareCardProps {
  score: number;
  percentile: number | null;
  date: string;
  compact?: boolean;
}

export function ShareCard({
  score,
  percentile,
  date,
  compact = false,
}: ShareCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  const download = async () => {
    if (!ref.current) return;
    const dataUrl = await toPng(ref.current, { cacheBust: true });
    const link = document.createElement("a");
    link.download = `steadyhand-${date}.png`;
    link.href = dataUrl;
    link.click();
  };

  if (compact) {
    return (
      <>
        <div ref={ref} className="sr-only" aria-hidden>
          <ShareCardPreview score={score} percentile={percentile} date={date} />
        </div>
        <button
          onClick={download}
          className="text-xs tracking-wide text-[var(--fg-muted)] hover:text-[var(--accent-teal)]"
        >
          Download share card
        </button>
      </>
    );
  }

  return (
    <div className="space-y-3">
      <div ref={ref}>
        <ShareCardPreview score={score} percentile={percentile} date={date} />
      </div>
      <button onClick={download} className="btn-secondary w-full py-2.5">
        Download share card
      </button>
    </div>
  );
}

function ShareCardPreview({
  score,
  percentile,
  date,
}: {
  score: number;
  percentile: number | null;
  date: string;
}) {
  return (
    <div className="card rounded-sm p-6 text-center w-full max-w-sm">
      <p className="section-label">SteadyHand</p>
      <p className="font-serif text-5xl text-[var(--accent-teal)] mt-3">
        {score.toFixed(2)}°
      </p>
      {percentile != null && (
        <p className="text-[var(--fg)] text-sm mt-2">Top {percentile}% today</p>
      )}
      <p className="text-[var(--fg-subtle)] text-xs mt-4">{date}</p>
    </div>
  );
}
