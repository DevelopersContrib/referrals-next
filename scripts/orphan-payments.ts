/**
 * B2 — Orphan payments: member_payment rows with no matching url_plan.
 *
 * Read-only. Lists payments that were recorded before checkout required a brand,
 * so they have no url_plan tying them to a specific brand.
 *
 * Usage:
 *   npx tsx scripts/orphan-payments.ts              # JSON
 *   npx tsx scripts/orphan-payments.ts --csv         # CSV for Maida
 *
 * Output columns: member_id, name, email, amount, date, transaction_id,
 *   paypal_subscription_id (from member_plan if available), brands (domain +
 *   live/private status).
 *
 * This script does NOT modify any data.
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface OrphanRow {
  paymentId: number;
  memberId: number;
  name: string;
  email: string;
  amount: number;
  currency: string;
  date: string;
  transactionId: string;
  paypalSubscriptionId: string;
  brands: string;
}

async function main() {
  const args = process.argv.slice(2);
  const csvMode = args.includes("--csv");

  // member_payment rows that have no url_id (not linked to a brand).
  const orphanPayments = await prisma.member_payment.findMany({
    where: { url_id: null, amount: { gt: 0 } },
    orderBy: { datetime_created: "desc" },
  });

  if (orphanPayments.length === 0) {
    console.error("No orphan payments found.");
    if (csvMode) {
      console.log(
        "payment_id,member_id,name,email,amount,currency,date,transaction_id,paypal_subscription_id,brands",
      );
    } else {
      console.log(JSON.stringify({ asOf: new Date().toISOString(), orphanPayments: [] }, null, 2));
    }
    return;
  }

  const memberIds = [...new Set(orphanPayments.map((p) => p.member_id))];

  const members = await prisma.members.findMany({
    where: { id: { in: memberIds } },
    select: { id: true, name: true, email: true },
  });
  const memberMap = new Map(members.map((m) => [m.id, m]));

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

  // Try to find PayPal subscription ids from member_plan for these members.
  const memberPlans = await prisma.member_plan.findMany({
    where: { member_id: { in: memberIds } },
    orderBy: { id: "desc" },
    select: { member_id: true, paypal_agreement_id: true },
  });
  const subIdByMember = new Map<number, string>();
  for (const mp of memberPlans) {
    if (mp.paypal_agreement_id && !subIdByMember.has(mp.member_id)) {
      subIdByMember.set(mp.member_id, mp.paypal_agreement_id);
    }
  }

  // Also check url_plan for matching transaction ids.
  const transactionIds = orphanPayments
    .map((p) => p.transaction_id)
    .filter((t): t is string => !!t);
  const matchingUrlPlans = await prisma.url_plan.findMany({
    where: { paypal_agreement_id: { in: transactionIds } },
    select: { paypal_agreement_id: true, url_id: true },
  });
  const urlPlanByAgreement = new Map(
    matchingUrlPlans.map((up) => [up.paypal_agreement_id, up]),
  );

  const rows: OrphanRow[] = [];

  for (const payment of orphanPayments) {
    // Skip if this payment's transaction_id actually matches a url_plan
    // (it's not truly orphaned, just the url_id foreign key wasn't set).
    if (
      payment.transaction_id &&
      urlPlanByAgreement.has(payment.transaction_id)
    ) {
      continue;
    }

    const member = memberMap.get(payment.member_id);
    const brands = brandsByMember.get(payment.member_id) ?? [];
    const now = new Date();

    rows.push({
      paymentId: payment.id,
      memberId: payment.member_id,
      name: member?.name ?? "",
      email: member?.email ?? "",
      amount: payment.amount ?? 0,
      currency: payment.currency ?? "USD",
      date: payment.datetime_created.toISOString().slice(0, 10),
      transactionId: payment.transaction_id ?? "",
      paypalSubscriptionId: subIdByMember.get(payment.member_id) ?? "",
      brands: brands
        .map((b) => {
          const live =
            b.plan_expiry && b.plan_expiry > now ? "live" : "private";
          return `${b.domain} (${live})`;
        })
        .join("; "),
    });
  }

  if (csvMode) {
    const headers = [
      "payment_id",
      "member_id",
      "name",
      "email",
      "amount",
      "currency",
      "date",
      "transaction_id",
      "paypal_subscription_id",
      "brands",
    ];
    console.log(headers.join(","));
    for (const r of rows) {
      console.log(
        [
          r.paymentId,
          r.memberId,
          csvEscape(r.name),
          csvEscape(r.email),
          r.amount,
          r.currency,
          r.date,
          csvEscape(r.transactionId),
          r.paypalSubscriptionId,
          csvEscape(r.brands),
        ].join(","),
      );
    }
  } else {
    console.log(
      JSON.stringify(
        { asOf: new Date().toISOString(), orphanPayments: rows },
        null,
        2,
      ),
    );
  }

  console.error(`\nOrphan payments found: ${rows.length}`);
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
