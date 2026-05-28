import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { getBrandIfAccessible } from "@/lib/brand-access";
import {
  getShareLeaders,
  getInviteLeaders,
} from "@/lib/brand-stats";
import { BrandDashboardPanel } from "@/components/brands/brand-dashboard-panel";
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
      take: 5,
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

  const logo =
    brand.logo_url && brand.logo_url !== "0" ? brand.logo_url : null;

  return (
    <div className="space-y-6">
      <nav className="flex items-center gap-1.5 text-sm text-[#a7abc3]">
        <Link
          href="/dashboard"
          className="flex items-center gap-1 transition-colors hover:text-brand"
        >
          <HomeIcon className="size-3.5" />
          Home
        </Link>
        <ChevronRightIcon className="size-3" />
        <Link href="/brands" className="transition-colors hover:text-brand">
          Brands
        </Link>
        <ChevronRightIcon className="size-3" />
        <span className="font-medium text-[#575962]">{brand.domain}</span>
      </nav>

      <div className="subheader flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          {logo ? (
            <img
              src={logo}
              alt={brand.domain}
              className="size-12 rounded-lg border border-white/20 bg-white/10 object-contain p-1"
            />
          ) : (
            <div className="flex size-12 items-center justify-center rounded-lg bg-white/20 text-xl font-bold text-white">
              {brand.domain.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="text-xl font-bold text-white">
              {brand.domain} Dashboard
            </h1>
            <a
              href={brand.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-white/70 hover:text-white"
            >
              URL: {brand.url}
              <ExternalLinkIcon className="size-3" />
            </a>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/brands/${brand.id}/edit`}>
            <Button className="gap-2 border border-white/20 bg-white/20 text-white backdrop-blur-sm hover:bg-white/30">
              <SettingsIcon className="size-4" />
              Edit Brand
            </Button>
          </Link>
          <Link href={`/brands/${brand.id}/campaigns/new`}>
            <Button className="gap-2 bg-white font-semibold text-brand hover:bg-white/90">
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
