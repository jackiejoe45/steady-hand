"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AuthButtons } from "@/components/AuthButtons";
import { FriendGroups } from "@/components/FriendGroups";
import { PageHeader } from "@/components/ui/PageHeader";
import { useSession } from "@/lib/auth-client";

interface ProfileData {
  profile: {
    displayName: string;
    streak: number;
    totalAttempts: number;
    personalBestMad: number | null;
    rankTier: string;
  } | null;
  gold: number;
  silver: number;
  bronze: number;
}

export default function ProfilePage() {
  const { data: session } = useSession();
  const [data, setData] = useState<ProfileData | null>(null);

  useEffect(() => {
    if (session) {
      fetch("/api/profile")
        .then((r) => r.json())
        .then(setData)
        .catch(() => null);
    }
  }, [session]);

  if (!session) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-5 px-4 pb-4">
        <PageHeader
          index="03 / Account"
          title="Profile"
          subtitle="Sign in to track streaks, medals, and personal best"
          compact
        />
        <AuthButtons />
        <Link
          href="/sign-in"
          className="text-xs text-[var(--fg-muted)] hover:text-[var(--accent-teal)]"
        >
          Sign in page
        </Link>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-4 max-w-lg mx-auto space-y-6">
      <PageHeader index="03 / Account" title="Profile" compact />

      {data?.profile && (
        <>
          <div className="text-center">
            <p className="font-serif text-2xl">{data.profile.displayName}</p>
            <span className="inline-block mt-2 border border-[var(--border)] px-3 py-0.5 text-[0.65rem] tracking-[0.14em] uppercase text-[var(--accent-teal)] capitalize">
              {data.profile.rankTier}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Streak", value: `${data.profile.streak} days` },
              {
                label: "Personal best",
                value: data.profile.personalBestMad
                  ? `${data.profile.personalBestMad.toFixed(2)}°`
                  : "—",
              },
              { label: "Attempts", value: data.profile.totalAttempts },
              {
                label: "Medals",
                value: `${data.gold}🥇 ${data.silver}🥈 ${data.bronze}🥉`,
              },
            ].map(({ label, value }) => (
              <div key={label} className="card rounded-sm p-3 text-center">
                <p className="section-label">{label}</p>
                <p className="font-mono text-sm mt-1">{value}</p>
              </div>
            ))}
          </div>
        </>
      )}

      <FriendGroups />

      <div className="editorial-rule" />
      <AuthButtons />
    </div>
  );
}
