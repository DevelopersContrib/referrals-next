import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePlatformAdminApi } from "@/lib/require-platform-admin";

export async function POST(req: NextRequest) {
  const authResult = await requirePlatformAdminApi();
  if (!authResult.ok) {
    return NextResponse.json(
      { error: authResult.status === 401 ? "Unauthorized" : "Forbidden" },
      { status: authResult.status }
    );
  }

  try {
    const body = await req.json();
    const rawIds = body.ids ?? body.data_id;
    const ids: number[] = Array.isArray(rawIds)
      ? rawIds.map((id) => parseInt(String(id), 10)).filter(Number.isFinite)
      : String(rawIds ?? "")
          .split(",")
          .map((id) => parseInt(id.trim(), 10))
          .filter(Number.isFinite);

    if (ids.length === 0) {
      return NextResponse.json(
        { error: "No brand IDs provided" },
        { status: 400 }
      );
    }

    await prisma.$transaction([
      prisma.url_socials.deleteMany({ where: { url_id: { in: ids } } }),
      prisma.member_campaigns.deleteMany({ where: { url_id: { in: ids } } }),
      prisma.member_urls.deleteMany({ where: { id: { in: ids } } }),
    ]);

    return NextResponse.json({ status: true, deleted: ids.length });
  } catch (error) {
    console.error("Error deleting brands:", error);
    return NextResponse.json(
      { error: "Failed to delete brands" },
      { status: 500 }
    );
  }
}
