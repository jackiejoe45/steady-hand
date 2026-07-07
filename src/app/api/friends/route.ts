import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import {
  createFriendGroup,
  getUserFriendGroups,
  joinFriendGroup,
  leaveFriendGroup,
  type FriendGroupWithMembers,
} from "@/server/queries";

function serializeGroups(groups: FriendGroupWithMembers[]) {
  return groups.map((group) => ({
    ...group,
    joinedAt:
      group.joinedAt instanceof Date
        ? group.joinedAt.toISOString()
        : group.joinedAt,
  }));
}

export async function GET() {
  try {
    const session = await requireSession(await headers());
    const groups = await getUserFriendGroups(session.user.id);
    return NextResponse.json({ groups: serializeGroups(groups) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}

const createSchema = z.object({ name: z.string().trim().min(2).max(32) });
const joinSchema = z.object({ inviteCode: z.string().trim().min(4).max(16) });
const leaveSchema = z.object({ groupId: z.string().uuid() });

export async function POST(request: Request) {
  try {
    const session = await requireSession(await headers());
    const body = await request.json();
    const action = body.action as string;

    if (action === "create") {
      const { name } = createSchema.parse(body);
      const group = await createFriendGroup(session.user.id, name);
      const groups = await getUserFriendGroups(session.user.id);
      return NextResponse.json({
        group,
        groups: serializeGroups(groups),
      });
    }

    if (action === "join") {
      const { inviteCode } = joinSchema.parse(body);
      const group = await joinFriendGroup(session.user.id, inviteCode);
      const groups = await getUserFriendGroups(session.user.id);
      return NextResponse.json({
        group: { id: group.id, name: group.name, inviteCode: group.inviteCode },
        groups: serializeGroups(groups),
      });
    }

    if (action === "leave") {
      const { groupId } = leaveSchema.parse(body);
      await leaveFriendGroup(session.user.id, groupId);
      const groups = await getUserFriendGroups(session.user.id);
      return NextResponse.json({ groups: serializeGroups(groups) });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
