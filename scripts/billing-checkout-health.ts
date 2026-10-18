/**
 * B4 — Billing checkout health diagnostics.
 *
 * Read-only. Summarizes billing_checkout_events error counts and recent
 * messages, plus billing_paypal_webhook_events verified deliveries.
 *
 * Usage:
 *   npx tsx scripts/billing-checkout-health.ts                  # last 7 days
 *   npx tsx scripts/billing-checkout-health.ts --since 2026-10-01
 *   npx tsx scripts/billing-checkout-health.ts --since 24h       # relative
 *
 * This script does NOT modify any data.
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function parseSince(raw: string): Date {
  const relMatch = raw.match(/^(\d+)\s*(h|d|m)$/i);
  if (relMatch) {
    const n = parseInt(relMatch[1], 10);
    const unit = relMatch[2].toLowerCase();
    const ms =
      unit === "h"
        ? n * 3_600_000
        : unit === "d"
          ? n * 86_400_000
          : n * 86_400_000 * 30;
    return new Date(Date.now() - ms);
  }
  const d = new Date(raw);
  if (isNaN(d.getTime())) {
    console.error(`Invalid --since value: ${raw}. Using 7 days.`);
    return new Date(Date.now() - 7 * 86_400_000);
  }
  return d;
}

interface EventSummary {
  event_name: string;
  count: bigint;
}

interface RecentError {
  id: bigint;
  attempt_id: string;
  member_id: number;
  plan_id: number;
  event_name: string;
  error_code: string | null;
  error_message: string | null;
  created_at: Date;
}

interface WebhookSummary {
  verification_status: string;
  processing_status: string;
  count: bigint;
}

interface RecentWebhook {
  id: bigint;
  event_type: string | null;
  resource_id: string | null;
  verification_status: string;
  processing_status: string;
  error_message: string | null;
  received_at: Date;
}

async function main() {
  const args = process.argv.slice(2);
  const sinceIdx = args.indexOf("--since");
  const since =
    sinceIdx >= 0 && args[sinceIdx + 1]
      ? parseSince(args[sinceIdx + 1])
      : new Date(Date.now() - 7 * 86_400_000);

  console.error(`Checking billing health since ${since.toISOString()}…\n`);

  // 1. Checkout events summary
  const eventCounts = await prisma.$queryRawUnsafe<EventSummary[]>(
    `SELECT event_name, COUNT(*) AS count
     FROM billing_checkout_events
     WHERE created_at >= ?
     GROUP BY event_name
     ORDER BY count DESC`,
    since,
  );

  // 2. Error events (server_error, client_error)
  const errorEvents = await prisma.$queryRawUnsafe<RecentError[]>(
    `SELECT id, attempt_id, member_id, plan_id, event_name, error_code, error_message, created_at
     FROM billing_checkout_events
     WHERE created_at >= ?
       AND event_name IN ('server_error', 'client_error')
     ORDER BY created_at DESC
     LIMIT 50`,
    since,
  );

  // 3. Webhook events summary
  const webhookCounts = await prisma.$queryRawUnsafe<WebhookSummary[]>(
    `SELECT verification_status, processing_status, COUNT(*) AS count
     FROM billing_paypal_webhook_events
     WHERE received_at >= ?
     GROUP BY verification_status, processing_status
     ORDER BY count DESC`,
    since,
  );

  // 4. Recent webhook events
  const recentWebhooks = await prisma.$queryRawUnsafe<RecentWebhook[]>(
    `SELECT id, event_type, resource_id, verification_status, processing_status, error_message, received_at
     FROM billing_paypal_webhook_events
     WHERE received_at >= ?
     ORDER BY received_at DESC
     LIMIT 20`,
    since,
  );

  // 5. Checkout attempts summary
  const attemptCounts = await prisma.$queryRawUnsafe<
    { status: string; count: bigint }[]
  >(
    `SELECT status, COUNT(*) AS count
     FROM billing_checkout_attempts
     WHERE created_at >= ?
     GROUP BY status
     ORDER BY count DESC`,
    since,
  );

  // 6. Successful activations
  const activations = await prisma.$queryRawUnsafe<{ count: bigint }[]>(
    `SELECT COUNT(*) AS count
     FROM billing_checkout_events
     WHERE created_at >= ?
       AND event_name = 'activated'`,
    since,
  );

  const report = {
    since: since.toISOString(),
    generatedAt: new Date().toISOString(),

    checkoutEvents: eventCounts.map((e) => ({
      eventName: e.event_name,
      count: Number(e.count),
    })),

    errorSummary: {
      serverErrors: Number(
        eventCounts.find((e) => e.event_name === "server_error")?.count ?? 0,
      ),
      clientErrors: Number(
        eventCounts.find((e) => e.event_name === "client_error")?.count ?? 0,
      ),
      activations: Number(activations[0]?.count ?? 0),
    },

    recentErrors: errorEvents.map((e) => ({
      id: Number(e.id),
      attemptId: e.attempt_id,
      memberId: e.member_id,
      planId: e.plan_id,
      eventName: e.event_name,
      errorCode: e.error_code,
      errorMessage: e.error_message,
      createdAt: e.created_at.toISOString(),
    })),

    checkoutAttempts: attemptCounts.map((a) => ({
      status: a.status,
      count: Number(a.count),
    })),

    webhookSummary: webhookCounts.map((w) => ({
      verificationStatus: w.verification_status,
      processingStatus: w.processing_status,
      count: Number(w.count),
    })),

    recentWebhooks: recentWebhooks.map((w) => ({
      id: Number(w.id),
      eventType: w.event_type,
      resourceId: w.resource_id,
      verificationStatus: w.verification_status,
      processingStatus: w.processing_status,
      errorMessage: w.error_message,
      receivedAt: w.received_at.toISOString(),
    })),
  };

  console.log(JSON.stringify(report, null, 2));

  // Print a human-friendly summary to stderr
  console.error("── Checkout Events ──");
  for (const e of report.checkoutEvents) {
    console.error(`  ${e.eventName}: ${e.count}`);
  }

  console.error("\n── Error Summary ──");
  console.error(`  server_error: ${report.errorSummary.serverErrors}`);
  console.error(`  client_error: ${report.errorSummary.clientErrors}`);
  console.error(`  activations:  ${report.errorSummary.activations}`);

  if (report.recentErrors.length > 0) {
    console.error("\n── Recent Errors (last 5) ──");
    for (const e of report.recentErrors.slice(0, 5)) {
      console.error(
        `  [${e.createdAt}] ${e.eventName} — ${e.errorCode}: ${e.errorMessage}`,
      );
    }
  }

  console.error("\n── Webhook Deliveries ──");
  for (const w of report.webhookSummary) {
    console.error(
      `  ${w.verificationStatus}/${w.processingStatus}: ${w.count}`,
    );
  }

  const verified = report.webhookSummary
    .filter((w) => w.verificationStatus === "SUCCESS")
    .reduce((sum, w) => sum + w.count, 0);
  const failed = report.webhookSummary
    .filter((w) => w.verificationStatus !== "SUCCESS")
    .reduce((sum, w) => sum + w.count, 0);
  console.error(`\n  Verified: ${verified}  |  Failed/Pending: ${failed}`);
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
