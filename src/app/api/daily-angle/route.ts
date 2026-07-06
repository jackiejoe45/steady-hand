import { NextResponse } from "next/server";
import { computeDailyAngle, getUtcTodayDateStr } from "@/lib/game/daily-angle";
import { getDailyAngle, getOrCreateDailyAngle } from "@/server/queries";

export async function GET() {
  const date = getUtcTodayDateStr();

  try {
    const stored = await getDailyAngle(date);
    if (stored) {
      return NextResponse.json({
        date: stored.date,
        angleDegrees: stored.angleDegrees,
        axis: stored.axis,
        exists: true,
      });
    }

    return NextResponse.json({ date, exists: false });
  } catch {
    return NextResponse.json({ date, exists: false });
  }
}

/** First player of the day creates the angle in Supabase */
export async function POST() {
  const date = getUtcTodayDateStr();

  try {
    const stored = await getOrCreateDailyAngle(date);
    return NextResponse.json({
      date: stored.date,
      angleDegrees: stored.angleDegrees,
      axis: stored.axis,
      exists: true,
    });
  } catch {
    const { angle, axis } = computeDailyAngle(date);
    return NextResponse.json({
      date,
      angleDegrees: angle,
      axis,
      exists: true,
      fallback: true,
    });
  }
}
