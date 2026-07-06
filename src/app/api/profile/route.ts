import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { db, requireDb } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getUserProfile } from "@/server/queries";

export async function GET() {
  try {
    const session = await requireSession(await headers());
    const data = await getUserProfile(session.user.id);
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}

const updateSchema = z.object({
  displayName: z.string().min(2).max(32).optional(),
});

export async function PATCH(request: Request) {
  try {
    const session = await requireSession(await headers());
    const body = updateSchema.parse(await request.json());
    const database = requireDb();

    if (body.displayName) {
      await database
        .update(schema.profiles)
        .set({ displayName: body.displayName })
        .where(eq(schema.profiles.userId, session.user.id));
    }

    const data = await getUserProfile(session.user.id);
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
