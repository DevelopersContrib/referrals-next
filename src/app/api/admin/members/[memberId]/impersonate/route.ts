import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";

type RouteParams = { params: Promise<{ memberId: string }> };

export async function POST(_req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
