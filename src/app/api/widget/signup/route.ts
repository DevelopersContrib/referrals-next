import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendCampaignEntryEmail } from "@/lib/campaign-email";
import { syncParticipantToMailchimp } from "@/lib/integrations/mailchimp-sync";
import { ZapierIntegration } from "@/lib/integrations/zapier";
import {
  canMemberAcceptParticipant,
  participantCapResponse,
} from "@/lib/member-subscription";
import {
  SHARE_SOCIAL_DIRECT,
  buildTrackedShareUrl,
  ensureParticipantShare,
} from "@/lib/widget-share-tracking";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

/**
 * POST /api/widget/signup
 *
 * Register a participant in a campaign.
 * Body: { campaignId, email, name, referrerId? }
 * Returns participant ID and share links.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { campaignId, email, name, referrerId } = body;

    const campaignIdNum = Number(campaignId);
    if (!campaignIdNum || !email) {
      return NextResponse.json(
        { error: "campaignId and email are required" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Check campaign exists
    const campaign = await prisma.member_campaigns.findUnique({
      where: { id: campaignIdNum },
    });
    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    // Check if participant already exists for this campaign
    let participant = await prisma.campaign_participants.findFirst({
      where: {
        campaign_id: campaignIdNum,
        email: email.toLowerCase().trim(),
      },
    });

    let isNewParticipant = false;

    if (!participant) {
      const cap = await canMemberAcceptParticipant(campaign.member_id);
      if (!cap.ok) {
        return participantCapResponse(corsHeaders);
      }

      isNewParticipant = true;
      // Find or create the global participant record
      let globalParticipant = await prisma.participants.findFirst({
        where: { email: email.toLowerCase().trim() },
      });

      if (!globalParticipant) {
        globalParticipant = await prisma.participants.create({
          data: {
            email: email.toLowerCase().trim(),
            name: name || email.split("@")[0],
          },
        });
      }

      // Determine invited_by and invited_social
      let invitedBy: number | undefined;
      let invitedSocial: number | undefined;

      if (referrerId) {
        const referrer = await prisma.campaign_participants.findFirst({
          where: {
            campaign_id: campaignIdNum,
            id: Number(referrerId),
          },
        });
        if (referrer) {
          invitedBy = referrer.id;
          // Default social type for direct referral
          invitedSocial = SHARE_SOCIAL_DIRECT;
        }
      }

      // Get IP and signup URL from request
      const ip =
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        request.headers.get("x-real-ip") ||
        undefined;
      const refererUrl = request.headers.get("referer") || undefined;

      // Create campaign participant
      participant = await prisma.campaign_participants.create({
        data: {
          campaign_id: campaignIdNum,
          email: email.toLowerCase().trim(),
          name: name || email.split("@")[0],
          participant_id: globalParticipant.id,
          invited_by: invitedBy,
          invited_social: invitedSocial,
          ip_address: ip,
          signup_url: refererUrl,
        },
      });
    }

    // Ensure share row exists so /t/{code} clicks are not silently dropped
    const shareUrl = buildTrackedShareUrl(
      campaignIdNum,
      SHARE_SOCIAL_DIRECT,
      participant.id
    );
    await ensureParticipantShare({
      campaignId: campaignIdNum,
      participantId: participant.id,
      socialTypeId: SHARE_SOCIAL_DIRECT,
      url: shareUrl,
    });

    if (isNewParticipant) {
      try {
        const emailContent = await prisma.campaign_email_content.findFirst({
          where: { campaign_id: campaignIdNum },
        });
        const brand = campaign.url_id
          ? await prisma.member_urls.findUnique({
              where: { id: campaign.url_id },
              select: { domain: true },
            })
          : null;

        await sendCampaignEntryEmail({
          to: participant.email,
          campaignName: campaign.name,
          participantName: participant.name,
          referralUrl: shareUrl,
          entrySubject: campaign.campaign_entry_subject,
          entryMessage: campaign.campaign_entry_message,
          customTemplate: emailContent,
          fromName: brand?.domain || campaign.name,
        });
      } catch (emailError) {
        console.error("[widget/signup] Failed to send entry email:", emailError);
      }

      void syncParticipantToMailchimp(
        campaignIdNum,
        participant.email,
        participant.name
      );

      void ZapierIntegration.fireSignupEvent(campaign.member_id, {
        id: participant.id,
        email: participant.email,
        name: participant.name,
        campaign_id: participant.campaign_id,
        date_signedup: participant.date_signedup,
      }).catch((err) =>
        console.error("[widget/signup] Zapier webhook error:", err)
      );
    }

    // Get referral stats
    const referralCount = await prisma.campaign_participants.count({
      where: {
        campaign_id: campaignIdNum,
        invited_by: participant.id,
      },
    });

    // Get click stats
    const shares = await prisma.participants_share.findMany({
      where: {
        campaign_id: campaignIdNum,
        participant_id: participant.id,
      },
    });
    const clickCount = shares.reduce((sum, s) => sum + (s.clicks || 0), 0);

    // Check goal
    const goalMet = checkGoal(campaign, referralCount, clickCount);

    return NextResponse.json(
      {
        success: true,
        participantId: participant.id,
        shareUrl,
        referralCount,
        clickCount,
        goalMet,
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("[widget/signup] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: corsHeaders }
    );
  }
}

function checkGoal(
  campaign: { goal_type: string | null | undefined; num_visits: number | null | undefined; num_signups: number | null | undefined },
  referralCount: number,
  clickCount: number
): boolean {
  if (!campaign.goal_type) return false;

  if (campaign.goal_type === "visit" && campaign.num_visits) {
    return clickCount >= campaign.num_visits;
  }
  if (campaign.goal_type === "signup" && campaign.num_signups) {
    return referralCount >= campaign.num_signups;
  }
  return false;
}
