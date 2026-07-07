import { NextResponse } from "next/server";
import { isDbConfigured } from "@/lib/db";
import { getUtcTodayDateStr } from "@/lib/game/daily-angle";
import {
  getLeaderboardWithUser,
  type CurrentUserLeaderboard,
  type LeaderboardEntry,
} from "@/server/queries";

function dbErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (
    message.includes("DATABASE_URL is not configured") ||
    message.includes("ENOTFOUND") ||
    message.includes("tenant/user")
  ) {
    return "Database connection failed. Set DATABASE_URL on Vercel (EU pooler URL).";
  }
  if (message.includes("relation") && message.includes("does not exist")) {
    return "Database tables missing. Run npm run db:push against your Supabase project.";
  }
  return "Failed to load leaderboard";
}

function serializeEntry(entry: LeaderboardEntry & Record<string, unknown>) {
  return {
    ...entry,
    submittedAt:
      entry.submittedAt instanceof Date
        ? entry.submittedAt.toISOString()
        : entry.submittedAt,
  };
}

function serializeResponse(result: {
  entries: Array<LeaderboardEntry & Record<string, unknown>>;
  currentUser: CurrentUserLeaderboard | null;
}) {
  return {
    entries: result.entries.map(serializeEntry),
    currentUser: result.currentUser,
  };
}

export async function GET(request: Request) {
  if (!isDbConfigured()) {
    return NextResponse.json({
      entries: [],
      currentUser: null,
      error: "Database not configured",
    });
  }

  try {
    const { searchParams } = new URL(request.url);
    const type = (searchParams.get("type") ?? "daily") as
      | "daily"
      | "weekly"
      | "alltime"
      | "friends";
    const userId = searchParams.get("userId") ?? undefined;
    const date = searchParams.get("date") ?? getUtcTodayDateStr();
    const groupId = searchParams.get("groupId") ?? undefined;

    if (type === "friends" && !userId) {
      return NextResponse.json({ entries: [], currentUser: null });
    }

    const result = await getLeaderboardWithUser(type, userId, date, groupId);
    return NextResponse.json(serializeResponse(result));
  } catch (error) {
    console.error("Leaderboard fetch failed:", error);
    return NextResponse.json({
      entries: [],
      currentUser: null,
      error: dbErrorMessage(error),
    });
  }
}
