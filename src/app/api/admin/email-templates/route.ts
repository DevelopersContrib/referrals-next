import { NextResponse } from "next/server";
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

    const templates = await prisma.campaign_email_content.findMany({
      orderBy: { id: "desc" },
      take: 200,
    });

    return NextResponse.json(templates);
  } catch (error) {
    console.error("Error fetching email templates:", error);
    return NextResponse.json(
      { error: "Failed to fetch email templates" },
      { status: 500 }
    );
  }
}
