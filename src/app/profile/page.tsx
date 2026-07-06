"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AuthButtons } from "@/components/AuthButtons";
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
  const [inviteCode, setInviteCode] = useState("");
  const [groupName, setGroupName] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (session) {
      fetch("/api/profile")
        .then((r) => r.json())
        .then(setData)
        .catch(() => null);
    }
  }, [session]);

  const createGroup = async () => {
    const res = await fetch("/api/friends", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create", name: groupName }),
    });
    const result = await res.json();
    setMessage(`Group created! Invite code: ${result.inviteCode}`);
  };

  const joinGroup = async () => {
    const res = await fetch("/api/friends", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "join", inviteCode }),
    });
    const result = await res.json();
    setMessage(result.error ?? `Joined ${result.name}!`);
  };

  if (!session) {
    return (
      <div className="flex flex-col items-center gap-6 px-4 pb-24 pt-12">
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="text-zinc-500 text-center">
          Sign in to track your streak, medals, and personal best
        </p>
        <AuthButtons />
        <Link href="/sign-in" className="text-[#4FC3F7] text-sm underline">
          Sign in page
        </Link>
      </div>
    );
  }

  return (
    <div className="px-4 pb-24 pt-8 max-w-lg mx-auto space-y-8">
      <h1 className="text-2xl font-bold">Profile</h1>

      {data?.profile && (
        <>
          <div className="text-center">
            <p className="text-2xl font-bold">{data.profile.displayName}</p>
            <span className="inline-block mt-2 rounded-full bg-zinc-800 px-3 py-1 text-xs capitalize text-[#4FC3F7]">
              {data.profile.rankTier}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Streak", value: `${data.profile.streak} days` },
              {
                label: "Personal Best",
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
              <div
                key={label}
                className="rounded-xl bg-zinc-900 border border-zinc-800 p-4 text-center"
              >
                <p className="text-zinc-500 text-xs uppercase">{label}</p>
                <p className="font-mono text-lg mt-1">{value}</p>
              </div>
            ))}
          </div>
        </>
      )}

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Friend Groups</h2>
        <div className="space-y-3">
          <input
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="New group name"
            className="w-full rounded-xl bg-zinc-900 border border-zinc-700 px-4 py-3 text-white placeholder:text-zinc-600"
          />
          <button
            onClick={createGroup}
            className="w-full rounded-xl bg-zinc-800 hover:bg-zinc-700 py-3 font-medium transition-colors"
          >
            Create Group (free, up to 5)
          </button>
          <input
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            placeholder="Invite code"
            className="w-full rounded-xl bg-zinc-900 border border-zinc-700 px-4 py-3 text-white placeholder:text-zinc-600"
          />
          <button
            onClick={joinGroup}
            className="w-full rounded-xl bg-[#4FC3F7] hover:bg-[#29B6F6] text-black py-3 font-medium transition-colors"
          >
            Join Group
          </button>
        </div>
        {message && <p className="text-sm text-[#4FC3F7]">{message}</p>}
      </section>

      <AuthButtons />
    </div>
  );
}
