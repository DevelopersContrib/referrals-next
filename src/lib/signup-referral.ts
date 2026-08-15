import { prisma } from "@/lib/prisma";
import {
  SHARE_SOCIAL_DIRECT,
  buildTrackedShareUrl,
  ensureParticipantShare,
} from "@/lib/widget-share-tracking";

export function referralsSignupCampaignId() {
  const id = Number(process.env.REFERRALS_SIGNUP_CAMPAIGN || 77);
  return Number.isFinite(id) && id > 0 ? id : 77;
}

export type SignupReferralInvite = {
  campaignId: number;
  participantId: number;
  shareUrl: string;
  created: boolean;
};

/**
 * Enroll a new (or existing) member as a participant in the platform
 * signup-referral campaign and return their tracked invite URL.
 *
 * Idempotent by campaign + email. Does not overwrite an existing invited_by.
 */
export async function enrollMemberInSignupReferral(opts: {
  memberId: number;
  email: string;
  name?: string | null;
  invitedBy?: number | null;
}): Promise<SignupReferralInvite | null> {
  const campaignId = referralsSignupCampaignId();
  const email = opts.email.trim().toLowerCase();
  if (!email) return null;

  const campaign = await prisma.member_campaigns.findUnique({
    where: { id: campaignId },
    select: { id: true },
  });
  if (!campaign) {
    console.error("[signup-referral] campaign missing:", campaignId);
    return null;
  }

  const name = (opts.name || email.split("@")[0] || "Member").slice(0, 100);
  const invitedBy =
    opts.invitedBy && Number.isFinite(opts.invitedBy) && opts.invitedBy > 0
      ? opts.invitedBy
      : null;

  let participant = await prisma.campaign_participants.findFirst({
    where: { campaign_id: campaignId, email },
  });
  let created = false;

  if (!participant) {
    participant = await prisma.campaign_participants.create({
      data: {
        campaign_id: campaignId,
        email,
        name,
        participant_id: opts.memberId,
        invited_by: invitedBy,
        referral_url: null,
      },
    });
    created = true;
  } else if (!participant.participant_id) {
    participant = await prisma.campaign_participants.update({
      where: { id: participant.id },
      data: { participant_id: opts.memberId },
    });
  }

  const shareUrl = buildTrackedShareUrl(
    campaignId,
    SHARE_SOCIAL_DIRECT,
    participant.id
  );

  await ensureParticipantShare({
    campaignId,
    participantId: participant.id,
    socialTypeId: SHARE_SOCIAL_DIRECT,
    url: shareUrl,
  });

  if (participant.referral_url !== shareUrl) {
    await prisma.campaign_participants.update({
      where: { id: participant.id },
      data: { referral_url: shareUrl.slice(0, 250) },
    });
  }

  return {
    campaignId,
    participantId: participant.id,
    shareUrl,
    created,
  };
}

export async function getSignupReferralInviteByEmail(
  email: string
): Promise<SignupReferralInvite | null> {
  const member = await prisma.members.findFirst({
    where: { email },
    select: { id: true, email: true, name: true },
  });
  if (!member) return null;
  return enrollMemberInSignupReferral({
    memberId: member.id,
    email: member.email,
    name: member.name,
  });
}
