/**
 * B18 — Subscriber report: active subscribers per plan with optional PayPal
 * status check.
 *
 * Read-only. Queries member_plan + url_plan, joins members / plans / member_urls,
 * and optionally calls PayPal to fetch each subscription's live status.
 *
 * Usage:
 *   npx tsx scripts/subscriber-report.ts                    # JSON
 *   npx tsx scripts/subscriber-report.ts --csv              # CSV
 *   npx tsx scripts/subscriber-report.ts --csv --paypal     # CSV + PayPal status
 *
 * Flags:
 *   --csv       Output as CSV instead of JSON
 *   --paypal    Check each subscription's PayPal status (ACTIVE/CANCELLED/SUSPENDED)
 *   --plan <id> Filter to a single plan id
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const PLAN_PUBLIC_NAME: Record<number, string> = {
  2: "Brand, monthly",
  6: "Brand, yearly",
  4: "Agency 10",
  5: "Agency 50",
  3: "Premium Unlimited",
};

interface SubscriberRow {
  memberId: number;
  memberName: string;
  email: string;
  planId: number;
  planName: string;
  planPrice: number;
  planUnit: string;
  brands: string;
  paypalSubscriptionId: string;
  nextBillingDate: string;
  paypalStatus?: string;
}

function getPayPalApiBaseUrl(): string {
  return process.env.PAYPAL_MODE === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
}

async function getAccessToken(): Promise<string> {
  const auth = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`,
  ).toString("base64");

  const response = await fetch(`${getPayPalApiBaseUrl()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  const data = await response.json();
  return data.access_token;
}

async function getPayPalSubscription(
  subscriptionId: string,
  token: string,
): Promise<{ status?: string; billing_info?: { next_billing_time?: string } }> {
  const response = await fetch(
    `${getPayPalApiBaseUrl()}/v1/billing/subscriptions/${subscriptionId}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!response.ok) return {};
  return response.json();
}

async function main() {
  const args = process.argv.slice(2);
  const csvMode = args.includes("--csv");
  const paypalMode = args.includes("--paypal");
  const planFilterIdx = args.indexOf("--plan");
  const planFilter =
    planFilterIdx >= 0 ? parseInt(args[planFilterIdx + 1], 10) : null;

  // Pull all active member_plan rows (not cancelled).
  const memberPlans = await prisma.member_plan.findMany({
    where: {
      agreement_activate: { not: null },
      agreement_cancel: null,
      ...(planFilter != null ? { payment_id: planFilter } : {}),
    },
    orderBy: { id: "desc" },
  });

  // Also pull url_plan rows for brand-level subscriptions.
  const urlPlans = await prisma.url_plan.findMany({
    where: {
      agreement_activate: { not: null },
      agreement_cancel: null,
    },
    orderBy: { id: "desc" },
  });

  // Collect unique member ids.
  const memberIds = [
    ...new Set([
      ...memberPlans.map((mp) => mp.member_id),
      ...urlPlans.map((up) => up.member_id),
    ]),
  ];

  const members = await prisma.members.findMany({
    where: { id: { in: memberIds } },
    select: { id: true, name: true, email: true, plan_expiry: true },
  });
  const memberMap = new Map(members.map((m) => [m.id, m]));

  const plans = await prisma.plans.findMany();
  const planMap = new Map(plans.map((p) => [p.id, p]));

  const allBrands = await prisma.member_urls.findMany({
    where: { member_id: { in: memberIds } },
    select: { id: true, member_id: true, domain: true, plan_expiry: true },
  });
  const brandsByMember = new Map<number, typeof allBrands>();
  for (const b of allBrands) {
    const arr = brandsByMember.get(b.member_id) ?? [];
    arr.push(b);
    brandsByMember.set(b.member_id, arr);
  }

  // Dedupe by paypal_agreement_id so we don't double-list.
  const seen = new Set<string>();
  const rows: SubscriberRow[] = [];

  for (const mp of memberPlans) {
    const agreementId = mp.paypal_agreement_id ?? "";
    if (!agreementId || seen.has(agreementId)) continue;
    seen.add(agreementId);

    const member = memberMap.get(mp.member_id);
    const plan = planMap.get(mp.payment_id ?? 0);
    const brands = brandsByMember.get(mp.member_id) ?? [];

    const planId = mp.payment_id ?? 0;
    const expiry = member?.plan_expiry;
    const brandExpiries = brands
      .filter((b) => b.plan_expiry)
      .map((b) => b.plan_expiry!);
    const latestExpiry = [expiry, ...brandExpiries]
      .filter(Boolean)
      .sort((a, b) => (b as Date).getTime() - (a as Date).getTime())[0];

    rows.push({
      memberId: mp.member_id,
      memberName: member?.name ?? "",
      email: member?.email ?? "",
      planId,
      planName:
        PLAN_PUBLIC_NAME[planId] ?? plan?.name ?? `Plan #${planId}`,
      planPrice: plan?.price ?? 0,
      planUnit: plan?.unit ?? "month",
      brands: brands.map((b) => b.domain).join("; "),
      paypalSubscriptionId: agreementId,
      nextBillingDate: latestExpiry
        ? (latestExpiry as Date).toISOString().slice(0, 10)
        : "unknown",
    });
  }

  // url_plan rows that have no corresponding member_plan entry.
  for (const up of urlPlans) {
    const agreementId = up.paypal_agreement_id ?? "";
    if (!agreementId || seen.has(agreementId)) continue;
    seen.add(agreementId);

    const member = memberMap.get(up.member_id);
    const plan = planMap.get(up.payment_id ?? 0);
    const brands = brandsByMember.get(up.member_id) ?? [];
    const planId = up.payment_id ?? 0;
    const brand = brands.find((b) => b.id === up.url_id);
    const latestExpiry = brand?.plan_expiry ?? member?.plan_expiry;

    rows.push({
      memberId: up.member_id,
      memberName: member?.name ?? "",
      email: member?.email ?? "",
      planId,
      planName:
        PLAN_PUBLIC_NAME[planId] ?? plan?.name ?? `Plan #${planId}`,
      planPrice: plan?.price ?? 0,
      planUnit: plan?.unit ?? "month",
      brands: brands.map((b) => b.domain).join("; "),
      paypalSubscriptionId: agreementId,
      nextBillingDate: latestExpiry
        ? latestExpiry.toISOString().slice(0, 10)
        : "unknown",
    });
  }

  // Optional PayPal status check.
  if (paypalMode) {
    if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
      console.error(
        "Warning: PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET not set. Skipping PayPal status check.",
      );
    } else {
      console.error(
        `Checking PayPal status for ${rows.length} subscriptions…`,
      );
      const token = await getAccessToken();
      for (const row of rows) {
        try {
          const sub = await getPayPalSubscription(
            row.paypalSubscriptionId,
            token,
          );
          row.paypalStatus = sub.status ?? "UNKNOWN";
          if (sub.billing_info?.next_billing_time) {
            row.nextBillingDate = sub.billing_info.next_billing_time.slice(
              0,
              10,
            );
          }
        } catch {
          row.paypalStatus = "ERROR";
        }
      }
    }
  }

  // Sort: Premium Unlimited first, then by plan name.
  rows.sort((a, b) => {
    if (a.planId === 3 && b.planId !== 3) return -1;
    if (b.planId === 3 && a.planId !== 3) return 1;
    return a.planName.localeCompare(b.planName) || a.email.localeCompare(b.email);
  });

  if (csvMode) {
    const headers = [
      "member_id",
      "name",
      "email",
      "plan",
      "price",
      "unit",
      "brands",
      "paypal_subscription_id",
      "next_billing_date",
      ...(paypalMode ? ["paypal_status"] : []),
    ];
    console.log(headers.join(","));
    for (const r of rows) {
      const vals = [
        r.memberId,
        csvEscape(r.memberName),
        csvEscape(r.email),
        csvEscape(r.planName),
        r.planPrice,
        r.planUnit,
        csvEscape(r.brands),
        r.paypalSubscriptionId,
        r.nextBillingDate,
        ...(paypalMode ? [r.paypalStatus ?? ""] : []),
      ];
      console.log(vals.join(","));
    }
  } else {
    console.log(JSON.stringify({ asOf: new Date().toISOString(), subscribers: rows }, null, 2));
  }

  console.error(`\nTotal active subscribers: ${rows.length}`);

  const unlimited = rows.filter((r) => r.planId === 3);
  if (unlimited.length > 0) {
    console.error(`\nPremium Unlimited ($1,999/yr) subscribers:`);
    for (const u of unlimited) {
      console.error(
        `  ${u.email} — renewal: ${u.nextBillingDate}${u.paypalStatus ? ` (PayPal: ${u.paypalStatus})` : ""}`,
      );
    }
  } else {
    console.error("\nNo Premium Unlimited subscribers found.");
  }
}

function csvEscape(val: string): string {
  if (val.includes(",") || val.includes('"') || val.includes("\n")) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
