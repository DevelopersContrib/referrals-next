import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
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
import {
  PlusIcon,
  HomeIcon,
  ChevronRightIcon,
  SettingsIcon,
  MegaphoneIcon,
  UsersIcon,
  MousePointerClickIcon,
  ShareIcon,
  TrophyIcon,
  UserPlusIcon,
  CalendarIcon,
  ExternalLinkIcon,
  ArrowRightIcon,
} from "lucide-react";

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

  // Share leaders & invite leaders
  let shareLeaders: any[] = [];
  let inviteLeaders: any[] = [];

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

    // Get share leaders
    const shareLeadersRaw = await prisma.participants_share.groupBy({
      by: ["participant_id"],
      where: { campaign_id: { in: campaignIds } },
      _sum: { clicks: true },
      _count: { id: true },
      orderBy: { _sum: { clicks: "desc" } },
      take: 5,
    });

    const shareLeaderIds = shareLeadersRaw.map((s) => s.participant_id);
    const shareLeaderDetails = shareLeaderIds.length
      ? await prisma.campaign_participants.findMany({
          where: { id: { in: shareLeaderIds } },
          select: { id: true, name: true, email: true },
        })
      : [];
    const shareLeaderMap = new Map(
      shareLeaderDetails.map((l) => [l.id, l])
    );

    shareLeaders = shareLeadersRaw.map((s) => ({
      participant: shareLeaderMap.get(s.participant_id),
      shares: s._count.id,
      clicks: s._sum.clicks || 0,
    }));

    // Get invite leaders
    const inviteLeadersRaw = await prisma.campaign_participants.groupBy({
      by: ["invited_by"],
      where: { campaign_id: { in: campaignIds }, invited_by: { not: null } },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 5,
    });

    const inviteLeaderIds = inviteLeadersRaw
      .map((r) => r.invited_by)
      .filter((id): id is number => id !== null);
    const inviteLeaderDetails = inviteLeaderIds.length
      ? await prisma.campaign_participants.findMany({
          where: { id: { in: inviteLeaderIds } },
          select: { id: true, name: true, email: true },
        })
      : [];
    const inviteLeaderMap = new Map(
      inviteLeaderDetails.map((l) => [l.id, l])
    );

    inviteLeaders = inviteLeadersRaw.map((r) => ({
      participant: inviteLeaderMap.get(r.invited_by!),
      count: r._count.id,
    }));
  }

  return {
    brand,
    campaigns,
    shareLeaders,
    inviteLeaders,
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

  const { brand, campaigns, shareLeaders, inviteLeaders, stats } = data;

  const statCards = [
    {
      title: "Campaigns",
      value: stats.campaignsCount,
      icon: MegaphoneIcon,
      color: "text-brand",
      bg: "bg-brand/10",
    },
    {
      title: "Participants",
      value: stats.participantsCount,
      icon: UsersIcon,
      color: "text-[#28a745]",
      bg: "bg-[#28a745]/10",
    },
    {
      title: "Total Clicks",
      value: stats.totalClicks,
      icon: MousePointerClickIcon,
      color: "text-[#dc3545]",
      bg: "bg-[#dc3545]/10",
    },
    {
      title: "Total Shares",
      value: stats.totalShares,
      icon: ShareIcon,
      color: "text-[#36a3f7]",
      bg: "bg-[#36a3f7]/10",
    },
  ];

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
        <Link href="/brands" className="hover:text-brand transition-colors">
          Brands
        </Link>
        <ChevronRightIcon className="size-3" />
        <span className="font-medium text-[#575962]">{brand.domain}</span>
      </nav>

      {/* Brand Header */}
      <div className="subheader flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          {brand.logo_url ? (
            <img
              src={brand.logo_url}
              alt={brand.domain}
              className="size-12 rounded-lg border border-white/20 bg-white/10 object-contain p-1"
            />
          ) : (
            <div className="flex size-12 items-center justify-center rounded-lg bg-white/20 text-xl font-bold text-white">
              {brand.domain.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="text-xl font-bold text-white">{brand.domain}</h1>
            <a
              href={brand.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-white/70 hover:text-white"
            >
              {brand.url}
              <ExternalLinkIcon className="size-3" />
            </a>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/brands/${brand.id}/edit`}>
            <Button className="gap-2 bg-white/20 text-white backdrop-blur-sm hover:bg-white/30 border border-white/20">
              <SettingsIcon className="size-4" />
              Edit Brand
            </Button>
          </Link>
          <Link href={`/brands/${brand.id}/campaigns/new`}>
            <Button className="gap-2 bg-white text-brand hover:bg-white/90 font-semibold">
              <PlusIcon className="size-4" />
              Create Campaign
            </Button>
          </Link>
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

      {/* Three Column Layout */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Share Leaders */}
        <div className="portlet">
          <div className="mb-4 flex items-center gap-2">
            <TrophyIcon className="size-5 text-[#ffc107]" />
            <h3 className="font-semibold text-[#575962]">Share Leaders</h3>
          </div>
          {shareLeaders.length === 0 ? (
            <p className="py-6 text-center text-sm text-[#a7abc3]">
              No share data yet
            </p>
          ) : (
            <div className="space-y-2">
              {shareLeaders.map((leader, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-md border border-[#ebeef0] p-2.5"
                >
                  <div className="flex size-8 items-center justify-center rounded-full bg-brand/10 text-xs font-bold text-brand">
                    #{i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-[#575962]">
                      {leader.participant?.name || "Unknown"}
                    </p>
                    <p className="text-xs text-[#a7abc3]">
                      {leader.shares} shares &middot; {leader.clicks} clicks
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Invite Leaders */}
        <div className="portlet">
          <div className="mb-4 flex items-center gap-2">
            <UserPlusIcon className="size-5 text-[#28a745]" />
            <h3 className="font-semibold text-[#575962]">Invite Leaders</h3>
          </div>
          {inviteLeaders.length === 0 ? (
            <p className="py-6 text-center text-sm text-[#a7abc3]">
              No invite data yet
            </p>
          ) : (
            <div className="space-y-2">
              {inviteLeaders.map((leader, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-md border border-[#ebeef0] p-2.5"
                >
                  <div className="flex size-8 items-center justify-center rounded-full bg-[#28a745]/10 text-xs font-bold text-[#28a745]">
                    #{i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-[#575962]">
                      {leader.participant?.name || "Unknown"}
                    </p>
                    <p className="text-xs text-[#a7abc3]">
                      {leader.count} referral{leader.count !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Latest Campaigns */}
        <div className="portlet">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MegaphoneIcon className="size-5 text-brand" />
              <h3 className="font-semibold text-[#575962]">
                Latest Campaigns
              </h3>
            </div>
            <Link href={`/brands/${brand.id}/campaigns`}>
              <Button variant="ghost" size="sm" className="gap-1 text-brand text-xs">
                All <ArrowRightIcon className="size-3" />
              </Button>
            </Link>
          </div>
          {campaigns.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-sm text-[#a7abc3]">No campaigns yet.</p>
              <Link href={`/brands/${brand.id}/campaigns/new`}>
                <Button
                  size="sm"
                  className="mt-3 gap-1 bg-brand text-white hover:bg-brand-hover"
                >
                  <PlusIcon className="size-3" />
                  Create First Campaign
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {campaigns.slice(0, 5).map((campaign) => (
                <Link
                  key={campaign.id}
                  href={`/brands/${brand.id}/campaigns/${campaign.id}`}
                  className="block rounded-md border border-[#ebeef0] p-2.5 transition-colors hover:border-brand/30 hover:bg-brand/5"
                >
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[#575962]">
                        {campaign.name}
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <CalendarIcon className="size-3 text-[#a7abc3]" />
                        <p className="text-xs text-[#a7abc3]">
                          {new Date(campaign.date_added).toLocaleDateString(
                            "en-US",
                            { month: "short", day: "numeric", year: "numeric" }
                          )}
                        </p>
                      </div>
                    </div>
                    <Badge
                      className={
                        campaign.publish === "public"
                          ? "border-0 bg-[#28a745]/10 text-[#28a745] text-[10px]"
                          : "border-0 bg-[#f2f3f8] text-[#a7abc3] text-[10px]"
                      }
                    >
                      {campaign.publish ?? "public"}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
