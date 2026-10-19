import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { memberIdIsPlatformAdmin } from "@/lib/platform-admin";
import { isNetworkSyntheticParticipantEmail } from "@/lib/domain-referrer";
import { corsHeaders } from "@/lib/api/helpers";
import {
  DEFAULT_PAID_PLAN_ID,
  FREE_PARTICIPANT_CAP,
  TRIAL_DAYS,
  TRIAL_PLAN_ID,
  UNLIMITED_PLAN_ID,
} from "@/lib/billing-constants";

export {
  DEFAULT_PAID_PLAN_ID,
  FREE_DOMAIN_CAP,
  FREE_PARTICIPANT_CAP,
  TRIAL_DAYS,
  TRIAL_PLAN_ID,
} from "@/lib/billing-constants";

export type EntitlementStatus =
  | "trial"
  | "free_capped"
  | "unpaid"
  | "paid"
  | "unverified";

export type MemberEntitlement = {
  status: EntitlementStatus;
  planId: number | null;
  planExpiry: Date | null;
  daysLeft: number | null;
  /** Full Growth features (paid). */
  isGrowth: boolean;
  /** Paying customer (price > 0). */
  isPaid: boolean;
  /** Hide Referrals.com Powered-by (paid only). */
  hideBranding: boolean;
};

export type BrandEntitlement = MemberEntitlement & {
  brandId: number;
  memberId: number;
  /** Network (VNOC) brand — treated as paid/live without a $9/mo stamp. */
  isVnoc: boolean;
};

export function subscriptionRequiredResponse(message?: string) {
  return NextResponse.json(
    {
      error:
        message ||
        "Pay $9/mo for this brand to go live.",
      code: "REQUIRES_SUBSCRIPTION",
      upgradePlanId: DEFAULT_PAID_PLAN_ID,
    },
    { status: 403 },
  );
}

export function participantCapMessage() {
  return `This program has reached ${FREE_PARTICIPANT_CAP} participants. The brand owner can upgrade to grow further.`;
}

export function programNotLiveMessage() {
  return "This campaign isn't live yet.";
}

export function programNotLiveResponse(extraHeaders?: HeadersInit) {
  return NextResponse.json(
    {
      error: programNotLiveMessage(),
      code: "NOT_LIVE",
    },
    { status: 403, headers: extraHeaders },
  );
}

/** VNOC network brand — free to publish (no $9/mo stamp). */
export function isVnocBrand(brand: {
  in_vnoc?: boolean | null;
  vnoc_id?: number | null;
}): boolean {
  return Boolean(brand.in_vnoc) || brand.vnoc_id != null;
}

export function participantCapResponse(extraHeaders?: HeadersInit) {
  return NextResponse.json(
    {
      error: participantCapMessage(),
      code: "PARTICIPANT_CAP",
    },
    { status: 403, headers: extraHeaders },
  );
}

/** v1 / public API shape — includes CORS headers. */
export function participantCapApiError() {
  return NextResponse.json(
    {
      success: false,
      error: participantCapMessage(),
      code: "PARTICIPANT_CAP",
    },
    { status: 403, headers: corsHeaders() },
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
 * Entitlement:
 * - paid: price > 0 + future plan_expiry → full Growth + hide branding
 * - unpaid: must pay $9/mo per brand to publish (not a free SKU)
 * - free_capped: legacy alias kept for engagement segments; maps to unpaid at gates
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

  const planId = member?.plan_id && member.plan_id > 0 ? member.plan_id : null;
  const expiry = member?.plan_expiry ? new Date(member.plan_expiry) : null;
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

  if (!member?.is_verified) {
    return {
      status: "unverified",
      planId,
      planExpiry: expiry,
      daysLeft,
      isGrowth: false,
      isPaid: false,
      hideBranding: false,
    };
  }

  return {
    status: "unpaid",
    planId,
    planExpiry: expiry,
    daysLeft: 0,
    isGrowth: false,
    isPaid: false,
    hideBranding: false,
  };
}

/**
 * Per-brand entitlement. Paid Growth is stamped per brand
 * (url_plan + member_urls.plan_expiry). Publishing requires that stamp.
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
      vnoc_id: true,
    },
  });
  if (!brand) return null;

  const memberId = brand.member_id;
  const isVnoc = isVnocBrand(brand);
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

  if (isVnoc) {
    return {
      brandId,
      memberId,
      isVnoc: true,
      status: "paid",
      planId: null,
      planExpiry: null,
      daysLeft: null,
      isGrowth: true,
      isPaid: true,
      hideBranding: true,
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

  const covered = await brandCoveredByAccountPlan(brandId, memberId, member);
  if (covered) {
    return {
      brandId,
      memberId,
      isVnoc,
      status: "paid",
      planId: covered.planId,
      planExpiry: covered.planExpiry,
      daysLeft: daysLeftUntil(covered.planExpiry),
      isGrowth: true,
      isPaid: true,
      hideBranding: true,
    };
  }

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

  return {
    brandId,
    memberId,
    isVnoc,
    status: "unpaid",
    planId: null,
    planExpiry: brandExpiry,
    daysLeft: daysLeftUntil(brandExpiry),
    isGrowth: false,
    isPaid: false,
    hideBranding: false,
  };
}

function accountPlanCoversMultipleBrands(
  planId: number | null | undefined,
  price: number,
  noOfDomains: number | null | undefined,
) {
  if (!planId || price <= 0) return false;
  if (planId === UNLIMITED_PLAN_ID) return true;
  const domains = noOfDomains ?? 1;
  return domains !== 1;
}

async function brandCoveredByAccountPlan(
  brandId: number,
  memberId: number,
  member: { plan_id: number | null; plan_expiry: Date | null } | null,
): Promise<{ planId: number; planExpiry: Date } | null> {
  const planId = member?.plan_id && member.plan_id > 0 ? member.plan_id : null;
  const expiry = member?.plan_expiry ? new Date(member.plan_expiry) : null;
  if (!planId || !expiry || expiry.getTime() <= Date.now()) return null;

  const plan = await prisma.plans.findUnique({
    where: { id: planId },
    select: { price: true, no_of_domains: true },
  });
  if (!plan || !accountPlanCoversMultipleBrands(planId, plan.price ?? 0, plan.no_of_domains)) {
    return null;
  }

  const brands = await prisma.member_urls.findMany({
    where: { member_id: memberId },
    orderBy: { date_added: "asc" },
    select: { id: true, in_vnoc: true, vnoc_id: true },
  });
  const countable = brands.filter((b) => !isVnocBrand(b));
  const cap = plan.no_of_domains != null && plan.no_of_domains > 0
    ? plan.no_of_domains
    : Number.POSITIVE_INFINITY;
  const index = countable.findIndex((b) => b.id === brandId);
  if (index < 0 || index >= cap) return null;
  return { planId, planExpiry: expiry };
}

/**
 * First non-VNOC brand for checkout CTAs.
 * VNOC/network brands are free and must never appear in Go Live / pay prompts.
 */
export async function getPrimaryCheckoutBrand(memberId: number) {
  const brands = await prisma.member_urls.findMany({
    where: { member_id: memberId },
    orderBy: { date_added: "asc" },
    select: { id: true, domain: true, in_vnoc: true, vnoc_id: true },
  });
  const own = brands.filter((b) => !isVnocBrand(b));
  // Prefer a brand that still needs paying for, so a checkout never lands on a live brand.
  for (const b of own) {
    const e = await getBrandEntitlement(b.id, { applyAdminBypass: false });
    if (!e?.isPaid) return b;
  }
  return own[0] ?? null;
}

/**
 * REF-J5: show a brand Upgrade CTA only for unpaid, non-VNOC brands that are
 * that are not already paid.
 */
export function brandShouldShowUpgradeCta(
  e:
    Pick<BrandEntitlement, "isVnoc" | "isPaid" | "isGrowth"> | null | undefined,
): boolean {
  if (!e) return false;
  return !e.isPaid;
}

/** A brand is live only when it has an active paid stamp. */
export async function isBrandGrowthEntitled(brandId: number): Promise<boolean> {
  const e = await getBrandEntitlement(brandId);
  return e?.isPaid ?? false;
}

/** Paid Growth for a single brand. */
export async function isBrandOnPaidPlan(brandId: number): Promise<boolean> {
  const e = await getBrandEntitlement(brandId);
  return e?.isPaid ?? false;
}

/**
 * Go Live / publish CTA for a specific brand. Hidden when the brand is
 * already live, the viewer is a platform admin, or the owner has an
 * active Unlimited subscription.
 */
export async function shouldShowBrandPublishCta(opts: {
  brandId: number;
  viewerMemberId: number | null;
  isViewerAdmin?: boolean;
}): Promise<boolean> {
  const viewerId = opts.viewerMemberId;
  if (!viewerId || viewerId <= 0) return false;

  if (
    opts.isViewerAdmin === true ||
    (await memberIdIsPlatformAdmin(viewerId))
  ) {
    return false;
  }

  const entitlement = await getBrandEntitlement(opts.brandId, {
    applyAdminBypass: false,
  });
  if (!entitlement) return false;
  if (entitlement.isPaid || entitlement.isVnoc) return false;

  const owner = await prisma.members.findUnique({
    where: { id: entitlement.memberId },
    select: { plan_id: true, plan_expiry: true },
  });
  if (owner?.plan_id === UNLIMITED_PLAN_ID) {
    const expiry = owner.plan_expiry ? new Date(owner.plan_expiry) : null;
    if (expiry != null && expiry.getTime() > Date.now()) return false;
  }

  return true;
}

/** Account is paid only when the member plan price is greater than zero. */
export async function isMemberGrowthEntitled(
  memberId: number,
): Promise<boolean> {
  const e = await getMemberEntitlement(memberId);
  return e.isPaid;
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
     WHERE mc.member_id = ?
       AND LOWER(cp.email) NOT LIKE '%@network.referrals.com'`,
    memberId,
  );
  return Number(rows[0]?.c ?? 0);
}

/**
 * Anyone can set up as many brands as they like, at any time, free. Paying is
 * per brand and only needed to publish (campaigns go public, widget and
 * sign-ups work). Kept as a function so callers have one place to change if a
 * limit is ever needed again.
 */
export async function canMemberAddBrand(memberId: number) {
  const e = await getMemberEntitlement(memberId);
  return { ok: true as const, entitlement: e };
}

export type BrandBillingRow = {
  brandId: number;
  domain: string | null;
  status: "live" | "private" | "network";
  planExpiry: Date | null;
  subscriptionId: string | null;
  checkoutPlanId: number;
};

export async function listMemberBrandBilling(
  memberId: number,
): Promise<BrandBillingRow[]> {
  const brands = await prisma.member_urls.findMany({
    where: { member_id: memberId },
    orderBy: { date_added: "asc" },
    select: {
      id: true,
      domain: true,
      in_vnoc: true,
      vnoc_id: true,
      plan_expiry: true,
    },
  });

  const rows: BrandBillingRow[] = [];
  for (const brand of brands) {
    const entitlement = await getBrandEntitlement(brand.id, {
      applyAdminBypass: false,
    });
    const urlPlan = await prisma.url_plan.findFirst({
      where: { url_id: brand.id },
      orderBy: { id: "desc" },
      select: { paypal_agreement_id: true, payment_id: true },
    });
    const isNetwork = isVnocBrand(brand);
    rows.push({
      brandId: brand.id,
      domain: brand.domain,
      status: isNetwork ? "network" : entitlement?.isPaid ? "live" : "private",
      planExpiry: entitlement?.planExpiry ?? brand.plan_expiry,
      subscriptionId: urlPlan?.paypal_agreement_id ?? null,
      checkoutPlanId: urlPlan?.payment_id || DEFAULT_PAID_PLAN_ID,
    });
  }
  return rows;
}

export async function countBrandParticipants(brandId: number) {
  const rows = await prisma.$queryRawUnsafe<{ c: bigint }[]>(
    `SELECT COUNT(*) AS c
     FROM campaign_participants cp
     JOIN member_campaigns mc ON mc.id = cp.campaign_id
     WHERE mc.url_id = ?
       AND LOWER(cp.email) NOT LIKE '%@network.referrals.com'`,
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
  if (!e.isPaid) {
    return {
      ok: false as const,
      entitlement: e,
      reason: "not_live" as const,
    };
  }
  return { ok: true as const, entitlement: e };
}

/** Shared cap gate for every participant create path. */
export async function assertCanAcceptParticipant(
  brandId: number,
  opts?: { email?: string },
) {
  if (opts?.email && isNetworkSyntheticParticipantEmail(opts.email)) {
    return { ok: true as const };
  }
  const cap = await canBrandAcceptParticipant(brandId);
  if (cap.ok) return { ok: true as const };
  return {
    ok: false as const,
    reason: cap.reason ?? ("participant_cap" as const),
  };
}

/** @deprecated Prefer canBrandAcceptParticipant for widget/API caps. */
export async function canMemberAcceptParticipant(memberId: number) {
  const e = await getMemberEntitlement(memberId);
  if (e.isPaid) return { ok: true as const, entitlement: e };
  return {
    ok: false as const,
    entitlement: e,
    reason: "not_live" as const,
  };
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
