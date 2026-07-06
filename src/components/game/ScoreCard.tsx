"use client";

interface ScoreCardProps {
  score: number;
  percentile?: number | null;
  isPractice?: boolean;
  onShare?: () => void;
  onPlayAgain?: () => void;
}

export function ScoreCard({
  score,
  percentile,
  isPractice,
  onShare,
  onPlayAgain,
}: ScoreCardProps) {
  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-sm">
      <div className="text-center">
        <p className="text-zinc-500 text-sm uppercase tracking-widest mb-2">
          {isPractice ? "Practice Score" : "Your Score"}
        </p>
        <span className="font-mono text-7xl font-bold text-[#4FC3F7]">
          {score.toFixed(2)}°
        </span>
        <p className="text-zinc-500 text-sm mt-2">Mean absolute deviation</p>
      </div>

      {percentile != null && !isPractice && (
        <div className="rounded-xl bg-zinc-900 border border-zinc-800 px-6 py-4 text-center w-full">
          <p className="text-zinc-400 text-sm">Today&apos;s rank</p>
          <p className="font-mono text-3xl text-white mt-1">
            Top {percentile}%
          </p>
        </div>
      )}

      {isPractice && (
        <p className="text-zinc-500 text-sm text-center">
          Practice runs don&apos;t count toward the leaderboard
        </p>
      )}

      <div className="flex gap-3 w-full">
        {onPlayAgain && (
          <button
            onClick={onPlayAgain}
            className="flex-1 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white py-3 font-medium transition-colors"
          >
            {isPractice ? "Try Again" : "Back Home"}
          </button>
        )}
        {onShare && !isPractice && (
          <button
            onClick={onShare}
            className="flex-1 rounded-xl bg-[#4FC3F7] hover:bg-[#29B6F6] text-black py-3 font-medium transition-colors"
          >
            Share
          </button>
        )}
      </div>
    </div>
  );
}
