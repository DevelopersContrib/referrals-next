import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
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

  // Fetch campaign types and reward types
  const [campaignTypes, rewardTypes] = await Promise.all([
    prisma.campaign_types.findMany({ orderBy: { name: "asc" } }),
    prisma.reward_types.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Create New Campaign</h1>
        <p className="mt-1 text-muted-foreground">
          Set up a new referral campaign for {brand.url || "your brand"}
        </p>
      </div>

      <CampaignWizard
        brandId={brandId}
        brandUrl={brand.url}
        campaignTypes={campaignTypes.map((t) => ({ id: t.id, name: t.name }))}
        rewardTypes={rewardTypes.map((t) => ({ id: t.id, name: t.name }))}
      />
    </div>
  );
}
