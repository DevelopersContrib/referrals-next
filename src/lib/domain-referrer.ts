import { prisma } from "@/lib/prisma";
import { encryptShareCode } from "@/lib/encryption";
import { normalizeDomain } from "@/lib/domain-brand";

/**
 * Domain-to-domain referrals.
 *
 * A "domain referrer" is a normal `campaign_participants` row that represents
 * a whole DOMAIN (not a person) acting as the referrer inside another domain's
 * campaign. It reuses the exact participant + share-code + click-tracking +
 * reward machinery — no new tables. The synthetic identity is
 * `<domain>@network.referrals.com` so it is stable and get-or-createable.
 *
 * Lazy by design: the row is only created the first time a real referral link
 * between two domains is minted (so no 20k×20k explosion — only actual cross
 * links create rows).
 */
export const NETWORK_EMAIL_DOMAIN = "network.referrals.com";

export interface DomainReferrerLink {
  campaignId: number;
  participantId: number;
  code: string;
  url: string;
}

export function networkIdentity(domain: string): string {
  return `${normalizeDomain(domain)}@${NETWORK_EMAIL_DOMAIN}`;
}

export async function getOrCreateDomainReferrer(
  fromDomain: string,
  toCampaignId: number,
  root = process.env.NEXT_PUBLIC_APP_URL || "https://referrals.com"
): Promise<DomainReferrerLink> {
  const from = normalizeDomain(fromDomain);
  const email = networkIdentity(from);

  // Existing referrer participant for this (campaign, domain)?
  let participant = await prisma.campaign_participants.findFirst({
    where: { campaign_id: toCampaignId, email },
  });

  if (!participant) {
    let global = await prisma.participants.findFirst({ where: { email } });
    if (!global) {
      global = await prisma.participants.create({ data: { email, name: from } });
    }
    participant = await prisma.campaign_participants.create({
      data: {
        campaign_id: toCampaignId,
        email,
        name: from,
        participant_id: global.id,
        signup_url: `https://${from}`,
      },
    });
  }

  const code = encryptShareCode(`${toCampaignId}:1:${participant.id}`);
  const url = `${root.replace(/\/+$/, "")}/t/${code}`;
  return { campaignId: toCampaignId, participantId: participant.id, code, url };
}

/** Resolve a target domain to its active public campaign (or null if not in network). */
export async function resolveTargetCampaign(toDomain: string) {
  const to = normalizeDomain(toDomain);
  const brand = await prisma.member_urls.findFirst({ where: { domain: to } });
  if (!brand) return null;
  const campaign = await prisma.member_campaigns.findFirst({
    where: { url_id: brand.id, publish: "public" },
    orderBy: { date_added: "desc" },
  });
  if (!campaign) return null;
  return { brand, campaign };
}
