import { prisma } from "@/lib/prisma";
import type { TimeSeriesPoint } from "@/lib/brand-stats";
import { resolveGroupBy } from "@/lib/brand-stats";

function formatDayLabel(
	year: number,
	month: number,
	day: number
): string {
	const d = new Date(year, Math.max(0, month - 1), day || 1);
	return d.toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});
}

export async function getMemberParticipantsSeries(
	memberId: number,
	fromDate: Date,
	toDate: Date
): Promise<TimeSeriesPoint[]> {
	const groupBy = resolveGroupBy(fromDate, toDate);

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
      WHERE mc.member_id = ${memberId}
        AND cp.date_signedup >= ${fromDate}
        AND cp.date_signedup <= ${toDate}
      GROUP BY YEAR(cp.date_signedup), MONTH(cp.date_signedup), DAY(cp.date_signedup)
      ORDER BY MIN(cp.date_signedup) ASC
    `;
	} else if (groupBy === "month") {
		rows = await prisma.$queryRaw`
      SELECT COUNT(*) AS total,
             1 AS day_added,
             MONTH(cp.date_signedup) AS month_added,
             YEAR(cp.date_signedup) AS year_added
      FROM campaign_participants cp
      INNER JOIN member_campaigns mc ON mc.id = cp.campaign_id
      WHERE mc.member_id = ${memberId}
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
      WHERE mc.member_id = ${memberId}
        AND cp.date_signedup >= ${fromDate}
        AND cp.date_signedup <= ${toDate}
      GROUP BY YEAR(cp.date_signedup)
      ORDER BY MIN(cp.date_signedup) ASC
    `;
	}

	return rows.map((r) => ({
		label: formatDayLabel(
			Number(r.year_added),
			Number(r.month_added),
			Number(r.day_added)
		),
		value: Number(r.total),
	}));
}

export type CampaignStatRow = {
	id: number;
	name: string;
	urlId: number;
	participants: number;
	shares: number;
	clicks: number;
};

export async function getCampaignStatsForMember(
	memberId: number
): Promise<CampaignStatRow[]> {
	const campaigns = await prisma.member_campaigns.findMany({
		where: { member_id: memberId },
		select: { id: true, name: true, url_id: true },
		orderBy: { date_added: "desc" },
	});

	if (campaigns.length === 0) return [];

	return Promise.all(
		campaigns.map(async (c) => {
			const [participants, shares, clicksAgg] = await Promise.all([
				prisma.campaign_participants.count({
					where: { campaign_id: c.id },
				}),
				prisma.participants_share.count({
					where: { campaign_id: c.id },
				}),
				prisma.participants_share.aggregate({
					where: { campaign_id: c.id },
					_sum: { clicks: true },
				}),
			]);

			return {
				id: c.id,
				name: c.name,
				urlId: c.url_id,
				participants,
				shares,
				clicks: clicksAgg._sum.clicks || 0,
			};
		})
	);
}
