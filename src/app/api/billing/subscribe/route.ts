import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createSubscription } from "@/lib/paypal";
import { resolvePaypalPlanId } from "@/lib/billing-paypal-plan";
import {
  logCheckoutEvent,
  newCheckoutAttemptId,
} from "@/lib/billing-checkout-log";
import { getPrimaryCheckoutBrand } from "@/lib/member-subscription";
import { WINBACK_PLAN_ID } from "@/lib/billing-constants";
import { resolveWinbackPaypalPlanId, memberHasUsedWinbackOffer } from "@/lib/billing-winback";

/**
 * Redirect checkout fallback: creates the subscription server-side and returns
 * PayPal's approval URL. The in-page buttons (PayPal wallet or card) are the
 * primary path; this keeps checkout working if the JS SDK can't load.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { planId, brandId: rawBrandId, attemptId: requestedAttemptId } = await req.json();
  const memberId = parseInt(session.user.id, 10);
  const parsedBrandId = Number(rawBrandId);
  let brandId =
    Number.isFinite(parsedBrandId) && parsedBrandId > 0 ? parsedBrandId : null;
  if (brandId) {
    const owns = await prisma.member_urls.findFirst({
      where: { id: brandId, member_id: memberId },
      select: { id: true },
    });
    if (!owns) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }
  } else {
    const primary = await getPrimaryCheckoutBrand(memberId);
    brandId = primary?.id ?? null;
  }
  if (!brandId) {
    return NextResponse.json(
      {
        error: "Create a brand before checkout. Payment publishes that brand.",
        code: "BRAND_REQUIRED",
      },
      { status: 400 },
    );
  }
  const existingAttempt =
    typeof requestedAttemptId === "string"
      ? await prisma.billing_checkout_attempts.findFirst({
          where: {
            attempt_id: requestedAttemptId,
            member_id: memberId,
            plan_id: Number(planId),
          },
          select: { attempt_id: true },
        })
      : null;
  const attemptId = existingAttempt?.attempt_id || newCheckoutAttemptId();

  const plan = await prisma.plans.findUnique({ where: { id: planId } });
  if (!plan) {
    await logCheckoutEvent({
      attemptId,
      memberId,
      planId: Number(planId) || 0,
      brandId,
      eventName: "server_error",
      checkoutMode: "redirect",
      errorCode: "PLAN_NOT_FOUND",
      errorMessage: "Internal plan not found",
    });
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  }

  if (!existingAttempt) {
    await logCheckoutEvent({
      attemptId,
      memberId,
      planId: plan.id,
      brandId,
      eventName: "checkout_created",
      checkoutMode: "redirect",
      metadata: { source: "subscribe_route" },
    });
  }

  try {
    // $0 plans are not offered. Publishing requires a paid plan.
    if (!plan.price || plan.price <= 0) {
      await logCheckoutEvent({
        attemptId,
        memberId,
        planId: plan.id,
        brandId,
        eventName: "server_error",
        checkoutMode: "redirect",
        errorCode: "TRIAL_NOT_VIA_SUBSCRIBE",
        errorMessage: "A $0 plan cannot create a PayPal subscription",
      });
      return NextResponse.json(
        {
          error:
            "That plan is not available. Choose a paid plan to publish a brand.",
          code: "TRIAL_NOT_VIA_SUBSCRIBE",
        },
        { status: 400 }
      );
    }

    if (plan.id === WINBACK_PLAN_ID) {
      const alreadyUsed = await memberHasUsedWinbackOffer(memberId);
      if (alreadyUsed) {
        await logCheckoutEvent({
          attemptId,
          memberId,
          planId: plan.id,
          brandId,
          eventName: "server_error",
          checkoutMode: "redirect",
          errorCode: "WINBACK_ALREADY_USED",
          errorMessage: "Member has already used the $1 win-back offer",
        });
        return NextResponse.json(
          { error: "This offer has already been used.", code: "WINBACK_ALREADY_USED" },
          { status: 409 },
        );
      }
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const returnUrl = `${appUrl}/api/billing/execute?planId=${planId}&attemptId=${attemptId}${brandId ? `&brandId=${brandId}` : ""}`;
    const cancelUrl = `${appUrl}/billing`;

    const paypalPlanId = plan.id === WINBACK_PLAN_ID
      ? await resolveWinbackPaypalPlanId()
      : await resolvePaypalPlanId(plan);
    if (!paypalPlanId) {
      await logCheckoutEvent({
        attemptId,
        memberId,
        planId: plan.id,
        brandId,
        eventName: "server_error",
        checkoutMode: "redirect",
        errorCode: "PAYPAL_PLAN_FAILED",
        errorMessage: "Failed to resolve PayPal billing plan",
      });
      return NextResponse.json(
        { error: "Failed to create PayPal billing plan" },
        { status: 500 }
      );
    }

    const subscription = await createSubscription(
      paypalPlanId,
      returnUrl,
      cancelUrl,
      brandId ? `brand:${brandId}` : undefined
    );

    const approvalUrl = subscription.links?.find(
      (l: { rel?: string; href?: string }) => l.rel === "approve"
    )?.href;

    if (!approvalUrl) {
      console.error("PayPal subscription response:", subscription);
      await logCheckoutEvent({
        attemptId,
        memberId,
        planId: plan.id,
        brandId,
        eventName: "server_error",
        checkoutMode: "redirect",
        paypalSubscriptionId: subscription.id,
        errorCode: "APPROVAL_URL_MISSING",
        errorMessage: "PayPal subscription response did not include an approval URL",
      });
      return NextResponse.json(
        { error: "Failed to create PayPal subscription" },
        { status: 500 }
      );
    }

    await logCheckoutEvent({
      attemptId,
      memberId,
      planId: plan.id,
      brandId,
      eventName: "redirect_created",
      checkoutMode: "redirect",
      paypalSubscriptionId: subscription.id,
    });

    return NextResponse.json({ approvalUrl, attemptId });
  } catch (error) {
    console.error("PayPal subscription error:", error);
    await logCheckoutEvent({
      attemptId,
      memberId,
      planId: plan.id,
      brandId,
      eventName: "server_error",
      checkoutMode: "redirect",
      errorCode: "PAYMENT_PROCESSING_FAILED",
      errorMessage: error instanceof Error ? error.message : "Unknown PayPal error",
    });
    return NextResponse.json(
      { error: "Payment processing failed" },
      { status: 500 }
    );
  }
}
