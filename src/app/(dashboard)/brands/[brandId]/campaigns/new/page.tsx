import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { isMemberOnPaidPlan } from "@/lib/member-subscription";
import { CampaignWizard } from "@/components/campaigns/campaign-wizard";

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

  // Verify brand ownership
  const brand = await prisma.member_urls.findFirst({
    where: { id: parseInt(brandId, 10), member_id: memberId },
  });
  if (!brand) redirect("/dashboard");

  const embedBaseUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "") || "https://referrals.com";

  // Fetch campaign types and reward types
  const [campaignTypes, rewardTypes, paid] = await Promise.all([
    prisma.campaign_types.findMany({ orderBy: { name: "asc" } }),
    prisma.reward_types.findMany({ orderBy: { name: "asc" } }),
    isMemberOnPaidPlan(memberId),
  ]);

  return (
    <div>
      <div className="mb-6 rounded-xl border border-[#ebeef0] bg-gradient-to-r from-white to-rose-50/30 px-4 py-4 sm:px-5">
        <h1 className="text-2xl font-bold text-[#575962]">Create new campaign</h1>
        <p className="mt-1 text-sm text-[#a7abc3]">
          Step through basics, goal, and creative — then copy embed code for{" "}
          <span className="font-medium text-[#575962]">{brand.url || "your brand"}</span>.
        </p>
      </div>

      <CampaignWizard
        brandId={brandId}
        brandUrl={brand.url}
        brandSlug={brand.slug}
        embedBaseUrl={embedBaseUrl}
        campaignTypes={campaignTypes.map((t) => ({ id: t.id, name: t.name }))}
        rewardTypes={rewardTypes.map((t) => ({ id: t.id, name: t.name }))}
        initialPublish={paid ? "public" : "private"}
      />
    </div>
  );
}
