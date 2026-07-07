"use client";

interface ScoreCardProps {
  score: number;
  percentile?: number | null;
  rank?: number | null;
  summary?: string | null;
  saved?: boolean;
  valid?: boolean | null;
  isPractice?: boolean;
  onShare?: () => void;
  onPlayAgain?: () => void;
}

export function ScoreCard({
  score,
  percentile,
  rank,
  summary,
  saved = false,
  valid = null,
  isPractice,
  onShare,
  onPlayAgain,
}: ScoreCardProps) {
  return (
    <div className="flex w-full flex-col items-center gap-4">
      <div className="text-center">
        <p className="section-label mb-2">
          {isPractice ? "Practice score" : "Your score"}
        </p>
        <span className="font-serif text-6xl text-[var(--accent-teal)]">
          {score.toFixed(2)}°
        </span>
        <p className="text-[var(--fg-subtle)] text-xs mt-1">
          Mean absolute deviation
        </p>
      </div>

      {summary && !isPractice && (
        <div
          className={`card rounded-sm px-4 py-3 text-center w-full ${
            valid === false ? "border-[var(--danger)]" : ""
          }`}
        >
          <p
            className={`text-xs leading-relaxed ${
              valid === false
                ? "text-[var(--danger)]"
                : "text-[var(--fg-muted)]"
            }`}
          >
            {summary}
          </p>
        </div>
      )}

      {saved && percentile != null && !isPractice && (
        <div className="card rounded-sm px-5 py-3 text-center w-full">
          <p className="section-label">Saved to leaderboard</p>
          <p className="font-mono text-2xl text-[var(--fg)] mt-1">
            {rank != null ? `#${rank}` : "—"} · Top {percentile}%
          </p>
        </div>
      )}

      {isPractice && (
        <p className="text-[var(--fg-subtle)] text-xs text-center">
          Practice runs don&apos;t count toward the leaderboard
        </p>
      )}

      <div className="flex gap-2 w-full">
        {onPlayAgain && (
          <button onClick={onPlayAgain} className="btn-secondary flex-1 py-2.5">
            {isPractice ? "Try again" : "Home"}
          </button>
        )}
        {onShare && saved && !isPractice && (
          <button onClick={onShare} className="btn-primary flex-1 py-2.5">
            Share
          </button>
        )}
      </div>
    </div>
  );
}
