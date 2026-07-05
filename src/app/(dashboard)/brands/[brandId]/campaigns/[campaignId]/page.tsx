import { auth } from "@/lib/auth";
import {
  getBrandIfAccessible,
  getCampaignIfAccessible,
} from "@/lib/brand-access";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ParticipantTable } from "@/components/campaigns/participant-table";
import { CampaignShareLinks } from "@/components/campaigns/campaign-share-links";
import { CampaignTabs } from "@/components/campaigns/campaign-tabs";
import { CampaignRewardSettings } from "@/components/campaigns/campaign-reward-settings";
import { CampaignEmailsEditor } from "@/components/campaigns/campaign-emails-editor";
import { IntegrationGuide } from "@/components/campaigns/integration-guide";
import {
  HomeIcon,
  ChevronRightIcon,
  UsersIcon,
  ShareIcon,
  MousePointerClickIcon,
  EyeIcon,
  SettingsIcon,
  TrophyIcon,
  MegaphoneIcon,
  LayoutDashboardIcon,
  PuzzleIcon,
  TargetIcon,
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
  const isAdmin = Boolean((session.user as { isAdmin?: boolean }).isAdmin);
  const urlId = parseInt(brandId, 10);
  const id = parseInt(campaignId, 10);

  if (isNaN(urlId) || isNaN(id)) notFound();

  const [campaign, brand] = await Promise.all([
    getCampaignIfAccessible(id, urlId, memberId, isAdmin),
    getBrandIfAccessible(urlId, memberId, isAdmin),
  ]);
  if (!campaign || !brand) notFound();

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
      bar: "from-[#28a745] to-[#5fd07d]",
    },
    {
      title: "Shares",
      value: stats.shares,
      icon: ShareIcon,
      color: "text-brand",
      bg: "bg-brand/10",
      bar: "from-brand to-[#ff9a7a]",
    },
    {
      title: "Clicks",
      value: stats.clicks,
      icon: MousePointerClickIcon,
      color: "text-[#dc3545]",
      bg: "bg-[#dc3545]/10",
      bar: "from-[#dc3545] to-[#ff7b93]",
    },
    {
      title: "Impressions",
      value: stats.impressions,
      icon: EyeIcon,
      color: "text-[#ffc107]",
      bg: "bg-[#ffc107]/10",
      bar: "from-[#ffc107] to-[#ffe08a]",
    },
  ];

  const siteOrigin =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "") || "https://referrals.com";
  const slugOrId = brand?.slug?.trim() || String(brand?.id ?? brandId);
  const referralLink = `${siteOrigin}/r/${campaign.id}`;
  const publicPageLink = `${siteOrigin}/public/${encodeURIComponent(slugOrId)}/campaign/${campaign.id}`;

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
      <div className="subheader relative overflow-hidden">
        {/* decorative glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-24 size-64 rounded-full bg-white/15 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-28 left-1/4 size-56 rounded-full bg-black/10 blur-3xl"
        />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-2xl font-black text-white shadow-lg ring-1 ring-white/25 backdrop-blur-sm sm:size-16">
              {campaign.name.trim().charAt(0).toUpperCase() || "R"}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl font-black capitalize leading-tight tracking-tight text-white drop-shadow-sm sm:text-3xl lg:text-4xl">
                  {campaign.name}
                </h1>
                <Badge
                  className={
                    campaign.publish === "public"
                      ? "border-0 bg-white/25 text-white font-semibold uppercase tracking-wide backdrop-blur-sm"
                      : "border-0 bg-white/10 text-white/70 font-semibold uppercase tracking-wide backdrop-blur-sm"
                  }
                >
                  {campaign.publish || "public"}
                </Badge>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 font-medium text-white backdrop-blur-sm">
                  <MegaphoneIcon className="size-3.5" />
                  {campaignType?.name || "Campaign"}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 font-medium text-white backdrop-blur-sm">
                  <TargetIcon className="size-3.5" />
                  Goal:{" "}
                  {campaign.goal_type === "visit"
                    ? `${campaign.num_visits} visits`
                    : `${campaign.num_signups} signups`}
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="#integrations" scroll={false}>
              <Button className="gap-2 bg-white/20 text-white backdrop-blur-sm hover:bg-white/30 border border-white/20">
                <PuzzleIcon className="size-4" />
                Install / embed
              </Button>
            </Link>
            <Link href={`/brands/${brandId}/campaigns/${campaignId}/edit`}>
              <Button className="gap-2 bg-white/20 text-white backdrop-blur-sm hover:bg-white/30 border border-white/20">
                <SettingsIcon className="size-4" />
                Edit
              </Button>
            </Link>
            <Link href={`/brands/${brandId}/campaigns`}>
              <Button className="gap-2 bg-white text-brand hover:bg-white/90 font-semibold shadow-md">
                <LayoutDashboardIcon className="size-4" />
                All Campaigns
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Referral + public page URLs */}
      <div className="portlet">
        <CampaignShareLinks referralUrl={referralLink} publicPageUrl={publicPageLink} />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.title}
              className="stat-card group relative overflow-hidden"
            >
              <div
                aria-hidden
                className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${stat.bar}`}
              />
              <div className="flex items-center gap-3">
                <div
                  className={`flex size-11 items-center justify-center rounded-xl ${stat.bg} transition-transform duration-200 group-hover:-rotate-6 group-hover:scale-110`}
                >
                  <Icon className={`size-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-3xl font-extrabold tracking-tight text-[#464457]">
                    {stat.value.toLocaleString()}
                  </p>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[#a7abc3]">
                    {stat.title}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabbed Interface */}
      <CampaignTabs
        analytics={
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
        }
        referrals={
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
        }
        rewards={<CampaignRewardSettings campaignId={campaignId} />}
        emails={<CampaignEmailsEditor campaignId={campaignId} />}
        integrations={
          <IntegrationGuide
            brandId={brandId}
            campaignId={campaign.id}
            baseUrl={siteOrigin}
            publicUrl={publicPageLink}
          />
        }
      />
    </div>
  );
}
