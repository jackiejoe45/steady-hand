"use client";

import Link from "next/link";
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

interface CurrentUserEntry {
  userId: string;
  displayName: string;
  scoreMad?: number;
  avgScore?: number;
  rank: number | null;
  percentile: number | null;
  gold?: number;
  silver?: number;
  bronze?: number;
  hasPlayed: boolean;
  valid?: boolean;
}

interface LeaderboardResponse {
  entries: LeaderboardEntry[];
  currentUser: CurrentUserEntry | null;
}

function UserScoreCard({
  tab,
  user,
}: {
  tab: Tab;
  user: CurrentUserEntry;
}) {
  if (!user.hasPlayed) {
    return (
      <div className="card rounded-sm px-4 py-3 mb-4 text-center">
        <p className="section-label">Your score</p>
        <p className="text-sm text-[var(--fg-muted)] mt-2">
          No attempt yet today
        </p>
        <Link
          href="/"
          className="inline-block mt-2 text-xs text-[var(--accent-teal)] hover:underline"
        >
          Play today&apos;s challenge
        </Link>
      </div>
    );
  }

  if (user.valid === false) {
    return (
      <div className="card rounded-sm px-4 py-3 mb-4 text-center border-[var(--danger)]">
        <p className="section-label">Your score</p>
        <p className="font-mono text-2xl text-[var(--fg)] mt-1">
          {user.scoreMad?.toFixed(2)}°
        </p>
        <p className="text-xs text-[var(--danger)] mt-1">
          Invalid attempt — not ranked
        </p>
      </div>
    );
  }

  return (
    <div className="card rounded-sm px-4 py-3 mb-4 border-[var(--accent-teal)]">
      <p className="section-label">Your score</p>
      <div className="flex items-center justify-between mt-2">
        <div>
          <p className="text-sm">{user.displayName}</p>
          {user.rank != null && user.percentile != null && tab !== "alltime" && (
            <p className="text-[0.65rem] text-[var(--fg-subtle)]">
              #{user.rank} · Top {user.percentile}%
            </p>
          )}
          {tab === "alltime" && user.rank != null && (
            <p className="text-[0.65rem] text-[var(--fg-subtle)]">
              #{user.rank} all-time
            </p>
          )}
        </div>
        <span className="font-mono text-xl text-[var(--accent-teal)]">
          {tab === "alltime"
            ? `${user.gold ?? 0}🥇 ${user.silver ?? 0}🥈`
            : tab === "weekly"
              ? `${user.avgScore?.toFixed(2) ?? "—"}°`
              : `${user.scoreMad?.toFixed(2) ?? "—"}°`}
        </span>
      </div>
    </div>
  );
}

function LeaderboardContent() {
  const { data: session } = useSession();
  const [tab, setTab] = useState<Tab>("daily");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUserEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ type: tab });
    if (session?.user.id) {
      params.set("userId", session.user.id);
    }
    fetch(`/api/leaderboard?${params}`)
      .then(async (r) => {
        const data = (await r.json()) as LeaderboardResponse & { error?: string };
        if (!r.ok) {
          throw new Error(data.error ?? "Failed to load leaderboard");
        }
        if (!Array.isArray(data.entries)) {
          throw new Error("Invalid leaderboard response");
        }
        if (data.error) {
          setError(data.error);
        }
        return data;
      })
      .then((data) => {
        setEntries(data.entries);
        setCurrentUser(data.currentUser ?? null);
        if (data.error) setError(data.error);
      })
      .catch((err: Error) => {
        setEntries([]);
        setCurrentUser(null);
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

      {session && currentUser && tab !== "friends" && (
        <UserScoreCard tab={tab} user={currentUser} />
      )}

      {session && tab === "friends" && currentUser && (
        <UserScoreCard tab="daily" user={currentUser} />
      )}

      {!session && (
        <div className="card rounded-sm px-4 py-3 mb-4 text-center">
          <p className="text-xs text-[var(--fg-muted)]">
            Sign in to save your score to the board
          </p>
          <Link
            href="/sign-in"
            className="inline-block mt-2 text-xs text-[var(--accent-teal)] hover:underline"
          >
            Sign in
          </Link>
        </div>
      )}

      {loading ? (
        <p className="section-label text-center animate-pulse-glow">Loading</p>
      ) : error ? (
        <p className="text-[var(--fg-muted)] text-sm text-center">{error}</p>
      ) : entries.length === 0 ? (
        <p className="text-[var(--fg-muted)] text-sm text-center">
          {tab === "friends" && !session
            ? "Sign in to see your friend leaderboard"
            : "No scores yet — be the first to play"}
        </p>
      ) : (
        <div className="space-y-1.5">
          {entries.slice(0, 100).map((entry, i) => {
            const isMe = session?.user.id === entry.userId;
            return (
              <div
                key={entry.userId + i}
                className={`card flex items-center gap-3 rounded-sm px-3 py-2.5 ${
                  isMe ? "border-[var(--accent-teal)] bg-[var(--bg-soft)]" : ""
                }`}
              >
                <span className="font-mono text-xs text-[var(--fg-subtle)] w-7">
                  #{entry.rank}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">
                    {entry.displayName}
                    {isMe && (
                      <span className="text-[var(--accent-teal)] ml-1">· you</span>
                    )}
                  </p>
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
            );
          })}
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
