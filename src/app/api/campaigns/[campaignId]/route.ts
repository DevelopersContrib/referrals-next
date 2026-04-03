import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function verifyCampaignOwnership(campaignId: number, memberId: number) {
  const campaign = await prisma.member_campaigns.findFirst({
    where: { id: campaignId, member_id: memberId },
  });
  return campaign;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { campaignId } = await params;
  const memberId = parseInt(session.user.id, 10);
  const id = parseInt(campaignId, 10);

  try {
    const campaign = await verifyCampaignOwnership(id, memberId);
    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    // Get related data
    const [widget, reward, emailContent, socialContent, campaignType, rewardType] =
      await Promise.all([
        prisma.campaign_widget.findFirst({ where: { campaign_id: id } }),
        prisma.campaign_reward.findFirst({ where: { campaign_id: id } }),
        prisma.campaign_email_content.findMany({ where: { campaign_id: id } }),
        prisma.campaign_social_content.findMany({ where: { campaign_id: id } }),
        prisma.campaign_types.findFirst({ where: { id: campaign.type_id } }),
        prisma.reward_types.findFirst({ where: { id: campaign.reward_type } }),
      ]);

    return NextResponse.json({
      ...campaign,
      widget,
      reward,
      emailContent,
      socialContent,
      typeName: campaignType?.name || "Unknown",
      rewardTypeName: rewardType?.name || "Unknown",
    });
  } catch (error) {
    console.error("Error fetching campaign:", error);
    return NextResponse.json(
      { error: "Failed to fetch campaign" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { campaignId } = await params;
  const memberId = parseInt(session.user.id, 10);
  const id = parseInt(campaignId, 10);

  try {
    const campaign = await verifyCampaignOwnership(id, memberId);
    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      name,
      type_id,
      goal_type,
      num_visits,
      num_signups,
      reward_type,
      reward_notify_subject,
      reward_notify_message,
      campaign_entry_subject,
      campaign_entry_message,
      publish,
      allow_email,
      topbar_link,
      twoway_reward_notify_subject,
      twoway_reward_notify_message,
    } = body;

    const updated = await prisma.member_campaigns.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(type_id !== undefined && { type_id: parseInt(type_id, 10) }),
        ...(goal_type !== undefined && { goal_type }),
        ...(num_visits !== undefined && {
          num_visits: num_visits ? parseInt(num_visits, 10) : null,
        }),
        ...(num_signups !== undefined && {
          num_signups: num_signups ? parseInt(num_signups, 10) : null,
        }),
        ...(reward_type !== undefined && {
          reward_type: parseInt(reward_type, 10),
        }),
        ...(reward_notify_subject !== undefined && { reward_notify_subject }),
        ...(reward_notify_message !== undefined && { reward_notify_message }),
        ...(campaign_entry_subject !== undefined && { campaign_entry_subject }),
        ...(campaign_entry_message !== undefined && { campaign_entry_message }),
        ...(publish !== undefined && { publish }),
        ...(allow_email !== undefined && { allow_email }),
        ...(topbar_link !== undefined && { topbar_link }),
        ...(twoway_reward_notify_subject !== undefined && {
          twoway_reward_notify_subject,
        }),
        ...(twoway_reward_notify_message !== undefined && {
          twoway_reward_notify_message,
        }),
      },
    });

    // Update widget if provided
    if (body.widget) {
      await prisma.campaign_widget.updateMany({
        where: { campaign_id: id },
        data: body.widget,
      });
    }

    // Update reward if provided
    if (body.reward) {
      await prisma.campaign_reward.updateMany({
        where: { campaign_id: id },
        data: body.reward,
      });
    }

    // Update email content if provided
    if (body.emailContent) {
      for (const email of body.emailContent) {
        if (email.id) {
          await prisma.campaign_email_content.update({
            where: { id: email.id },
            data: { subject: email.subject, template: email.template },
          });
        } else {
          await prisma.campaign_email_content.create({
            data: {
              campaign_id: id,
              subject: email.subject,
              template: email.template,
            },
          });
        }
      }
    }

    // Add coupons if provided
    if (body.coupons && Array.isArray(body.coupons)) {
      const couponData = body.coupons.map((code: string) => ({
        campaign_id: id,
        code,
        is_used: false,
      }));
      await prisma.campaign_coupons.createMany({ data: couponData });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating campaign:", error);
    return NextResponse.json(
      { error: "Failed to update campaign" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { campaignId } = await params;
  const memberId = parseInt(session.user.id, 10);
  const id = parseInt(campaignId, 10);

  try {
    const campaign = await verifyCampaignOwnership(id, memberId);
    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    // Delete related records first
    await Promise.all([
      prisma.campaign_widget.deleteMany({ where: { campaign_id: id } }),
      prisma.campaign_reward.deleteMany({ where: { campaign_id: id } }),
      prisma.campaign_email_content.deleteMany({ where: { campaign_id: id } }),
      prisma.campaign_social_content.deleteMany({ where: { campaign_id: id } }),
      prisma.campaign_coupons.deleteMany({ where: { campaign_id: id } }),
      prisma.participants_share.deleteMany({ where: { campaign_id: id } }),
      prisma.campaign_participants.deleteMany({ where: { campaign_id: id } }),
      prisma.campaign_widget_impressions.deleteMany({
        where: { campaign_id: id },
      }),
      prisma.campaign_widget_impressions_count.deleteMany({
        where: { campaign_id: id },
      }),
    ]);

    await prisma.member_campaigns.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting campaign:", error);
    return NextResponse.json(
      { error: "Failed to delete campaign" },
      { status: 500 }
    );
  }
}
