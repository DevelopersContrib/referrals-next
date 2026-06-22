import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsPerformanceSection } from "@/components/dashboard/stats-performance-section";
import { StatsCampaignMobileList } from "@/components/dashboard/stats-campaign-mobile-list";
import {
	getCampaignStatsForMember,
	getMemberParticipantsSeries,
} from "@/lib/member-stats";

export default async function StatsPage() {
	const session = await auth();
	if (!session?.user?.id) redirect("/signin");
	const memberId = parseInt(session.user.id, 10);

	const campaigns = await prisma.member_campaigns.findMany({
		where: { member_id: memberId },
		select: { id: true },
	});
	const campaignIds = campaigns.map((c) => c.id);

	let totalParticipants = 0;
	let totalShares = 0;
	let totalClicks = 0;
	let totalImpressions = 0;
	let totalRewards = 0;

	if (campaignIds.length > 0) {
		const [
			participantCount,
			shareCount,
			clicksAgg,
			impressionCount,
			rewardCount,
		] = await Promise.all([
			prisma.campaign_participants.count({
				where: { campaign_id: { in: campaignIds } },
			}),
			prisma.participants_share.count({
				where: { campaign_id: { in: campaignIds } },
			}),
			prisma.participants_share.aggregate({
				where: { campaign_id: { in: campaignIds } },
				_sum: { clicks: true },
			}),
			prisma.campaign_widget_impressions.count({
				where: { campaign_id: { in: campaignIds } },
			}),
			prisma.participants_rewards.count({
				where: { campaign_id: { in: campaignIds } },
			}),
		]);

		totalParticipants = participantCount;
		totalShares = shareCount;
		totalClicks = clicksAgg._sum.clicks || 0;
		totalImpressions = impressionCount;
		totalRewards = rewardCount;
	}

	const toDate = new Date();
	const fromDate = new Date();
	fromDate.setFullYear(fromDate.getFullYear() - 1);

	const [chartData, campaignStats] = await Promise.all([
		getMemberParticipantsSeries(memberId, fromDate, toDate),
		getCampaignStatsForMember(memberId),
	]);

	const statCards = [
		{ title: "Total Participants", value: totalParticipants },
		{ title: "Total Shares", value: totalShares },
		{ title: "Total Clicks", value: totalClicks },
		{ title: "Widget Impressions", value: totalImpressions },
		{ title: "Rewards Sent", value: totalRewards },
		{ title: "Campaigns", value: campaigns.length },
	];

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold">Statistics</h1>
				<p className="mt-1 text-muted-foreground">
					Overall performance metrics across all your campaigns.
				</p>
			</div>

			<div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
				{statCards.map((stat) => (
					<Card key={stat.title}>
						<CardHeader className="pb-2">
							<CardTitle className="text-sm font-medium text-muted-foreground">
								{stat.title}
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-3xl font-bold">
								{stat.value.toLocaleString()}
							</p>
						</CardContent>
					</Card>
				))}
			</div>

			<StatsPerformanceSection chartData={chartData} />

			{campaignStats.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle>Per-Campaign Breakdown</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<StatsCampaignMobileList campaigns={campaignStats} />
						<div className="hidden overflow-x-auto lg:block">
							<table className="w-full min-w-[540px] text-sm">
								<thead>
									<tr className="border-b border-[#ebeef0]">
										<th className="py-2 text-left font-medium text-muted-foreground">
											Campaign
										</th>
										<th className="py-2 text-right font-medium text-muted-foreground">
											Participants
										</th>
										<th className="py-2 text-right font-medium text-muted-foreground">
											Shares
										</th>
										<th className="py-2 text-right font-medium text-muted-foreground">
											Clicks
										</th>
										<th className="py-2 text-right font-medium text-muted-foreground">
											ID
										</th>
									</tr>
								</thead>
								<tbody>
									{campaignStats.map((c, i) => (
										<tr
											key={c.id}
											className={
												i % 2 === 0
													? "border-b border-[#ebeef0] bg-[#f9fafb]"
													: "border-b border-[#ebeef0]"
											}
										>
											<td className="max-w-[200px] py-2.5 font-medium">
												<Link
													href={`/brands/${c.urlId}/campaigns/${c.id}`}
													className="truncate text-brand hover:underline"
												>
													{c.name}
												</Link>
											</td>
											<td className="py-2.5 text-right tabular-nums">
												{c.participants.toLocaleString()}
											</td>
											<td className="py-2.5 text-right tabular-nums">
												{c.shares.toLocaleString()}
											</td>
											<td className="py-2.5 text-right tabular-nums">
												{c.clicks.toLocaleString()}
											</td>
											<td className="py-2.5 text-right text-muted-foreground">
												#{c.id}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
