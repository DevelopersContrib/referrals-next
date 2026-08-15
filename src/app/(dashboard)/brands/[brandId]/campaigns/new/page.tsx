import { auth } from "@/lib/auth";
import { getBrandIfAccessible } from "@/lib/brand-access";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { isMemberGrowthEntitled } from "@/lib/member-subscription";
import { CampaignCreateFlow } from "@/components/campaigns/campaign-create-flow";

interface NewCampaignPageProps {
  params: Promise<{ brandId: string }>;
}

export default async function NewCampaignPage({
  params,
}: NewCampaignPageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const { brandId } = await params;
  const memberId = parseInt(session.user.id, 10);
  const isAdmin = Boolean((session.user as { isAdmin?: boolean }).isAdmin);
  const urlId = parseInt(brandId, 10);

  if (isNaN(urlId)) notFound();

  const brand = await getBrandIfAccessible(urlId, memberId, isAdmin);
  if (!brand) notFound();

  const embedBaseUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "") || "https://referrals.com";

  // Fetch campaign types and reward types
  const [campaignTypes, rewardTypes, paid] = await Promise.all([
    prisma.campaign_types.findMany({ orderBy: { name: "asc" } }),
    prisma.reward_types.findMany({ orderBy: { name: "asc" } }),
    isMemberGrowthEntitled(memberId),
  ]);

  const brandColors =
    brand.brand_colors && typeof brand.brand_colors === "object" && !Array.isArray(brand.brand_colors)
      ? (brand.brand_colors as Record<string, string>)
      : null;

  return (
    <div>
      <div className="mb-6 rounded-xl border border-[#ebeef0] bg-gradient-to-r from-white to-rose-50/30 px-4 py-4 sm:px-5">
        <h1 className="text-2xl font-bold text-[#575962]">Create new campaign</h1>
        <p className="mt-1 text-sm text-[#a7abc3]">
          Pick a use-case template to start fast, or build from scratch — everything
          is prefilled for{" "}
          <span className="font-medium text-[#575962]">{brand.url || "your brand"}</span>.
        </p>
      </div>

      <CampaignCreateFlow
        brandId={brandId}
        brandUrl={brand.url}
        brandSlug={brand.slug}
        brandName={brand.url}
        brandColors={brandColors}
        embedBaseUrl={embedBaseUrl}
        campaignTypes={campaignTypes.map((t) => ({ id: t.id, name: t.name }))}
        rewardTypes={rewardTypes.map((t) => ({
          id: t.id,
          name: t.name,
          has_value: t.has_value ?? false,
        }))}
        initialPublish={paid ? "public" : "private"}
      />
    </div>
  );
}
