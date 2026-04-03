import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateApiKey, apiSuccess, apiError, handleCors } from "@/lib/api/helpers";

export async function OPTIONS() {
  return handleCors();
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  try {
    const memberId = await authenticateApiKey(req);
    if (!memberId) {
      return apiError("Invalid or missing API key", 401);
    }

    const { campaignId } = await params;
    const id = parseInt(campaignId, 10);

    const campaign = await prisma.member_campaigns.findFirst({
      where: { id, member_id: memberId },
    });

    if (!campaign) {
      return apiError("Campaign not found", 404);
    }

    // Include widget and reward info
    const [widget, reward, contest] = await Promise.all([
      prisma.campaign_widget.findFirst({ where: { campaign_id: id } }),
      prisma.campaign_reward.findFirst({ where: { campaign_id: id } }),
      prisma.campaign_contest.findFirst({ where: { campaign_id: id } }),
    ]);

    return apiSuccess({
      ...campaign,
      widget,
      reward,
      contest,
    });
  } catch (error) {
    console.error("Get campaign error:", error);
    return apiError("Internal server error", 500);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  try {
    const memberId = await authenticateApiKey(req);
    if (!memberId) {
      return apiError("Invalid or missing API key", 401);
    }

    const { campaignId } = await params;
    const id = parseInt(campaignId, 10);

    const existing = await prisma.member_campaigns.findFirst({
      where: { id, member_id: memberId },
    });

    if (!existing) {
      return apiError("Campaign not found", 404);
    }

    const body = await req.json();
    const {
      name,
      type_id,
      reward_type,
      allow_email,
      goal_type,
      num_signups,
      publish,
      num_visits,
    } = body;

    const updated = await prisma.member_campaigns.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(type_id !== undefined && { type_id }),
        ...(reward_type !== undefined && { reward_type }),
        ...(allow_email !== undefined && { allow_email }),
        ...(goal_type !== undefined && { goal_type }),
        ...(num_signups !== undefined && { num_signups }),
        ...(publish !== undefined && { publish }),
        ...(num_visits !== undefined && { num_visits }),
      },
    });

    return apiSuccess(updated);
  } catch (error) {
    console.error("Update campaign error:", error);
    return apiError("Internal server error", 500);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  try {
    const memberId = await authenticateApiKey(req);
    if (!memberId) {
      return apiError("Invalid or missing API key", 401);
    }

    const { campaignId } = await params;
    const id = parseInt(campaignId, 10);

    const existing = await prisma.member_campaigns.findFirst({
      where: { id, member_id: memberId },
    });

    if (!existing) {
      return apiError("Campaign not found", 404);
    }

    // Delete related records first
    await Promise.all([
      prisma.campaign_widget.deleteMany({ where: { campaign_id: id } }),
      prisma.campaign_reward.deleteMany({ where: { campaign_id: id } }),
      prisma.campaign_contest.deleteMany({ where: { campaign_id: id } }),
      prisma.campaign_coupons.deleteMany({ where: { campaign_id: id } }),
      prisma.campaign_social_content.deleteMany({ where: { campaign_id: id } }),
      prisma.campaign_socials_allowed.deleteMany({ where: { campaign_id: id } }),
    ]);

    await prisma.member_campaigns.delete({ where: { id } });

    return apiSuccess({ message: "Campaign deleted successfully" });
  } catch (error) {
    console.error("Delete campaign error:", error);
    return apiError("Internal server error", 500);
  }
}
