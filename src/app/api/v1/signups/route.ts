import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateApiKey, apiSuccess, apiError, handleCors } from "@/lib/api/helpers";
import { syncParticipantToMailchimp } from "@/lib/integrations/mailchimp-sync";
import { ZapierIntegration } from "@/lib/integrations/zapier";
import {
  assertCanAcceptParticipant,
  participantCapApiError,
} from "@/lib/member-subscription";

export async function OPTIONS() {
  return handleCors();
}

export async function POST(req: NextRequest) {
  try {
    const memberId = await authenticateApiKey(req);
    if (!memberId) {
      return apiError("Invalid or missing API key", 401);
    }

    const body = await req.json();
    const { campaign_id, email, name, referral_url, ip_address } = body;

    if (!campaign_id || !email || !name) {
      return apiError("campaign_id, email, and name are required", 400);
    }

    // Verify campaign belongs to the member
    const campaign = await prisma.member_campaigns.findFirst({
      where: { id: campaign_id, member_id: memberId },
      select: { id: true, url_id: true },
    });

    if (!campaign) {
      return apiError("Campaign not found or access denied", 404);
    }

    const normalizedEmail = String(email).toLowerCase().trim();

    // Check for duplicate participant
    const existing = await prisma.campaign_participants.findFirst({
      where: { campaign_id, email: normalizedEmail },
    });

    if (existing) {
      return apiError("Participant already signed up for this campaign", 409);
    }

    const cap = await assertCanAcceptParticipant(campaign.url_id, {
      email: normalizedEmail,
    });
    if (!cap.ok) {
      return participantCapApiError();
    }

    const participant = await prisma.campaign_participants.create({
      data: {
        campaign_id,
        email: normalizedEmail,
        name,
        referral_url: referral_url || null,
        ip_address: ip_address || null,
        date_signedup: new Date(),
      },
    });

    void ZapierIntegration.fireSignupEvent(memberId, {
      id: participant.id,
      email: participant.email,
      name: participant.name,
      campaign_id: participant.campaign_id,
      date_signedup: participant.date_signedup,
    }).catch((e) => console.error("Zapier webhook fire error:", e));

    void syncParticipantToMailchimp(
      campaign_id,
      participant.email,
      participant.name
    );

    return apiSuccess(participant, 201);
  } catch (error) {
    console.error("Signup error:", error);
    return apiError("Internal server error", 500);
  }
}
