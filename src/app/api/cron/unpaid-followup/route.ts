import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateCron } from "@/lib/api/helpers";
import { runUnpaidFollowup, isFollowupEnabled } from "@/lib/unpaid-followup";

/**
 * B8 — Unpaid follow-up email cron.
 *
 * OFF by default. Set UNPAID_FOLLOWUP_EMAILS_ENABLED=true in Vercel env
 * (after Lee and Maida approve the copy) to send real emails.
 * Until then every run is a dry run that only logs who *would* be emailed.
 */
export async function GET(req: NextRequest) {
  if (!authenticateCron(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const enabled = isFollowupEnabled();

  try {
    const result = await runUnpaidFollowup(prisma, { dryRun: !enabled });

    return NextResponse.json({
      success: true,
      enabled,
      ...result,
    });
  } catch (error) {
    console.error("[unpaid-followup] cron error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
