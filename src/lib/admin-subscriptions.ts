import { prisma } from "@/lib/prisma";

/**
 * Admin view over PayPal recurring subscriptions (`member_plan`). A row's
 * status is derived from the agreement lifecycle columns that the billing
 * webhook maintains:
 *   - agreement_cancel set   → cancelled
 *   - agreement_activate set → active
 *   - has agreement id only  → pending (approved, not yet activated)
 *   - no agreement id        → incomplete
 */

export type SubStatus = "active" | "cancelled" | "pending" | "incomplete";

export type AdminSubscriptionRow = {
  id: number;
  memberId: number;
  memberName: string;
  memberEmail: string;
  planName: string | null;
  planPrice: number | null;
  amount: number | null;
  currency: string | null;
  agreementId: string | null;
  paypalPlanId: string;
  status: SubStatus;
  startedAt: string;
  planExpiry: string | null;
};

export type AdminSubscriptionStats = {
  active: number;
  cancelled: number;
  pending: number;
  total: number;
  newThisMonth: number;
  mrr: number;
};

type MemberPlanRow = {
  id: number;
  member_id: number;
  paypal_plan_id: string;
  paypal_agreement_id: string | null;
  agreement_activate: string | null;
  agreement_cancel: string | null;
  date_added: Date;
  payment_id: number | null;
};

export function deriveSubStatus(row: {
  paypal_agreement_id: string | null;
  agreement_activate: string | null;
  agreement_cancel: string | null;
}): SubStatus {
  if (row.agreement_cancel) return "cancelled";
  if (row.agreement_activate) return "active";
  if (row.paypal_agreement_id) return "pending";
  return "incomplete";
}

function statusWhere(status?: string) {
  switch (status) {
    case "active":
      return { agreement_activate: { not: null }, agreement_cancel: null };
    case "cancelled":
      return { agreement_cancel: { not: null } };
    case "pending":
      return { agreement_activate: null, agreement_cancel: null };
    default:
      return {};
  }
}

export async function getSubscriptionStats(): Promise<AdminSubscriptionStats> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [active, cancelled, pending, total, newThisMonth, mrrRows] =
    await Promise.all([
      prisma.member_plan.count({
        where: { agreement_activate: { not: null }, agreement_cancel: null },
      }),
      prisma.member_plan.count({ where: { agreement_cancel: { not: null } } }),
      prisma.member_plan.count({
        where: { agreement_activate: null, agreement_cancel: null },
      }),
      prisma.member_plan.count(),
      prisma.member_plan.count({ where: { date_added: { gte: monthStart } } }),
      // MRR = monthly-normalized price across members with a live paid plan.
      prisma.$queryRaw<{ mrr: number | null }[]>`
        SELECT COALESCE(
          SUM(CASE WHEN pl.unit = 'year' THEN pl.price / 12 ELSE pl.price END),
        0) AS mrr
        FROM members m
        JOIN plans pl ON pl.id = m.plan_id
        WHERE m.plan_id > 0 AND m.plan_expiry > ${now} AND pl.price > 0`,
    ]);

  return {
    active,
    cancelled,
    pending,
    total,
    newThisMonth,
    mrr: Number(mrrRows[0]?.mrr ?? 0),
  };
}

export async function listSubscriptions(opts: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}): Promise<{
  rows: AdminSubscriptionRow[];
  total: number;
  page: number;
  totalPages: number;
}> {
  const page = Math.max(1, opts.page || 1);
  const limit = opts.limit || 20;
  const search = opts.search?.trim();

  const where: Record<string, unknown> = { ...statusWhere(opts.status) };

  if (search) {
    const matches = await prisma.members.findMany({
      where: { OR: [{ email: { contains: search } }, { name: { contains: search } }] },
      select: { id: true },
      take: 500,
    });
    where.member_id = { in: matches.map((m) => m.id) };
  }

  const [rows, total] = await Promise.all([
    prisma.member_plan.findMany({
      where,
      orderBy: { id: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }) as Promise<MemberPlanRow[]>,
    prisma.member_plan.count({ where }),
  ]);

  // Batch-resolve members → plans (via member.plan_id) → payments (via payment_id).
  const memberIds = [...new Set(rows.map((r) => r.member_id))];
  const paymentIds = rows
    .map((r) => r.payment_id)
    .filter((x): x is number => typeof x === "number");

  const [members, payments] = await Promise.all([
    prisma.members.findMany({
      where: { id: { in: memberIds } },
      select: { id: true, name: true, email: true, plan_id: true, plan_expiry: true },
    }),
    paymentIds.length
      ? prisma.member_payment.findMany({
          where: { id: { in: paymentIds } },
          select: { id: true, amount: true, currency: true },
        })
      : Promise.resolve([] as { id: number; amount: number | null; currency: string | null }[]),
  ]);

  const memberMap = new Map(members.map((m) => [m.id, m]));
  const planIds = [
    ...new Set(members.map((m) => m.plan_id).filter((x): x is number => !!x && x > 0)),
  ];
  const plans = planIds.length
    ? await prisma.plans.findMany({
        where: { id: { in: planIds } },
        select: { id: true, name: true, price: true },
      })
    : [];
  const planMap = new Map(plans.map((p) => [p.id, p]));
  const paymentMap = new Map(payments.map((p) => [p.id, p]));

  const mapped: AdminSubscriptionRow[] = rows.map((r) => {
    const m = memberMap.get(r.member_id);
    const plan = m?.plan_id ? planMap.get(m.plan_id) : undefined;
    const pay = r.payment_id ? paymentMap.get(r.payment_id) : undefined;
    return {
      id: r.id,
      memberId: r.member_id,
      memberName: m?.name || "",
      memberEmail: m?.email || "",
      planName: plan?.name ?? null,
      planPrice: plan?.price ?? null,
      amount: pay?.amount ?? null,
      currency: pay?.currency ?? null,
      agreementId: r.paypal_agreement_id,
      paypalPlanId: r.paypal_plan_id,
      status: deriveSubStatus(r),
      startedAt: r.date_added.toISOString(),
      planExpiry: m?.plan_expiry ? m.plan_expiry.toISOString() : null,
    };
  });

  return { rows: mapped, total, page, totalPages: Math.ceil(total / limit) };
}
