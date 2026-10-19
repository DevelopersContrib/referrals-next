import { NextRequest, NextResponse } from "next/server";
import { authenticateCron } from "@/lib/api/helpers";
import { sendWeeklyForumDigest } from "@/lib/forum-emails";

/**
 * JJ6 — Weekly forum digest for members with forum_digest = 1.
 * Monday 09:00 UTC (same hour as unpaid-followup).
 */
export async function GET(req: NextRequest) {
  if (!authenticateCron(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dryRun = req.nextUrl.searchParams.get("dryRun") === "1";

  try {
    const result = await sendWeeklyForumDigest({ dryRun });
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("[forum-digest] cron error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
