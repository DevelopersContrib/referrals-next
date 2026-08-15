import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createSubscription } from "@/lib/paypal";
import { resolvePaypalPlanId } from "@/lib/billing-paypal-plan";
import {
  logCheckoutEvent,
  newCheckoutAttemptId,
} from "@/lib/billing-checkout-log";

/**
 * Redirect checkout fallback: creates the subscription server-side and returns
 * PayPal's approval URL. The in-page buttons (PayPal wallet or card) are the
 * primary path; this keeps checkout working if the JS SDK can't load.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { planId, brandId, attemptId: requestedAttemptId } = await req.json();
  const memberId = parseInt(session.user.id, 10);
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
    // Free / $0 plans cannot restart infinite Growth trials via Billing
    if (!plan.price || plan.price <= 0) {
      await logCheckoutEvent({
        attemptId,
        memberId,
        planId: plan.id,
        brandId,
        eventName: "server_error",
        checkoutMode: "redirect",
        errorCode: "TRIAL_NOT_VIA_SUBSCRIBE",
        errorMessage: "A free plan cannot create a PayPal subscription",
      });
      return NextResponse.json(
        {
          error:
            "Free trial starts automatically at signup. Choose Growth ($9/mo per brand) to upgrade.",
          code: "TRIAL_NOT_VIA_SUBSCRIBE",
        },
        { status: 400 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const returnUrl = `${appUrl}/api/billing/execute?planId=${planId}&attemptId=${attemptId}${brandId ? `&brandId=${brandId}` : ""}`;
    const cancelUrl = `${appUrl}/billing`;

    const paypalPlanId = await resolvePaypalPlanId(plan);
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
