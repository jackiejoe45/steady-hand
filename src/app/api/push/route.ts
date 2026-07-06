import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { db, requireDb } from "@/lib/db";
import * as schema from "@/lib/db/schema";

const subscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
  timezone: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const session = await requireSession(await headers());
    const body = subscriptionSchema.parse(await request.json());
    const database = requireDb();

    await database
      .insert(schema.pushSubscriptions)
      .values({
        id: crypto.randomUUID(),
        userId: session.user.id,
        endpoint: body.endpoint,
        p256dh: body.keys.p256dh,
        auth: body.keys.auth,
        timezone: body.timezone ?? "UTC",
      })
      .onConflictDoUpdate({
        target: schema.pushSubscriptions.endpoint,
        set: {
          p256dh: body.keys.p256dh,
          auth: body.keys.auth,
          timezone: body.timezone ?? "UTC",
        },
      });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await requireSession(await headers());
    const { endpoint } = await request.json();
    const database = requireDb();

    await database
      .delete(schema.pushSubscriptions)
      .where(
        eq(schema.pushSubscriptions.endpoint, endpoint),
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
