import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  PlusIcon,
  GlobeIcon,
  BarChart3Icon,
  UsersIcon,
  MousePointerClickIcon,
  ShareIcon,
  MegaphoneIcon,
  EyeIcon,
  BookOpenIcon,
  LifeBuoyIcon,
  HelpCircleIcon,
  MessageSquareIcon,
  ExternalLinkIcon,
  ArrowRightIcon,
  LayoutGridIcon,
} from "lucide-react";

async function getDashboardData(memberId: number) {
  const brands = await prisma.member_urls.findMany({
    where: { member_id: memberId },
    orderBy: { date_added: "desc" },
    take: 10,
  });

  const brandIds = brands.map((b) => b.id);

  let totalCampaigns = 0;
  let totalParticipants = 0;
  let totalClicks = 0;
  let totalShares = 0;
  let totalImpressions = 0;
  const campaignCountByBrandMap = new Map<number, number>();

  if (brandIds.length > 0) {
    const allCampaigns = await prisma.member_campaigns.findMany({
      where: { member_id: memberId },
      select: { id: true, url_id: true },
    });

    totalCampaigns = allCampaigns.length;
    const campaignIds = allCampaigns.map((c) => c.id);

    // Count campaigns per brand manually
    for (const c of allCampaigns) {
      campaignCountByBrandMap.set(c.url_id, (campaignCountByBrandMap.get(c.url_id) || 0) + 1);
    }

    if (campaignIds.length > 0) {
      const [participantCount, clicksAgg, shareCount, impressionsAgg] =
        await Promise.all([
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
          prisma.campaign_widget_impressions_count.aggregate({
            where: { campaign_id: { in: campaignIds } },
            _sum: { views: true },
          }),
        ]);

      totalParticipants = participantCount;
      totalClicks = clicksAgg._sum.clicks || 0;
      totalShares = shareCount;
      totalImpressions = Number(impressionsAgg._sum.views || 0);
    }
  }

  // Build a map of campaign counts by brand
  return {
    brands,
    campaignCountByBrand: campaignCountByBrandMap,
    stats: {
      brands: brands.length,
      campaigns: totalCampaigns,
      participants: totalParticipants,
      clicks: totalClicks,
      shares: totalShares,
      impressions: totalImpressions,
    },
  };
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const memberId = parseInt(session.user.id, 10);
  const userName = session.user.name || session.user.email || "User";

  let data;
  try {
    data = await getDashboardData(memberId);
  } catch {
    data = {
      brands: [],
      campaignCountByBrand: new Map(),
      stats: {
        brands: 0,
        campaigns: 0,
        participants: 0,
        clicks: 0,
        shares: 0,
        impressions: 0,
      },
    };
  }

  const { brands, campaignCountByBrand, stats } = data;

  const statCards = [
    {
      title: "Brands",
      value: stats.brands,
      icon: GlobeIcon,
      color: "text-brand",
      bg: "bg-brand/10",
    },
    {
      title: "Campaigns",
      value: stats.campaigns,
      icon: MegaphoneIcon,
      color: "text-[#36a3f7]",
      bg: "bg-[#36a3f7]/10",
    },
    {
      title: "Impressions",
      value: stats.impressions,
      icon: EyeIcon,
      color: "text-[#ffc107]",
      bg: "bg-[#ffc107]/10",
    },
    {
      title: "Referrals",
      value: stats.participants,
      icon: UsersIcon,
      color: "text-[#28a745]",
      bg: "bg-[#28a745]/10",
    },
    {
      title: "Shares",
      value: stats.shares,
      icon: ShareIcon,
      color: "text-[#6f42c1]",
      bg: "bg-[#6f42c1]/10",
    },
    {
      title: "Clicks",
      value: stats.clicks,
      icon: MousePointerClickIcon,
      color: "text-[#dc3545]",
      bg: "bg-[#dc3545]/10",
    },
  ];

  const quickLinks = [
    {
      title: "Blog",
      description: "Latest tips & guides",
      href: "https://referrals.com/blog",
      icon: BookOpenIcon,
      color: "text-brand",
      bg: "bg-brand/10",
      external: true,
    },
    {
      title: "Knowledge Base",
      description: "How-to articles",
      href: "https://referrals.com/support",
      icon: HelpCircleIcon,
      color: "text-[#28a745]",
      bg: "bg-[#28a745]/10",
      external: true,
    },
    {
      title: "Support",
      description: "Get help from us",
      href: "https://referrals.com/support",
      icon: LifeBuoyIcon,
      color: "text-[#36a3f7]",
      bg: "bg-[#36a3f7]/10",
      external: true,
    },
    {
      title: "Discussions",
      description: "Community forum",
      href: "/forum",
      icon: MessageSquareIcon,
      color: "text-[#ffc107]",
      bg: "bg-[#ffc107]/10",
      external: false,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Subheader Banner */}
      <div className="subheader flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="mt-1 text-sm text-white/80">
            Welcome back, {userName}! Here is your referral program overview.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/promotions">
            <Button className="gap-2 bg-white/20 text-white backdrop-blur-sm hover:bg-white/30 border border-white/20">
              <ShareIcon className="size-4" />
              Refer Us
            </Button>
          </Link>
          <Link href="/brands/new">
            <Button className="gap-2 bg-white text-brand hover:bg-white/90 font-semibold">
              <PlusIcon className="size-4" />
              New Brand
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.title} className="stat-card">
              <div className="flex items-center justify-between">
                <div className={`flex size-10 items-center justify-center rounded-lg ${stat.bg}`}>
                  <Icon className={`size-5 ${stat.color}`} />
                </div>
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold text-[#575962]">
                  {stat.value.toLocaleString()}
                </p>
                <p className="text-xs font-medium uppercase tracking-wider text-[#a7abc3]">
                  {stat.title}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Content: Two Columns */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column: Brand Cards */}
        <div className="lg:col-span-7">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#575962]">
              <LayoutGridIcon className="mr-2 inline-block size-5" />
              Your Brands
            </h2>
            <Link href="/brands">
              <Button variant="ghost" size="sm" className="gap-1 text-brand">
                View All <ArrowRightIcon className="size-3.5" />
              </Button>
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {brands.map((brand) => {
              const campaignCount = campaignCountByBrand.get(brand.id) || 0;
              return (
                <Link
                  key={brand.id}
                  href={`/brands/${brand.id}`}
                  className="group block"
                >
                  <div
                    className="brand-overlay-card"
                    style={{
                      background: brand.logo_url
                        ? `url(${brand.logo_url}) center/cover no-repeat`
                        : "linear-gradient(135deg, #2c2e3e 0%, #1a1c2d 100%)",
                    }}
                  >
                    {/* Campaign Button (top right) */}
                    <div className="absolute right-3 top-3 z-10">
                      <Link href={`/brands/${brand.id}/campaigns/new`}>
                        <span className="inline-flex items-center gap-1 rounded-md bg-brand/90 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm transition hover:bg-brand">
                          <PlusIcon className="size-3" />
                          Campaign
                        </span>
                      </Link>
                    </div>

                    {/* Brand Info */}
                    <div className="p-5">
                      {brand.logo_url ? (
                        <img
                          src={brand.logo_url}
                          alt={brand.domain}
                          className="mb-3 h-8 w-auto brightness-0 invert opacity-90"
                        />
                      ) : (
                        <h3 className="mb-2 text-xl font-bold text-white drop-shadow-lg">
                          {brand.domain}
                        </h3>
                      )}
                      <p className="mb-3 text-xs text-white/70">{brand.url}</p>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-3 gap-2 rounded-md bg-black/30 p-2.5 backdrop-blur-sm">
                        <div className="text-center">
                          <p className="text-base font-bold text-white">
                            {campaignCount}
                          </p>
                          <p className="text-[10px] uppercase tracking-wider text-white/60">
                            Campaigns
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-base font-bold text-white">
                            {brand.plan_expiry &&
                            new Date(brand.plan_expiry) > new Date() ? (
                              <Badge className="bg-[#28a745]/80 text-white text-[10px] border-0">
                                Active
                              </Badge>
                            ) : (
                              <Badge className="bg-white/20 text-white text-[10px] border-0">
                                Free
                              </Badge>
                            )}
                          </p>
                          <p className="text-[10px] uppercase tracking-wider text-white/60">
                            Plan
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-base font-bold text-white">
                            {new Date(brand.date_added).toLocaleDateString(
                              "en-US",
                              { month: "short", year: "2-digit" }
                            )}
                          </p>
                          <p className="text-[10px] uppercase tracking-wider text-white/60">
                            Added
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}

            {/* Add Brand Card */}
            <Link href="/brands/new" className="group block">
              <div className="flex min-h-[220px] flex-col items-center justify-center rounded-lg border-2 border-dashed border-[#ebeef0] bg-white transition-all group-hover:border-brand group-hover:bg-brand/5">
                <div className="flex size-14 items-center justify-center rounded-full bg-[#f2f3f8] transition-colors group-hover:bg-brand/10">
                  <PlusIcon className="size-7 text-[#a7abc3] transition-colors group-hover:text-brand" />
                </div>
                <p className="mt-3 text-sm font-semibold text-[#575962]">
                  Add New Brand
                </p>
                <p className="mt-1 text-xs text-[#a7abc3]">
                  Start a referral program
                </p>
              </div>
            </Link>
          </div>

          {brands.length >= 10 && (
            <div className="mt-4 text-center">
              <Link href="/brands">
                <Button variant="outline" className="gap-2 border-[#ebeef0]">
                  Load More Brands
                  <ArrowRightIcon className="size-4" />
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Right Column: Quick Links + Social */}
        <div className="space-y-6 lg:col-span-5">
          {/* Plan Notification */}
          <div className="rounded-lg border border-brand/20 bg-brand/5 p-4">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand/10">
                <BarChart3Icon className="size-5 text-brand" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-[#575962]">
                  Upgrade Your Plan
                </h3>
                <p className="mt-0.5 text-xs text-[#a7abc3]">
                  Unlock advanced analytics, custom branding, and priority
                  support.
                </p>
                <Link href="/billing">
                  <Button
                    size="sm"
                    className="mt-2 gap-1 bg-brand text-white hover:bg-brand-hover"
                  >
                    View Plans <ArrowRightIcon className="size-3" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Quick Links Grid */}
          <div>
            <h2 className="mb-3 text-lg font-semibold text-[#575962]">
              Quick Links
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {quickLinks.map((link) => {
                const Icon = link.icon;
                const Wrapper = link.external ? "a" : Link;
                const extraProps = link.external
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {};
                return (
                  <Wrapper
                    key={link.title}
                    href={link.href}
                    {...(extraProps as any)}
                  >
                    <div className="quick-link-card group">
                      <div
                        className={`flex size-10 items-center justify-center rounded-lg ${link.bg} transition-transform group-hover:scale-110`}
                      >
                        <Icon className={`size-5 ${link.color}`} />
                      </div>
                      <h3 className="text-sm font-semibold text-[#575962]">
                        {link.title}
                      </h3>
                      <p className="text-[11px] text-[#a7abc3]">
                        {link.description}
                      </p>
                      {link.external && (
                        <ExternalLinkIcon className="size-3 text-[#a7abc3]" />
                      )}
                    </div>
                  </Wrapper>
                );
              })}
            </div>
          </div>

          {/* Social Links */}
          <div className="portlet">
            <h3 className="mb-3 text-sm font-semibold text-[#575962]">
              Connect With Us
            </h3>
            <div className="space-y-2">
              {[
                {
                  name: "Discord",
                  href: "https://discord.gg/referrals",
                  color: "bg-[#5865F2]",
                },
                {
                  name: "Twitter / X",
                  href: "https://twitter.com/referralscom",
                  color: "bg-black",
                },
                {
                  name: "Facebook",
                  href: "https://facebook.com/referralscom",
                  color: "bg-[#1877F2]",
                },
                {
                  name: "LinkedIn",
                  href: "https://linkedin.com/company/referralscom",
                  color: "bg-[#0A66C2]",
                },
              ].map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-[#575962] transition-colors hover:bg-[#f2f3f8]"
                >
                  <span
                    className={`flex size-6 items-center justify-center rounded ${social.color}`}
                  >
                    <ExternalLinkIcon className="size-3 text-white" />
                  </span>
                  {social.name}
                  <ExternalLinkIcon className="ml-auto size-3 text-[#a7abc3]" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
