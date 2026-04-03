import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
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
  const id = parseInt(campaignId, 10);

  const campaign = await prisma.member_campaigns.findFirst({
    where: { id, member_id: memberId },
  });
  if (!campaign) redirect(`/brands/${brandId}/campaigns`);

  const totalParticipants = await prisma.campaign_participants.count({
    where: { campaign_id: id },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Participants</h1>
          <p className="mt-1 text-muted-foreground">
            {campaign.name} &middot; {totalParticipants.toLocaleString()} total
            participants
          </p>
        </div>
        <Link href={`/brands/${brandId}/campaigns/${campaignId}`}>
          <Button variant="outline">Back to Campaign</Button>
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
