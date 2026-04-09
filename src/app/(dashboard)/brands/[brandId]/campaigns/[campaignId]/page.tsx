import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ParticipantTable } from "@/components/campaigns/participant-table";
import {
  HomeIcon,
  ChevronRightIcon,
  UsersIcon,
  ShareIcon,
  MousePointerClickIcon,
  EyeIcon,
  SettingsIcon,
  LinkIcon,
  CopyIcon,
  BarChart3Icon,
  TrophyIcon,
  GiftIcon,
  CodeIcon,
  ZapIcon,
  ExternalLinkIcon,
  LayoutDashboardIcon,
} from "lucide-react";

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

  // Get the brand for breadcrumb
  const brand = await prisma.member_urls.findFirst({
    where: { id: parseInt(brandId, 10), member_id: memberId },
    select: { domain: true, slug: true, id: true },
  });

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
    {
      title: "Participants",
      value: stats.participants,
      icon: UsersIcon,
      color: "text-[#28a745]",
      bg: "bg-[#28a745]/10",
    },
    {
      title: "Shares",
      value: stats.shares,
      icon: ShareIcon,
      color: "text-brand",
      bg: "bg-brand/10",
    },
    {
      title: "Clicks",
      value: stats.clicks,
      icon: MousePointerClickIcon,
      color: "text-[#dc3545]",
      bg: "bg-[#dc3545]/10",
    },
    {
      title: "Impressions",
      value: stats.impressions,
      icon: EyeIcon,
      color: "text-[#ffc107]",
      bg: "bg-[#ffc107]/10",
    },
  ];

  // Build referral link
  const referralLink = `https://referrals.com/r/${campaign.id}`;
  const publicPageLink = `https://referrals.com/public/${brand?.slug || brand?.id}/campaign/${campaign.id}`;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-[#a7abc3]">
        <Link
          href="/dashboard"
          className="flex items-center gap-1 hover:text-brand transition-colors"
        >
          <HomeIcon className="size-3.5" />
          Home
        </Link>
        <ChevronRightIcon className="size-3" />
        <Link
          href={`/brands/${brandId}`}
          className="hover:text-brand transition-colors"
        >
          {brand?.domain || "Brand"}
        </Link>
        <ChevronRightIcon className="size-3" />
        <span className="font-medium text-[#575962]">{campaign.name}</span>
      </nav>

      {/* Campaign Header */}
      <div className="subheader flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-white">{campaign.name}</h1>
            <Badge
              className={
                campaign.publish === "public"
                  ? "border-0 bg-white/20 text-white font-medium"
                  : "border-0 bg-white/10 text-white/70 font-medium"
              }
            >
              {campaign.publish || "public"}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-white/70">
            {campaignType?.name || "Campaign"} &middot; Goal:{" "}
            {campaign.goal_type === "visit"
              ? `${campaign.num_visits} visits`
              : `${campaign.num_signups} signups`}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/brands/${brandId}/campaigns/${campaignId}/edit`}>
            <Button className="gap-2 bg-white/20 text-white backdrop-blur-sm hover:bg-white/30 border border-white/20">
              <SettingsIcon className="size-4" />
              Edit
            </Button>
          </Link>
          <Link href={`/brands/${brandId}/campaigns`}>
            <Button className="gap-2 bg-white text-brand hover:bg-white/90 font-semibold">
              <LayoutDashboardIcon className="size-4" />
              All Campaigns
            </Button>
          </Link>
        </div>
      </div>

      {/* Referral Link Display */}
      <div className="portlet">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#a7abc3]">
              Referral Link
            </label>
            <div className="flex items-center gap-2">
              <div className="flex h-9 flex-1 items-center rounded-md border border-[#ebeef0] bg-[#f7f8fa] px-3 text-sm text-[#575962]">
                <LinkIcon className="mr-2 size-3.5 text-[#a7abc3]" />
                <span className="truncate">{referralLink}</span>
              </div>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 border-[#ebeef0] hover:border-brand hover:text-brand"
              >
                <CopyIcon className="size-4" />
              </Button>
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#a7abc3]">
              Public Page Link
            </label>
            <div className="flex items-center gap-2">
              <div className="flex h-9 flex-1 items-center rounded-md border border-[#ebeef0] bg-[#f7f8fa] px-3 text-sm text-[#575962]">
                <ExternalLinkIcon className="mr-2 size-3.5 text-[#a7abc3]" />
                <span className="truncate">{publicPageLink}</span>
              </div>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 border-[#ebeef0] hover:border-brand hover:text-brand"
              >
                <CopyIcon className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.title} className="stat-card">
              <div className="flex items-center gap-3">
                <div
                  className={`flex size-10 items-center justify-center rounded-lg ${stat.bg}`}
                >
                  <Icon className={`size-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#575962]">
                    {stat.value.toLocaleString()}
                  </p>
                  <p className="text-xs font-medium uppercase tracking-wider text-[#a7abc3]">
                    {stat.title}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabbed Interface */}
      <Tabs defaultValue="analytics">
        <TabsList variant="line" className="border-b border-[#ebeef0] pb-0">
          <TabsTrigger value="analytics" className="gap-1.5">
            <BarChart3Icon className="size-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="referrals" className="gap-1.5">
            <UsersIcon className="size-4" />
            Referrals
          </TabsTrigger>
          <TabsTrigger value="integrations" className="gap-1.5">
            <CodeIcon className="size-4" />
            Integrations
          </TabsTrigger>
        </TabsList>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Top Referrers */}
            <div className="portlet">
              <div className="mb-4 flex items-center gap-2">
                <TrophyIcon className="size-5 text-[#ffc107]" />
                <h3 className="font-semibold text-[#575962]">Top Referrers</h3>
              </div>
              {topReferrers.length === 0 ? (
                <p className="py-6 text-center text-sm text-[#a7abc3]">
                  No referrals yet
                </p>
              ) : (
                <div className="space-y-2">
                  {topReferrers.map((r, i) => {
                    const detail = referrerMap.get(r.invited_by!);
                    return (
                      <div
                        key={r.invited_by}
                        className="flex items-center gap-3 rounded-md border border-[#ebeef0] p-2.5"
                      >
                        <div className="flex size-8 items-center justify-center rounded-full bg-[#ffc107]/10 text-xs font-bold text-[#ffc107]">
                          #{i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="truncate text-sm font-medium text-[#575962]">
                            {detail?.name || "Unknown"}
                          </p>
                          <p className="text-xs text-[#a7abc3]">
                            {detail?.email}
                          </p>
                        </div>
                        <Badge className="border-0 bg-brand/10 text-brand font-semibold">
                          {r._count.id}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Share Leaders */}
            <div className="portlet">
              <div className="mb-4 flex items-center gap-2">
                <ShareIcon className="size-5 text-brand" />
                <h3 className="font-semibold text-[#575962]">Share Leaders</h3>
              </div>
              {shareLeaders.length === 0 ? (
                <p className="py-6 text-center text-sm text-[#a7abc3]">
                  No shares yet
                </p>
              ) : (
                <div className="space-y-2">
                  {shareLeaders.map((s, i) => {
                    const detail = leaderMap.get(s.participant_id);
                    return (
                      <div
                        key={s.participant_id}
                        className="flex items-center gap-3 rounded-md border border-[#ebeef0] p-2.5"
                      >
                        <div className="flex size-8 items-center justify-center rounded-full bg-brand/10 text-xs font-bold text-brand">
                          #{i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="truncate text-sm font-medium text-[#575962]">
                            {detail?.name || "Unknown"}
                          </p>
                          <p className="text-xs text-[#a7abc3]">
                            {s._count.id} shares
                          </p>
                        </div>
                        <Badge className="border-0 bg-[#dc3545]/10 text-[#dc3545] font-semibold">
                          {s._sum.clicks || 0} clicks
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Referrals Tab */}
        <TabsContent value="referrals" className="mt-6">
          <div className="portlet">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-[#575962]">All Participants</h3>
              <div className="flex gap-2">
                <Link
                  href={`/brands/${brandId}/campaigns/${campaignId}/participants`}
                >
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 border-[#ebeef0]"
                  >
                    <UsersIcon className="size-3.5" />
                    Full View
                  </Button>
                </Link>
              </div>
            </div>
            <ParticipantTable
              campaignId={campaignId}
              brandId={brandId}
              compact
              showExport={false}
            />
          </div>
        </TabsContent>

        {/* Integrations Tab */}
        <TabsContent value="integrations" className="mt-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Link
              href={`/brands/${brandId}/campaigns/${campaignId}/widget`}
              className="quick-link-card"
            >
              <div className="flex size-10 items-center justify-center rounded-lg bg-brand/10">
                <CodeIcon className="size-5 text-brand" />
              </div>
              <h4 className="text-sm font-semibold text-[#575962]">Widget</h4>
              <p className="text-xs text-[#a7abc3]">Embed on your site</p>
            </Link>
            <Link
              href={`/brands/${brandId}/campaigns/${campaignId}/emails`}
              className="quick-link-card"
            >
              <div className="flex size-10 items-center justify-center rounded-lg bg-[#28a745]/10">
                <ZapIcon className="size-5 text-[#28a745]" />
              </div>
              <h4 className="text-sm font-semibold text-[#575962]">Emails</h4>
              <p className="text-xs text-[#a7abc3]">Configure email flows</p>
            </Link>
            <Link
              href={`/brands/${brandId}/campaigns/${campaignId}/rewards`}
              className="quick-link-card"
            >
              <div className="flex size-10 items-center justify-center rounded-lg bg-[#ffc107]/10">
                <GiftIcon className="size-5 text-[#ffc107]" />
              </div>
              <h4 className="text-sm font-semibold text-[#575962]">Rewards</h4>
              <p className="text-xs text-[#a7abc3]">Manage incentives</p>
            </Link>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
