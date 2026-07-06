import { and, asc, count, desc, eq, gte, sql } from "drizzle-orm";
import { db, requireDb } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import {
  computePercentileRank,
  computeRanks,
  getRankTier,
} from "@/lib/game/scoring";
import { computeDailyAngle, getUtcTodayDateStr } from "@/lib/game/daily-angle";

function generateId() {
  return crypto.randomUUID();
}

/** Read today's angle from DB — does not create */
export async function getDailyAngle(dateStr?: string) {
  const database = requireDb();
  const date = dateStr ?? getUtcTodayDateStr();
  const [existing] = await database
    .select()
    .from(schema.dailyAngles)
    .where(eq(schema.dailyAngles.date, date))
    .limit(1);

  return existing ?? null;
}

/** Create today's angle on first play; safe under concurrent requests */
export async function getOrCreateDailyAngle(dateStr?: string) {
  const database = requireDb();
  const date = dateStr ?? getUtcTodayDateStr();

  const existing = await getDailyAngle(date);
  if (existing) return existing;

  const { angle, axis } = computeDailyAngle(date);
  await database
    .insert(schema.dailyAngles)
    .values({
      date,
      angleDegrees: angle,
      axis,
    })
    .onConflictDoNothing();

  const created = await getDailyAngle(date);
  if (created) return created;

  throw new Error("Failed to create daily angle");
}

export function buildPerformanceSummary(params: {
  scoreMad: number;
  percentile: number;
  rank: number | null;
  playerCount: number;
  saved: boolean;
}): string {
  const { scoreMad, percentile, rank, playerCount, saved } = params;
  const score = scoreMad.toFixed(2);

  if (saved && rank != null) {
    return `Ranked #${rank} today — top ${percentile}% with ${score}° MAD`;
  }

  if (playerCount === 0) {
    return `${score}° — you'd be first on today's board. Sign in to save your score.`;
  }

  if (rank === 1) {
    return `${score}° — you'd rank #1 among ${playerCount} players today. Sign in to claim it.`;
  }

  return `${score}° — better than ${percentile}% of today's ${playerCount} players. Sign in to save your score.`;
}

/** Compare a score against today's leaderboard without persisting */
export async function compareScoreToDaily(scoreMad: number, dateStr?: string) {
  const date = dateStr ?? getUtcTodayDateStr();
  const leaderboard = await getDailyLeaderboard(date);
  const scores = leaderboard.map((e) => e.scoreMad);
  const percentile = computePercentileRank(scoreMad, scores);

  const rankAmong =
    scores.length === 0
      ? 1
      : scores.filter((s) => s < scoreMad).length + 1;

  const avgScore =
    scores.length > 0
      ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) /
        100
      : null;

  const bestScore = scores.length > 0 ? Math.min(...scores) : null;

  return {
    percentile,
    rank: rankAmong,
    playerCount: scores.length,
    avgScore,
    bestScore,
    summary: buildPerformanceSummary({
      scoreMad,
      percentile,
      rank: rankAmong,
      playerCount: scores.length,
      saved: false,
    }),
  };
}

export async function getDailyLeaderboard(dateStr?: string) {
  const database = requireDb();
  const date = dateStr ?? getUtcTodayDateStr();

  const rows = await database
    .select({
      userId: schema.attempts.userId,
      displayName: schema.profiles.displayName,
      avatarUrl: schema.profiles.avatarUrl,
      scoreMad: schema.attempts.scoreMad,
      submittedAt: schema.attempts.submittedAt,
    })
    .from(schema.attempts)
    .innerJoin(schema.profiles, eq(schema.attempts.userId, schema.profiles.userId))
    .where(
      and(
        eq(schema.attempts.date, date),
        eq(schema.attempts.isPractice, false),
        eq(schema.attempts.valid, true),
      ),
    )
    .orderBy(asc(schema.attempts.scoreMad));

  const scores = rows.map((r) => r.scoreMad);
  const ranks = computeRanks(rows.map((r) => ({ userId: r.userId, score: r.scoreMad })));

  return rows.map((row) => ({
    ...row,
    rank: ranks.get(row.userId) ?? 0,
    percentile: computePercentileRank(row.scoreMad, scores),
  }));
}

export async function getWeeklyLeaderboard() {
  const database = requireDb();
  const weekAgo = new Date();
  weekAgo.setUTCDate(weekAgo.getUTCDate() - 7);
  const weekAgoStr = weekAgo.toISOString().slice(0, 10);

  const rows = await database
    .select({
      userId: schema.attempts.userId,
      displayName: schema.profiles.displayName,
      avatarUrl: schema.profiles.avatarUrl,
      avgScore: sql<number>`avg(${schema.attempts.scoreMad})`.mapWith(Number),
      attemptCount: count(),
    })
    .from(schema.attempts)
    .innerJoin(schema.profiles, eq(schema.attempts.userId, schema.profiles.userId))
    .where(
      and(
        gte(schema.attempts.date, weekAgoStr),
        eq(schema.attempts.isPractice, false),
        eq(schema.attempts.valid, true),
      ),
    )
    .groupBy(
      schema.attempts.userId,
      schema.profiles.displayName,
      schema.profiles.avatarUrl,
    )
    .orderBy(sql`avg(${schema.attempts.scoreMad}) asc`);

  const scores = rows.map((r) => r.avgScore);
  return rows.map((row, i) => ({
    ...row,
    rank: i + 1,
    percentile: computePercentileRank(row.avgScore, scores),
  }));
}

export async function getAllTimeLeaderboard() {
  const database = requireDb();

  const rows = await database
    .select({
      userId: schema.profiles.userId,
      displayName: schema.profiles.displayName,
      avatarUrl: schema.profiles.avatarUrl,
      gold: sql<number>`count(case when ${schema.medals.medalType} = 'gold' then 1 end)`.mapWith(Number),
      silver: sql<number>`count(case when ${schema.medals.medalType} = 'silver' then 1 end)`.mapWith(Number),
      bronze: sql<number>`count(case when ${schema.medals.medalType} = 'bronze' then 1 end)`.mapWith(Number),
      totalMedals: count(schema.medals.id),
    })
    .from(schema.profiles)
    .leftJoin(schema.medals, eq(schema.profiles.userId, schema.medals.userId))
    .groupBy(
      schema.profiles.userId,
      schema.profiles.displayName,
      schema.profiles.avatarUrl,
    )
    .orderBy(
      desc(sql`count(case when ${schema.medals.medalType} = 'gold' then 1 end)`),
      desc(sql`count(case when ${schema.medals.medalType} = 'silver' then 1 end)`),
      desc(sql`count(case when ${schema.medals.medalType} = 'bronze' then 1 end)`),
    )
    .limit(100);

  return rows;
}

export async function submitAttempt(params: {
  userId: string;
  date: string;
  scoreMad: number;
  samples: unknown;
  deviceModel?: string;
  isPractice: boolean;
  valid: boolean;
  tremorFlag: boolean;
}) {
  const database = requireDb();

  if (!params.isPractice) {
    const [existing] = await database
      .select()
      .from(schema.attempts)
      .where(
        and(
          eq(schema.attempts.userId, params.userId),
          eq(schema.attempts.date, params.date),
          eq(schema.attempts.isPractice, false),
        ),
      )
      .limit(1);

    if (existing) {
      throw new Error("Already submitted today's attempt");
    }
  }

  const id = generateId();
  await database.insert(schema.attempts).values({
    id,
    userId: params.userId,
    date: params.date,
    scoreMad: params.scoreMad,
    deviceModel: params.deviceModel,
    isPractice: params.isPractice,
    valid: params.valid,
    tremorFlag: params.tremorFlag,
    rawSamples: params.isPractice ? null : params.samples,
  });

  if (!params.isPractice && params.valid) {
    await updateProfileAfterAttempt(params.userId, params.scoreMad, params.date);
  }

  const leaderboard = await getDailyLeaderboard(params.date);
  const entry = leaderboard.find((e) => e.userId === params.userId);

  const percentile = entry?.percentile ?? null;
  const rank = entry?.rank ?? null;

  return {
    attemptId: id,
    percentile,
    rank,
    saved: true,
    summary: buildPerformanceSummary({
      scoreMad: params.scoreMad,
      percentile: percentile ?? 100,
      rank,
      playerCount: leaderboard.length,
      saved: true,
    }),
  };
}

async function updateProfileAfterAttempt(
  userId: string,
  scoreMad: number,
  date: string,
) {
  const database = requireDb();
  const [profile] = await database
    .select()
    .from(schema.profiles)
    .where(eq(schema.profiles.userId, userId))
    .limit(1);

  if (!profile) return;

  const newBest =
    profile.personalBestMad == null
      ? scoreMad
      : Math.min(profile.personalBestMad, scoreMad);

  const yesterday = new Date(`${date}T00:00:00Z`);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  const [yesterdayAttempt] = await database
    .select()
    .from(schema.attempts)
    .where(
      and(
        eq(schema.attempts.userId, userId),
        eq(schema.attempts.date, yesterdayStr),
        eq(schema.attempts.isPractice, false),
        eq(schema.attempts.valid, true),
      ),
    )
    .limit(1);

  const newStreak = yesterdayAttempt ? profile.streak + 1 : 1;

  const [{ medalCount }] = await database
    .select({ medalCount: count() })
    .from(schema.medals)
    .where(eq(schema.medals.userId, userId));

  await database
    .update(schema.profiles)
    .set({
      personalBestMad: newBest,
      streak: newStreak,
      totalAttempts: profile.totalAttempts + 1,
      rankTier: getRankTier(Number(medalCount)) as
        | "bronze"
        | "silver"
        | "gold"
        | "platinum"
        | "diamond",
    })
    .where(eq(schema.profiles.userId, userId));
}

export async function getUserProfile(userId: string) {
  const database = requireDb();
  const [profile] = await database
    .select()
    .from(schema.profiles)
    .where(eq(schema.profiles.userId, userId))
    .limit(1);

  const userMedals = await database
    .select()
    .from(schema.medals)
    .where(eq(schema.medals.userId, userId))
    .orderBy(desc(schema.medals.date));

  const gold = userMedals.filter((m) => m.medalType === "gold").length;
  const silver = userMedals.filter((m) => m.medalType === "silver").length;
  const bronze = userMedals.filter((m) => m.medalType === "bronze").length;

  return { profile, medals: userMedals, gold, silver, bronze };
}

export async function assignDailyMedals(dateStr: string) {
  const database = requireDb();
  const leaderboard = await getDailyLeaderboard(dateStr);
  const medalTypes: ("gold" | "silver" | "bronze")[] = ["gold", "silver", "bronze"];

  for (let i = 0; i < Math.min(3, leaderboard.length); i++) {
    const entry = leaderboard[i]!;
    await database
      .insert(schema.medals)
      .values({
        id: generateId(),
        userId: entry.userId,
        date: dateStr,
        medalType: medalTypes[i]!,
      })
      .onConflictDoNothing();
  }
}

export async function createFriendGroup(userId: string, name: string) {
  const database = requireDb();
  const id = generateId();
  const inviteCode = generateId().slice(0, 8).toUpperCase();

  await database.insert(schema.friendGroups).values({
    id,
    name,
    inviteCode,
    createdBy: userId,
    maxMembers: 5,
  });

  await database.insert(schema.friendGroupMembers).values({
    groupId: id,
    userId,
  });

  return { id, inviteCode };
}

export async function joinFriendGroup(userId: string, inviteCode: string) {
  const database = requireDb();
  const [group] = await database
    .select()
    .from(schema.friendGroups)
    .where(eq(schema.friendGroups.inviteCode, inviteCode.toUpperCase()))
    .limit(1);

  if (!group) throw new Error("Group not found");

  const [{ memberCount }] = await database
    .select({ memberCount: count() })
    .from(schema.friendGroupMembers)
    .where(eq(schema.friendGroupMembers.groupId, group.id));

  if (Number(memberCount) >= group.maxMembers) {
    throw new Error("Group is full");
  }

  await database
    .insert(schema.friendGroupMembers)
    .values({ groupId: group.id, userId })
    .onConflictDoNothing();

  return group;
}

export async function getFriendLeaderboard(userId: string, dateStr?: string) {
  const database = requireDb();
  const date = dateStr ?? getUtcTodayDateStr();

  const memberships = await database
    .select({ groupId: schema.friendGroupMembers.groupId })
    .from(schema.friendGroupMembers)
    .where(eq(schema.friendGroupMembers.userId, userId));

  if (memberships.length === 0) return [];

  const groupIds = memberships.map((m) => m.groupId);
  const members = await database
    .select({ userId: schema.friendGroupMembers.userId })
    .from(schema.friendGroupMembers)
    .where(
      sql`${schema.friendGroupMembers.groupId} in (${sql.join(
        groupIds.map((id) => sql`${id}`),
        sql`, `,
      )})`,
    );

  const memberIds = [...new Set(members.map((m) => m.userId))];
  const allScores = await getDailyLeaderboard(date);
  return allScores.filter((s) => memberIds.includes(s.userId));
}
