import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createSubscription, createSubscriptionPlan } from "@/lib/paypal";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { planId, brandId } = await req.json();

  const plan = await prisma.plans.findUnique({ where: { id: planId } });
  if (!plan)
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });

  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const returnUrl = `${appUrl}/api/billing/execute?planId=${planId}&memberId=${session.user.id}${brandId ? `&brandId=${brandId}` : ""}`;
    const cancelUrl = `${appUrl}/billing`;

    // Look up an existing PayPal plan ID linked to this specific plan
    const existingPaypalPlan = await prisma.member_plan.findFirst({
      where: {
        paypal_plan_id: { not: "" },
        payment_id: plan.id,
      },
      orderBy: { id: "desc" },
    });

    let paypalPlanId = existingPaypalPlan?.paypal_plan_id || "";

    if (!paypalPlanId) {
      const interval =
        plan.unit?.toUpperCase() === "YEAR" ? "YEAR" : "MONTH";
      const newPlan = await createSubscriptionPlan(
        plan.name || `Plan ${plan.id}`,
        String(plan.price ?? "0"),
        interval as "MONTH" | "YEAR"
      );

      if (!newPlan.id) {
        console.error("PayPal plan creation failed:", newPlan);
        return NextResponse.json(
          { error: "Failed to create PayPal billing plan" },
          { status: 500 }
        );
      }

      paypalPlanId = newPlan.id;
    }

    const subscription = await createSubscription(
      paypalPlanId,
      returnUrl,
      cancelUrl
    );

    const approvalUrl = subscription.links?.find(
      (l: any) => l.rel === "approve"
    )?.href;

    if (!approvalUrl) {
      console.error("PayPal subscription response:", subscription);
      return NextResponse.json(
        { error: "Failed to create PayPal subscription" },
        { status: 500 }
      );
    }

    return NextResponse.json({ approvalUrl });
  } catch (error) {
    console.error("PayPal subscription error:", error);
    return NextResponse.json(
      { error: "Payment processing failed" },
      { status: 500 }
    );
  }
}
