"use client";

import { useRef } from "react";
import { toPng } from "html-to-image";

interface ShareCardProps {
  score: number;
  percentile: number | null;
  date: string;
}

export function ShareCard({ score, percentile, date }: ShareCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  const download = async () => {
    if (!ref.current) return;
    const dataUrl = await toPng(ref.current, { cacheBust: true });
    const link = document.createElement("a");
    link.download = `steadyhand-${date}.png`;
    link.href = dataUrl;
    link.click();
  };

  return (
    <div className="space-y-4">
      <div
        ref={ref}
        className="rounded-2xl bg-zinc-900 border border-zinc-700 p-8 text-center w-full max-w-sm"
      >
        <p className="text-zinc-500 text-xs uppercase tracking-widest">
          SteadyHand
        </p>
        <p className="font-mono text-6xl font-bold text-[#4FC3F7] mt-4">
          {score.toFixed(2)}°
        </p>
        {percentile != null && (
          <p className="text-white text-lg mt-2">Top {percentile}% today</p>
        )}
        <p className="text-zinc-600 text-xs mt-6">{date}</p>
      </div>
      <button
        onClick={download}
        className="w-full rounded-xl bg-zinc-800 hover:bg-zinc-700 py-3 text-sm font-medium transition-colors"
      >
        Download Share Card
      </button>
    </div>
  );
}
