import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ParticipantTable } from "@/components/campaigns/participant-table";

interface CampaignDashboardPageProps {
  params: Promise<{ brandId: string; campaignId: string }>;
}

export default async function CampaignDashboardPage({
  params,
}: CampaignDashboardPageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const { brandId, campaignId } = await params;
  const memberId = parseInt(session.user.id, 10);
  const id = parseInt(campaignId, 10);

  const campaign = await prisma.member_campaigns.findFirst({
    where: { id, member_id: memberId },
  });
  if (!campaign) redirect(`/brands/${brandId}/campaigns`);

  // Fetch stats
  const [participantCount, sharesData, impressionsData] = await Promise.all([
    prisma.campaign_participants.count({ where: { campaign_id: id } }),
    prisma.participants_share.aggregate({
      where: { campaign_id: id },
      _count: { id: true },
      _sum: { clicks: true },
    }),
    prisma.campaign_widget_impressions_count.findFirst({
      where: { campaign_id: id },
    }),
  ]);

  const stats = {
    participants: participantCount,
    shares: sharesData._count.id,
    clicks: sharesData._sum.clicks || 0,
    impressions: Number(impressionsData?.views || 0),
  };

  // Get top referrers
  const topReferrers = await prisma.campaign_participants.groupBy({
    by: ["invited_by"],
    where: { campaign_id: id, invited_by: { not: null } },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: 10,
  });

  const referrerIds = topReferrers
    .map((r) => r.invited_by)
    .filter((id): id is number => id !== null);

  const referrerDetails = referrerIds.length
    ? await prisma.campaign_participants.findMany({
        where: { id: { in: referrerIds } },
        select: { id: true, name: true, email: true },
      })
    : [];
  const referrerMap = new Map(referrerDetails.map((r) => [r.id, r]));

  // Get share leaders
  const shareLeaders = await prisma.participants_share.groupBy({
    by: ["participant_id"],
    where: { campaign_id: id },
    _sum: { clicks: true },
    _count: { id: true },
    orderBy: { _sum: { clicks: "desc" } },
    take: 10,
  });

  const leaderIds = shareLeaders.map((s) => s.participant_id);
  const leaderDetails = leaderIds.length
    ? await prisma.campaign_participants.findMany({
        where: { id: { in: leaderIds } },
        select: { id: true, name: true, email: true },
      })
    : [];
  const leaderMap = new Map(leaderDetails.map((l) => [l.id, l]));

  const campaignType = await prisma.campaign_types.findFirst({
    where: { id: campaign.type_id },
  });

  const statCards = [
    { title: "Participants", value: stats.participants },
    { title: "Shares", value: stats.shares },
    { title: "Clicks", value: stats.clicks },
    { title: "Impressions", value: stats.impressions },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{campaign.name}</h1>
            <Badge
              variant={
                campaign.publish === "public" ? "default" : "secondary"
              }
            >
              {campaign.publish || "public"}
            </Badge>
          </div>
          <p className="mt-1 text-muted-foreground">
            {campaignType?.name || "Campaign"} &middot; Goal:{" "}
            {campaign.goal_type === "visit"
              ? `${campaign.num_visits} visits`
              : `${campaign.num_signups} signups`}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/brands/${brandId}/campaigns/${campaignId}/edit`}>
            <Button variant="outline">Edit Campaign</Button>
          </Link>
          <Link href={`/brands/${brandId}/campaigns`}>
            <Button variant="outline">All Campaigns</Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

      {/* Navigation Tabs */}
      <div className="mt-6 flex flex-wrap gap-2">
        <Link href={`/brands/${brandId}/campaigns/${campaignId}/participants`}>
          <Button variant="outline" size="sm">
            All Participants
          </Button>
        </Link>
        <Link href={`/brands/${brandId}/campaigns/${campaignId}/rewards`}>
          <Button variant="outline" size="sm">
            Rewards
          </Button>
        </Link>
        <Link href={`/brands/${brandId}/campaigns/${campaignId}/widget`}>
          <Button variant="outline" size="sm">
            Widget
          </Button>
        </Link>
        <Link href={`/brands/${brandId}/campaigns/${campaignId}/emails`}>
          <Button variant="outline" size="sm">
            Emails
          </Button>
        </Link>
      </div>

      {/* Content */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Recent Participants */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Participants</CardTitle>
            <CardDescription>Latest people who joined</CardDescription>
          </CardHeader>
          <CardContent>
            <ParticipantTable
              campaignId={campaignId}
              brandId={brandId}
              compact
              showExport={false}
            />
          </CardContent>
        </Card>

        {/* Top Referrers & Share Leaders */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Referrers</CardTitle>
              <CardDescription>
                Participants with the most referrals
              </CardDescription>
            </CardHeader>
            <CardContent>
              {topReferrers.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No referrals yet
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead className="text-right">Referrals</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topReferrers.map((r) => {
                      const detail = referrerMap.get(r.invited_by!);
                      return (
                        <TableRow key={r.invited_by}>
                          <TableCell className="font-medium">
                            {detail?.name || "Unknown"}
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant="secondary">{r._count.id}</Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Share Leaders</CardTitle>
              <CardDescription>
                Participants with the most clicks from shares
              </CardDescription>
            </CardHeader>
            <CardContent>
              {shareLeaders.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No shares yet
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead className="text-right">Shares</TableHead>
                      <TableHead className="text-right">Clicks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {shareLeaders.map((s) => {
                      const detail = leaderMap.get(s.participant_id);
                      return (
                        <TableRow key={s.participant_id}>
                          <TableCell className="font-medium">
                            {detail?.name || "Unknown"}
                          </TableCell>
                          <TableCell className="text-right">
                            {s._count.id}
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant="secondary">
                              {s._sum.clicks || 0}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
