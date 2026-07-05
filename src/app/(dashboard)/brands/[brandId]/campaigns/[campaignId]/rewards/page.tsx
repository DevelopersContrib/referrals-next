import { auth } from "@/lib/auth";
import { getCampaignIfAccessible } from "@/lib/brand-access";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CampaignRewardSettings } from "@/components/campaigns/campaign-reward-settings";

interface RewardsPageProps {
  params: Promise<{ brandId: string; campaignId: string }>;
}

export default async function RewardsPage({ params }: RewardsPageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const { brandId, campaignId } = await params;
  const memberId = parseInt(session.user.id, 10);
  const isAdmin = Boolean((session.user as { isAdmin?: boolean }).isAdmin);
  const urlId = parseInt(brandId, 10);
  const id = parseInt(campaignId, 10);

  if (isNaN(urlId) || isNaN(id)) notFound();

  const campaign = await getCampaignIfAccessible(id, urlId, memberId, isAdmin);
  if (!campaign) notFound();

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Rewards & Coupons</h1>
          <p className="mt-1 text-muted-foreground">{campaign.name}</p>
        </div>
        <Link href={`/brands/${brandId}/campaigns/${campaignId}`}>
          <Button variant="outline">Back to Campaign</Button>
        </Link>
      </div>

      <div className="mt-6">
        <CampaignRewardSettings campaignId={campaignId} />
      </div>
    </div>
  );
}
