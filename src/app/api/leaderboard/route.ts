import { NextResponse } from "next/server";
import { getUtcTodayDateStr } from "@/lib/game/daily-angle";
import {
  getAllTimeLeaderboard,
  getDailyLeaderboard,
  getFriendLeaderboard,
  getWeeklyLeaderboard,
} from "@/server/queries";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") ?? "daily";
    const userId = searchParams.get("userId");
    const date = searchParams.get("date") ?? getUtcTodayDateStr();

    switch (type) {
      case "daily":
        return NextResponse.json(await getDailyLeaderboard(date));
      case "weekly":
        return NextResponse.json(await getWeeklyLeaderboard());
      case "alltime":
        return NextResponse.json(await getAllTimeLeaderboard());
      case "friends":
        if (!userId) {
          return NextResponse.json([]);
        }
        return NextResponse.json(await getFriendLeaderboard(userId, date));
      default:
        return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }
  } catch (error) {
    console.error("Leaderboard fetch failed:", error);
    return NextResponse.json([], { status: 200 });
  }
}
