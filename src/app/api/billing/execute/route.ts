import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const subscriptionId = searchParams.get("subscription_id");
  const planId = searchParams.get("planId");
  const memberId = searchParams.get("memberId");

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

    const now = new Date();
    const expiry = new Date(now);
    expiry.setDate(expiry.getDate() + (plan.days || 30));

    // Save subscription
    await prisma.member_plan.create({
      data: {
        member_id: parseInt(memberId, 10),
        paypal_plan_id: planId,
        paypal_agreement_id: subscriptionId,
        date_added: now,
      },
    });

    // Record payment
    await prisma.member_payment.create({
      data: {
        member_id: parseInt(memberId, 10),
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
      where: { id: parseInt(memberId, 10) },
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
