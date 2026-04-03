import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateApiKey, apiSuccess, apiError, handleCors } from "@/lib/api/helpers";

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
    });

    if (!campaign) {
      return apiError("Campaign not found or access denied", 404);
    }

    // Check for duplicate participant
    const existing = await prisma.campaign_participants.findFirst({
      where: { campaign_id, email },
    });

    if (existing) {
      return apiError("Participant already signed up for this campaign", 409);
    }

    const participant = await prisma.campaign_participants.create({
      data: {
        campaign_id,
        email,
        name,
        referral_url: referral_url || null,
        ip_address: ip_address || null,
        date_signedup: new Date(),
      },
    });

    // Fire Zapier webhook if configured
    const zapierHook = await prisma.member_zapier.findFirst({
      where: {
        member_id: memberId,
        campaign_id,
      },
    });

    if (zapierHook) {
      try {
        await fetch(zapierHook.link, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event: "participant.signup",
            participant: {
              id: participant.id,
              email: participant.email,
              name: participant.name,
              campaign_id: participant.campaign_id,
              date_signedup: participant.date_signedup,
            },
          }),
        });
      } catch (e) {
        console.error("Zapier webhook fire error:", e);
      }
    }

    return apiSuccess(participant, 201);
  } catch (error) {
    console.error("Signup error:", error);
    return apiError("Internal server error", 500);
  }
}
