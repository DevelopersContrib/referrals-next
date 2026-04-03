import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashSync } from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, email, password } = body;

    if (!code || !email || !password) {
      return NextResponse.json(
        { error: "Code, email, and password are required." },
        { status: 400 }
      );
    }

    if (typeof password !== "string" || password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }

    const member = await prisma.members.findFirst({
      where: {
        email: email.toLowerCase().trim(),
        verification_code: code,
      },
    });

    if (!member) {
      return NextResponse.json(
        { error: "Invalid or expired reset link." },
        { status: 400 }
      );
    }

    const hashedPassword = hashSync(password, 10);

    await prisma.members.update({
      where: { id: member.id },
      data: {
        password: hashedPassword,
        verification_code: null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
