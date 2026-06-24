"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface CronJob {
  id: string;
  name: string;
  description: string;
  schedule: string;
  lastRun: string | null;
  status: "idle" | "running" | "success" | "error";
}

const CRON_JOBS: CronJob[] = [
  {
    id: "contest-winners",
    name: "Contest Winners",
    description: "Select winners for ended contests and notify them by email",
    schedule: "Every 6 hours",
    lastRun: null,
    status: "idle",
  },
  {
    id: "plan-expiry",
    name: "Plan Expiry Reminders",
    description: "Email members whose plans expire within the next 7 days",
    schedule: "Daily at 8 AM",
    lastRun: null,
    status: "idle",
  },
  {
    id: "update-payments",
    name: "Update Payments",
    description: "Sync PayPal subscription statuses for active member plans",
    schedule: "Every 12 hours",
    lastRun: null,
    status: "idle",
  },
  {
    id: "update-impressions",
    name: "Update Impressions",
    description: "Aggregate widget impression counts per campaign",
    schedule: "Every 30 minutes",
    lastRun: null,
    status: "idle",
  },
  {
    id: "update-feeds",
    name: "Update Feeds",
    description: "Fetch and store RSS feed items for brand URLs",
    schedule: "Every 4 hours",
    lastRun: null,
    status: "idle",
  },
];

export default function AdminCronPage() {
  const [jobs, setJobs] = useState<CronJob[]>(CRON_JOBS);
  const [runningJob, setRunningJob] = useState<string | null>(null);

  async function handleTrigger(jobId: string) {
    setRunningJob(jobId);
    setJobs((prev) =>
      prev.map((j) => (j.id === jobId ? { ...j, status: "running" as const } : j))
    );

    try {
      const res = await fetch(`/api/admin/cron/${jobId}/run`, {
        method: "POST",
      });
      const data = await res.json();

      setJobs((prev) =>
        prev.map((j) =>
          j.id === jobId
            ? {
                ...j,
                status: data.success ? ("success" as const) : ("error" as const),
                lastRun: new Date().toISOString(),
              }
            : j
        )
      );
    } catch {
      setJobs((prev) =>
        prev.map((j) =>
          j.id === jobId ? { ...j, status: "error" as const } : j
        )
      );
    } finally {
      setRunningJob(null);
    }
  }

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold">Cron Jobs</h1>
        <p className="text-muted-foreground">
          Manage and manually trigger background jobs.
        </p>
      </div>

      <div className="mt-6 space-y-4">
        {jobs.map((job) => (
          <Card key={job.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{job.name}</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      job.status === "success"
                        ? "default"
                        : job.status === "error"
                          ? "destructive"
                          : job.status === "running"
                            ? "default"
                            : "secondary"
                    }
                    className={
                      job.status === "success"
                        ? "bg-green-100 text-green-800"
                        : ""
                    }
                  >
                    {job.status === "running" ? "Running..." : job.status}
                  </Badge>
                  <Button
                    size="sm"
                    onClick={() => handleTrigger(job.id)}
                    disabled={runningJob === job.id}
                  >
                    {runningJob === job.id ? "Running..." : "Run Now"}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {job.description}
              </p>
              <Separator className="my-2" />
              <div className="flex gap-4 text-xs text-muted-foreground">
                <span>Schedule: {job.schedule}</span>
                <span>
                  Last run:{" "}
                  {job.lastRun
                    ? new Date(job.lastRun).toLocaleString()
                    : "Never"}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
