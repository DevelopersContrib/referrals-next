/**
 * B8 — Unpaid follow-up email series smoke test (offline, no DB).
 *
 *   npx tsx scripts/smoke-unpaid-followup.ts
 *
 * Checks:
 *  1. Feature flag defaults to OFF → dry run
 *  2. Step selection is correct for brand age
 *  3. All 5 email drafts render without error
 *  4. Every draft links to /billing/plan/<planId>?brandId=<id>
 *  5. Duplicate-send guard prevents the same step twice
 *  6. Cron route file exists and uses authenticateCron
 *  7. vercel.json lists the cron
 *  8. SQL migration file exists
 *  9. Prisma model exists
 * 10. "Launch on Free" stale text is gone
 */

import { readFileSync } from "fs";
import { join } from "path";

function fail(msg: string): never {
  console.error(`FAIL: ${msg}`);
  process.exit(1);
}

function pass(msg: string) {
  console.log(`OK: ${msg}`);
}

function readRepo(relPath: string): string {
  return readFileSync(join(process.cwd(), relPath), "utf8");
}

// ─── 1. Feature flag defaults OFF ────────────────────────────────────────────

console.log("\n=== Unpaid follow-up smoke (offline) ===\n");

delete process.env.UNPAID_FOLLOWUP_EMAILS_ENABLED;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { isFollowupEnabled } = require("../src/lib/unpaid-followup") as typeof import("../src/lib/unpaid-followup");

if (isFollowupEnabled()) {
  fail("isFollowupEnabled() should return false when env flag is unset");
}
pass("Feature flag defaults to OFF (dry run)");

process.env.UNPAID_FOLLOWUP_EMAILS_ENABLED = "true";
if (!isFollowupEnabled()) {
  fail("isFollowupEnabled() should return true when flag is 'true'");
}
pass("Feature flag enables when UNPAID_FOLLOWUP_EMAILS_ENABLED=true");
delete process.env.UNPAID_FOLLOWUP_EMAILS_ENABLED;

// ─── 2. Step selection ───────────────────────────────────────────────────────

console.log("");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { pickTimeStep } = require("../src/lib/unpaid-followup") as typeof import("../src/lib/unpaid-followup");

const now = new Date("2026-10-20T09:00:00Z");

const cases: { ageDays: number; expected: string | null }[] = [
  { ageDays: 0, expected: "day0" },
  { ageDays: 0.5, expected: "day0" },
  { ageDays: 1, expected: "day1" },
  { ageDays: 2, expected: "day1" },
  { ageDays: 3, expected: "day3" },
  { ageDays: 5, expected: "day3" },
  { ageDays: 7, expected: "day7" },
  { ageDays: 30, expected: "day7" },
];

for (const { ageDays, expected } of cases) {
  const created = new Date(now.getTime() - ageDays * 86400000);
  const result = pickTimeStep(created, now);
  if (result !== expected) {
    fail(`pickTimeStep(age=${ageDays}d) = ${result}, expected ${expected}`);
  }
}
pass("Step selection correct for all age brackets");

// ─── 3. Email drafts render ──────────────────────────────────────────────────

console.log("");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { getFollowupEmailDraft } = require("../src/lib/unpaid-followup") as typeof import("../src/lib/unpaid-followup");

const steps = ["day0", "day1", "day3", "day7", "abandoned"] as const;
for (const step of steps) {
  const draft = getFollowupEmailDraft(step, "example.com", 42);
  if (!draft.subject || !draft.heading || !draft.bodyHtml || !draft.ctaLabel || !draft.ctaHref) {
    fail(`Draft for step '${step}' is missing a field`);
  }
  pass(`Draft '${step}' renders: "${draft.subject}"`);
}

// ─── 4. CTA links to correct checkout URL ───────────────────────────────────

console.log("");
for (const step of steps) {
  const draft = getFollowupEmailDraft(step, "example.com", 42);
  const expectedPattern = /\/billing\/plan\/\d+\?brandId=42/;
  if (!expectedPattern.test(draft.ctaHref)) {
    fail(`Draft '${step}' ctaHref does not link to brand checkout: ${draft.ctaHref}`);
  }
}
pass("All drafts link to /billing/plan/<planId>?brandId=<id>");

// ─── 5. Duplicate guard (schema check) ──────────────────────────────────────

console.log("");
const schema = readRepo("prisma/schema.prisma");
if (!schema.includes("unpaid_followup_sends")) {
  fail("Prisma schema missing unpaid_followup_sends model");
}
if (!schema.includes("uq_followup_member_brand_step")) {
  fail("Prisma schema missing unique constraint uq_followup_member_brand_step");
}
pass("Unique constraint on (member_id, brand_id, step) prevents duplicate sends");

// ─── 6. Cron route ──────────────────────────────────────────────────────────

console.log("");
const cronRoute = readRepo("src/app/api/cron/unpaid-followup/route.ts");
if (!cronRoute.includes("authenticateCron")) {
  fail("Cron route missing authenticateCron");
}
if (!cronRoute.includes("runUnpaidFollowup")) {
  fail("Cron route missing runUnpaidFollowup call");
}
if (!cronRoute.includes("isFollowupEnabled")) {
  fail("Cron route missing isFollowupEnabled check");
}
pass("Cron route exists, authenticated, and checks feature flag");

// ─── 7. vercel.json ─────────────────────────────────────────────────────────

console.log("");
const vercelJson = JSON.parse(readRepo("vercel.json"));
const cronEntry = (vercelJson.crons as { path: string }[]).find(
  (c) => c.path === "/api/cron/unpaid-followup",
);
if (!cronEntry) {
  fail("vercel.json missing /api/cron/unpaid-followup cron entry");
}
pass("vercel.json has /api/cron/unpaid-followup cron");

// ─── 8. SQL migration ───────────────────────────────────────────────────────

console.log("");
const sql = readRepo("prisma/sql/unpaid_followup_sends.sql");
if (!sql.includes("CREATE TABLE")) {
  fail("SQL migration missing CREATE TABLE");
}
if (!sql.includes("uq_followup_member_brand_step")) {
  fail("SQL migration missing unique key");
}
pass("SQL migration file exists with correct schema");

// ─── 9. Prisma model ────────────────────────────────────────────────────────

if (!schema.includes("model unpaid_followup_sends")) {
  fail("Prisma schema missing model unpaid_followup_sends");
}
pass("Prisma model unpaid_followup_sends present");

// ─── 10. Stale 'Launch on Free' text removed ────────────────────────────────

console.log("");
const templates = readRepo("src/lib/engagement-email-templates.ts");
if (templates.includes("Launch on Free")) {
  fail("engagement-email-templates.ts still contains 'Launch on Free'");
}
if (!templates.includes("$9/mo")) {
  fail("engagement-email-templates.ts missing $9/mo pay-to-publish copy");
}
pass("'Launch on Free' replaced with $9/mo pay-to-publish copy");

// ─── Done ────────────────────────────────────────────────────────────────────

console.log("\nAll checks passed.\n");
