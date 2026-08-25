"use client";

import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CampaignEmailsEditor } from "@/components/campaigns/campaign-emails-editor";

export default function EmailsPage() {
  const router = useRouter();
  const params = useParams();
  const brandId = params.brandId as string;
  const campaignId = params.campaignId as string;

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold">Email Templates</h1>
          <p className="mt-1 text-muted-foreground">
            Customize emails sent to participants
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() =>
            router.push(`/brands/${brandId}/campaigns/${campaignId}`)
          }
          className="w-full sm:w-auto sm:shrink-0"
        >
          Back to Campaign
        </Button>
      </div>

      <CampaignEmailsEditor campaignId={campaignId} />
    </div>
  );
}
