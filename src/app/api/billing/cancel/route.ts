import { NextRequest, NextResponse, after } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cancelSubscription } from "@/lib/paypal";
import { postVnocAttribution, resolveVnocPlan } from "@/lib/vnoc-attribution";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const memberId = parseInt(session.user.id, 10);
  const { reason } = await req.json();

  const activePlan = await prisma.member_plan.findFirst({
    where: { member_id: memberId },
    orderBy: { id: "desc" },
  });

  if (!activePlan?.paypal_agreement_id) {
    return NextResponse.json({ error: "No active subscription" }, { status: 404 });
  }

  try {
    await cancelSubscription(activePlan.paypal_agreement_id, reason || "Customer requested");

    await prisma.member_plan.update({
      where: { id: activePlan.id },
      data: { agreement_cancel: new Date().toISOString() },
    });

    // Report the cancellation to VNOC (after response; non-fatal).
    const cancelledPlan = activePlan.payment_id
      ? await prisma.plans.findUnique({ where: { id: activePlan.payment_id } })
      : null;
    const mapped = cancelledPlan ? resolveVnocPlan(cancelledPlan.price ?? 0) : null;
    const agreementId = activePlan.paypal_agreement_id;
    after(() =>
      postVnocAttribution({
        product: mapped?.product ?? "referrals",
        eventType: "cancel",
        refExternalId: agreementId,
        planSlug: mapped?.planSlug,
      })
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Cancel subscription error:", error);
    return NextResponse.json({ error: "Cancellation failed" }, { status: 500 });
  }
}
