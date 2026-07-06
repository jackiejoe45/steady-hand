#!/usr/bin/env tsx
/**
 * Seed beta leaderboard data for cold-start testing.
 * Usage: DATABASE_URL=... npx tsx scripts/seed-beta.ts
 */
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../src/lib/db/schema";
import { computeDailyAngle, getUtcTodayDateStr } from "../src/lib/game/daily-angle";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL required");
  process.exit(1);
}

const client = postgres(connectionString, { prepare: false });
const db = drizzle(client, { schema });

async function seed() {
  const date = getUtcTodayDateStr();
  const { angle, axis } = computeDailyAngle(date);

  await db
    .insert(schema.dailyAngles)
    .values({ date, angleDegrees: angle, axis })
    .onConflictDoNothing();

  const names = [
    "SteadySam", "TiltTina", "CalmCarlos", "ZenZara", "HoldHannah",
    "BalanceBen", "LevelLeo", "FlatFiona", "TrueTyler", "AxisAlex",
  ];

  for (let i = 0; i < names.length; i++) {
    const userId = crypto.randomUUID();
    await db.insert(schema.user).values({
      id: userId,
      name: names[i]!,
      email: `beta${i}@steadyhand.test`,
      emailVerified: true,
    });
    await db.insert(schema.profiles).values({
      userId,
      displayName: names[i]!,
    });
    await db.insert(schema.attempts).values({
      id: crypto.randomUUID(),
      userId,
      date,
      scoreMad: 0.2 + Math.random() * 1.5,
      valid: true,
      isPractice: false,
    });
  }

  console.log(`Seeded ${names.length} beta users for ${date}`);
  await client.end();
}

seed().catch(console.error);
