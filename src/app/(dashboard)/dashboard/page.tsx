import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

async function getDashboardStats(memberId: number) {
  const [brands, campaigns] = await Promise.all([
    prisma.member_urls.count({ where: { member_id: memberId } }),
    prisma.member_campaigns.count({ where: { member_id: memberId } }),
  ]);

  // Get campaign IDs for this member
  const memberCampaigns = await prisma.member_campaigns.findMany({
    where: { member_id: memberId },
    select: { id: true },
  });
  const campaignIds = memberCampaigns.map((c) => c.id);

  let participants = 0;
  let totalClicks = 0;
  let totalShares = 0;

  if (campaignIds.length > 0) {
    const [participantCount, clicksAgg, shareCount] = await Promise.all([
      prisma.campaign_participants.count({
        where: { campaign_id: { in: campaignIds } },
      }),
      prisma.participants_share.aggregate({
        where: { campaign_id: { in: campaignIds } },
        _sum: { clicks: true },
      }),
      prisma.participants_share.count({
        where: { campaign_id: { in: campaignIds } },
      }),
    ]);

    participants = participantCount;
    totalClicks = clicksAgg._sum.clicks || 0;
    totalShares = shareCount;
  }

  return { brands, campaigns, participants, totalClicks, totalShares };
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const memberId = parseInt(session.user.id, 10);

  let stats;
  try {
    stats = await getDashboardStats(memberId);
  } catch {
    stats = {
      brands: 0,
      campaigns: 0,
      participants: 0,
      totalClicks: 0,
      totalShares: 0,
    };
  }

  const statCards = [
    { title: "Brands", value: stats.brands },
    { title: "Campaigns", value: stats.campaigns },
    { title: "Participants", value: stats.participants },
    { title: "Total Clicks", value: stats.totalClicks },
    { title: "Total Shares", value: stats.totalShares },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="mt-1 text-muted-foreground">
        Welcome back! Here&apos;s your referral program overview.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stat.value.toLocaleString()}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
