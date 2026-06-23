import { prisma } from "@/lib/prisma";

export type StatsGroupBy = "day" | "month" | "year";

export type TimeSeriesPoint = {
  label: string;
  value: number;
};

export type BrandOverviewStats = {
  rewardedReferrals: number;
  rewardsValue: number;
  totalCampaigns: number;
  totalImpressions: number;
  totalClicks: number;
  totalShares: number;
  totalParticipants: number;
};

function parseDateRange(from: string, to: string) {
  const fromDate = new Date(`${from}T00:00:00`);
  const toDate = new Date(`${to}T23:59:59`);
  if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
    throw new Error("Invalid date range");
  }
  if (toDate < fromDate) {
    throw new Error("End date must be greater than start date.");
  }
  return { fromDate, toDate };
}

export function resolveGroupBy(from: Date, to: Date): StatsGroupBy {
  const diffMs = to.getTime() - from.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays <= 31) return "day";
  if (diffDays < 365) return "month";
  return "year";
}

function formatLabel(
  year: number,
  month: number,
  day: number,
  groupBy: StatsGroupBy
): string {
  const d = new Date(year, Math.max(0, month - 1), day || 1);
  if (groupBy === "day") {
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }
  if (groupBy === "month") {
    return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  }
  return String(year);
}

export async function getBrandCampaignIds(brandId: number): Promise<number[]> {
  const campaigns = await prisma.member_campaigns.findMany({
    where: { url_id: brandId },
    select: { id: true },
  });
  return campaigns.map((c) => c.id);
}

export async function getBrandOverviewStats(
  brandId: number,
  from: string,
  to: string
): Promise<BrandOverviewStats> {
  const { fromDate, toDate } = parseDateRange(from, to);
  const campaignIds = await getBrandCampaignIds(brandId);

  const totalCampaigns = await prisma.member_campaigns.count({
    where: {
      url_id: brandId,
      date_added: { gte: fromDate, lte: toDate },
    },
  });

  let totalImpressions = 0;
  let totalClicks = 0;
  let totalShares = 0;
  let totalParticipants = 0;

  if (campaignIds.length > 0) {
    const [impressions, clicks, shares, participants] = await Promise.all([
      prisma.campaign_widget_impressions.count({
        where: {
          campaign_id: { in: campaignIds },
          date_viewed: { gte: fromDate, lte: toDate },
        },
      }),
      prisma.participants_share.aggregate({
        where: {
          campaign_id: { in: campaignIds },
          date_shared: { gte: fromDate, lte: toDate },
        },
        _sum: { clicks: true },
      }),
      prisma.participants_share.count({
        where: {
          campaign_id: { in: campaignIds },
          date_shared: { gte: fromDate, lte: toDate },
        },
      }),
      prisma.campaign_participants.count({
        where: {
          campaign_id: { in: campaignIds },
          date_signedup: { gte: fromDate, lte: toDate },
        },
      }),
    ]);

    totalImpressions = impressions;
    totalClicks = clicks._sum.clicks || 0;
    totalShares = shares;
    totalParticipants = participants;
  }

  // Rewarded Referrals + Rewards Value (mirror PHP BrandajaxController:
  // gettotalrewarded + Ini::campaignrewardworthbrand) — scoped by brand url_id.
  let rewardedReferrals = 0;
  let rewardsValue = 0;
  const [rewardedRows, worthRows] = await Promise.all([
    prisma.$queryRaw<{ total: bigint }[]>`
      SELECT COUNT(DISTINCT pr.participant_id) AS total
      FROM participants_rewards pr
      JOIN member_campaigns mc ON mc.id = pr.campaign_id
      WHERE mc.url_id = ${brandId}
        AND pr.date_sent >= ${fromDate} AND pr.date_sent <= ${toDate}`,
    prisma.$queryRaw<{ total: number | null }[]>`
      SELECT COALESCE(SUM(cr.worth_value), 0) + COALESCE(SUM(cr.cash_value), 0) AS total
      FROM participants_rewards pr
      JOIN campaign_participants cp ON cp.id = pr.participant_id
      JOIN campaign_reward cr ON cr.campaign_id = pr.campaign_id
      JOIN member_campaigns mc ON mc.id = pr.campaign_id
      WHERE mc.url_id = ${brandId}
        AND pr.date_sent >= ${fromDate} AND pr.date_sent <= ${toDate}`,
  ]);
  rewardedReferrals = Number(rewardedRows[0]?.total ?? 0);
  rewardsValue = Number(worthRows[0]?.total ?? 0);

  return {
    rewardedReferrals,
    rewardsValue,
    totalCampaigns,
    totalImpressions,
    totalClicks,
    totalShares,
    totalParticipants,
  };
}

export async function getBrandParticipantsSeries(
  brandId: number,
  from: string,
  to: string
): Promise<TimeSeriesPoint[]> {
  const { fromDate, toDate } = parseDateRange(from, to);
  const groupBy = resolveGroupBy(fromDate, toDate);
  return getParticipantsSeriesRaw(brandId, fromDate, toDate, groupBy);
}

async function getParticipantsSeriesRaw(
  brandId: number,
  fromDate: Date,
  toDate: Date,
  groupBy: StatsGroupBy
): Promise<TimeSeriesPoint[]> {
  let rows: Array<{
    total: bigint;
    day_added: number;
    month_added: number;
    year_added: number;
  }>;

  if (groupBy === "day") {
    rows = await prisma.$queryRaw`
      SELECT COUNT(*) AS total,
             DAY(cp.date_signedup) AS day_added,
             MONTH(cp.date_signedup) AS month_added,
             YEAR(cp.date_signedup) AS year_added
      FROM campaign_participants cp
      INNER JOIN member_campaigns mc ON mc.id = cp.campaign_id
      WHERE mc.url_id = ${brandId}
        AND cp.date_signedup >= ${fromDate}
        AND cp.date_signedup <= ${toDate}
      GROUP BY YEAR(cp.date_signedup), MONTH(cp.date_signedup), DAY(cp.date_signedup)
      ORDER BY cp.date_signedup ASC
    `;
  } else if (groupBy === "month") {
    rows = await prisma.$queryRaw`
      SELECT COUNT(*) AS total,
             1 AS day_added,
             MONTH(cp.date_signedup) AS month_added,
             YEAR(cp.date_signedup) AS year_added
      FROM campaign_participants cp
      INNER JOIN member_campaigns mc ON mc.id = cp.campaign_id
      WHERE mc.url_id = ${brandId}
        AND cp.date_signedup >= ${fromDate}
        AND cp.date_signedup <= ${toDate}
      GROUP BY YEAR(cp.date_signedup), MONTH(cp.date_signedup)
      ORDER BY MIN(cp.date_signedup) ASC
    `;
  } else {
    rows = await prisma.$queryRaw`
      SELECT COUNT(*) AS total,
             1 AS day_added,
             1 AS month_added,
             YEAR(cp.date_signedup) AS year_added
      FROM campaign_participants cp
      INNER JOIN member_campaigns mc ON mc.id = cp.campaign_id
      WHERE mc.url_id = ${brandId}
        AND cp.date_signedup >= ${fromDate}
        AND cp.date_signedup <= ${toDate}
      GROUP BY YEAR(cp.date_signedup)
      ORDER BY MIN(cp.date_signedup) ASC
    `;
  }

  return rows.map((r) => ({
    label: formatLabel(
      Number(r.year_added),
      Number(r.month_added),
      Number(r.day_added),
      groupBy
    ),
    value: Number(r.total),
  }));
}

export async function getBrandSharesSeries(
  brandId: number,
  from: string,
  to: string
): Promise<TimeSeriesPoint[]> {
  const { fromDate, toDate } = parseDateRange(from, to);
  const groupBy = resolveGroupBy(fromDate, toDate);
  return getSharesSeriesRaw(brandId, fromDate, toDate, groupBy);
}

async function getSharesSeriesRaw(
  brandId: number,
  fromDate: Date,
  toDate: Date,
  groupBy: StatsGroupBy
): Promise<TimeSeriesPoint[]> {
  let rows: Array<{
    total: bigint;
    day_added: number;
    month_added: number;
    year_added: number;
  }>;

  if (groupBy === "day") {
    rows = await prisma.$queryRaw`
      SELECT COUNT(*) AS total,
             DAY(ps.date_shared) AS day_added,
             MONTH(ps.date_shared) AS month_added,
             YEAR(ps.date_shared) AS year_added
      FROM participants_share ps
      INNER JOIN member_campaigns mc ON mc.id = ps.campaign_id
      WHERE mc.url_id = ${brandId}
        AND ps.date_shared >= ${fromDate}
        AND ps.date_shared <= ${toDate}
      GROUP BY YEAR(ps.date_shared), MONTH(ps.date_shared), DAY(ps.date_shared)
      ORDER BY ps.date_shared ASC
    `;
  } else if (groupBy === "month") {
    rows = await prisma.$queryRaw`
      SELECT COUNT(*) AS total,
             1 AS day_added,
             MONTH(ps.date_shared) AS month_added,
             YEAR(ps.date_shared) AS year_added
      FROM participants_share ps
      INNER JOIN member_campaigns mc ON mc.id = ps.campaign_id
      WHERE mc.url_id = ${brandId}
        AND ps.date_shared >= ${fromDate}
        AND ps.date_shared <= ${toDate}
      GROUP BY YEAR(ps.date_shared), MONTH(ps.date_shared)
      ORDER BY MIN(ps.date_shared) ASC
    `;
  } else {
    rows = await prisma.$queryRaw`
      SELECT COUNT(*) AS total,
             1 AS day_added,
             1 AS month_added,
             YEAR(ps.date_shared) AS year_added
      FROM participants_share ps
      INNER JOIN member_campaigns mc ON mc.id = ps.campaign_id
      WHERE mc.url_id = ${brandId}
        AND ps.date_shared >= ${fromDate}
        AND ps.date_shared <= ${toDate}
      GROUP BY YEAR(ps.date_shared)
      ORDER BY MIN(ps.date_shared) ASC
    `;
  }

  return rows.map((r) => ({
    label: formatLabel(
      Number(r.year_added),
      Number(r.month_added),
      Number(r.day_added),
      groupBy
    ),
    value: Number(r.total),
  }));
}

export async function getShareLeaders(brandId: number, limit = 10) {
  const rows = await prisma.$queryRaw<
    Array<{ id: number; name: string; email: string; total: bigint }>
  >`
    SELECT cp.id, cp.name, cp.email, COUNT(*) AS total
    FROM campaign_participants cp
    INNER JOIN member_campaigns mc ON mc.id = cp.campaign_id
    INNER JOIN participants_share ps ON ps.participant_id = cp.id
    WHERE mc.url_id = ${brandId}
    GROUP BY cp.email
    ORDER BY total DESC
    LIMIT ${limit}
  `;

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    total: Number(r.total),
  }));
}

export async function getInviteLeaders(brandId: number, limit = 10) {
  const rows = await prisma.$queryRaw<
    Array<{ id: number; name: string; email: string; total: bigint }>
  >`
    SELECT cp.id, cp.name, cp.email, COUNT(*) AS total
    FROM campaign_participants cp
    INNER JOIN member_campaigns mc ON mc.id = cp.campaign_id
    INNER JOIN participants_invited_emails pie ON pie.participant_id = cp.id
    WHERE mc.url_id = ${brandId}
    GROUP BY cp.email
    ORDER BY total DESC
    LIMIT ${limit}
  `;

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    total: Number(r.total),
  }));
}

export function defaultStatsDateRange() {
  const to = new Date();
  const from = new Date();
  from.setMonth(from.getMonth() - 1);
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}
