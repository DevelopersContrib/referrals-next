import { after } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSubscription } from "@/lib/paypal";
import { postVnocAttribution, resolveVnocPlan } from "@/lib/vnoc-attribution";
import { handlePaidEngagementTransition } from "@/lib/engagement";
import {
  logCheckoutEvent,
  newCheckoutAttemptId,
} from "@/lib/billing-checkout-log";

export type ActivationFailure =
  | "missing_params"
  | "plan_not_found"
  | "paypal_plan_not_found"
  | "subscription_not_active"
  | "plan_mismatch"
  | "brand_not_found"
  | "execution_failed";

export type ActivationResult =
  | { ok: true; alreadyProcessed: boolean }
  | { ok: false; error: ActivationFailure };

/**
 * Apply a completed PayPal subscription to a member.
 *
 * Shared by the PayPal return URL and the in-page (JS SDK) checkout so both
 * paths enforce the same rules: the member always comes from the caller's
 * session, PayPal must consider the subscription live, a known PayPal plan must
 * map to the plan being claimed, and re-processing the same subscription must
 * not stack payments or extend expiry.
 */
export async function activatePaidSubscription(opts: {
  memberId: number;
  planId: number;
  brandId?: number | null;
  subscriptionId: string;
  attemptId?: string | null;
}): Promise<ActivationResult> {
  const { memberId, subscriptionId } = opts;
  const existingAttempt = await prisma.billing_checkout_attempts.findFirst({
    where: {
      member_id: memberId,
      plan_id: opts.planId,
      OR: [
        ...(opts.attemptId ? [{ attempt_id: opts.attemptId }] : []),
        { paypal_subscription_id: subscriptionId },
      ],
    },
    orderBy: { id: "desc" },
    select: { attempt_id: true, checkout_mode: true },
  });
  const attemptId =
    existingAttempt?.attempt_id ||
    (/^[0-9a-f-]{36}$/i.test(opts.attemptId || "")
      ? opts.attemptId!
      : newCheckoutAttemptId());
  const checkoutMode =
    existingAttempt?.checkout_mode === "redirect" ? "redirect" : "in_page";

  const log = (
    eventName: "activation_started" | "activated" | "server_error",
    extra?: { errorCode?: string; errorMessage?: string; replay?: boolean }
  ) =>
    logCheckoutEvent({
      attemptId,
      memberId,
      planId: opts.planId,
      brandId: opts.brandId,
      eventName,
      checkoutMode,
      paypalSubscriptionId: subscriptionId,
      errorCode: extra?.errorCode,
      errorMessage: extra?.errorMessage,
      metadata: extra?.replay ? { replay: true } : undefined,
    });

  if (!subscriptionId || !Number.isFinite(opts.planId)) {
    await log("server_error", {
      errorCode: "missing_params",
      errorMessage: "Missing subscription id or plan id",
    });
    return { ok: false, error: "missing_params" };
  }

  try {
    await log("activation_started");
    const plan = await prisma.plans.findUnique({ where: { id: opts.planId } });
    if (!plan) {
      await log("server_error", {
        errorCode: "plan_not_found",
        errorMessage: "Internal plan not found",
      });
      return { ok: false, error: "plan_not_found" };
    }

    const alreadyProcessed = await prisma.member_payment.findFirst({
      where: { transaction_id: subscriptionId },
    });
    if (alreadyProcessed) {
      await log("activated", { replay: true });
      return { ok: true, alreadyProcessed: true };
    }

    const subscription = await getSubscription(subscriptionId);
    const paypalPlanId = subscription.plan_id as string | undefined;
    const status = (subscription.status as string | undefined)?.toUpperCase();

    if (!paypalPlanId) {
      console.error("PayPal subscription missing plan_id:", subscription);
      await log("server_error", {
        errorCode: "paypal_plan_not_found",
        errorMessage: "PayPal subscription is missing plan_id",
      });
      return { ok: false, error: "paypal_plan_not_found" };
    }

    if (status && !["ACTIVE", "APPROVED"].includes(status)) {
      await log("server_error", {
        errorCode: "subscription_not_active",
        errorMessage: `PayPal subscription status is ${status}`,
      });
      return { ok: false, error: "subscription_not_active" };
    }

    const knownMapping = await prisma.member_plan.findFirst({
      where: { paypal_plan_id: paypalPlanId },
      orderBy: { id: "desc" },
    });
    if (knownMapping && knownMapping.payment_id !== plan.id) {
      console.error(
        `[billing] plan mismatch: paypal plan ${paypalPlanId} maps to ${knownMapping.payment_id}, claimed ${plan.id}`
      );
      await log("server_error", {
        errorCode: "plan_mismatch",
        errorMessage: "PayPal plan maps to a different internal plan",
      });
      return { ok: false, error: "plan_mismatch" };
    }

    const brandId = opts.brandId ?? null;
    if (brandId) {
      const brand = await prisma.member_urls.findFirst({
        where: { id: brandId, member_id: memberId },
      });
      if (!brand) {
        await log("server_error", {
          errorCode: "brand_not_found",
          errorMessage: "Brand does not belong to the authenticated member",
        });
        return { ok: false, error: "brand_not_found" };
      }
    }

    const now = new Date();
    const expiry = new Date(now);
    expiry.setDate(expiry.getDate() + (plan.days || 30));

    await prisma.member_plan.create({
      data: {
        member_id: memberId,
        paypal_plan_id: paypalPlanId,
        paypal_agreement_id: subscriptionId,
        payment_id: plan.id,
        date_added: now,
      },
    });

    if (brandId) {
      await prisma.url_plan.create({
        data: {
          url_id: brandId,
          member_id: memberId,
          paypal_plan_id: paypalPlanId,
          paypal_agreement_id: subscriptionId,
          payment_id: plan.id,
          date_added: now,
        },
      });
    }

    await prisma.member_payment.create({
      data: {
        member_id: memberId,
        amount: plan.price,
        datetime_created: now,
        status: "completed",
        transaction_id: subscriptionId,
        currency: "USD",
        plan_expiry: expiry,
      },
    });

    await prisma.members.update({
      where: { id: memberId },
      data: { plan_id: plan.id, plan_expiry: expiry },
    });

    const priceUsd = plan.price ?? 0;
    const billing = (plan.days || 30) >= 365 ? "year" : "month";
    const mapped = resolveVnocPlan(priceUsd, billing);
    after(() =>
      postVnocAttribution({
        product: mapped?.product ?? "referrals",
        eventType: "paid",
        eventValueUsd: priceUsd,
        refExternalId: subscriptionId,
        planSlug: mapped?.planSlug,
        paymentMethod: "paypal",
      })
    );

    await log("activated");
    if (!alreadyProcessed) {
      try {
        await handlePaidEngagementTransition(memberId);
      } catch (engagementError) {
        console.error("[billing] paid engagement transition failed:", engagementError);
      }
    }
    return { ok: true, alreadyProcessed: false };
  } catch (error) {
    console.error("[billing] subscription activation error:", error);
    await log("server_error", {
      errorCode: "execution_failed",
      errorMessage: error instanceof Error ? error.message : "Unknown activation error",
    });
    return { ok: false, error: "execution_failed" };
  }
}
