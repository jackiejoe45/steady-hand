import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { getUtcTodayDateStr } from "@/lib/game/daily-angle";
import {
  computeWeightedMAD,
  detectSurfaceCheat,
  downsample,
  isPortraitValid,
} from "@/lib/game/scoring";
import {
  compareScoreToDaily,
  getOrCreateDailyAngle,
  submitAttempt,
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
      (s) => !isPortraitValid(s.pitch),
    );
    const tremorFlag = detectSurfaceCheat(downsampled, axis);
    const scoreMad = computeWeightedMAD(
      downsampled,
      dailyAngle.angleDegrees,
      axis,
    );

    const valid = !portraitInvalid && !tremorFlag;

    if (parsed.isPractice) {
      return NextResponse.json({
        scoreMad,
        valid,
        tremorFlag,
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
        saved: false,
        ...comparison,
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
    });

    return NextResponse.json({
      scoreMad,
      valid,
      tremorFlag,
      ...result,
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
