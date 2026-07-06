"use client";

import { Suspense, useEffect, useState } from "react";
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
            typeof data?.error === "string" ? data.error : "Failed to load leaderboard",
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
    <div className="px-4 pb-24 pt-8 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-6">Leaderboard</h1>

      <div className="flex gap-2 mb-6 overflow-x-auto">
        {tabs.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              tab === id
                ? "bg-[#4FC3F7] text-black"
                : "bg-zinc-800 text-zinc-400 hover:text-white"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-zinc-500 text-center font-mono animate-pulse">
          Loading...
        </p>
      ) : error ? (
        <p className="text-zinc-500 text-center">{error}</p>
      ) : entries.length === 0 ? (
        <p className="text-zinc-500 text-center">
          {tab === "friends" && !session
            ? "Sign in to see your friend leaderboard"
            : "No scores yet"}
        </p>
      ) : (
        <div className="space-y-2">
          {entries.slice(0, 100).map((entry, i) => (
            <div
              key={entry.userId + i}
              className="flex items-center gap-3 rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-3"
            >
              <span className="font-mono text-zinc-500 w-8">#{entry.rank}</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{entry.displayName}</p>
                <p className="text-xs text-zinc-500">
                  Top {entry.percentile}%
                </p>
              </div>
              <span className="font-mono text-[#4FC3F7]">
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
    <Suspense fallback={<div className="text-center pt-8 text-zinc-500">Loading...</div>}>
      <LeaderboardContent />
    </Suspense>
  );
}
