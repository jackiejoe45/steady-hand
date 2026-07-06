import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { db, requireDb } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import {
  createFriendGroup,
  joinFriendGroup,
} from "@/server/queries";

export async function GET() {
  try {
    const session = await requireSession(await headers());
    const database = requireDb();

    const groups = await database
      .select({
        id: schema.friendGroups.id,
        name: schema.friendGroups.name,
        inviteCode: schema.friendGroups.inviteCode,
        maxMembers: schema.friendGroups.maxMembers,
      })
      .from(schema.friendGroupMembers)
      .innerJoin(
        schema.friendGroups,
        eq(schema.friendGroupMembers.groupId, schema.friendGroups.id),
      )
      .where(eq(schema.friendGroupMembers.userId, session.user.id));

    return NextResponse.json(groups);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}

const createSchema = z.object({ name: z.string().min(2).max(32) });
const joinSchema = z.object({ inviteCode: z.string().min(4) });

export async function POST(request: Request) {
  try {
    const session = await requireSession(await headers());
    const body = await request.json();
    const action = body.action as string;

    if (action === "create") {
      const { name } = createSchema.parse(body);
      const group = await createFriendGroup(session.user.id, name);
      return NextResponse.json(group);
    }

    if (action === "join") {
      const { inviteCode } = joinSchema.parse(body);
      const group = await joinFriendGroup(session.user.id, inviteCode);
      return NextResponse.json(group);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
