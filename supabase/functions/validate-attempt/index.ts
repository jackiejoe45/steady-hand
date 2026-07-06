import { createHash } from "node:crypto";

interface Sample {
  timestamp: number;
  pitch: number;
  roll: number;
}

function computeWeightedMAD(
  samples: Sample[],
  target: number,
  axis: "pitch" | "roll",
): number {
  if (samples.length === 0) return 999;
  let weightedSum = 0;
  let totalWeight = 0;
  const tolerance = 2;
  const driftWeight = 3;

  for (const s of samples) {
    const value = axis === "pitch" ? s.pitch : s.roll;
    const deviation = Math.abs(value - target);
    const weight = deviation <= tolerance ? 1 : driftWeight;
    weightedSum += deviation * weight;
    totalWeight += weight;
  }
  return Math.round((weightedSum / totalWeight) * 100) / 100;
}

function detectSurfaceCheat(samples: Sample[], axis: "pitch" | "roll"): boolean {
  if (samples.length < 10) return false;
  const windowMs = 100;
  let lowTremorMs = 0;

  for (let i = 10; i < samples.length; i++) {
    const window = samples.slice(Math.max(0, i - 20), i + 1);
    const values = window.map((s) => (axis === "pitch" ? s.pitch : s.roll));
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance =
      values.reduce((acc, v) => acc + (v - mean) ** 2, 0) / values.length;
    const sd = Math.sqrt(variance);

    if (sd < 0.01) {
      lowTremorMs += 50;
    } else {
      lowTremorMs = 0;
    }
    if (lowTremorMs >= 500) return true;
  }
  return false;
}

function computeDailyAngle(dateStr: string): { angle: number; axis: string } {
  const hash = createHash("sha256").update(`steadyhand${dateStr}`).digest();
  let seed = 0n;
  for (let i = 0; i < 8; i++) seed = (seed << 8n) | BigInt(hash[i]!);
  const angle = 15 + Number(seed % 61n);
  const date = new Date(`${dateStr}T00:00:00Z`);
  const weekNum = Math.ceil(
    ((date.getTime() - new Date(Date.UTC(date.getUTCFullYear(), 0, 1)).getTime()) /
      86400000 +
      1) /
      7,
  );
  return { angle, axis: weekNum % 2 === 0 ? "pitch" : "roll" };
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
    });
  }

  try {
    const body = await req.json();
    const { date, samples, deviceModel } = body as {
      date: string;
      samples: Sample[];
      deviceModel?: string;
    };

    const daily = computeDailyAngle(date);
    const tremorFlag = detectSurfaceCheat(samples, daily.axis as "pitch" | "roll");
    const scoreMad = computeWeightedMAD(
      samples,
      daily.angle,
      daily.axis as "pitch" | "roll",
    );

    const portraitInvalid = samples.some(
      (s) => Math.abs(s.pitch - 90) > 30,
    );

    return new Response(
      JSON.stringify({
        scoreMad,
        valid: !tremorFlag && !portraitInvalid,
        tremorFlag,
        angle: daily.angle,
        axis: daily.axis,
        deviceModel,
      }),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Validation failed" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }
});
