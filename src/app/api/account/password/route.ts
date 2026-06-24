import { NextRequest, NextResponse } from "next/server";
import { compareSync, hashSync } from "bcryptjs";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const memberId = parseInt(session.user.id, 10);

  try {
    const body = await request.json();
    const currentPassword =
      typeof body.currentPassword === "string" ? body.currentPassword : "";
    const newPassword =
      typeof body.newPassword === "string" ? body.newPassword : "";

    if (!currentPassword) {
      return NextResponse.json(
        { error: "Current password is required." },
        { status: 400 }
      );
    }
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "New password must be at least 8 characters." },
        { status: 400 }
      );
    }

    const member = await prisma.members.findUnique({
      where: { id: memberId },
      select: { id: true, password: true },
    });

    if (!member?.password) {
      return NextResponse.json(
        { error: "Account not found." },
        { status: 404 }
      );
    }

    // Verify current password: bcrypt first, then plain text (legacy PHP compat)
    let isValid = false;
    try {
      isValid = compareSync(currentPassword, member.password);
    } catch {
      // bcrypt may throw on non-hash strings
    }
    if (!isValid && currentPassword === member.password) {
      isValid = true;
    }

    if (!isValid) {
      return NextResponse.json(
        { error: "Current password is incorrect." },
        { status: 400 }
      );
    }

    await prisma.members.update({
      where: { id: memberId },
      data: { password: hashSync(newPassword, 10) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update password error:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
