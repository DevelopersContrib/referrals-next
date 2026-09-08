import { prisma } from "@/lib/prisma";
import { normalizeDomain } from "@/lib/domain-brand";
import { tryRewardReferrerAfterSignup } from "@/lib/campaign-reward";
import { SHARE_SOCIAL_DIRECT } from "@/lib/widget-share-tracking";

export type ResolvedNetworkRef = {
  campaignId: number;
  referrerParticipantId: number;
  socialType: number;
  inviteeParticipantId?: number;
};

export type NetworkConversionResult =
  | {
      ok: true;
      participantId: number;
      created: boolean;
      reward?: Awaited<ReturnType<typeof tryRewardReferrerAfterSignup>>;
      message: string;
    }
  | { ok: false; error: "invalid_ref" | "domain_mismatch" | "incompatible_campaign" };

export async function resolveNetworkRef(
  ref: string | number,
): Promise<ResolvedNetworkRef | null> {
  const refStr = String(ref).trim();
  if (!refStr) return null;

  if (/^\d+$/.test(refStr)) {
    const referrerParticipantId = parseInt(refStr, 10);
    const referrer = await prisma.campaign_participants.findUnique({
      where: { id: referrerParticipantId },
      select: { id: true, campaign_id: true, invited_social: true },
    });
    if (!referrer) return null;
    return {
      campaignId: referrer.campaign_id,
      referrerParticipantId: referrer.id,
      socialType: referrer.invited_social ?? SHARE_SOCIAL_DIRECT,
    };
  }

  let decoded: string;
  try {
    decoded = Buffer.from(decodeURIComponent(refStr), "base64").toString("utf-8");
  } catch {
    try {
      decoded = Buffer.from(refStr, "base64").toString("utf-8");
    } catch {
      return null;
    }
  }

  const parts = decoded.split(":");
  if (parts.length < 3) return null;

  const campaignId = parseInt(parts[0], 10);
  const socialType = parseInt(parts[1], 10);
  const referrerParticipantId = parseInt(parts[2], 10);
  const inviteeParticipantId = parts[3] ? parseInt(parts[3], 10) : undefined;

  if (
    !Number.isFinite(campaignId) ||
    !Number.isFinite(socialType) ||
    !Number.isFinite(referrerParticipantId)
  ) {
    return null;
  }

  const referrer = await prisma.campaign_participants.findFirst({
    where: { id: referrerParticipantId, campaign_id: campaignId },
    select: { id: true },
  });
  if (!referrer) return null;

  return {
    campaignId,
    referrerParticipantId,
    socialType,
    inviteeParticipantId: Number.isFinite(inviteeParticipantId)
      ? inviteeParticipantId
      : undefined,
  };
}

export async function domainMatchesCampaignBrand(
  campaignId: number,
  domain: string,
): Promise<boolean> {
  const normalized = normalizeDomain(domain);
  if (!normalized) return false;

  const campaign = await prisma.member_campaigns.findUnique({
    where: { id: campaignId },
    select: { url_id: true },
  });
  if (!campaign) return false;

  const brand = await prisma.member_urls.findUnique({
    where: { id: campaign.url_id },
    select: { domain: true },
  });
  if (!brand?.domain) return false;

  const brandDomain = normalizeDomain(brand.domain);
  return (
    brandDomain === normalized ||
    brandDomain === normalizeDomain(`www.${normalized}`) ||
    normalized === normalizeDomain(`www.${brandDomain}`)
  );
}

/**
 * Attribute a lead to a referrer and fire rewards when the goal is met.
 * Same participant rules as v1/signups/referral. Does not enforce owner caps.
 */
export async function recordNetworkConversion(opts: {
  email: string;
  name: string;
  resolved: ResolvedNetworkRef;
  domain?: string;
  ip?: string | null;
}): Promise<NetworkConversionResult> {
  const { resolved } = opts;
  const normalizedEmail = opts.email.toLowerCase().trim();

  if (opts.domain) {
    const matches = await domainMatchesCampaignBrand(
      resolved.campaignId,
      opts.domain,
    );
    if (!matches) {
      return { ok: false, error: "domain_mismatch" };
    }
  }

  const campaign = await prisma.member_campaigns.findFirst({
    where: { id: resolved.campaignId },
  });
  if (!campaign || campaign.goal_type !== "signup") {
    return { ok: false, error: "incompatible_campaign" };
  }

  const existing = await prisma.campaign_participants.findFirst({
    where: { campaign_id: resolved.campaignId, email: normalizedEmail },
  });

  let participantId: number;
  let created = false;

  if (!existing) {
    const row = await prisma.campaign_participants.create({
      data: {
        name: opts.name,
        email: normalizedEmail,
        campaign_id: resolved.campaignId,
        invited_by: resolved.referrerParticipantId,
        invited_social: resolved.socialType,
        ip_address: opts.ip ?? null,
      },
    });
    participantId = row.id;
    created = true;
  } else if (existing.invited_by === null) {
    await prisma.campaign_participants.update({
      where: { id: existing.id },
      data: {
        name: opts.name,
        invited_by: resolved.referrerParticipantId,
        invited_social: resolved.socialType,
        ip_address: opts.ip ?? null,
      },
    });
    participantId = existing.id;
    created = true;
  } else if (existing.invited_by === resolved.referrerParticipantId) {
    participantId = existing.id;
  } else {
    return {
      ok: true,
      participantId: existing.id,
      created: false,
      message: "Conversion already attributed",
    };
  }

  const reward = await tryRewardReferrerAfterSignup({
    campaign,
    referrerParticipantId: resolved.referrerParticipantId,
    socialType: resolved.socialType,
    inviteeParticipantId:
      campaign.reward_invited && resolved.inviteeParticipantId
        ? resolved.inviteeParticipantId
        : campaign.reward_invited
          ? participantId
          : undefined,
  });

  return {
    ok: true,
    participantId,
    created,
    reward: reward ?? undefined,
    message: created ? "Conversion recorded" : "Conversion already recorded",
  };
}
