import { NextRequest, NextResponse } from "next/server";
import { requirePlatformAdminApi } from "@/lib/require-platform-admin";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";

type RouteParams = { params: Promise<{ memberId: string }> };

export async function POST(_req: NextRequest, { params }: RouteParams) {
  try {
    const guard = await requirePlatformAdminApi();
    if (!guard.ok)
      return NextResponse.json(
        { error: guard.status === 401 ? "Unauthorized" : "Forbidden" },
        { status: guard.status }
      );

    const { memberId } = await params;
    const id = parseInt(memberId, 10);
    if (isNaN(id))
      return NextResponse.json({ error: "Invalid member ID" }, { status: 400 });

    const member = await prisma.members.findUnique({ where: { id } });
    if (!member)
      return NextResponse.json({ error: "Member not found" }, { status: 404 });

    // Generate a one-time impersonation token
    const token = randomBytes(32).toString("hex");

    await prisma.member_tokens.create({
      data: {
        token,
        email: member.email,
        date_generated: new Date(),
      },
    });

    return NextResponse.json({
      token,
      memberId: member.id,
      email: member.email,
      message: "Impersonation token generated. Use this token to create a session for this member.",
    });
  } catch (error) {
    console.error("Error generating impersonation token:", error);
    return NextResponse.json(
      { error: "Failed to generate impersonation token" },
      { status: 500 }
    );
  }
}
