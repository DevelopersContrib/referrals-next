import { NextRequest, NextResponse } from "next/server";
import { requirePlatformAdminApi } from "@/lib/require-platform-admin";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const guard = await requirePlatformAdminApi();
    if (!guard.ok)
      return NextResponse.json(
        { error: guard.status === 401 ? "Unauthorized" : "Forbidden" },
        { status: guard.status }
      );

    const subdomains = await prisma.brand_subdomains.findMany({
      orderBy: { date_created: "desc" },
      take: 200,
    });

    return NextResponse.json(subdomains);
  } catch (error) {
    console.error("Error fetching subdomains:", error);
    return NextResponse.json(
      { error: "Failed to fetch subdomains" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const guard = await requirePlatformAdminApi();
    if (!guard.ok)
      return NextResponse.json(
        { error: guard.status === 401 ? "Unauthorized" : "Forbidden" },
        { status: guard.status }
      );

    const { searchParams } = new URL(req.url);
    const id = parseInt(searchParams.get("id") || "0", 10);

    if (!id)
      return NextResponse.json({ error: "ID required" }, { status: 400 });

    await prisma.brand_subdomains.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting subdomain:", error);
    return NextResponse.json(
      { error: "Failed to delete subdomain" },
      { status: 500 }
    );
  }
}
