"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

export interface FriendGroup {
  id: string;
  name: string;
  inviteCode: string;
  maxMembers: number;
  memberCount: number;
  isCreator: boolean;
  joinedAt: string;
  members: { userId: string; displayName: string }[];
}

interface FriendGroupsProps {
  compact?: boolean;
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const el = document.createElement("textarea");
    el.value = text;
    el.style.position = "fixed";
    el.style.opacity = "0";
    document.body.appendChild(el);
    el.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(el);
    return ok;
  }
}

export function FriendGroups({ compact = false }: FriendGroupsProps) {
  const [groups, setGroups] = useState<FriendGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [groupName, setGroupName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);

  const loadGroups = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/friends");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load groups");
      setGroups(data.groups ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load groups");
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  const handleCopy = async (group: FriendGroup) => {
    const ok = await copyText(group.inviteCode);
    if (ok) {
      setCopiedId(group.id);
      setMessage(`Copied ${group.inviteCode}`);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const createGroup = async () => {
    if (!groupName.trim()) return;
    setBusy("create");
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", name: groupName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create group");
      setGroups(data.groups ?? []);
      setGroupName("");
      setShowCreate(false);
      setMessage(`Created "${data.group.name}"`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create group");
    } finally {
      setBusy(null);
    }
  };

  const joinGroup = async () => {
    if (!inviteCode.trim()) return;
    setBusy("join");
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "join",
          inviteCode: inviteCode.trim().toUpperCase(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to join group");
      setGroups(data.groups ?? []);
      setInviteCode("");
      setShowJoin(false);
      setMessage(`Joined ${data.group.name}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to join group");
    } finally {
      setBusy(null);
    }
  };

  const leaveGroup = async (group: FriendGroup) => {
    if (!confirm(`Leave "${group.name}"?`)) return;
    setBusy(group.id);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "leave", groupId: group.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to leave group");
      setGroups(data.groups ?? []);
      setMessage(`Left ${group.name}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to leave group");
    } finally {
      setBusy(null);
    }
  };

  if (loading) {
    return (
      <p className="section-label text-center animate-pulse-glow py-4">
        Loading groups
      </p>
    );
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="section-label">Friend groups</p>
        {!compact && groups.length > 0 && (
          <Link
            href="/leaderboard"
            className="text-[0.65rem] text-[var(--accent-teal)] hover:underline"
          >
            View boards
          </Link>
        )}
      </div>

      {groups.length === 0 ? (
        <div className="card rounded-sm px-4 py-4 text-center">
          <p className="text-sm text-[var(--fg-muted)]">
            No groups yet — create one or join with an invite code
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {groups.map((group) => (
            <div key={group.id} className="card rounded-sm p-3 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{group.name}</p>
                  <p className="text-[0.65rem] text-[var(--fg-subtle)] mt-0.5">
                    {group.memberCount}/{group.maxMembers} members
                    {group.isCreator && " · you created this"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => leaveGroup(group)}
                  disabled={busy === group.id}
                  className="shrink-0 text-[0.65rem] text-[var(--fg-subtle)] hover:text-[var(--danger)] disabled:opacity-50"
                >
                  Leave
                </button>
              </div>

              <button
                type="button"
                onClick={() => handleCopy(group)}
                className="w-full rounded-sm border border-dashed border-[var(--border)] bg-[var(--bg-soft)] px-3 py-2.5 text-left transition-colors hover:border-[var(--accent-teal)] active:scale-[0.99]"
              >
                <p className="text-[0.6rem] tracking-[0.14em] uppercase text-[var(--fg-subtle)]">
                  {copiedId === group.id ? "Copied" : "Tap to copy invite code"}
                </p>
                <p className="font-mono text-lg tracking-[0.2em] text-[var(--accent-teal)] mt-1">
                  {group.inviteCode}
                </p>
              </button>

              {!compact && group.members.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {group.members.map((member) => (
                    <span
                      key={member.userId}
                      className="rounded-sm border border-[var(--border)] px-2 py-0.5 text-[0.65rem] text-[var(--fg-muted)]"
                    >
                      {member.displayName}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => {
            setShowCreate((v) => !v);
            setShowJoin(false);
          }}
          className={`btn-secondary flex-1 py-2.5 ${showCreate ? "border-[var(--accent-teal)]" : ""}`}
        >
          {showCreate ? "Cancel" : "Create group"}
        </button>
        <button
          type="button"
          onClick={() => {
            setShowJoin((v) => !v);
            setShowCreate(false);
          }}
          className={`btn-primary flex-1 py-2.5 ${showJoin ? "ring-1 ring-[var(--accent-teal)]" : ""}`}
        >
          {showJoin ? "Cancel" : "Join group"}
        </button>
      </div>

      {showCreate && (
        <div className="card rounded-sm p-3 space-y-2">
          <input
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Group name"
            maxLength={32}
            className="input-field w-full rounded-sm px-3 py-2.5 text-sm"
          />
          <button
            type="button"
            onClick={createGroup}
            disabled={busy === "create" || groupName.trim().length < 2}
            className="btn-secondary w-full py-2.5 disabled:opacity-50"
          >
            {busy === "create" ? "Creating…" : "Create (up to 5 members)"}
          </button>
        </div>
      )}

      {showJoin && (
        <div className="card rounded-sm p-3 space-y-2">
          <input
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
            placeholder="Invite code"
            maxLength={16}
            className="input-field w-full rounded-sm px-3 py-2.5 text-sm font-mono tracking-wider uppercase"
          />
          <button
            type="button"
            onClick={joinGroup}
            disabled={busy === "join" || inviteCode.trim().length < 4}
            className="btn-primary w-full py-2.5 disabled:opacity-50"
          >
            {busy === "join" ? "Joining…" : "Join with code"}
          </button>
        </div>
      )}

      {message && (
        <p className="text-xs text-[var(--accent-teal)] text-center">{message}</p>
      )}
      {error && (
        <p className="text-xs text-[var(--danger)] text-center">{error}</p>
      )}
    </section>
  );
}

/** Fetch groups for leaderboard group picker */
export function useFriendGroups() {
  const [groups, setGroups] = useState<FriendGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/friends")
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) return [];
        return data.groups ?? [];
      })
      .then(setGroups)
      .catch(() => setGroups([]))
      .finally(() => setLoading(false));
  }, []);

  return { groups, loading };
}
