import { betterAuth } from "better-auth";
import { dash } from "@better-auth/infra";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { nextCookies } from "better-auth/next-js";
import { eq } from "drizzle-orm";
import { db, requireDb } from "./db";
import * as schema from "./db/schema";
import {
  getAuthBaseURLConfig,
  getTrustedOrigins,
  isBetterAuthInfraEnabled,
} from "./auth-config";

export const auth = betterAuth({
  database: db
    ? drizzleAdapter(requireDb(), {
        provider: "pg",
        schema,
      })
    : undefined,
  secret:
    process.env.BETTER_AUTH_SECRET ??
    "dev-secret-change-in-production-min-32-chars",
  baseURL: getAuthBaseURLConfig(),
  trustedOrigins: getTrustedOrigins(),
  advanced: {
    trustedProxyHeaders: true,
    useSecureCookies: process.env.NODE_ENV === "production",
    defaultCookieAttributes: {
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    },
  },
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    minPasswordLength: 8,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      enabled: Boolean(
        process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
      ),
    },
    apple: {
      clientId: process.env.APPLE_CLIENT_ID ?? "",
      clientSecret: process.env.APPLE_CLIENT_SECRET ?? "",
      enabled: Boolean(
        process.env.APPLE_CLIENT_ID && process.env.APPLE_CLIENT_SECRET,
      ),
    },
  },
  plugins: [
    ...(isBetterAuthInfraEnabled()
      ? [
          dash({
            apiKey: process.env.BETTER_AUTH_API_KEY!,
            apiUrl: process.env.BETTER_AUTH_API_URL,
            kvUrl: process.env.BETTER_AUTH_KV_URL,
          }),
        ]
      : []),
    nextCookies(),
  ],
  databaseHooks: {
    user: {
      create: {
        after: async (createdUser) => {
          if (!db) return;
          await db.insert(schema.profiles).values({
            userId: createdUser.id,
            displayName: createdUser.name || "Player",
            avatarUrl: createdUser.image ?? null,
          });
        },
      },
    },
  },
});

export type Session = typeof auth.$Infer.Session;

export async function getSession(headers: Headers) {
  return auth.api.getSession({ headers });
}

export async function requireSession(headers: Headers) {
  const session = await getSession(headers);
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function getProfile(userId: string) {
  if (!db) return null;
  const [profile] = await db
    .select()
    .from(schema.profiles)
    .where(eq(schema.profiles.userId, userId))
    .limit(1);
  return profile ?? null;
}
