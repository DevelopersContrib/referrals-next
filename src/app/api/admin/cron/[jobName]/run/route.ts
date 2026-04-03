import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

type RouteParams = { params: Promise<{ jobName: string }> };

// Known cron jobs in the system
const CRON_JOBS: Record<string, { name: string; endpoint: string }> = {
  "expire-plans": {
    name: "Expire Plans",
    endpoint: "/api/cron/expire-plans",
  },
  "send-reminders": {
    name: "Send Reminders",
    endpoint: "/api/cron/send-reminders",
  },
  "cleanup-tokens": {
    name: "Cleanup Tokens",
    endpoint: "/api/cron/cleanup-tokens",
  },
  "sync-analytics": {
    name: "Sync Analytics",
    endpoint: "/api/cron/sync-analytics",
  },
  "process-payments": {
    name: "Process Payments",
    endpoint: "/api/cron/process-payments",
  },
};

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
