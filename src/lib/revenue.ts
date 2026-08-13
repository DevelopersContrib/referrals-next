import { prisma } from "@/lib/prisma";

/**
 * Platform revenue, computed the "correct" way for admin/reporting:
 *  - excludes admin / enterprise-comped members
 *  - excludes non-captured rows (pending/failed/refunded/void)
 *  - de-dupes exact re-inserts by transaction_id
 *
 * Note on `status`: the update-payments cron overwrites member_payment.status
 * with the *subscription's* current state, so "cancelled"/"active" rows still
 * represent real captured charges and ARE counted. Only clearly non-captured
 * states are dropped.
 */

const NON_CAPTURED_STATUS = /pending|fail|declin|refund|revers|void|incomplete|error/i;

export interface PlatformRevenue {
  /** Calendar year-to-date gross. */
  thisYear: number;
  thisMonth: number;
  lastMonth: number;
  /** All-time gross (captured, admin-excluded, de-duped). */
  allTime: number;
  /** Distinct captured charges this year. */
  paidCountThisYear: number;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export async function getPlatformRevenue(opts: {
  excludeMemberIds?: number[];
  now?: Date;
}): Promise<PlatformRevenue> {
  const now = opts.now ?? new Date();
  const excludeMemberIds = opts.excludeMemberIds ?? [];
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const rows = await prisma.member_payment.findMany({
    where: excludeMemberIds.length
      ? { member_id: { notIn: excludeMemberIds } }
      : undefined,
    select: {
      amount: true,
      status: true,
      transaction_id: true,
      datetime_created: true,
    },
    orderBy: { id: "asc" },
  });

  const seen = new Set<string>();
  let thisYear = 0;
  let thisMonth = 0;
  let lastMonth = 0;
  let allTime = 0;
  let paidCountThisYear = 0;

  for (const r of rows) {
    const amount = r.amount ?? 0;
    if (amount <= 0) continue;
    if (NON_CAPTURED_STATUS.test(r.status || "")) continue;

    const tx = r.transaction_id?.trim();
    if (tx) {
      if (seen.has(tx)) continue;
      seen.add(tx);
    }

    allTime += amount;
    const d = r.datetime_created;
    if (d >= yearStart) {
      thisYear += amount;
      paidCountThisYear += 1;
    }
    if (d >= thisMonthStart) thisMonth += amount;
    else if (d >= lastMonthStart && d < thisMonthStart) lastMonth += amount;
  }

  return {
    thisYear: round2(thisYear),
    thisMonth: round2(thisMonth),
    lastMonth: round2(lastMonth),
    allTime: round2(allTime),
    paidCountThisYear,
  };
}

/**
 * Normalize a plan's price to a monthly figure (annual plans / day-based
 * durations converted to a per-month equivalent).
 */
export function monthlyPrice(plan: {
  price?: number | null;
  unit?: string | null;
  days?: number | null;
}): number {
  const price = plan.price ?? 0;
  if (!price) return 0;
  const unit = (plan.unit || "month").toLowerCase();
  const days = plan.days ?? 0;
  if (unit.includes("year") || days >= 360) return price / 12;
  if (days > 45) return (price * 30) / days;
  return price;
}

/**
 * Estimated Monthly Recurring Revenue from currently-active subscribers,
 * normalizing annual plans to a monthly figure. Admin/comped members excluded.
 */
export async function getMrrEstimate(opts: {
  excludeMemberIds?: number[];
  now?: Date;
}): Promise<number> {
  const now = opts.now ?? new Date();
  const excludeMemberIds = opts.excludeMemberIds ?? [];

  const activeMembers = await prisma.members.findMany({
    where: {
      plan_id: { gt: 0 },
      plan_expiry: { gt: now },
      ...(excludeMemberIds.length ? { id: { notIn: excludeMemberIds } } : {}),
    },
    select: { plan_id: true },
  });
  if (activeMembers.length === 0) return 0;

  const planIds = [...new Set(activeMembers.map((m) => m.plan_id).filter((v): v is number => v != null))];
  const plans = await prisma.plans.findMany({
    where: { id: { in: planIds } },
    select: { id: true, price: true, unit: true, days: true },
  });
  const planById = new Map(plans.map((p) => [p.id, p]));

  let mrr = 0;
  for (const m of activeMembers) {
    const plan = m.plan_id != null ? planById.get(m.plan_id) : undefined;
    if (!plan) continue;
    mrr += monthlyPrice(plan);
  }
  return round2(mrr);
}

export interface PlanSubscriberStat {
  planId: number;
  active: number;
  expired: number;
  mrr: number;
}

/**
 * Per-plan subscriber breakdown (active vs expired) + monthly recurring revenue,
 * excluding team/test members. Keyed by plan id.
 */
export async function getSubscribersByPlan(opts: {
  excludeMemberIds?: number[];
  now?: Date;
}): Promise<Map<number, PlanSubscriberStat>> {
  const now = opts.now ?? new Date();
  const excludeMemberIds = opts.excludeMemberIds ?? [];
  const idNotIn = excludeMemberIds.length ? { id: { notIn: excludeMemberIds } } : {};

  const [activeGroups, expiredGroups, plans] = await Promise.all([
    prisma.members.groupBy({
      by: ["plan_id"],
      where: { plan_id: { gt: 0 }, plan_expiry: { gt: now }, ...idNotIn },
      _count: { _all: true },
    }),
    prisma.members.groupBy({
      by: ["plan_id"],
      where: {
        plan_id: { gt: 0 },
        OR: [{ plan_expiry: { lte: now } }, { plan_expiry: null }],
        ...idNotIn,
      },
      _count: { _all: true },
    }),
    prisma.plans.findMany({ select: { id: true, price: true, unit: true, days: true } }),
  ]);

  const planById = new Map(plans.map((p) => [p.id, p]));
  const result = new Map<number, PlanSubscriberStat>();

  for (const g of activeGroups) {
    if (g.plan_id == null) continue;
    const plan = planById.get(g.plan_id);
    const active = g._count._all;
    result.set(g.plan_id, {
      planId: g.plan_id,
      active,
      expired: 0,
      mrr: round2(active * (plan ? monthlyPrice(plan) : 0)),
    });
  }
  for (const g of expiredGroups) {
    if (g.plan_id == null) continue;
    const existing = result.get(g.plan_id);
    if (existing) existing.expired = g._count._all;
    else
      result.set(g.plan_id, {
        planId: g.plan_id,
        active: 0,
        expired: g._count._all,
        mrr: 0,
      });
  }

  return result;
}
