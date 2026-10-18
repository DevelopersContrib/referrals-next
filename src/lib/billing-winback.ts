/**
 * B16 Win-back $1 first-month offer.
 *
 * PayPal billing plan: 1-month trial at $1.00, then regular $9/mo.
 * Reuses the existing plan-resolution pipeline so the PayPal plan is created
 * on first checkout and reused thereafter.
 */

import { prisma } from "@/lib/prisma";
import { WINBACK_PLAN_ID } from "@/lib/billing-constants";
import {
  findSubscriptionPlanIdByName,
  getAccessToken,
  getBillingPlan,
  getOrCreateProduct,
  getPayPalApiBaseUrl,
} from "@/lib/paypal";

const WINBACK_TRIAL_PRICE = "1.00";
const WINBACK_REGULAR_PRICE = "9.00";

export function winbackPaypalPlanName(): string {
  return `Referrals.com #${WINBACK_PLAN_ID} Brand, monthly — $1 first month $1.00/MONTH+$9.00/MONTH`;
}

/**
 * Create or find the PayPal billing plan for the $1 win-back offer.
 * Trial cycle: 1 month at $1.00, then regular $9/mo.
 */
export async function createWinbackPaypalPlan(): Promise<string | null> {
  const mapped = await prisma.member_plan.findFirst({
    where: { paypal_plan_id: { not: "" }, payment_id: WINBACK_PLAN_ID },
    orderBy: { id: "desc" },
    select: { paypal_plan_id: true },
  });
  if (mapped?.paypal_plan_id) {
    try {
      const live = await getBillingPlan(mapped.paypal_plan_id);
      if ((live?.status ?? "").toUpperCase() === "ACTIVE") {
        return mapped.paypal_plan_id;
      }
    } catch {
      // fall through to create
    }
  }

  const name = winbackPaypalPlanName();
  const productId = await getOrCreateProduct();

  try {
    const existing = await findSubscriptionPlanIdByName(name, productId);
    if (existing) return existing;
  } catch {
    // fall through to create
  }

  const token = await getAccessToken();

  const response = await fetch(`${getPayPalApiBaseUrl()}/v1/billing/plans`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      product_id: productId,
      name,
      billing_cycles: [
        {
          frequency: { interval_unit: "MONTH", interval_count: 1 },
          tenure_type: "TRIAL",
          sequence: 1,
          total_cycles: 1,
          pricing_scheme: {
            fixed_price: { value: WINBACK_TRIAL_PRICE, currency_code: "USD" },
          },
        },
        {
          frequency: { interval_unit: "MONTH", interval_count: 1 },
          tenure_type: "REGULAR",
          sequence: 2,
          total_cycles: 0,
          pricing_scheme: {
            fixed_price: { value: WINBACK_REGULAR_PRICE, currency_code: "USD" },
          },
        },
      ],
      payment_preferences: {
        auto_bill_outstanding: true,
        payment_failure_threshold: 3,
      },
    }),
  });

  const data = await response.json();
  if (!data?.id) {
    console.error("[winback] PayPal plan creation failed:", data);
    return null;
  }
  return data.id as string;
}

/**
 * Resolve the PayPal plan id for the win-back offer.
 * Uses the same pattern as resolvePaypalPlanId but with trial-aware creation.
 */
export async function resolveWinbackPaypalPlanId(): Promise<string | null> {
  return createWinbackPaypalPlan();
}

/**
 * Check whether a member has already used the $1 win-back offer.
 * Returns true if they have a member_payment or url_plan for WINBACK_PLAN_ID.
 */
export async function memberHasUsedWinbackOffer(memberId: number): Promise<boolean> {
  const payment = await prisma.member_payment.findFirst({
    where: {
      member_id: memberId,
      url_id: { not: null },
    },
    select: { id: true, url_id: true },
  });

  if (payment) {
    const urlPlan = await prisma.url_plan.findFirst({
      where: {
        member_id: memberId,
        payment_id: WINBACK_PLAN_ID,
      },
      select: { id: true },
    });
    if (urlPlan) return true;
  }

  const memberPlan = await prisma.member_plan.findFirst({
    where: {
      member_id: memberId,
      payment_id: WINBACK_PLAN_ID,
    },
    select: { id: true },
  });

  return memberPlan != null;
}

/**
 * Build the checkout URL for the win-back offer for a specific brand.
 */
export function winbackCheckoutUrl(
  brandId: number,
  opts?: { baseUrl?: string },
): string {
  const base = opts?.baseUrl ?? process.env.NEXT_PUBLIC_APP_URL ?? "https://www.referrals.com";
  return `${base}/billing/plan/${WINBACK_PLAN_ID}?brandId=${brandId}&utm_source=winback&utm_campaign=oct2026`;
}
