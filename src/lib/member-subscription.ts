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

export type BrandEntitlement = MemberEntitlement & {
  brandId: number;
  memberId: number;
  /** VNOC network brands are always free — never inherit another brand's pay. */
  isVnoc: boolean;
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

/**
 * Per-brand entitlement. Account trial applies to all brands; paid Growth is
 * stamped per brand (url_plan + member_urls.plan_expiry). VNOC brands stay free.
 */
export async function getBrandEntitlement(
  brandId: number,
  options?: { applyAdminBypass?: boolean },
): Promise<BrandEntitlement | null> {
  const brand = await prisma.member_urls.findUnique({
    where: { id: brandId },
    select: {
      id: true,
      member_id: true,
      plan_expiry: true,
      in_vnoc: true,
    },
  });
  if (!brand) return null;

  const memberId = brand.member_id;
  const isVnoc = Boolean(brand.in_vnoc);
  const applyAdminBypass = options?.applyAdminBypass !== false;

  if (
    applyAdminBypass &&
    (skipPaidSubscriptionGate() || (await memberIdIsPlatformAdmin(memberId)))
  ) {
    return {
      brandId,
      memberId,
      isVnoc,
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
      brandId,
      memberId,
      isVnoc,
      status: "unverified",
      planId: member?.plan_id ?? null,
      planExpiry: member?.plan_expiry ?? null,
      daysLeft: daysLeftUntil(member?.plan_expiry),
      isGrowth: false,
      isPaid: false,
      hideBranding: false,
    };
  }

  const accountTrial = await getMemberEntitlement(memberId, {
    applyAdminBypass: false,
  });
  if (accountTrial.status === "trial") {
    return {
      brandId,
      memberId,
      isVnoc,
      status: "trial",
      planId: accountTrial.planId,
      planExpiry: accountTrial.planExpiry,
      daysLeft: accountTrial.daysLeft,
      isGrowth: true,
      isPaid: false,
      hideBranding: false,
    };
  }

  if (isVnoc) {
    return {
      brandId,
      memberId,
      isVnoc,
      status: "free_capped",
      planId: null,
      planExpiry: null,
      daysLeft: 0,
      isGrowth: false,
      isPaid: false,
      hideBranding: false,
    };
  }

  const brandExpiry = brand.plan_expiry ? new Date(brand.plan_expiry) : null;
  const brandPaidActive =
    brandExpiry != null && brandExpiry.getTime() > Date.now();

  if (brandPaidActive) {
    const urlPlan = await prisma.url_plan.findFirst({
      where: { url_id: brandId },
      orderBy: { id: "desc" },
      select: { payment_id: true },
    });
    const planId = urlPlan?.payment_id ?? null;
    let price = 0;
    if (planId) {
      const plan = await prisma.plans.findUnique({
        where: { id: planId },
        select: { price: true },
      });
      price = plan?.price ?? 0;
    }

    if (price > 0) {
      return {
        brandId,
        memberId,
        isVnoc,
        status: "paid",
        planId,
        planExpiry: brandExpiry,
        daysLeft: daysLeftUntil(brandExpiry),
        isGrowth: true,
        isPaid: true,
        hideBranding: true,
      };
    }
  }

  return {
    brandId,
    memberId,
    isVnoc,
    status: "free_capped",
    planId: null,
    planExpiry: brandExpiry,
    daysLeft: daysLeftUntil(brandExpiry),
    isGrowth: false,
    isPaid: false,
    hideBranding: false,
  };
}

/** Full Growth for a brand (account trial or that brand paid). */
export async function isBrandGrowthEntitled(brandId: number): Promise<boolean> {
  const e = await getBrandEntitlement(brandId);
  return e?.isGrowth ?? false;
}

/** Paid Growth for a single brand (not account trial). */
export async function isBrandOnPaidPlan(brandId: number): Promise<boolean> {
  const e = await getBrandEntitlement(brandId);
  return e?.isPaid ?? false;
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
  // Account trial unlocks multi-brand; per-brand pay does not bypass the free cap.
  if (e.status === "trial") return { ok: true as const, entitlement: e };
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

export async function countBrandParticipants(brandId: number) {
  const rows = await prisma.$queryRawUnsafe<{ c: bigint }[]>(
    `SELECT COUNT(*) AS c
     FROM campaign_participants cp
     JOIN member_campaigns mc ON mc.id = cp.campaign_id
     WHERE mc.url_id = ?`,
    brandId,
  );
  return Number(rows[0]?.c ?? 0);
}

export async function canBrandAcceptParticipant(brandId: number) {
  const e = await getBrandEntitlement(brandId);
  if (!e) {
    return {
      ok: false as const,
      entitlement: null,
      reason: "brand_not_found" as const,
    };
  }
  if (e.isGrowth) return { ok: true as const, entitlement: e };
  const n = await countBrandParticipants(brandId);
  if (n >= FREE_PARTICIPANT_CAP) {
    return {
      ok: false as const,
      entitlement: e,
      reason: "participant_cap" as const,
    };
  }
  return { ok: true as const, entitlement: e };
}

/** @deprecated Prefer canBrandAcceptParticipant for widget/API caps. */
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

/** Visitor-facing: show Powered-by unless this brand is on paid Growth. */
export async function brandMustShowBranding(brandId: number) {
  const e = await getBrandEntitlement(brandId);
  return !(e?.hideBranding ?? false);
}

/** @deprecated Prefer brandMustShowBranding(brandId) — account pay no longer hides branding globally. */
export async function memberMustShowBranding(memberId: number) {
  const e = await getMemberEntitlement(memberId);
  return !e.hideBranding;
}
