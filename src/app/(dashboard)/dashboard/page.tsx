import { Suspense } from "react";
import { unstable_cache } from "next/cache";
import { auth } from "@/lib/auth";
import { VerifyEmailBanner } from "@/components/auth/verify-email-banner";
import { WhatsNew } from "@/components/dashboard/whats-new";
import { prisma } from "@/lib/prisma";
import {
  brandShouldShowUpgradeCta,
  countMemberBrands,
  getBrandEntitlement,
} from "@/lib/member-subscription";
import { enrollMemberInSignupReferral } from "@/lib/signup-referral";
import { SignupInviteCard } from "@/components/auth/signup-invite-card";
import { BrandUpgradeCta } from "@/components/brands/brand-upgrade-cta";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  PlusIcon,
  GlobeIcon,
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

const BIG_ACCOUNT_CAMPAIGNS = 500;

/** Participants, shares, clicks and widget views across all of a member's campaigns. */
async function accountTotals(memberId: number) {
  const rows = await prisma.$queryRaw<
    { participants: bigint | null; shares: bigint | null; clicks: number | bigint | null; impressions: number | bigint | null }[]
  >`
    SELECT
      (SELECT COUNT(*) FROM campaign_participants cp
         JOIN member_campaigns mc ON mc.id = cp.campaign_id
        WHERE mc.member_id = ${memberId}) AS participants,
      (SELECT COUNT(*) FROM participants_share ps
         JOIN member_campaigns mc ON mc.id = ps.campaign_id
        WHERE mc.member_id = ${memberId}) AS shares,
      (SELECT COALESCE(SUM(ps.clicks), 0) FROM participants_share ps
         JOIN member_campaigns mc ON mc.id = ps.campaign_id
        WHERE mc.member_id = ${memberId}) AS clicks,
      (SELECT COALESCE(SUM(wi.views), 0) FROM campaign_widget_impressions_count wi
         JOIN member_campaigns mc ON mc.id = wi.campaign_id
        WHERE mc.member_id = ${memberId}) AS impressions`;
  const r = rows[0];
  // Plain numbers so the result can be cached.
  return {
    participants: Number(r?.participants ?? 0),
    shares: Number(r?.shares ?? 0),
    clicks: Number(r?.clicks ?? 0),
    impressions: Number(r?.impressions ?? 0),
  };
}

const cachedAccountTotals = unstable_cache(accountTotals, ["dashboard-account-totals"], {
  revalidate: 300,
});

async function getDashboardData(memberId: number, opts: { isAdmin: boolean }) {
  const brands = await prisma.member_urls.findMany({
    where: { member_id: memberId },
    orderBy: { date_added: "desc" },
    take: 10,
  });

  const brandIds = brands.map((b) => b.id);

  // Totals are counted in the database by account. Big accounts (network
  // owners) have 20k+ campaigns, so never load their ids into the app.
  const [brandTotal, campaignTotal, perBrand] = await Promise.all([
    prisma.member_urls.count({ where: { member_id: memberId } }),
    prisma.member_campaigns.count({ where: { member_id: memberId } }),
    brandIds.length
      ? prisma.member_campaigns.groupBy({
          by: ["url_id"],
          where: { member_id: memberId, url_id: { in: brandIds } },
          _count: { _all: true },
        })
      : Promise.resolve([]),
  ]);

  const campaignCountByBrandMap = new Map<number, number>(
    perBrand.map((r) => [r.url_id, r._count._all] as const),
  );
  // Big accounts and admins get totals cached for a few minutes; everyone
  // else sees them live so a new signup shows up right away.
  const t =
    opts.isAdmin || campaignTotal > BIG_ACCOUNT_CAMPAIGNS
      ? await cachedAccountTotals(memberId)
      : await accountTotals(memberId);

  // Build a map of campaign counts by brand
  return {
    brands,
    campaignCountByBrand: campaignCountByBrandMap,
    stats: {
      brands: brandTotal,
      campaigns: campaignTotal,
      participants: t.participants,
      clicks: t.clicks,
      shares: t.shares,
      impressions: t.impressions,
    },
  };
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const memberId = parseInt(session.user.id, 10);
  const userName = session.user.name || session.user.email || "User";
  const invite = session.user.email
    ? await enrollMemberInSignupReferral({
        memberId,
        email: session.user.email,
        name: session.user.name,
      }).catch(() => null)
    : null;

  // First-run activation: send brand-less users into guided onboarding.
  if ((await countMemberBrands(memberId)) === 0) {
    redirect("/onboarding");
  }

  const verifiedRow = await prisma.members.findUnique({
    where: { id: memberId },
    select: { is_verified: true },
  });
  const needsEmailVerify = !verifiedRow?.is_verified && Boolean(session.user.email);

  // Publishing is per brand, so the "Publish your brand" push lives on each
  // brand's own page, not on the account dashboard.

  let data;
  try {
    data = await getDashboardData(memberId, {
      isAdmin: Boolean((session.user as { isAdmin?: boolean }).isAdmin),
    });
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

  const brandEntitlements = await Promise.all(
    brands.map((brand) =>
      getBrandEntitlement(brand.id, { applyAdminBypass: false }),
    ),
  );
  const entitlementByBrandId = new Map(
    brands.map((brand, index) => [brand.id, brandEntitlements[index]] as const),
  );

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
      {needsEmailVerify && session.user.email && (
        <VerifyEmailBanner email={session.user.email} />
      )}
      {/* Welcome Subheader Banner */}
      <div className="subheader flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="mt-1 text-sm text-white/80">
            {stats.campaigns === 0
              ? `Welcome, ${userName}! Let's get your first campaign set up.`
              : `Welcome back, ${userName}! Here is your referral program overview.`}
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap lg:w-auto">
          <Link href="/refer" className="w-full sm:w-auto">
            <Button className="min-h-11 w-full gap-2 border border-white/20 bg-white/20 text-white backdrop-blur-sm hover:bg-white/30 sm:w-auto">
              <ShareIcon className="size-4" />
              Refer Us
            </Button>
          </Link>
          <Link href="/brands/new" className="w-full sm:w-auto">
            <Button className="min-h-11 w-full gap-2 bg-white font-semibold text-brand hover:bg-white/90 sm:w-auto">
              <PlusIcon className="size-4" />
              New Brand
            </Button>
          </Link>
        </div>
      </div>

      {invite && (
        <SignupInviteCard
          shareUrl={invite.shareUrl}
          campaignId={invite.campaignId}
          participantId={invite.participantId}
          compact
        />
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.title} className="stat-card">
              <div className="flex items-center justify-between">
                <div
                  className={`flex size-10 items-center justify-center rounded-lg ${stat.bg}`}
                >
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

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2">
            {brands.map((brand) => {
              const campaignCount = campaignCountByBrand.get(brand.id) || 0;
              const brandEntitlement = entitlementByBrandId.get(brand.id);
              const showBrandUpgrade =
                brandShouldShowUpgradeCta(brandEntitlement);
              const planActive = Boolean(
                brandEntitlement?.isPaid || brandEntitlement?.isGrowth,
              );
              const planLabel = brandEntitlement?.isVnoc
                ? "Network"
                : planActive
                  ? "Active"
                  : "Unpaid";
              return (
                <article
                  key={brand.id}
                  className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-[#ebeef0] bg-white shadow-sm transition hover:border-brand/40 hover:shadow-md"
                >
                  {/*
                    brand-overlay-card forces direct children to position:relative,
                    so wrap internals in one child. Body Link stays absolute and
                    covers empty space; website URL keeps pointer-events-auto.
                  */}
                  <div
                    className="brand-overlay-card relative min-h-[180px] flex-1 cursor-pointer"
                    style={{
                      background: brand.logo_url
                        ? `url(${brand.logo_url}) center/cover no-repeat`
                        : "linear-gradient(135deg, #2c2e3e 0%, #1a1c2d 100%)",
                    }}
                  >
                    <div className="relative flex min-h-[180px] w-full flex-1 flex-col justify-end">
                      <Link
                        href={`/brands/${brand.id}`}
                        className="absolute inset-0 z-[1]"
                        aria-label={`Open ${brand.domain ?? brand.url} dashboard`}
                      />
                      <div className="pointer-events-none relative z-[2] flex flex-col justify-end p-4 sm:p-5">
                        {brand.logo_url ? (
                          <img
                            src={brand.logo_url}
                            alt=""
                            className="mb-3 h-8 w-auto max-w-[60%] object-contain brightness-0 invert opacity-90"
                          />
                        ) : null}
                        <Link
                          href={`/brands/${brand.id}`}
                          className="pointer-events-auto mb-2 block wrap-break-word text-lg font-bold text-white drop-shadow-lg hover:underline sm:text-xl"
                        >
                          {brand.domain}
                        </Link>
                        <a
                          href={brand.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="pointer-events-auto mb-3 inline-flex max-w-full items-center gap-1 truncate text-xs text-white/80 underline-offset-2 hover:text-white hover:underline"
                        >
                          <span className="min-w-0 truncate">{brand.url}</span>
                        </a>

                        <div className="grid grid-cols-3 gap-2 rounded-xl bg-black/35 p-2.5 backdrop-blur-sm">
                          <div className="min-w-0 text-center">
                            <p className="text-base font-bold text-white">
                              {campaignCount}
                            </p>
                            <p className="text-[10px] uppercase tracking-wider text-white/60">
                              Campaigns
                            </p>
                          </div>
                          <div className="min-w-0 text-center">
                            <p className="flex justify-center text-base font-bold text-white">
                              <Badge
                                className={
                                  planActive
                                    ? "border-0 bg-[#28a745]/80 text-[10px] text-white"
                                    : "border-0 bg-white/20 text-[10px] text-white"
                                }
                              >
                                {planLabel}
                              </Badge>
                            </p>
                            <p className="text-[10px] uppercase tracking-wider text-white/60">
                              Plan
                            </p>
                          </div>
                          <div className="min-w-0 text-center">
                            <p className="text-base font-bold text-white">
                              {new Date(brand.date_added).toLocaleDateString(
                                "en-US",
                                { month: "short", year: "2-digit" },
                              )}
                            </p>
                            <p className="text-[10px] uppercase tracking-wider text-white/60">
                              Added
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="relative z-[2] flex flex-col gap-2 border-t border-[#ebeef0] bg-white p-3 sm:flex-row sm:items-center">
                    {showBrandUpgrade && (
                      <BrandUpgradeCta
                        brandId={brand.id}
                        variant="card"
                        className="sm:flex-1"
                      />
                    )}
                    <Link
                      href={`/brands/${brand.id}/campaigns/new`}
                      className={
                        showBrandUpgrade
                          ? "inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl border border-[#ebeef0] bg-[#f7f8fa] px-3 text-sm font-medium text-[#575962] transition hover:border-brand hover:text-brand sm:w-auto sm:shrink-0"
                          : "inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl bg-brand px-3 text-sm font-semibold text-white transition hover:bg-brand-hover"
                      }
                    >
                      <PlusIcon className="size-4 shrink-0" />
                      New campaign
                    </Link>
                  </div>
                </article>
              );
            })}

            {/* Add Brand Card */}
            <Link href="/brands/new" className="group block">
              <div className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#ebeef0] bg-white transition-all group-hover:border-brand group-hover:bg-brand/5">
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
          <Suspense
            fallback={
              <div className="h-72 animate-pulse rounded-2xl border border-gray-100 bg-white motion-reduce:animate-none" />
            }
          >
            <WhatsNew />
          </Suspense>

          {/* Quick Links Grid */}
          <div>
            <h2 className="mb-3 text-lg font-semibold text-[#575962]">
              Quick Links
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
