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
import {
  CampaignTabs,
  IntegrationsEmbedLink,
} from "@/components/campaigns/campaign-tabs";
import { CampaignRewardSettings } from "@/components/campaigns/campaign-reward-settings";
import { CampaignEmailsEditor } from "@/components/campaigns/campaign-emails-editor";
import { IntegrationGuide } from "@/components/campaigns/integration-guide";
import { CampaignTrackingProof } from "@/components/campaigns/campaign-tracking-proof";
import { BrandLogo } from "@/components/brands/brand-logo";
import { kindLook } from "@/lib/analysis/apply-campaign-suggestion";
import {
  CampaignDashboardPreview,
  previewFromRecords,
} from "@/components/campaigns/campaign-dashboard-preview";
import { getRewardKind } from "@/lib/reward-types";
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

  const [campaignType, widget, analysis, rewardRow, rewardType] =
    await Promise.all([
      prisma.campaign_types.findFirst({
        where: { id: campaign.type_id },
      }),
      prisma.campaign_widget.findFirst({
        where: { campaign_id: id },
      }),
      prisma.brand_analysis.findFirst({
        where: { url_id: urlId, member_id: memberId },
        orderBy: { id: "desc" },
        select: { id: true },
      }),
      prisma.campaign_reward.findFirst({
        where: { campaign_id: id },
      }),
      prisma.reward_types.findFirst({
        where: { id: campaign.reward_type },
      }),
    ]);

  const suggestion = analysis
    ? await prisma.brand_campaign_suggestion.findFirst({
        where: {
          analysis_id: analysis.id,
          OR: [
            { name: campaign.name },
            { headline: widget?.header_title || undefined },
          ],
        },
        orderBy: { id: "desc" },
      })
    : null;

  const look = kindLook(suggestion?.kind);
  const headline =
    widget?.header_title || suggestion?.headline || campaign.name;
  const pitch = widget?.description || suggestion?.description || null;
  const rewardKind = getRewardKind(rewardType?.name);
  const rewardLabel =
    rewardKind === "cash" && rewardRow?.cash_value
      ? `$${rewardRow.cash_value} cash per referral`
      : rewardKind === "coupons"
        ? "Coupon reward"
        : rewardKind === "custom" && rewardRow?.custom_message
          ? rewardRow.custom_message.slice(0, 80)
          : rewardType?.name
            ? `${rewardType.name} reward`
            : null;

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
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "") ||
    "https://referrals.com";
  const slugOrId = brand?.slug?.trim() || String(brand?.id ?? brandId);
  // Live referral surfaces — never /r/{id} (no route)
  const referralLink = `${siteOrigin}/widget/${campaign.id}`;
  const publicPageLink = `${siteOrigin}/p/${encodeURIComponent(slugOrId)}/campaign/${campaign.id}`;

  return (
    <div className="min-w-0 space-y-6">
      {/* Breadcrumb */}
      <nav className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-[#a7abc3]">
        <Link
          href="/dashboard"
          className="flex items-center gap-1 hover:text-brand transition-colors"
        >
          <HomeIcon className="size-3.5" />
          Home
        </Link>
        <ChevronRightIcon className="size-3 shrink-0" />
        <Link
          href={`/brands/${brandId}`}
          className="max-w-[45vw] truncate hover:text-brand transition-colors sm:max-w-none"
        >
          {brand?.domain || "Brand"}
        </Link>
        <ChevronRightIcon className="size-3 shrink-0" />
        <span className="max-w-full truncate font-medium text-[#575962]">
          {campaign.name}
        </span>
      </nav>

      {/* Campaign Header — same designed card the AI showed at launch */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div
          className="px-5 py-5 sm:px-8 sm:py-6"
          style={{
            background: `linear-gradient(135deg, ${look.from}14, ${look.to}0d)`,
          }}
        >
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white bg-white p-2 shadow-sm sm:size-16">
                <BrandLogo
                  domain={brand?.domain || ""}
                  logoUrl={brand?.logo_url}
                  imgClassName="h-full w-full object-contain"
                  fallbackClassName="flex h-full w-full items-center justify-center rounded-xl bg-gray-100 text-xl font-bold text-gray-400"
                />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className="rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white"
                    style={{
                      background: `linear-gradient(135deg, ${look.from}, ${look.to})`,
                    }}
                  >
                    {look.label}
                  </span>
                  <Badge
                    className={
                      campaign.publish === "public"
                        ? "border-0 bg-emerald-100 text-emerald-800 font-semibold uppercase tracking-wide"
                        : "border-0 bg-gray-100 text-gray-600 font-semibold uppercase tracking-wide"
                    }
                  >
                    {campaign.publish || "public"}
                  </Badge>
                </div>
                <h1 className="mt-2 text-2xl font-bold leading-tight tracking-tight text-gray-900 sm:text-3xl">
                  {headline}
                </h1>
                {pitch && (
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-600">
                    {pitch}
                  </p>
                )}
                <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-gray-500">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-2.5 py-1 font-medium">
                    <MegaphoneIcon className="size-3.5" />
                    {campaign.name}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-2.5 py-1 font-medium">
                    <TargetIcon className="size-3.5" />
                    Goal:{" "}
                    {campaign.goal_type === "visit"
                      ? `${campaign.num_visits} visits`
                      : `${campaign.num_signups} signups`}
                  </span>
                  {campaignType?.name && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-2.5 py-1 font-medium">
                      {campaignType.name}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto lg:shrink-0 lg:justify-end">
              <IntegrationsEmbedLink className="inline-flex h-10 w-full items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:border-brand/40 hover:text-brand sm:w-auto">
                <PuzzleIcon className="size-4" />
                Install / embed
              </IntegrationsEmbedLink>
              <Link
                href={`/brands/${brandId}/campaigns/${campaignId}/edit`}
                className="w-full sm:w-auto"
              >
                <Button
                  variant="outline"
                  className="h-10 w-full gap-2 whitespace-nowrap shadow-sm sm:w-auto"
                >
                  <SettingsIcon className="size-4" />
                  Edit
                </Button>
              </Link>
              <Link
                href={`/brands/${brandId}/campaigns`}
                className="w-full sm:w-auto"
              >
                <Button className="h-10 w-full gap-2 whitespace-nowrap bg-brand font-semibold text-white shadow-sm hover:bg-brand/90 sm:w-auto">
                  <LayoutDashboardIcon className="size-4" />
                  All Campaigns
                </Button>
              </Link>
            </div>
          </div>
        </div>
        {suggestion && (
          <div className="grid grid-cols-3 divide-x divide-gray-100 border-t border-gray-100 text-center">
            <div className="px-3 py-3">
              <p className="text-sm font-bold text-gray-900">
                {suggestion.predicted_conversion || "—"}
              </p>
              <p className="text-[11px] text-gray-400">Conversion</p>
            </div>
            <div className="px-3 py-3">
              <p className="text-sm font-bold text-gray-900">
                {suggestion.predicted_referrals || "—"}
              </p>
              <p className="text-[11px] text-gray-400">Referrals</p>
            </div>
            <div className="px-3 py-3">
              <p className="text-sm font-bold text-gray-900">
                {suggestion.estimated_roi || "—"}
              </p>
              <p className="text-[11px] text-gray-400">Est. ROI</p>
            </div>
          </div>
        )}
      </div>

      {/* Referral + public page URLs */}
      <div className="portlet min-w-0">
        <CampaignShareLinks
          referralUrl={referralLink}
          publicPageUrl={publicPageLink}
        />
      </div>

      <CampaignDashboardPreview
        {...previewFromRecords({
          kind: suggestion?.kind,
          headline,
          pitch,
          widget,
          suggestionPayload: suggestion?.payload,
          rewardLabel,
          brandDomain: brand?.domain || "",
          brandLogoUrl: brand?.logo_url,
          publicPageUrl: publicPageLink,
          widgetUrl: referralLink,
        })}
      />

      <CampaignTrackingProof
        campaignId={campaign.id}
        brandId={brandId}
        initialImpressions={stats.impressions}
        initialClicks={stats.clicks}
      />

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
          <div className="grid min-w-0 gap-6 lg:grid-cols-2">
            {/* Top Referrers */}
            <div className="portlet min-w-0">
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
            <div className="portlet min-w-0">
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
          <div className="portlet min-w-0">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
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
            brandDomain={brand?.domain || ""}
          />
        }
      />
    </div>
  );
}
