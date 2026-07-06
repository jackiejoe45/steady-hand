import { relations, sql } from "drizzle-orm";
import {
  boolean,
  date,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// ─── Better Auth tables ───────────────────────────────────────────────────────

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expiresAt").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
  refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
});

export const userRelations = relations(user, ({ many, one }) => ({
  sessions: many(session),
  accounts: many(account),
  profile: one(profiles),
  attempts: many(attempts),
  medals: many(medals),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, { fields: [session.userId], references: [user.id] }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, { fields: [account.userId], references: [user.id] }),
}));

// ─── Domain tables ────────────────────────────────────────────────────────────

export const axisEnum = pgEnum("axis", ["pitch", "roll"]);
export const medalTypeEnum = pgEnum("medal_type", ["gold", "silver", "bronze"]);
export const rankTierEnum = pgEnum("rank_tier", [
  "bronze",
  "silver",
  "gold",
  "platinum",
  "diamond",
]);

export const profiles = pgTable("profiles", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  displayName: text("display_name").notNull(),
  avatarUrl: text("avatar_url"),
  streak: integer("streak").notNull().default(0),
  totalAttempts: integer("total_attempts").notNull().default(0),
  personalBestMad: doublePrecision("personal_best_mad"),
  rankTier: rankTierEnum("rank_tier").notNull().default("bronze"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const dailyAngles = pgTable("daily_angles", {
  date: date("date").primaryKey(),
  angleDegrees: doublePrecision("angle_degrees").notNull(),
  axis: axisEnum("axis").notNull(),
});

export const attempts = pgTable(
  "attempts",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    date: date("date").notNull(),
    scoreMad: doublePrecision("score_mad").notNull(),
    submittedAt: timestamp("submitted_at").notNull().defaultNow(),
    valid: boolean("valid").notNull().default(true),
    tremorFlag: boolean("tremor_flag").notNull().default(false),
    deviceModel: text("device_model"),
    isPractice: boolean("is_practice").notNull().default(false),
    rawSamples: jsonb("raw_samples"),
  },
  (table) => [
    uniqueIndex("attempts_user_date_competitive_idx")
      .on(table.userId, table.date)
      .where(sql`${table.isPractice} = false`),
    index("attempts_date_score_idx").on(table.date, table.scoreMad),
    index("attempts_user_id_idx").on(table.userId),
  ],
);

export const medals = pgTable(
  "medals",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    date: date("date").notNull(),
    medalType: medalTypeEnum("medal_type").notNull(),
  },
  (table) => [
    uniqueIndex("medals_user_date_idx").on(table.userId, table.date),
    index("medals_user_id_idx").on(table.userId),
  ],
);

export const friendGroups = pgTable("friend_groups", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  inviteCode: text("invite_code").notNull().unique(),
  createdBy: text("created_by")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  maxMembers: integer("max_members").notNull().default(5),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const friendGroupMembers = pgTable(
  "friend_group_members",
  {
    groupId: text("group_id")
      .notNull()
      .references(() => friendGroups.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    joinedAt: timestamp("joined_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("friend_group_members_group_user_idx").on(
      table.groupId,
      table.userId,
    ),
  ],
);

export const pushSubscriptions = pgTable("push_subscriptions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  endpoint: text("endpoint").notNull().unique(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  timezone: text("timezone").default("UTC"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const profileRelations = relations(profiles, ({ one }) => ({
  user: one(user, { fields: [profiles.userId], references: [user.id] }),
}));

export const attemptRelations = relations(attempts, ({ one }) => ({
  user: one(user, { fields: [attempts.userId], references: [user.id] }),
}));

export const medalRelations = relations(medals, ({ one }) => ({
  user: one(user, { fields: [medals.userId], references: [user.id] }),
}));

export const friendGroupRelations = relations(friendGroups, ({ many }) => ({
  members: many(friendGroupMembers),
}));

export const friendGroupMemberRelations = relations(
  friendGroupMembers,
  ({ one }) => ({
    group: one(friendGroups, {
      fields: [friendGroupMembers.groupId],
      references: [friendGroups.id],
    }),
    user: one(user, {
      fields: [friendGroupMembers.userId],
      references: [user.id],
    }),
  }),
);
