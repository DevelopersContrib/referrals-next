import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function StatsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");
  const memberId = parseInt(session.user.id, 10);

  // Get all campaigns for this member
  const campaigns = await prisma.member_campaigns.findMany({
    where: { member_id: memberId },
    select: { id: true, name: true },
  });
  const campaignIds = campaigns.map((c) => c.id);

  let totalParticipants = 0;
  let totalShares = 0;
  let totalClicks = 0;
  let totalImpressions = 0;
  let totalRewards = 0;

  if (campaignIds.length > 0) {
    const [participantCount, shareCount, clicksAgg, impressionCount, rewardCount] =
      await Promise.all([
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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

      {/* Charts placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-64 items-center justify-center rounded-lg bg-gray-50 text-muted-foreground">
            Charts and graphs will be displayed here. Integrate with a charting
            library such as Recharts for detailed analytics visualization.
          </div>
        </CardContent>
      </Card>

      {/* Per-campaign stats */}
      {campaigns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Per-Campaign Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 text-left font-medium text-muted-foreground">
                      Campaign
                    </th>
                    <th className="py-2 text-right font-medium text-muted-foreground">
                      ID
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((c) => (
                    <tr key={c.id} className="border-b">
                      <td className="py-2 font-medium">{c.name}</td>
                      <td className="py-2 text-right text-muted-foreground">
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
