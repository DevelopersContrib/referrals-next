import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createSubscription } from "@/lib/paypal";

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

    // Look up the PayPal plan ID from member_plan or use plan ID as reference
    const existingPaypalPlan = await prisma.member_plan.findFirst({
      where: { paypal_plan_id: { not: "" } },
      orderBy: { id: "desc" },
    });

    const paypalPlanId = existingPaypalPlan?.paypal_plan_id || String(plan.id);

    const subscription = await createSubscription(
      paypalPlanId,
      returnUrl,
      cancelUrl
    );

    // Find approval URL
    const approvalUrl = subscription.links?.find(
      (l: any) => l.rel === "approve"
    )?.href;

    if (!approvalUrl) {
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
