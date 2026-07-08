import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { computeDailyAngle, getUtcTodayDateStr } from "@/lib/game/daily-angle";
import {
  getDailyAngle,
  getOrCreateDailyAngle,
  getUserDailyAttempt,
} from "@/server/queries";

export async function GET() {
  const date = getUtcTodayDateStr();
  const session = await getSession(await headers());

  try {
    const stored = await getDailyAngle(date);
    let userAttempt = null;

    if (session) {
      try {
        userAttempt = await getUserDailyAttempt(session.user.id, date);
      } catch {
        userAttempt = null;
      }
    }

    if (stored) {
      return NextResponse.json({
        date: stored.date,
        angleDegrees: stored.angleDegrees,
        axis: stored.axis,
        exists: true,
        userAttempt,
      });
    }

    return NextResponse.json({ date, exists: false, userAttempt });
  } catch {
    return NextResponse.json({ date, exists: false, userAttempt: null });
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
