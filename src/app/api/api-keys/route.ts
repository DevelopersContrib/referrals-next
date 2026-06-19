import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createMemberApiKey } from "@/lib/member-api-key";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const memberId = parseInt(session.user.id, 10);
  const keys = await prisma.member_keys.findMany({
    where: { userid: memberId },
    orderBy: { date_generated: "desc" },
    select: {
      user_key_id: true,
      api_key: true,
      date_generated: true,
    },
  });

  return NextResponse.json({ keys });
}

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const memberId = parseInt(session.user.id, 10);

  try {
    const key = await createMemberApiKey(memberId);
    return NextResponse.json(
      {
        api_key: key.api_key,
        date_generated: key.date_generated,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Generate API key error:", error);
    return NextResponse.json(
      { error: "Failed to generate API key" },
      { status: 500 }
    );
  }
}
