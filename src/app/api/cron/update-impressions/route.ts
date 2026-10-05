import { NextRequest, NextResponse } from "next/server";
import { authenticateCron } from "@/lib/api/helpers";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Each widget view already increments campaign_widget_impressions_count.
// Recounting the raw impression log is a full table scan and was hitting the
// 300s function limit every half hour, which held a database connection.
export async function GET(req: NextRequest) {
  if (!authenticateCron(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ success: true, skipped: true });
}
