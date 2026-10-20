import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Weekly digest opt-in. The cron in /api/cron/forum-digest sends to every
 * member with forum_digest = 1; this is the only place that flag is set.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const memberId = parseInt(session.user.id, 10);
    if (!Number.isInteger(memberId) || memberId <= 0) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    if (typeof body?.enabled !== "boolean") {
      return NextResponse.json(
        { error: "enabled must be true or false." },
        { status: 400 },
      );
    }

    await prisma.members.update({
      where: { id: memberId },
      data: { forum_digest: body.enabled },
    });

    return NextResponse.json({ forum_digest: body.enabled });
  } catch (error) {
    console.error("Forum digest preference error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
