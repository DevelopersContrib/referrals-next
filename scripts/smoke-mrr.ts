/**
 * B10 — MRR smoke test (offline, fixture data — no DB required).
 *
 *   npx tsx scripts/smoke-mrr.ts
 *
 * Validates the pure `computeMrrFromRows` helper and `monthlyPrice` against
 * representative fixture data covering every edge case in the spec.
 */
import { readFileSync } from "fs";
import { join } from "path";

import {
  computeMrrFromRows,
  type ActiveSubRow,
  type PlanPriceInfo,
} from "../src/lib/mrr";
import { monthlyPrice } from "../src/lib/revenue";

let failures = 0;

function fail(msg: string) {
  console.error(`FAIL: ${msg}`);
  failures += 1;
}

function pass(msg: string) {
  console.log(`OK: ${msg}`);
}

function approxEq(a: number, b: number, epsilon = 0.01): boolean {
  return Math.abs(a - b) < epsilon;
}

function assertApprox(label: string, actual: number, expected: number) {
  if (approxEq(actual, expected)) {
    pass(`${label} = ${actual} (expected ${expected})`);
  } else {
    fail(`${label} = ${actual}, expected ${expected}`);
  }
}

function readRepoFile(relPath: string): string {
  return readFileSync(join(process.cwd(), relPath), "utf8");
}

// ── Fixture plans ──────────────────────────────────────────────────────────

const PLANS = new Map<number, PlanPriceInfo>([
  [2, { price: 9, unit: "month", days: 30 }],     // Brand, monthly $9
  [6, { price: 99, unit: "year", days: 365 }],     // Brand, yearly $99
  [4, { price: 49, unit: "month", days: 30 }],     // Agency 10
  [5, { price: 99, unit: "month", days: 30 }],     // Agency 50
  [3, { price: 1999, unit: "year", days: 365 }],   // Premium Unlimited
]);

// ── monthlyPrice unit tests ────────────────────────────────────────────────

function testMonthlyPrice() {
  console.log("\n=== monthlyPrice ===\n");

  assertApprox("monthly $9", monthlyPrice({ price: 9, unit: "month", days: 30 }), 9);
  assertApprox("yearly $99", monthlyPrice({ price: 99, unit: "year", days: 365 }), 99 / 12);
  assertApprox("yearly $1999", monthlyPrice({ price: 1999, unit: "year", days: 365 }), 1999 / 12);
  assertApprox("null price", monthlyPrice({ price: null, unit: "month" }), 0);
  assertApprox("zero price", monthlyPrice({ price: 0, unit: "month" }), 0);
  assertApprox("60-day plan $15", monthlyPrice({ price: 15, unit: "month", days: 60 }), (15 * 30) / 60);
  assertApprox("360-day plan $100", monthlyPrice({ price: 100, unit: "month", days: 360 }), 100 / 12);
}

// ── computeMrrFromRows unit tests ──────────────────────────────────────────

function testComputeMrrFromRows() {
  console.log("\n=== computeMrrFromRows ===\n");

  // 1. Single active url_plan brand subscription ($9/mo)
  {
    const urlPlans: ActiveSubRow[] = [
      { paypal_agreement_id: "I-AAA111", payment_id: 2, member_id: 10 },
    ];
    const result = computeMrrFromRows(urlPlans, [], PLANS);
    assertApprox("single brand monthly", result, 9);
  }

  // 2. Single active member_plan subscription ($9/mo)
  {
    const mpRows: ActiveSubRow[] = [
      { paypal_agreement_id: "I-BBB222", payment_id: 2, member_id: 20 },
    ];
    const result = computeMrrFromRows([], mpRows, PLANS);
    assertApprox("single member_plan monthly", result, 9);
  }

  // 3. Yearly plan normalised
  {
    const urlPlans: ActiveSubRow[] = [
      { paypal_agreement_id: "I-CCC333", payment_id: 6, member_id: 30 },
    ];
    const result = computeMrrFromRows(urlPlans, [], PLANS);
    assertApprox("yearly normalised", result, 99 / 12);
  }

  // 4. Both tables, different agreements → sum
  {
    const urlPlans: ActiveSubRow[] = [
      { paypal_agreement_id: "I-AAA111", payment_id: 2, member_id: 10 },
    ];
    const mpRows: ActiveSubRow[] = [
      { paypal_agreement_id: "I-BBB222", payment_id: 4, member_id: 20 },
    ];
    const result = computeMrrFromRows(urlPlans, mpRows, PLANS);
    assertApprox("url_plan + member_plan different agreements", result, 9 + 49);
  }

  // 5. DEDUP: same agreement_id in both tables → counted once
  {
    const urlPlans: ActiveSubRow[] = [
      { paypal_agreement_id: "I-SHARED", payment_id: 2, member_id: 10 },
    ];
    const mpRows: ActiveSubRow[] = [
      { paypal_agreement_id: "I-SHARED", payment_id: 2, member_id: 10 },
    ];
    const result = computeMrrFromRows(urlPlans, mpRows, PLANS);
    assertApprox("dedup same agreement", result, 9);
  }

  // 6. No subscriptions → $0
  {
    const result = computeMrrFromRows([], [], PLANS);
    assertApprox("empty = $0", result, 0);
  }

  // 7. Plan with price = 0 (free) → excluded
  {
    const freePlans = new Map<number, PlanPriceInfo>([
      [1, { price: 0, unit: "month", days: 14 }],
    ]);
    const urlPlans: ActiveSubRow[] = [
      { paypal_agreement_id: "I-FREE", payment_id: 1, member_id: 50 },
    ];
    const result = computeMrrFromRows(urlPlans, [], freePlans);
    assertApprox("free plan = $0", result, 0);
  }

  // 8. Excluded member IDs
  {
    const urlPlans: ActiveSubRow[] = [
      { paypal_agreement_id: "I-AAA111", payment_id: 2, member_id: 10 },
      { paypal_agreement_id: "I-DDD444", payment_id: 2, member_id: 99 },
    ];
    const result = computeMrrFromRows(urlPlans, [], PLANS, [99]);
    assertApprox("exclude member 99", result, 9);
  }

  // 9. Mixed: monthly + yearly + agency
  {
    const urlPlans: ActiveSubRow[] = [
      { paypal_agreement_id: "I-M1", payment_id: 2, member_id: 1 },
      { paypal_agreement_id: "I-Y1", payment_id: 6, member_id: 2 },
    ];
    const mpRows: ActiveSubRow[] = [
      { paypal_agreement_id: "I-A1", payment_id: 5, member_id: 3 },
    ];
    const expected = 9 + 99 / 12 + 99;
    const result = computeMrrFromRows(urlPlans, mpRows, PLANS);
    assertApprox("mixed monthly+yearly+agency", result, Math.round(expected * 100) / 100);
  }

  // 10. Null paypal_agreement_id (edge) — each counted separately
  {
    const urlPlans: ActiveSubRow[] = [
      { paypal_agreement_id: null, payment_id: 2, member_id: 10 },
      { paypal_agreement_id: null, payment_id: 2, member_id: 11 },
    ];
    const result = computeMrrFromRows(urlPlans, [], PLANS);
    assertApprox("null agreement ids each counted", result, 18);
  }

  // 11. Unknown payment_id (no matching plan) → excluded
  {
    const urlPlans: ActiveSubRow[] = [
      { paypal_agreement_id: "I-UNK", payment_id: 999, member_id: 10 },
    ];
    const result = computeMrrFromRows(urlPlans, [], PLANS);
    assertApprox("unknown plan id = $0", result, 0);
  }
}

// ── Source-level checks ────────────────────────────────────────────────────

function testSourceIntegrity() {
  console.log("\n=== Source integrity ===\n");

  const mrr = readRepoFile("src/lib/mrr.ts");
  if (!mrr.includes("export function computeMrrFromRows")) {
    fail("mrr.ts must export the pure computeMrrFromRows helper");
  }
  if (!mrr.includes("export async function computeActiveMrr")) {
    fail("mrr.ts must export the async computeActiveMrr helper");
  }
  if (!mrr.includes("url_plan")) {
    fail("mrr.ts must query url_plan (per-brand subscriptions)");
  }
  if (!mrr.includes("member_plan")) {
    fail("mrr.ts must query member_plan (account-level subscriptions)");
  }
  if (!mrr.includes("agreement_cancel IS NULL")) {
    fail("mrr.ts must filter out cancelled subscriptions");
  }
  if (!mrr.includes("in_vnoc")) {
    fail("mrr.ts must exclude VNOC / network brands");
  }
  if (!mrr.includes("vnoc_id IS NULL")) {
    fail("mrr.ts must exclude vnoc_id brands");
  }
  if (!mrr.includes("seen")) {
    fail("mrr.ts must de-duplicate by paypal_agreement_id");
  }
  pass("mrr.ts source has all required pieces");

  const adminSubs = readRepoFile("src/lib/admin-subscriptions.ts");
  if (!adminSubs.includes("computeActiveMrr")) {
    fail("admin-subscriptions.ts must use computeActiveMrr");
  }
  if (adminSubs.includes("FROM members m") && adminSubs.includes("JOIN plans pl ON pl.id = m.plan_id")) {
    fail("admin-subscriptions.ts must NOT use the old members.plan_id MRR query");
  }
  pass("admin-subscriptions.ts uses the shared MRR helper");

  const revenue = readRepoFile("src/lib/revenue.ts");
  if (!revenue.includes("computeActiveMrr")) {
    fail("revenue.ts getMrrEstimate must use computeActiveMrr");
  }
  pass("revenue.ts uses the shared MRR helper");

  const snapshot = readRepoFile("scripts/paid-funnel-snapshot.ts");
  if (!snapshot.includes("computeActiveMrr")) {
    fail("paid-funnel-snapshot.ts must use computeActiveMrr");
  }
  if (snapshot.includes("FROM members m") && snapshot.includes("JOIN plans pl ON pl.id = m.plan_id")) {
    fail("paid-funnel-snapshot.ts must NOT use the old members.plan_id MRR query");
  }
  pass("paid-funnel-snapshot.ts uses the shared MRR helper");
}

// ── Main ───────────────────────────────────────────────────────────────────

function main() {
  console.log("\n=== B10 MRR smoke test (offline, fixture data) ===");

  testMonthlyPrice();
  testComputeMrrFromRows();
  testSourceIntegrity();

  console.log("");
  if (failures > 0) {
    console.error(`\n${failures} FAILURE(S)\n`);
    process.exit(1);
  }
  console.log("All MRR smoke tests passed.\n");
}

main();
