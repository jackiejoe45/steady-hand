import { NextResponse } from "next/server";
import { computeDailyAngle, getUtcTodayDateStr } from "@/lib/game/daily-angle";
import { getOrCreateDailyAngle } from "@/server/queries";

export async function GET() {
  try {
    const date = getUtcTodayDateStr();
    const stored = await getOrCreateDailyAngle(date);
    return NextResponse.json({
      date: stored.date,
      angleDegrees: stored.angleDegrees,
      axis: stored.axis,
    });
  } catch {
    // Fallback for local dev without DB
    const date = getUtcTodayDateStr();
    const { angle, axis } = computeDailyAngle(date);
    return NextResponse.json({
      date,
      angleDegrees: angle,
      axis,
    });
  }
}
