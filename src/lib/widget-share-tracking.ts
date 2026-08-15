import { prisma } from "@/lib/prisma";
import { encryptShareCode } from "@/lib/encryption";

/** Direct / copy-link social type used in signup share codes (`campaignId:1:participantId`). */
export const SHARE_SOCIAL_DIRECT = 1;

const NAME_TO_ID: Record<string, number> = {
  facebook: 1,
  twitter: 2,
  linkedin: 3,
  email: 4,
  whatsapp: 5,
  copy: 1,
  link: 1,
  direct: 1,
};

export function appOrigin() {
  return (process.env.NEXT_PUBLIC_APP_URL || "https://referrals.com").replace(/\/+$/, "");
}

export function buildTrackedShareUrl(
  campaignId: number,
  socialTypeId: number,
  participantId: number
) {
  const shareCode = encryptShareCode(`${campaignId}:${socialTypeId}:${participantId}`);
  return `${appOrigin()}/t/${shareCode}`;
}

export async function resolveSocialTypeId(
  socialType: string | number
): Promise<number | null> {
  if (typeof socialType === "number" && Number.isFinite(socialType)) return socialType;
  const parsed = parseInt(String(socialType), 10);
  if (!isNaN(parsed)) return parsed;

  const key = String(socialType).toLowerCase();
  if (NAME_TO_ID[key] != null) return NAME_TO_ID[key];

  const social = await prisma.social_types.findFirst({
    where: { name: String(socialType) },
  });
  return social?.id ?? null;
}

/**
 * Ensure a participants_share row exists for tracking clicks on /t/{code}.
 * participantId = campaign_participants.id (not global participants.id).
 */
export async function ensureParticipantShare(opts: {
  campaignId: number;
  participantId: number;
  socialTypeId: number;
  url?: string;
}) {
  const url =
    opts.url ||
    buildTrackedShareUrl(opts.campaignId, opts.socialTypeId, opts.participantId);

  const existing = await prisma.participants_share.findFirst({
    where: {
      campaign_id: opts.campaignId,
      participant_id: opts.participantId,
      social_type: opts.socialTypeId,
    },
  });

  if (existing) {
    if (existing.url !== url) {
      await prisma.participants_share.update({
        where: { id: existing.id },
        data: { url },
      });
    }
    return { id: existing.id, url, created: false };
  }

  const created = await prisma.participants_share.create({
    data: {
      campaign_id: opts.campaignId,
      participant_id: opts.participantId,
      social_type: opts.socialTypeId,
      clicks: 0,
      url,
    },
  });
  return { id: created.id, url, created: true };
}

/** Increment clicks; create the share row first if missing (fixes silent zero-click). */
export async function recordShareClick(opts: {
  campaignId: number;
  participantId: number;
  socialTypeId: number;
}) {
  const ensured = await ensureParticipantShare(opts);
  await prisma.participants_share.update({
    where: { id: ensured.id },
    data: { clicks: { increment: 1 } },
  });
  return ensured;
}
