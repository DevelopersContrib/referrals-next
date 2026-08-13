import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getExcludedMemberIds } from "@/lib/platform-admin";
import { getPlatformRevenue, getMrrEstimate } from "@/lib/revenue";

/**
 * Platform-wide admin statistics. Every number here is computed from a real
 * DB query — there are no placeholders. Each query is individually wrapped in
 * `safe()` so one slow/failing aggregate degrades to 0/[] instead of breaking
 * the whole dashboard.
 */

export type AdminPlatformStats = {
  totals: {
    members: number;
    brands: number;
    campaigns: number;
    participants: number;
    shares: number;
    clicks: number;
    impressions: number;
    rewardedReferrals: number;
    rewardsValue: number;
    revenue: number;
  };
  members: {
    verified: number;
    activeSubscribers: number;
    newThisMonth: number;
    newLastMonth: number;
    growthPct: number;
  };
  revenue: {
    total: number;
    thisYear: number;
    thisMonth: number;
    lastMonth: number;
    mrr: number;
    paidCountThisYear: number;
  };
  campaignsNewThisMonth: number;
  participantsNewThisMonth: number;
  recentSignups: { id: number; name: string; email: string; date: string }[];
  topBrands: { id: number; domain: string; campaigns: number }[];
  topCampaigns: { id: number; name: string; impressions: number }[];
  memberSeries: { label: string; value: number }[];
};

async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    console.error("[admin-stats] query failed:", err);
    return fallback;
  }
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

/**
 * Build a continuous month-by-month series from `start` through the current
 * month, filling gaps with 0 so the chart never drops or misaligns months.
 * January is labelled with a 2-digit year for cross-year clarity.
 */
function buildMonthlySeries(
  rows: { y: number; m: number; total: bigint }[],
  start: Date,
  now: Date
): { label: string; value: number }[] {
  const counts = new Map<string, number>();
  for (const r of rows) {
    counts.set(`${Number(r.y)}-${Number(r.m)}`, Number(r.total));
  }

  const series: { label: string; value: number }[] = [];
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth(), 1);
  while (cursor <= end) {
    const key = `${cursor.getFullYear()}-${cursor.getMonth() + 1}`;
    const month = cursor.toLocaleDateString("en-US", { month: "short" });
    const label =
      cursor.getMonth() === 0
        ? `${month} '${String(cursor.getFullYear()).slice(2)}`
        : month;
    series.push({ label, value: counts.get(key) || 0 });
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return series;
}

export async function getAdminPlatformStats(): Promise<AdminPlatformStats> {
  const now = new Date();
  const thisMonthStart = startOfMonth(now);
  const lastMonthStart = startOfMonth(
    new Date(now.getFullYear(), now.getMonth() - 1, 1)
  );
  const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

  // Team (admins/ADMIN_EMAILS) + test accounts are excluded from every
  // member-based stat so the dashboard reflects real customers only.
  const excludedIds = await safe(() => getExcludedMemberIds(), [] as number[]);
  const idNotIn = excludedIds.length ? { id: { notIn: excludedIds } } : {};
  const notInSql = excludedIds.length
    ? Prisma.sql`AND id NOT IN (${Prisma.join(excludedIds)})`
    : Prisma.empty;

  const [
    members,
    brands,
    campaigns,
    participants,
    shares,
    clicks,
    impressions,
    rewardedReferrals,
    rewardsValue,
    revenue,
    mrr,
    verified,
    activeSubscribers,
    newThisMonth,
    newLastMonth,
    campaignsNewThisMonth,
    participantsNewThisMonth,
    recentSignupsRows,
    topBrandsRows,
    topCampaignsRows,
    memberSeriesRows,
  ] = await Promise.all([
    safe(() => prisma.members.count({ where: idNotIn }), 0),
    safe(() => prisma.member_urls.count(), 0),
    safe(() => prisma.member_campaigns.count(), 0),
    safe(() => prisma.campaign_participants.count(), 0),
    safe(() => prisma.participants_share.count(), 0),
    safe(
      async () =>
        Number(
          (
            await prisma.participants_share.aggregate({
              _sum: { clicks: true },
            })
          )._sum.clicks || 0
        ),
      0
    ),
    safe(
      async () =>
        Number(
          (
            await prisma.campaign_widget_impressions_count.aggregate({
              _sum: { views: true },
            })
          )._sum.views || 0
        ),
      0
    ),
    safe(() => prisma.participants_rewards.count(), 0),
    safe(
      async () =>
        Number(
          (
            await prisma.participants_rewards.aggregate({
              _sum: { cash_value: true },
            })
          )._sum.cash_value || 0
        ),
      0
    ),
    safe(
      () => getPlatformRevenue({ excludeMemberIds: excludedIds, now }),
      { thisYear: 0, thisMonth: 0, lastMonth: 0, allTime: 0, paidCountThisYear: 0 }
    ),
    safe(() => getMrrEstimate({ excludeMemberIds: excludedIds, now }), 0),
    safe(
      () => prisma.members.count({ where: { is_verified: true, ...idNotIn } }),
      0
    ),
    safe(
      () =>
        prisma.members.count({
          where: { plan_id: { gt: 0 }, plan_expiry: { gt: now }, ...idNotIn },
        }),
      0
    ),
    safe(
      () =>
        prisma.members.count({
          where: { date_signedup: { gte: thisMonthStart }, ...idNotIn },
        }),
      0
    ),
    safe(
      () =>
        prisma.members.count({
          where: {
            date_signedup: { gte: lastMonthStart, lt: thisMonthStart },
            ...idNotIn,
          },
        }),
      0
    ),
    safe(
      () =>
        prisma.member_campaigns.count({
          where: { date_added: { gte: thisMonthStart } },
        }),
      0
    ),
    safe(
      () =>
        prisma.campaign_participants.count({
          where: { date_signedup: { gte: thisMonthStart } },
        }),
      0
    ),
    safe(
      () =>
        prisma.members.findMany({
          where: idNotIn,
          orderBy: { date_signedup: "desc" },
          take: 8,
          select: {
            id: true,
            name: true,
            email: true,
            date_signedup: true,
          },
        }),
      [] as { id: number; name: string; email: string; date_signedup: Date }[]
    ),
    safe(
      () =>
        prisma.$queryRaw<
          { id: number; domain: string; campaigns: bigint }[]
        >`
          SELECT mu.id, mu.domain, COUNT(mc.id) AS campaigns
          FROM member_urls mu
          JOIN member_campaigns mc ON mc.url_id = mu.id
          GROUP BY mu.id, mu.domain
          ORDER BY campaigns DESC
          LIMIT 6`,
      []
    ),
    safe(
      () =>
        prisma.$queryRaw<
          { id: number; name: string; impressions: bigint }[]
        >`
          SELECT mc.id, mc.name, COALESCE(SUM(ic.views), 0) AS impressions
          FROM member_campaigns mc
          JOIN campaign_widget_impressions_count ic ON ic.campaign_id = mc.id
          GROUP BY mc.id, mc.name
          ORDER BY impressions DESC
          LIMIT 6`,
      []
    ),
    safe(
      () =>
        prisma.$queryRaw<{ y: number; m: number; total: bigint }[]>`
          SELECT YEAR(date_signedup) AS y, MONTH(date_signedup) AS m, COUNT(*) AS total
          FROM members
          WHERE date_signedup >= ${twelveMonthsAgo} ${notInSql}
          GROUP BY YEAR(date_signedup), MONTH(date_signedup)
          ORDER BY y ASC, m ASC`,
      []
    ),
  ]);

  const growthPct =
    newLastMonth > 0
      ? Math.round(((newThisMonth - newLastMonth) / newLastMonth) * 100)
      : newThisMonth > 0
        ? 100
        : 0;

  return {
    totals: {
      members,
      brands,
      campaigns,
      participants,
      shares,
      clicks,
      impressions,
      rewardedReferrals,
      rewardsValue,
      revenue: revenue.thisYear,
    },
    members: {
      verified,
      activeSubscribers,
      newThisMonth,
      newLastMonth,
      growthPct,
    },
    revenue: {
      total: revenue.allTime,
      thisYear: revenue.thisYear,
      thisMonth: revenue.thisMonth,
      lastMonth: revenue.lastMonth,
      mrr,
      paidCountThisYear: revenue.paidCountThisYear,
    },
    campaignsNewThisMonth,
    participantsNewThisMonth,
    recentSignups: recentSignupsRows.map((m) => ({
      id: m.id,
      name: m.name,
      email: m.email,
      date: m.date_signedup.toISOString(),
    })),
    topBrands: topBrandsRows.map((b) => ({
      id: Number(b.id),
      domain: b.domain,
      campaigns: Number(b.campaigns),
    })),
    topCampaigns: topCampaignsRows.map((c) => ({
      id: Number(c.id),
      name: c.name,
      impressions: Number(c.impressions),
    })),
    memberSeries: buildMonthlySeries(memberSeriesRows, twelveMonthsAgo, now),
  };
}
