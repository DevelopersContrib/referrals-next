import { encryptShareCode, decryptShareCode, parseShareCode } from "../src/lib/encryption";
import {
  ensureParticipantShare,
  recordShareClick,
  buildTrackedShareUrl,
  SHARE_SOCIAL_DIRECT,
} from "../src/lib/widget-share-tracking";
import { getMemberEntitlement, trialExpiryFrom, TRIAL_PLAN_ID } from "../src/lib/member-subscription";
import { prisma } from "../src/lib/prisma";

async function main() {
  const code = encryptShareCode("42:1:99");
  const parsed = parseShareCode(decryptShareCode(code));
  console.log("encrypt ok", parsed);

  const paid = await prisma.members.findFirst({
    where: { plan_id: { gt: 1 }, plan_expiry: { gt: new Date() } },
    select: { id: true },
  });
  const free = await prisma.members.findFirst({
    where: { OR: [{ plan_id: null }, { plan_id: { lte: 1 } }, { plan_expiry: null }] },
    select: { id: true },
  });
  if (paid) console.log("paid entitlement", await getMemberEntitlement(paid.id));
  if (free) console.log("free entitlement", await getMemberEntitlement(free.id));

  const cp = await prisma.campaign_participants.findFirst({
    select: { id: true, campaign_id: true },
  });
  if (cp) {
    const url = buildTrackedShareUrl(cp.campaign_id, SHARE_SOCIAL_DIRECT, cp.id);
    const e = await ensureParticipantShare({
      campaignId: cp.campaign_id,
      participantId: cp.id,
      socialTypeId: SHARE_SOCIAL_DIRECT,
      url,
    });
    const before = await prisma.participants_share.findUnique({ where: { id: e.id } });
    await recordShareClick({
      campaignId: cp.campaign_id,
      participantId: cp.id,
      socialTypeId: SHARE_SOCIAL_DIRECT,
    });
    const after = await prisma.participants_share.findUnique({ where: { id: e.id } });
    console.log("share click", {
      before: before?.clicks,
      after: after?.clicks,
      urlLen: url.length,
      ok: Number(after?.clicks ?? 0) === Number(before?.clicks ?? 0) + 1,
    });
  }

  console.log("trialExpiry", trialExpiryFrom().toISOString(), "plan", TRIAL_PLAN_ID);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
