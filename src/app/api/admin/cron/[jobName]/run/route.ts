import { NextRequest, NextResponse } from "next/server";
import { adminApiGuard } from "@/lib/require-platform-admin";

type RouteParams = { params: Promise<{ jobName: string }> };

// Known cron jobs in the system, keyed by their route name under /api/cron
const CRON_JOBS: Record<string, { name: string; endpoint: string }> = {
  "contest-winners": {
    name: "Contest Winners",
    endpoint: "/api/cron/contest-winners",
  },
  "plan-expiry": {
    name: "Plan Expiry Reminders",
    endpoint: "/api/cron/plan-expiry",
  },
  "update-payments": {
    name: "Update Payments",
    endpoint: "/api/cron/update-payments",
  },
  "update-impressions": {
    name: "Update Impressions",
    endpoint: "/api/cron/update-impressions",
  },
  "update-feeds": {
    name: "Update Feeds",
    endpoint: "/api/cron/update-feeds",
  },
};

export async function POST(req: NextRequest, { params }: RouteParams) {
  const denied = await adminApiGuard();
  if (denied) return denied;
  try {
    const { jobName } = await params;
    const job = CRON_JOBS[jobName];

    if (!job) {
      return NextResponse.json(
        {
          error: `Unknown cron job: ${jobName}`,
          availableJobs: Object.keys(CRON_JOBS),
        },
        { status: 404 }
      );
    }

    // Attempt to call the cron endpoint internally
    const baseUrl =
      process.env.NEXTAUTH_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000";

    try {
      const response = await fetch(`${baseUrl}${job.endpoint}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${process.env.CRON_SECRET || ""}`,
        },
      });

      const result = await response.text();

      return NextResponse.json({
        success: true,
        job: job.name,
        status: response.status,
        result: result.substring(0, 500),
        triggeredAt: new Date().toISOString(),
      });
    } catch {
      return NextResponse.json({
        success: false,
        job: job.name,
        error: "Cron endpoint not reachable. It may not be implemented yet.",
        triggeredAt: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error("Error triggering cron job:", error);
    return NextResponse.json(
      { error: "Failed to trigger cron job" },
      { status: 500 }
    );
  }
}
