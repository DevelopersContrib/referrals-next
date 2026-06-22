import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSubscription } from "@/lib/paypal";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const subscriptionId = searchParams.get("subscription_id");
  const planId = searchParams.get("planId");
  const memberId = searchParams.get("memberId");
  const brandId = searchParams.get("brandId");

  if (!subscriptionId || !planId || !memberId) {
    return NextResponse.redirect(new URL("/billing?error=missing_params", req.url));
  }

  try {
    const plan = await prisma.plans.findUnique({
      where: { id: parseInt(planId, 10) },
    });

    if (!plan) {
      return NextResponse.redirect(new URL("/billing?error=plan_not_found", req.url));
    }

    const subscription = await getSubscription(subscriptionId);
    const paypalPlanId = subscription.plan_id as string | undefined;
    if (!paypalPlanId) {
      console.error("PayPal subscription missing plan_id:", subscription);
      return NextResponse.redirect(new URL("/billing?error=paypal_plan_not_found", req.url));
    }

    const parsedMemberId = parseInt(memberId, 10);
    const parsedBrandId = brandId ? parseInt(brandId, 10) : null;

    if (parsedBrandId) {
      const brand = await prisma.member_urls.findFirst({
        where: { id: parsedBrandId, member_id: parsedMemberId },
      });
      if (!brand) {
        return NextResponse.redirect(new URL("/billing?error=brand_not_found", req.url));
      }
    }

    const now = new Date();
    const expiry = new Date(now);
    expiry.setDate(expiry.getDate() + (plan.days || 30));

    // Save subscription
    await prisma.member_plan.create({
      data: {
        member_id: parsedMemberId,
        paypal_plan_id: paypalPlanId,
        paypal_agreement_id: subscriptionId,
        payment_id: plan.id,
        date_added: now,
      },
    });

    if (parsedBrandId) {
      await prisma.url_plan.create({
        data: {
          url_id: parsedBrandId,
          member_id: parsedMemberId,
          paypal_plan_id: paypalPlanId,
          paypal_agreement_id: subscriptionId,
          payment_id: plan.id,
          date_added: now,
        },
      });
    }

    // Record payment
    await prisma.member_payment.create({
      data: {
        member_id: parsedMemberId,
        amount: plan.price,
        datetime_created: now,
        status: "completed",
        transaction_id: subscriptionId,
        currency: "USD",
        plan_expiry: expiry,
      },
    });

    // Update member
    await prisma.members.update({
      where: { id: parsedMemberId },
      data: {
        plan_id: parseInt(planId, 10),
        plan_expiry: expiry,
      },
    });

    return NextResponse.redirect(new URL("/billing/success", req.url));
  } catch (error) {
    console.error("Execute subscription error:", error);
    return NextResponse.redirect(new URL("/billing?error=execution_failed", req.url));
  }
}
