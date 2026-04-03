import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function BrandStatsPage({
  params,
}: {
  params: Promise<{ brandId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const { brandId } = await params;
  const brand = await prisma.member_urls.findUnique({
    where: { id: parseInt(brandId, 10) },
  });
  if (!brand || brand.member_id !== parseInt(session.user.id, 10)) redirect("/brands");

  const campaigns = await prisma.member_campaigns.findMany({
    where: { url_id: parseInt(brandId, 10) },
    select: { id: true },
  });
  const campaignIds = campaigns.map((c) => c.id);

  let participants = 0;
  let totalClicks = 0;
  let totalShares = 0;

  if (campaignIds.length > 0) {
    const [pCount, clicksAgg, sCount] = await Promise.all([
      prisma.campaign_participants.count({ where: { campaign_id: { in: campaignIds } } }),
      prisma.participants_share.aggregate({
        where: { campaign_id: { in: campaignIds } },
        _sum: { clicks: true },
      }),
      prisma.participants_share.count({ where: { campaign_id: { in: campaignIds } } }),
    ]);
    participants = pCount;
    totalClicks = clicksAgg._sum.clicks || 0;
    totalShares = sCount;
  }

  // Top referrers
  const topSharers = campaignIds.length > 0
    ? await prisma.participants_share.findMany({
        where: { campaign_id: { in: campaignIds } },
        orderBy: { clicks: "desc" },
        take: 10,
      })
    : [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Stats — {brand.domain}</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Campaigns</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{campaigns.length}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Participants</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{participants}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Clicks</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{totalClicks}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Shares</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{totalShares}</p></CardContent>
        </Card>
      </div>

      {/* Top Referrers */}
      <Card>
        <CardHeader>
          <CardTitle>Top Referrers</CardTitle>
        </CardHeader>
        <CardContent>
          {topSharers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No share data yet.</p>
          ) : (
            <div className="space-y-2">
              {topSharers.map((share, i) => (
                <div key={share.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-2">
                  <span className="font-medium">#{i + 1} — Participant {share.participant_id}</span>
                  <span className="text-sm font-semibold">{share.clicks || 0} clicks</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
