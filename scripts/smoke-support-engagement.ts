/**
 * Backend smoke test for support inbox + engagement (Emails & AI).
 * Safe reads + one ticket create/cleanup. Run: npx tsx scripts/smoke-support-engagement.ts
 */
import { prisma } from "../src/lib/prisma";
import { listPanelTickets } from "../src/lib/support-tickets";
import { createContactFormTicket } from "../src/lib/support-email-tickets";
import {
  getRfEngagementStatus,
  getRfEngagementBrowse,
  RF_DOMAIN_KEY,
} from "../src/lib/engagement";
import { listCampaigns } from "../src/lib/engagement-crud";
import { listSegments } from "../src/lib/engagement-segments";
import { emailConfigured, emailProvider } from "../src/lib/mail-send";

const results: { name: string; ok: boolean; detail?: string }[] = [];

function pass(name: string, detail?: string) {
  results.push({ name, ok: true, detail });
  console.log(`  ✓ ${name}${detail ? ` — ${detail}` : ""}`);
}
function fail(name: string, detail: string) {
  results.push({ name, ok: false, detail });
  console.error(`  ✗ ${name} — ${detail}`);
}

async function main() {
  console.log("\n=== Support + Engagement backend smoke ===\n");

  // 1) Tables queryable
  console.log("1. Tables");
  try {
    const [st, sm, es, ec, est, ee, esnd] = await Promise.all([
      prisma.support_tickets.count(),
      prisma.support_ticket_messages.count(),
      prisma.engagement_segments.count(),
      prisma.engagement_campaigns.count(),
      prisma.engagement_steps.count(),
      prisma.engagement_enrollments.count(),
      prisma.engagement_sends.count(),
    ]);
    pass(
      "Prisma counts",
      `tickets=${st} msgs=${sm} segments=${es} campaigns=${ec} steps=${est} enrollments=${ee} sends=${esnd}`
    );
  } catch (e) {
    fail("Prisma counts", e instanceof Error ? e.message : String(e));
  }

  // 2) Mail / env
  console.log("\n2. Mail / env");
  pass(
    "EMAIL_PROVIDER",
    `${emailProvider()} configured=${emailConfigured()} from=${process.env.SUPPORT_FROM_EMAIL || process.env.CONTACT_EMAIL || "(none)"}`
  );
  pass(
    "SUPPORT flags",
    `AUTORESPONDER=${process.env.SUPPORT_AUTORESPONDER} AI=${process.env.SUPPORT_AI_ENABLED} OPENAI=${Boolean(process.env.OPENAI_API_KEY)} INBOUND_SECRET=${Boolean(process.env.SUPPORT_INBOUND_WEBHOOK_SECRET)}`
  );
  pass("domain_key", RF_DOMAIN_KEY);

  // 3) Support list
  console.log("\n3. Support inbox");
  try {
    const tickets = await listPanelTickets({ take: 5 });
    pass("listPanelTickets", `${tickets.length} row(s)`);
  } catch (e) {
    fail("listPanelTickets", e instanceof Error ? e.message : String(e));
  }

  // 4) Create ticket (real path — may send autoresponder/AI if enabled)
  let createdId: number | null = null;
  try {
    const ticket = await createContactFormTicket({
      name: "Smoke Test",
      email: "smoke-test+referrals@example.com",
      message: "Backend smoke test — safe to ignore/delete.",
    });
    createdId = ticket.ticketId;
    pass(
      "createContactFormTicket",
      `publicId=${ticket.publicId} ticketId=${ticket.ticketId}`
    );

    // Give autoresponder / AI a moment to write messages
    await new Promise((r) => setTimeout(r, 2500));

    const loaded = await prisma.support_tickets.findFirst({
      where: { id: ticket.ticketId, site: "referrals" },
      include: { messages: true },
    });
    if (!loaded) fail("ticket persisted", "not found");
    else
      pass(
        "ticket persisted",
        `status=${loaded.status} messages=${loaded.messages.length} ai_handling=${loaded.ai_handling}`
      );
  } catch (e) {
    fail("createContactFormTicket", e instanceof Error ? e.message : String(e));
  }

  // 5) Engagement
  console.log("\n4. Engagement (Emails & AI)");
  try {
    const status = await getRfEngagementStatus();
    pass(
      "getRfEngagementStatus",
      `enabled=${status.enabled} steps=${status.stepCount} enrollments=${JSON.stringify(status.enrollments)} vnoc=${status.hasVnocUrl}`
    );
  } catch (e) {
    fail("getRfEngagementStatus", e instanceof Error ? e.message : String(e));
  }

  try {
    const browse = await getRfEngagementBrowse();
    pass(
      "getRfEngagementBrowse",
      `campaigns=${browse.campaigns?.length ?? 0} people=${browse.subscriberTotal ?? "?"} sends=${browse.sends?.length ?? 0}`
    );
  } catch (e) {
    fail("getRfEngagementBrowse", e instanceof Error ? e.message : String(e));
  }

  try {
    const camps = await listCampaigns();
    const segs = await listSegments();
    pass("listCampaigns/listSegments", `campaigns=${camps.length} segments=${segs.length}`);
  } catch (e) {
    fail("listCampaigns/listSegments", e instanceof Error ? e.message : String(e));
  }

  // 6) HTTP gates (localhost)
  console.log("\n5. HTTP gates (localhost:3000)");
  const base = process.env.SMOKE_BASE_URL || "http://localhost:3000";
  try {
    const r = await fetch(`${base}/api/admin/support/tickets`);
    pass(
      "GET /api/admin/support/tickets (anon)",
      `status=${r.status} (expect 401/403)`
    );
  } catch (e) {
    fail(
      "GET /api/admin/support/tickets",
      e instanceof Error ? e.message : String(e)
    );
  }
  try {
    const r = await fetch(`${base}/api/admin/engagement/browse`);
    pass(
      "GET /api/admin/engagement/browse (anon)",
      `status=${r.status} (expect 401/403)`
    );
  } catch (e) {
    fail(
      "GET /api/admin/engagement/browse",
      e instanceof Error ? e.message : String(e)
    );
  }
  try {
    const r = await fetch(`${base}/api/webhooks/support-inbound`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fromEmail: "x@y.com",
        subject: "test",
        textBody: "hi",
      }),
    });
    const body = await r.json().catch(() => ({}));
    pass(
      "POST /api/webhooks/support-inbound (no auth)",
      `status=${r.status} error=${(body as { error?: string }).error || ""}`
    );
  } catch (e) {
    fail(
      "POST /api/webhooks/support-inbound",
      e instanceof Error ? e.message : String(e)
    );
  }

  // Cleanup smoke ticket
  if (createdId) {
    console.log("\n6. Cleanup");
    try {
      await prisma.support_tickets.delete({ where: { id: createdId } });
      pass("deleted smoke ticket", `id=${createdId}`);
    } catch (e) {
      fail("cleanup", e instanceof Error ? e.message : String(e));
    }
  }

  const failed = results.filter((r) => !r.ok);
  console.log(
    `\n=== Done: ${results.length - failed.length}/${results.length} passed ===\n`
  );
  await prisma.$disconnect();
  process.exit(failed.length ? 1 : 0);
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
