import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");
  const provider = searchParams.get("provider");

  if (!email) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  try {
    const member = await prisma.members.findFirst({
      where: { email },
      select: { id: true, email: true, is_verified: true },
    });

    return NextResponse.json({
      exists: !!member,
      active: member?.is_verified === true,
      provider: provider || null,
    });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
