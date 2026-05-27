import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const slug = String(body.slug ?? "").trim();
  const excludeBrandId = body.excludeBrandId
    ? parseInt(String(body.excludeBrandId), 10)
    : undefined;

  if (!slug) {
    return NextResponse.json({ available: false });
  }

  const existing = await prisma.member_urls.findFirst({
    where: {
      slug,
      ...(excludeBrandId ? { NOT: { id: excludeBrandId } } : {}),
    },
  });

  return NextResponse.json({ available: !existing });
}
