/**
 * Shared MRR (Monthly Recurring Revenue) helper.
 *
 * Aggregates ACTIVE subscriptions from both `url_plan` (per-brand) and
 * `member_plan` (account-level). A subscription is active when
 * `agreement_activate` IS NOT NULL and `agreement_cancel` IS NULL.
 *
 * Rules:
 *   - VNOC / network brands are free and excluded
 *   - Yearly plans normalised to monthly (price / 12)
 *   - Duplicate `paypal_agreement_id` across both tables counted once
 *     (url_plan wins because it is more specific)
 *   - Cancelled / suspended / expired subscriptions excluded
 */

import { prisma } from "@/lib/prisma";
import { monthlyPrice } from "@/lib/revenue";

export type ActiveSubRow = {
  paypal_agreement_id: string | null;
  payment_id: number | null;
  member_id: number;
};

export type PlanPriceInfo = {
  price?: number | null;
  unit?: string | null;
  days?: number | null;
};

/**
 * Pure computation — no DB access. Exported for smoke tests.
 *
 * `urlPlanRows` take precedence: if the same `paypal_agreement_id` appears in
 * both lists, only the url_plan entry counts.
 */
export function computeMrrFromRows(
  urlPlanRows: ActiveSubRow[],
  memberPlanRows: ActiveSubRow[],
  plansById: Map<number, PlanPriceInfo>,
  excludeMemberIds: number[] = [],
): number {
  const excludeSet = new Set(excludeMemberIds);
  const seen = new Set<string>();
  let mrr = 0;

  const addRow = (row: ActiveSubRow) => {
    if (excludeSet.has(row.member_id)) return;
    if (row.paypal_agreement_id) {
      if (seen.has(row.paypal_agreement_id)) return;
      seen.add(row.paypal_agreement_id);
    }
    const plan = row.payment_id ? plansById.get(row.payment_id) : undefined;
    if (!plan || !plan.price || plan.price <= 0) return;
    mrr += monthlyPrice(plan);
  };

  for (const row of urlPlanRows) addRow(row);
  for (const row of memberPlanRows) addRow(row);

  return Math.round(mrr * 100) / 100;
}

/**
 * Live MRR from the database: active `url_plan` + `member_plan` subscriptions,
 * VNOC-excluded, de-duplicated, yearly-normalised.
 */
export async function computeActiveMrr(opts?: {
  excludeMemberIds?: number[];
}): Promise<number> {
  const excludeIds = opts?.excludeMemberIds ?? [];

  const [activeUrlPlans, activeMemberPlans] = await Promise.all([
    prisma.$queryRaw<ActiveSubRow[]>`
      SELECT up.paypal_agreement_id, up.payment_id, up.member_id
      FROM url_plan up
      JOIN member_urls mu ON mu.id = up.url_id
      WHERE up.agreement_activate IS NOT NULL
        AND up.agreement_cancel IS NULL
        AND (mu.in_vnoc = 0 OR mu.in_vnoc IS NULL)
        AND mu.vnoc_id IS NULL`,
    prisma.$queryRaw<ActiveSubRow[]>`
      SELECT mp.paypal_agreement_id, mp.payment_id, mp.member_id
      FROM member_plan mp
      WHERE mp.agreement_activate IS NOT NULL
        AND mp.agreement_cancel IS NULL`,
  ]);

  const allPlanIds = new Set<number>();
  for (const row of [...activeUrlPlans, ...activeMemberPlans]) {
    if (row.payment_id) allPlanIds.add(row.payment_id);
  }

  const plans =
    allPlanIds.size > 0
      ? await prisma.plans.findMany({
          where: { id: { in: [...allPlanIds] } },
          select: { id: true, price: true, unit: true, days: true },
        })
      : [];
  const plansById = new Map(plans.map((p) => [p.id, p]));

  return computeMrrFromRows(
    activeUrlPlans,
    activeMemberPlans,
    plansById,
    excludeIds,
  );
}
