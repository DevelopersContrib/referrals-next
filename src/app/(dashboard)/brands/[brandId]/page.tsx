import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { getBrandIfAccessible } from "@/lib/brand-access";
import { getShareLeaders, getInviteLeaders } from "@/lib/brand-stats";
import { BrandDashboardPanel } from "@/components/brands/brand-dashboard-panel";
import { BrandLogo } from "@/components/brands/brand-logo";
import { Button } from "@/components/ui/button";
import {
  PlusIcon,
  HomeIcon,
  ChevronRightIcon,
  SettingsIcon,
  ExternalLinkIcon,
} from "lucide-react";

interface PageProps {
  params: Promise<{ brandId: string }>;
}

export default async function BrandDashboardPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const memberId = parseInt(session.user.id, 10);
  const isAdmin = Boolean((session.user as { isAdmin?: boolean }).isAdmin);
  const { brandId } = await params;
  const id = parseInt(brandId, 10);

  if (isNaN(id)) notFound();

  const brand = await getBrandIfAccessible(id, memberId, isAdmin);
  if (!brand) notFound();

  const [campaigns, shareLeaders, inviteLeaders] = await Promise.all([
    prisma.member_campaigns.findMany({
      where: { url_id: id },
      orderBy: { id: "desc" },
      select: {
        id: true,
        name: true,
        date_added: true,
        publish: true,
      },
    }),
    getShareLeaders(id),
    getInviteLeaders(id),
  ]);

  const logo = brand.logo_url && brand.logo_url !== "0" ? brand.logo_url : null;

  return (
    <div className="min-w-0 space-y-6">
      <nav className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-[#a7abc3]">
        <Link
          href="/dashboard"
          className="flex items-center gap-1 transition-colors hover:text-brand"
        >
          <HomeIcon className="size-3.5" />
          Home
        </Link>
        <ChevronRightIcon className="size-3 shrink-0" />
        <Link href="/brands" className="transition-colors hover:text-brand">
          Brands
        </Link>
        <ChevronRightIcon className="size-3 shrink-0" />
        <span className="min-w-0 max-w-full truncate font-medium text-[#575962]">
          {brand.domain}
        </span>
      </nav>

      <div className="subheader flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <BrandLogo
            domain={brand.domain}
            logoUrl={brand.logo_url}
            imgClassName="size-12 shrink-0 rounded-lg border border-white/20 bg-white/10 object-contain p-1"
            fallbackClassName="flex size-12 shrink-0 items-center justify-center rounded-lg bg-white/20 text-xl font-bold text-white"
          />
          <div className="min-w-0">
            <h1 className="wrap-break-word text-xl font-bold text-white">
              {brand.domain} Dashboard
            </h1>
            <a
              href={brand.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-w-0 items-center gap-1 text-sm text-white/70 hover:text-white"
            >
              <span className="min-w-0 flex-1 truncate">URL: {brand.url}</span>
              <ExternalLinkIcon className="size-3 shrink-0" />
            </a>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 lg:shrink-0">
          <Link href={`/brands/${brand.id}/edit`} className="w-full sm:w-auto">
            <Button className="w-full gap-2 border border-white/20 bg-white/20 text-white backdrop-blur-sm hover:bg-white/30 sm:w-auto">
              <SettingsIcon className="size-4" />
              Edit Brand
            </Button>
          </Link>
          <Link
            href={`/brands/${brand.id}/campaigns/new`}
            className="w-full sm:w-auto"
          >
            <Button className="w-full gap-2 bg-white font-semibold text-brand hover:bg-white/90 sm:w-auto">
              <PlusIcon className="size-4" />
              Create Campaign
            </Button>
          </Link>
        </div>
      </div>

      <BrandDashboardPanel
        brand={{
          id: brand.id,
          domain: brand.domain,
          url: brand.url,
          logo_url: logo,
        }}
        shareLeaders={shareLeaders}
        inviteLeaders={inviteLeaders}
        campaigns={campaigns.map((c) => ({
          ...c,
          date_added: c.date_added.toISOString(),
        }))}
      />
    </div>
  );
}
