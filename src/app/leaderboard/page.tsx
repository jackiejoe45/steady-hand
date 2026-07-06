"use client";

import { Suspense, useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { useSession } from "@/lib/auth-client";

type Tab = "daily" | "weekly" | "alltime" | "friends";

interface LeaderboardEntry {
  userId: string;
  displayName: string;
  avatarUrl?: string | null;
  scoreMad?: number;
  avgScore?: number;
  rank: number;
  percentile: number;
  gold?: number;
  silver?: number;
  bronze?: number;
}

function LeaderboardContent() {
  const { data: session } = useSession();
  const [tab, setTab] = useState<Tab>("daily");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ type: tab });
    if (tab === "friends" && session?.user.id) {
      params.set("userId", session.user.id);
    }
    fetch(`/api/leaderboard?${params}`)
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) {
          throw new Error(
            typeof data?.error === "string"
              ? data.error
              : "Failed to load leaderboard",
          );
        }
        if (!Array.isArray(data)) {
          throw new Error("Invalid leaderboard response");
        }
        return data as LeaderboardEntry[];
      })
      .then(setEntries)
      .catch((err: Error) => {
        setEntries([]);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [tab, session?.user.id]);

  const tabs: { id: Tab; label: string }[] = [
    { id: "daily", label: "Daily" },
    { id: "weekly", label: "Weekly" },
    { id: "alltime", label: "All-Time" },
    { id: "friends", label: "Friends" },
  ];

  return (
    <div className="h-full overflow-y-auto px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-4 max-w-lg mx-auto">
      <PageHeader index="02 / Rankings" title="Leaderboard" compact />

      <div className="flex gap-1.5 mt-5 mb-4 overflow-x-auto">
        {tabs.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`px-3 py-1.5 text-[0.65rem] tracking-[0.12em] uppercase whitespace-nowrap border transition-colors ${
              tab === id
                ? "border-[var(--accent-teal)] text-[var(--accent-teal)] bg-[var(--bg-soft)]"
                : "border-[var(--border)] text-[var(--fg-subtle)] hover:text-[var(--fg-muted)]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="section-label text-center animate-pulse-glow">Loading</p>
      ) : error ? (
        <p className="text-[var(--fg-muted)] text-sm text-center">{error}</p>
      ) : entries.length === 0 ? (
        <p className="text-[var(--fg-muted)] text-sm text-center">
          {tab === "friends" && !session
            ? "Sign in to see your friend leaderboard"
            : "No scores yet"}
        </p>
      ) : (
        <div className="space-y-1.5">
          {entries.slice(0, 100).map((entry, i) => (
            <div
              key={entry.userId + i}
              className="card flex items-center gap-3 rounded-sm px-3 py-2.5"
            >
              <span className="font-mono text-xs text-[var(--fg-subtle)] w-7">
                #{entry.rank}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{entry.displayName}</p>
                <p className="text-[0.65rem] text-[var(--fg-subtle)]">
                  Top {entry.percentile}%
                </p>
              </div>
              <span className="font-mono text-sm text-[var(--accent-teal)]">
                {tab === "alltime"
                  ? `${entry.gold ?? 0}🥇 ${entry.silver ?? 0}🥈`
                  : `${(entry.scoreMad ?? entry.avgScore ?? 0).toFixed(2)}°`}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function LeaderboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center">
          <p className="section-label animate-pulse-glow">Loading</p>
        </div>
      }
    >
      <LeaderboardContent />
    </Suspense>
  );
}
