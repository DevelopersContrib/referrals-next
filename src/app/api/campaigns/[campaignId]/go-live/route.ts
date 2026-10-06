import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DEFAULT_PAID_PLAN_ID } from "@/lib/billing-constants";
import { isBrandGrowthEntitled } from "@/lib/member-subscription";
import { publishCampaignGoLive } from "@/lib/campaign-live";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ campaignId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { campaignId } = await params;
  const memberId = parseInt(session.user.id, 10);
  const id = parseInt(campaignId, 10);
  if (Number.isNaN(id)) {
    return NextResponse.json({ error: "Invalid campaign ID" }, { status: 400 });
  }

  const campaign = await prisma.member_campaigns.findFirst({
    where: { id, member_id: memberId },
    select: { id: true, url_id: true },
  });
  if (!campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  const brandId = campaign.url_id;
  const entitled = await isBrandGrowthEntitled(brandId);
  if (!entitled) {
    return NextResponse.json(
      {
        error: "Pay $9/mo for this brand to go live.",
        code: "REQUIRES_SUBSCRIPTION",
        checkoutUrl: `/billing/plan/${DEFAULT_PAID_PLAN_ID}?brandId=${brandId}&goLiveCampaign=${id}`,
      },
      { status: 402 },
    );
  }

  const result = await publishCampaignGoLive({
    memberId,
    campaignId: id,
    brandId,
  });
  if (!result.ok) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, publish: "public" });
}
