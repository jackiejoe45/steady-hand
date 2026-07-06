import { createHash } from "crypto";
import { format } from "date-fns";
import { GAME_CONFIG, type Axis } from "./constants";

/** SHA-256 hash as bigint seed */
function hashSeed(input: string): number {
  const hash = createHash("sha256").update(input).digest();
  return hash.readUInt32BE(0);
}

/** Deterministic daily angle from date string YYYY-MM-DD */
export function computeDailyAngle(dateStr: string): {
  angle: number;
  axis: Axis;
} {
  const seed = hashSeed(`steadyhand${dateStr}`);
  const range = GAME_CONFIG.angleMax - GAME_CONFIG.angleMin + 1;
  const angle = GAME_CONFIG.angleMin + (seed % range);

  // Alternates pitch/roll weekly based on ISO week number
  const date = new Date(`${dateStr}T00:00:00Z`);
  const weekNum = getISOWeek(date);
  const axis: Axis = weekNum % 2 === 0 ? "pitch" : "roll";

  return { angle, axis };
}

function getISOWeek(date: Date): number {
  const d = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(
    ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
  );
}

export function getTodayDateStr(): string {
  return format(new Date(), "yyyy-MM-dd");
}

export function getUtcTodayDateStr(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Check angle hasn't repeated within 30-day window (for cron validation) */
export function validateNoRepeat(
  dateStr: string,
  recentAngles: number[],
): boolean {
  const { angle } = computeDailyAngle(dateStr);
  return !recentAngles.includes(angle);
}
