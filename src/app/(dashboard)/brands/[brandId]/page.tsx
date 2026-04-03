import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BrandCard } from "@/components/brands/brand-card";

interface PageProps {
  params: Promise<{ brandId: string }>;
}

async function getBrandWithStats(brandId: number, memberId: number) {
  const brand = await prisma.member_urls.findFirst({
    where: { id: brandId, member_id: memberId },
  });

  if (!brand) return null;

  const campaigns = await prisma.member_campaigns.findMany({
    where: { url_id: brandId, member_id: memberId },
    orderBy: { date_added: "desc" },
  });

  const campaignIds = campaigns.map((c) => c.id);

  let participantsCount = 0;
  let totalClicks = 0;
  let totalShares = 0;

  if (campaignIds.length > 0) {
    const [participantResult, clicksResult, sharesResult] = await Promise.all([
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

    participantsCount = participantResult;
    totalClicks = clicksResult._sum.clicks || 0;
    totalShares = sharesResult;
  }

  return {
    brand,
    campaigns,
    stats: {
      campaignsCount: campaigns.length,
      participantsCount,
      totalClicks,
      totalShares,
    },
  };
}

export default async function BrandDashboardPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const memberId = parseInt(session.user.id, 10);
  const { brandId } = await params;
  const id = parseInt(brandId, 10);

  if (isNaN(id)) notFound();

  const data = await getBrandWithStats(id, memberId);
  if (!data) notFound();

  const { brand, campaigns, stats } = data;

  const statCards = [
    { title: "Campaigns", value: stats.campaignsCount },
    { title: "Participants", value: stats.participantsCount },
    { title: "Total Clicks", value: stats.totalClicks },
    { title: "Total Shares", value: stats.totalShares },
  ];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/brands">
            <Button variant="ghost" size="sm">
              &larr; Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{brand.domain}</h1>
            <p className="mt-1 text-muted-foreground">Brand Dashboard</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/brands/${brand.id}/edit`}>
            <Button variant="outline">Edit Brand</Button>
          </Link>
        </div>
      </div>

      {/* Brand Info Card */}
      <BrandCard
        domain={brand.domain}
        url={brand.url}
        logoUrl={brand.logo_url}
        description={brand.description}
      />

      <Separator className="my-6" />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

      <Separator className="my-6" />

      {/* Recent Campaigns */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Campaigns</CardTitle>
          {/* Future: link to create campaign for this brand */}
        </CardHeader>
        <CardContent>
          {campaigns.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">
                No campaigns yet for this brand.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date Added</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((campaign) => (
                  <TableRow key={campaign.id}>
                    <TableCell className="font-medium">
                      {campaign.name}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          campaign.publish === "public"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {campaign.publish ?? "public"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(campaign.date_added).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
