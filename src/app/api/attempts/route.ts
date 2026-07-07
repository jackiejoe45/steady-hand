import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { getUtcTodayDateStr } from "@/lib/game/daily-angle";
import {
  computeWeightedMAD,
  detectSurfaceCheat,
  downsample,
  isDisallowedLeaderboardScore,
  isHoldPostureValid,
} from "@/lib/game/scoring";
import {
  compareScoreToDaily,
  getOrCreateDailyAngle,
  submitAttempt,
  buildPerformanceSummary,
} from "@/server/queries";
import type { Axis, TiltSample } from "@/lib/game/constants";

const attemptSchema = z.object({
  samples: z.array(
    z.object({
      timestamp: z.number(),
      pitch: z.number(),
      roll: z.number(),
    }),
  ),
  deviceModel: z.string().optional(),
  isPractice: z.boolean().default(false),
});

export async function POST(request: Request) {
  try {
    const session = await getSession(await headers());
    const body = await request.json();
    const parsed = attemptSchema.parse(body);

    const date = getUtcTodayDateStr();
    const dailyAngle = await getOrCreateDailyAngle(date);

    const downsampled = downsample(parsed.samples as TiltSample[]);
    const axis = dailyAngle.axis as Axis;

    const portraitInvalid = downsampled.some(
      (s) => !isHoldPostureValid(s, axis),
    );
    const tremorFlag = detectSurfaceCheat(downsampled, axis);
    const scoreMad = computeWeightedMAD(
      downsampled,
      dailyAngle.angleDegrees,
      axis,
    );
    const suspiciouslyLow = isDisallowedLeaderboardScore(scoreMad);

    const valid = !portraitInvalid && !tremorFlag && !suspiciouslyLow;
    const invalidReason = valid
      ? null
      : portraitInvalid
        ? "posture"
        : tremorFlag
          ? "surface"
          : suspiciouslyLow
            ? "too_good"
            : null;

    if (parsed.isPractice) {
      return NextResponse.json({
        scoreMad,
        valid,
        tremorFlag,
        portraitInvalid,
        invalidReason,
        isPractice: true,
        saved: false,
      });
    }

    if (!session) {
      const comparison = await compareScoreToDaily(scoreMad, date);
      return NextResponse.json({
        scoreMad,
        valid,
        tremorFlag,
        portraitInvalid,
        invalidReason,
        saved: false,
        ...comparison,
        summary: valid
          ? comparison.summary
          : buildPerformanceSummary({
              scoreMad,
              percentile: comparison.percentile,
              rank: comparison.rank,
              playerCount: comparison.playerCount,
              saved: false,
              valid: false,
              invalidReason,
            }),
      });
    }

    const result = await submitAttempt({
      userId: session.user.id,
      date,
      scoreMad,
      samples: downsampled,
      deviceModel: parsed.deviceModel,
      isPractice: false,
      valid,
      tremorFlag,
      portraitInvalid,
      suspiciouslyLow,
    });

    return NextResponse.json({
      ...result,
      scoreMad,
      valid,
      tremorFlag,
      portraitInvalid,
      invalidReason,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Submission failed";
    const status =
      message === "Already submitted today's attempt"
        ? 409
        : message === "Unauthorized"
          ? 401
          : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
