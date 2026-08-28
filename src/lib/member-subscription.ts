import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { memberIdIsPlatformAdmin } from "@/lib/platform-admin";
import {
  DEFAULT_PAID_PLAN_ID,
  FREE_DOMAIN_CAP,
  FREE_PARTICIPANT_CAP,
  TRIAL_DAYS,
  TRIAL_PLAN_ID,
} from "@/lib/billing-constants";

export {
  DEFAULT_PAID_PLAN_ID,
  FREE_DOMAIN_CAP,
  FREE_PARTICIPANT_CAP,
  TRIAL_DAYS,
  TRIAL_PLAN_ID,
} from "@/lib/billing-constants";

export type EntitlementStatus = "trial" | "free_capped" | "paid" | "unverified";

export type MemberEntitlement = {
  status: EntitlementStatus;
  planId: number | null;
  planExpiry: Date | null;
  daysLeft: number | null;
  /** Full Growth features (trial or paid). */
  isGrowth: boolean;
  /** Paying customer (price > 0). */
  isPaid: boolean;
  /** Hide Referrals.com Powered-by (paid only). */
  hideBranding: boolean;
};

export function subscriptionRequiredResponse(message?: string) {
  return NextResponse.json(
    {
      error:
        message ||
        "Your Growth trial has ended or this feature needs a paid plan. Open Billing to continue — $9/mo per brand.",
      code: "REQUIRES_SUBSCRIPTION",
      upgradePlanId: DEFAULT_PAID_PLAN_ID,
    },
    { status: 403 },
  );
}

export function participantCapResponse(extraHeaders?: HeadersInit) {
  return NextResponse.json(
    {
      error: `This free program has reached ${FREE_PARTICIPANT_CAP} participants. The brand owner can upgrade to grow further.`,
      code: "PARTICIPANT_CAP",
    },
    { status: 403, headers: extraHeaders },
  );
}

/** Local/dev bypass — set SKIP_PAID_SUBSCRIPTION_GATE=true in .env to treat all members as Growth. */
export function skipPaidSubscriptionGate() {
  return process.env.SKIP_PAID_SUBSCRIPTION_GATE === "true";
}

export function trialExpiryFrom(now = new Date()) {
  return new Date(now.getTime() + TRIAL_DAYS * 86400000);
}

export function daysLeftUntil(
  expiry: Date | null | undefined,
  now = new Date(),
) {
  if (!expiry) return null;
  const ms = new Date(expiry).getTime() - now.getTime();
  if (ms <= 0) return 0;
  return Math.ceil(ms / 86400000);
}

/**
 * Reverse-trial entitlement:
 * - trial: plan_id trial/free + future plan_expiry → full Growth
 * - paid: price > 0 + future plan_expiry → full Growth + hide branding
 * - free_capped: everyone else (post-trial / legacy) → capped free, branding on
 */
export async function getMemberEntitlement(
  memberId: number,
  options?: { applyAdminBypass?: boolean },
): Promise<MemberEntitlement> {
  const applyAdminBypass = options?.applyAdminBypass !== false;
  if (
    applyAdminBypass &&
    (skipPaidSubscriptionGate() || (await memberIdIsPlatformAdmin(memberId)))
  ) {
    return {
      status: "paid",
      planId: DEFAULT_PAID_PLAN_ID,
      planExpiry: null,
      daysLeft: null,
      isGrowth: true,
      isPaid: true,
      hideBranding: true,
    };
  }

  const member = await prisma.members.findUnique({
    where: { id: memberId },
    select: { plan_id: true, plan_expiry: true, is_verified: true },
  });

  if (!member?.is_verified) {
    return {
      status: "unverified",
      planId: member?.plan_id ?? null,
      planExpiry: member?.plan_expiry ?? null,
      daysLeft: daysLeftUntil(member?.plan_expiry),
      isGrowth: false,
      isPaid: false,
      hideBranding: false,
    };
  }

  const planId = member.plan_id && member.plan_id > 0 ? member.plan_id : null;
  const expiry = member.plan_expiry ? new Date(member.plan_expiry) : null;
  const activeExpiry = expiry != null && expiry.getTime() > Date.now();
  const daysLeft = daysLeftUntil(expiry);

  let price = 0;
  if (planId) {
    const plan = await prisma.plans.findUnique({
      where: { id: planId },
      select: { price: true },
    });
    price = plan?.price ?? 0;
  }

  if (activeExpiry && price > 0) {
    return {
      status: "paid",
      planId,
      planExpiry: expiry,
      daysLeft,
      isGrowth: true,
      isPaid: true,
      hideBranding: true,
    };
  }

  if (activeExpiry && price <= 0) {
    return {
      status: "trial",
      planId: planId ?? TRIAL_PLAN_ID,
      planExpiry: expiry,
      daysLeft,
      isGrowth: true,
      isPaid: false,
      hideBranding: false,
    };
  }

  return {
    status: "free_capped",
    planId,
    planExpiry: expiry,
    daysLeft: 0,
    isGrowth: false,
    isPaid: false,
    hideBranding: false,
  };
}

/** Full Growth (trial or paid). Prefer this for feature gates. */
export async function isMemberGrowthEntitled(
  memberId: number,
): Promise<boolean> {
  const e = await getMemberEntitlement(memberId);
  return e.isGrowth;
}

/**
 * Paid only (price > 0). Kept for billing badges / MRR.
 * @deprecated Prefer getMemberEntitlement / isMemberGrowthEntitled for product gates.
 */
export async function isMemberOnPaidPlan(memberId: number): Promise<boolean> {
  const e = await getMemberEntitlement(memberId);
  return e.isPaid;
}

/** @deprecated alias — gates should use isMemberGrowthEntitled */
export const isMemberEntitled = isMemberGrowthEntitled;

export async function countMemberBrands(memberId: number) {
  return prisma.member_urls.count({ where: { member_id: memberId } });
}

export async function countMemberParticipants(memberId: number) {
  const rows = await prisma.$queryRawUnsafe<{ c: bigint }[]>(
    `SELECT COUNT(*) AS c
     FROM campaign_participants cp
     JOIN member_campaigns mc ON mc.id = cp.campaign_id
     WHERE mc.member_id = ?`,
    memberId,
  );
  return Number(rows[0]?.c ?? 0);
}

export async function canMemberAddBrand(memberId: number) {
  const e = await getMemberEntitlement(memberId);
  if (e.isGrowth) return { ok: true as const, entitlement: e };
  const n = await countMemberBrands(memberId);
  if (n >= FREE_DOMAIN_CAP) {
    return {
      ok: false as const,
      entitlement: e,
      reason: "domain_cap" as const,
    };
  }
  return { ok: true as const, entitlement: e };
}

export async function canMemberAcceptParticipant(memberId: number) {
  const e = await getMemberEntitlement(memberId);
  if (e.isGrowth) return { ok: true as const, entitlement: e };
  const n = await countMemberParticipants(memberId);
  if (n >= FREE_PARTICIPANT_CAP) {
    return {
      ok: false as const,
      entitlement: e,
      reason: "participant_cap" as const,
    };
  }
  return { ok: true as const, entitlement: e };
}

/** Visitor-facing: show Powered-by unless the campaign owner is paid. */
export async function memberMustShowBranding(memberId: number) {
  const e = await getMemberEntitlement(memberId);
  return !e.hideBranding;
}
