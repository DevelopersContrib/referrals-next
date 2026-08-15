import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resolvePaypalPlanId } from "@/lib/billing-paypal-plan";
import {
  logCheckoutEvent,
  newCheckoutAttemptId,
} from "@/lib/billing-checkout-log";

/**
 * GET /api/billing/checkout-config?planId=2
 *
 * Everything the client needs to render PayPal wallet + card buttons. The
 * PayPal client id is public by design (it ships in the SDK URL); the secret
 * never leaves the server.
 */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const planIdParam = req.nextUrl.searchParams.get("planId");
  const brandIdParam = req.nextUrl.searchParams.get("brandId");
  const planId = Number(planIdParam);
  if (!planIdParam || !Number.isFinite(planId)) {
    return NextResponse.json({ error: "planId is required" }, { status: 400 });
  }

  const plan = await prisma.plans.findUnique({ where: { id: planId } });
  if (!plan) {
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  }

  if (!plan.price || plan.price <= 0) {
    return NextResponse.json(
      {
        error:
          "Free trial starts automatically at signup. Choose Growth ($9/mo per brand) to upgrade.",
        code: "TRIAL_NOT_VIA_SUBSCRIBE",
      },
      { status: 400 }
    );
  }

  const memberId = parseInt(session.user.id, 10);
  const parsedBrandId = brandIdParam ? Number(brandIdParam) : null;
  const brandId =
    parsedBrandId != null && Number.isFinite(parsedBrandId) ? parsedBrandId : null;
  if (brandId != null) {
    const ownsBrand = await prisma.member_urls.findFirst({
      where: { id: brandId, member_id: memberId },
      select: { id: true },
    });
    if (!ownsBrand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }
  }

  const attemptId = newCheckoutAttemptId();
  await logCheckoutEvent({
    attemptId,
    memberId,
    planId: plan.id,
    brandId,
    eventName: "checkout_created",
    checkoutMode: "in_page",
    metadata: {
      currency: "USD",
      price: plan.price,
      source: "billing_plan_page",
    },
  });

  const clientId = process.env.PAYPAL_CLIENT_ID;
  if (!clientId) {
    await logCheckoutEvent({
      attemptId,
      memberId,
      planId: plan.id,
      brandId,
      eventName: "server_error",
      checkoutMode: "in_page",
      errorCode: "PAYPAL_NOT_CONFIGURED",
      errorMessage: "PayPal client id is not configured",
    });
    return NextResponse.json(
      { error: "PayPal is not configured", code: "PAYPAL_NOT_CONFIGURED" },
      { status: 503 }
    );
  }

  const paypalPlanId = await resolvePaypalPlanId(plan);
  if (!paypalPlanId) {
    await logCheckoutEvent({
      attemptId,
      memberId,
      planId: plan.id,
      brandId,
      eventName: "server_error",
      checkoutMode: "in_page",
      errorCode: "PAYPAL_PLAN_FAILED",
      errorMessage: "Failed to resolve PayPal billing plan",
    });
    return NextResponse.json(
      { error: "Failed to prepare PayPal billing plan", code: "PAYPAL_PLAN_FAILED" },
      { status: 502 }
    );
  }

  return NextResponse.json({
    attemptId,
    clientId,
    paypalPlanId,
    currency: "USD",
    plan: {
      id: plan.id,
      name: plan.name,
      price: plan.price,
      unit: plan.unit,
      days: plan.days,
    },
  });
}
