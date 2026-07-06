import { NextResponse } from "next/server";
import { getUtcTodayDateStr } from "@/lib/game/daily-angle";
import { getLeaderboardWithUser } from "@/server/queries";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = (searchParams.get("type") ?? "daily") as
      | "daily"
      | "weekly"
      | "alltime"
      | "friends";
    const userId = searchParams.get("userId") ?? undefined;
    const date = searchParams.get("date") ?? getUtcTodayDateStr();

    if (type === "friends" && !userId) {
      return NextResponse.json({ entries: [], currentUser: null });
    }

    const result = await getLeaderboardWithUser(type, userId, date);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Leaderboard fetch failed:", error);
    return NextResponse.json(
      { entries: [], currentUser: null, error: "Failed to load leaderboard" },
      { status: 500 },
    );
  }
}
