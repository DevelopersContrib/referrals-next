/**
 * Paid activation → engagement enrollment smoke (R3).
 *
 * Offline — wiring checks (no DB):
 *   npx tsx scripts/smoke-paid-engagement.ts
 *
 * Live — idempotent paid enrollment for a member:
 *   npx tsx scripts/smoke-paid-engagement.ts --live --member-id 123
 */
import { readFileSync } from "fs";
import { join } from "path";
import { config as loadEnv } from "dotenv";
import { RF_DOMAIN_KEY } from "../src/lib/engagement";

loadEnv({ path: ".env.local", quiet: true });
loadEnv({ quiet: true });

function hasFlag(name: string): boolean {
  return process.argv.includes(`--${name}`);
}

function arg(name: string, fallback = ""): string {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

function fail(msg: string): never {
  console.error(`FAIL: ${msg}`);
  process.exit(1);
}

function pass(msg: string) {
  console.log(`OK: ${msg}`);
}

function readRepoFile(relPath: string): string {
  return readFileSync(join(process.cwd(), relPath), "utf8");
}

function offline() {
  console.log("\n=== Paid engagement smoke (offline) ===\n");

  console.log("1. Activation wires engagement");
  const activation = readRepoFile("src/lib/billing-activation.ts");
  if (!activation.includes("handlePaidEngagementTransition")) {
    fail("billing-activation.ts must call handlePaidEngagementTransition");
  }
  if (!activation.includes("alreadyProcessed")) {
    fail("billing-activation.ts must short-circuit replayed subscriptions");
  }
  pass("activatePaidSubscription calls handlePaidEngagementTransition");
  pass("alreadyProcessed guard present for webhook replay");

  console.log("\n2. PayPal webhook does not send engagement mail");
  const webhook = readRepoFile("src/app/api/billing/webhook/route.ts");
  if (webhook.includes("handlePaidEngagementTransition")) {
    fail("PayPal webhook must not call handlePaidEngagementTransition directly");
  }
  if (webhook.includes("engagement")) {
    fail("PayPal webhook should not import engagement enrollment");
  }
  pass("webhook route has no engagement enrollment (runs in activatePaidSubscription only)");

  console.log("\n3. Checkout routes share activation");
  for (const route of ["src/app/api/billing/confirm/route.ts", "src/app/api/billing/execute/route.ts"]) {
    const src = readRepoFile(route);
    if (!src.includes("activatePaidSubscription")) {
      fail(`${route} must call activatePaidSubscription`);
    }
  }
  pass("confirm + execute routes delegate to activatePaidSubscription");
}

async function findPaidCampaignKey(): Promise<string | null> {
  const { prisma } = await import("../src/lib/prisma");
  const { parseRulesFromJson } = await import("../src/lib/engagement-segments");

  const segments = await prisma.engagement_segments.findMany({
    where: { domain_key: RF_DOMAIN_KEY, enabled: true },
    select: { segment_key: true, rules_json: true },
  });

  const paidSegmentKey = segments.find(
    (s) => parseRulesFromJson(s.rules_json).plan === "paid",
  )?.segment_key;
  if (!paidSegmentKey) return null;

  const campaign = await prisma.engagement_campaigns.findFirst({
    where: {
      domain_key: RF_DOMAIN_KEY,
      enabled: true,
      segment_key: paidSegmentKey,
    },
    select: { campaign_key: true },
  });
  return campaign?.campaign_key ?? null;
}

async function countPaidEnrollments(memberId: number, campaignKey: string) {
  const { prisma } = await import("../src/lib/prisma");
  return prisma.engagement_enrollments.count({
    where: {
      domain_key: RF_DOMAIN_KEY,
      user_id: memberId,
      campaign_key: campaignKey,
      status: { in: ["active", "completed"] },
    },
  });
}

async function live(memberId: number) {
  const { prisma } = await import("../src/lib/prisma");
  const { handlePaidEngagementTransition } = await import("../src/lib/engagement");

  console.log("\n=== Paid engagement smoke (live) ===\n");

  if (!process.env.DATABASE_URL?.trim()) {
    fail("DATABASE_URL not set");
  }
  pass("DATABASE_URL present");

  if (!Number.isFinite(memberId) || memberId <= 0) {
    fail("--live requires --member-id <id>");
  }

  const member = await prisma.members.findUnique({
    where: { id: memberId },
    select: { id: true, email: true },
  });
  if (!member) fail(`member ${memberId} not found`);
  pass(`member ${memberId} (${member.email || "no email"})`);

  const paidCampaignKey = await findPaidCampaignKey();
  if (!paidCampaignKey) {
    fail(
      "no enabled paid engagement campaign in DB — seed engagement_segments (plan=paid) + engagement_campaigns",
    );
  }
  pass(`paid campaign_key: ${paidCampaignKey}`);

  const before = await countPaidEnrollments(memberId, paidCampaignKey);

  await handlePaidEngagementTransition(memberId);
  const afterFirst = await countPaidEnrollments(memberId, paidCampaignKey);
  if (afterFirst < before) {
    fail("paid enrollment count decreased after transition");
  }
  if (afterFirst === before) {
    pass("first transition: no duplicate row (member may already be enrolled)");
  } else {
    pass("first transition: enrolled in paid campaign");
  }

  await handlePaidEngagementTransition(memberId);
  const afterSecond = await countPaidEnrollments(memberId, paidCampaignKey);
  if (afterSecond !== afterFirst) {
    fail(
      `idempotency broken: enrollment count ${afterFirst} → ${afterSecond} on replay`,
    );
  }
  pass("second transition: idempotent (no double enrollment)");

  const enrollment = await prisma.engagement_enrollments.findFirst({
    where: {
      domain_key: RF_DOMAIN_KEY,
      user_id: memberId,
      campaign_key: paidCampaignKey,
      status: "active",
    },
    orderBy: { id: "desc" },
  });
  if (enrollment?.context_json?.includes("paid_activate")) {
    pass('enrollment context source=paid_activate');
  } else if (enrollment) {
    pass("active paid enrollment present");
  }

  await prisma.$disconnect();
}

async function main() {
  offline();

  if (hasFlag("live")) {
    const memberId = parseInt(arg("member-id", "0"), 10);
    await live(memberId);
  } else {
    console.log("\nRun with --live --member-id <id> to test idempotent enrollment.\n");
  }

  console.log("All checks passed.\n");
}

main().catch((e) => {
  console.error("FAIL:", (e as Error).message || e);
  process.exit(1);
});
