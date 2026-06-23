import { NextResponse } from "next/server";
import { requirePlatformAdminApi } from "@/lib/require-platform-admin";

export async function GET() {
  try {
    const guard = await requirePlatformAdminApi();
    if (!guard.ok)
      return NextResponse.json(
        { error: guard.status === 401 ? "Unauthorized" : "Forbidden" },
        { status: guard.status }
      );

    // Placeholder - SES email logs integration pending
    return NextResponse.json({
      message: "Email logs endpoint. SES integration pending.",
      logs: [],
      stats: {
        sentToday: 0,
        delivered: 0,
        bounced: 0,
        complaints: 0,
      },
    });
  } catch (error) {
    console.error("Error fetching email logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch email logs" },
      { status: 500 }
    );
  }
}
