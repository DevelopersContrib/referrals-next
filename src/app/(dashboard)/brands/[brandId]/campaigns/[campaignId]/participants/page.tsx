import { auth } from "@/lib/auth";
import { getCampaignIfAccessible } from "@/lib/brand-access";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ParticipantTable } from "@/components/campaigns/participant-table";

interface ParticipantsPageProps {
  params: Promise<{ brandId: string; campaignId: string }>;
}

export default async function ParticipantsPage({
  params,
}: ParticipantsPageProps) {
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

  const totalParticipants = await prisma.campaign_participants.count({
    where: { campaign_id: id },
  });

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold">Participants</h1>
          <p className="mt-1 wrap-break-word text-muted-foreground">
            {campaign.name} &middot; {totalParticipants.toLocaleString()} total
            participants
          </p>
        </div>
        <Link
          href={`/brands/${brandId}/campaigns/${campaignId}`}
          className="w-full sm:w-auto sm:shrink-0"
        >
          <Button variant="outline" className="w-full sm:w-auto">
            Back to Campaign
          </Button>
        </Link>
      </div>

      <div className="mt-6">
        <ParticipantTable
          campaignId={campaignId}
          brandId={brandId}
          showExport
        />
      </div>
    </div>
  );
}
