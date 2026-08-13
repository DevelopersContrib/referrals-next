/**
 * Compute + (optionally) post the all-time VNOC attribution baseline, split by
 * product 3 (referrals) and product 11 (referralstier).
 *
 * Manage tiles = baseline + live events with ts >= as_of. Run this ONCE at
 * go-live, using an `as_of` at/just-before the moment live postbacks start, so
 * historical totals show without replaying every old row and without
 * double-counting new events.
 *
 * Differentiation: the two products have non-overlapping prices
 *   referrals     -> 9, 99, 1999
 *   referralstier -> 70, 350
 * so each payment's amount maps uniquely to a product. Amounts that don't match
 * fall back to a join through member_plan -> plans.price, then to the
 * --unmatched bucket (default: referrals).
 *
 * Usage:
 *   npx tsx scripts/vnoc-baseline.ts                 # dry run (prints, sends nothing)
 *   npx tsx scripts/vnoc-baseline.ts --send          # PUT baselines to VNOC
 *   npx tsx scripts/vnoc-baseline.ts --as-of=2026-08-12T00:00:00Z
 *   npx tsx scripts/vnoc-baseline.ts --unmatched=skip   # referrals|referralstier|skip
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import {
  putVnocBaseline,
  resolveVnocPlan,
  isVnocAttributionConfigured,
  type VnocProduct,
} from "../src/lib/vnoc-attribution";

const prisma = new PrismaClient();

type Bucket = {
  paidCount: number;
  revenueUsd: number;
  refundsCount: number;
  refundsUsd: number;
};

const REFUND_RE = /refund|revers|charge.?back/i;

function emptyBucket(): Bucket {
  return { paidCount: 0, revenueUsd: 0, refundsCount: 0, refundsUsd: 0 };
}

function arg(name: string): string | undefined {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : undefined;
}

async function main() {
  const send = process.argv.includes("--send");
  const asOf = arg("as-of") ?? new Date().toISOString();
  const unmatchedTarget = (arg("unmatched") ?? "referrals") as
    | VnocProduct
    | "skip";

  // Baseline window: current year by default (legacy pre-window rows are ignored).
  // Override with --since=YYYY-MM-DD (or an ISO timestamp), or --since=all.
  const sinceArg = arg("since");
  const since =
    sinceArg === "all"
      ? null
      : sinceArg
        ? new Date(sinceArg)
        : new Date(Date.UTC(new Date().getUTCFullYear(), 0, 1));

  const windowLabel = since ? `since ${since.toISOString()}` : "all-time";
  const notes = arg("notes") ?? `Baseline (${windowLabel}) at attribution go-live`;

  // Price lookup for the member_plan -> plans.price fallback join.
  const plans = await prisma.plans.findMany({ select: { id: true, price: true } });
  const planPriceById = new Map<number, number>(
    plans.map((p) => [p.id, p.price ?? 0])
  );

  const memberPlans = await prisma.member_plan.findMany({
    select: { paypal_agreement_id: true, payment_id: true },
  });
  const priceByAgreement = new Map<string, number>();
  for (const mp of memberPlans) {
    if (mp.paypal_agreement_id && mp.payment_id != null) {
      const price = planPriceById.get(mp.payment_id);
      if (price != null) priceByAgreement.set(mp.paypal_agreement_id, price);
    }
  }

  // Exclude platform admins (is_admin flag or ADMIN_EMAILS) — they're free /
  // enterprise-comped and must not count toward signups or revenue.
  const includeAdmins = process.argv.includes("--include-admins");
  const adminEmails = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  const adminMembers = includeAdmins
    ? []
    : await prisma.members.findMany({
        where: {
          OR: [
            { is_admin: true },
            ...(adminEmails.length ? [{ email: { in: adminEmails } }] : []),
          ],
        },
        select: { id: true },
      });
  const adminIds = adminMembers.map((m) => m.id);
  const excludeAdmin = adminIds.length ? { notIn: adminIds } : undefined;

  const [signups, payments] = await Promise.all([
    prisma.members.count({
      where: {
        ...(since ? { date_signedup: { gte: since } } : {}),
        ...(excludeAdmin ? { id: excludeAdmin } : {}),
      },
    }),
    prisma.member_payment.findMany({
      where: {
        ...(since ? { datetime_created: { gte: since } } : {}),
        ...(excludeAdmin ? { member_id: excludeAdmin } : {}),
      },
      select: { id: true, amount: true, status: true, transaction_id: true },
    }),
  ]);

  const buckets: Record<VnocProduct, Bucket> = {
    referrals: emptyBucket(),
    referralstier: emptyBucket(),
  };
  const unmatched = { ...emptyBucket(), samples: [] as number[] };

  // De-dupe: billing/execute and the PayPal webhook can both write the same
  // charge (same transaction_id). Count each transaction once.
  const seen = new Set<string>();

  for (const p of payments) {
    const key = p.transaction_id?.trim() || `id:${p.id}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const amount = p.amount ?? 0;
    const abs = Math.abs(amount);
    const isRefund = REFUND_RE.test(p.status || "") || amount < 0;

    // Resolve product: amount first, then plan-join fallback.
    let product: VnocProduct | null = resolveVnocPlan(abs)?.product ?? null;
    if (!product && p.transaction_id) {
      const price = priceByAgreement.get(p.transaction_id.trim());
      if (price != null) product = resolveVnocPlan(price)?.product ?? null;
    }

    const target: Bucket | typeof unmatched =
      product != null ? buckets[product] : unmatched;

    if (isRefund) {
      target.refundsCount += 1;
      target.refundsUsd += abs;
    } else if (abs > 0) {
      target.paidCount += 1;
      target.revenueUsd += abs;
    }
    if (product == null && unmatched.samples.length < 10) {
      unmatched.samples.push(amount);
    }
  }

  // Fold unmatched into the chosen product (default referrals), unless skipped.
  if (unmatchedTarget !== "skip") {
    const t = buckets[unmatchedTarget];
    t.paidCount += unmatched.paidCount;
    t.revenueUsd += unmatched.revenueUsd;
    t.refundsCount += unmatched.refundsCount;
    t.refundsUsd += unmatched.refundsUsd;
  }

  const round2 = (n: number) => Math.round(n * 100) / 100;

  // signups (free accounts) live under the base product only.
  const baselineByProduct: Record<
    VnocProduct,
    { signups: number } & Bucket
  > = {
    referrals: { signups, ...buckets.referrals },
    referralstier: { signups: 0, ...buckets.referralstier },
  };
  baselineByProduct.referrals.revenueUsd = round2(baselineByProduct.referrals.revenueUsd);
  baselineByProduct.referrals.refundsUsd = round2(baselineByProduct.referrals.refundsUsd);
  baselineByProduct.referralstier.revenueUsd = round2(baselineByProduct.referralstier.revenueUsd);
  baselineByProduct.referralstier.refundsUsd = round2(baselineByProduct.referralstier.refundsUsd);

  console.log("VNOC attribution baseline");
  console.log("window:", windowLabel);
  console.log("as_of:", asOf);
  console.log(
    "admins excluded:",
    includeAdmins ? "no (--include-admins)" : adminIds.length
  );
  console.log("mode:", send ? "SEND" : "DRY RUN (pass --send to post)");
  console.log("");
  console.table({
    "referrals (product 3)": baselineByProduct.referrals,
    "referralstier (product 11)": baselineByProduct.referralstier,
  });

  if (unmatched.paidCount || unmatched.refundsCount) {
    console.log(
      `\nUnmatched (${unmatchedTarget === "skip" ? "excluded" : `folded into ${unmatchedTarget}`}):`,
      {
        paidCount: unmatched.paidCount,
        revenueUsd: round2(unmatched.revenueUsd),
        refundsCount: unmatched.refundsCount,
        refundsUsd: round2(unmatched.refundsUsd),
        sampleAmounts: unmatched.samples,
      }
    );
  }

  if (!send) {
    console.log("\nDry run — nothing sent. Re-run with --send to post baselines.");
    return;
  }

  if (!isVnocAttributionConfigured()) {
    throw new Error(
      "VNOC attribution env not configured (VNOC_ATTRIBUTION_URL / VNOC_DOMAIN_ID / product tokens)."
    );
  }

  for (const product of ["referrals", "referralstier"] as VnocProduct[]) {
    const b = baselineByProduct[product];
    const result = await putVnocBaseline(product, {
      asOf,
      signups: b.signups,
      paidCount: b.paidCount,
      revenueUsd: b.revenueUsd,
      refundsCount: b.refundsCount,
      refundsUsd: b.refundsUsd,
      notes,
    });
    console.log(
      `\n${product}:`,
      result.ok ? "OK" : result.skipped ? "SKIPPED (not configured)" : `FAILED: ${result.error}`
    );
  }
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
