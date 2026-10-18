import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { activateSubscription, getSubscription } from "@/lib/paypal";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const memberId = parseInt(session.user.id, 10);

  const cancelledPlan = await prisma.member_plan.findFirst({
    where: {
      member_id: memberId,
      agreement_cancel: { not: null },
      paypal_agreement_id: { not: null },
    },
    orderBy: { id: "desc" },
  });

  if (!cancelledPlan?.paypal_agreement_id) {
    return NextResponse.json({ error: "No cancelled subscription found" }, { status: 404 });
  }

  const paypal = await activateSubscription(cancelledPlan.paypal_agreement_id);
  if (paypal && paypal.success === false) {
    return NextResponse.json(
      { error: "PayPal could not reactivate this subscription" },
      { status: 502 },
    );
  }

  const live = await getSubscription(cancelledPlan.paypal_agreement_id);
  const status = String(live?.status ?? "").toUpperCase();
  if (status && !["ACTIVE", "APPROVED"].includes(status)) {
    return NextResponse.json(
      { error: "PayPal has not confirmed this subscription as active" },
      { status: 502 },
    );
  }

  await prisma.member_plan.update({
    where: { id: cancelledPlan.id },
    data: { agreement_cancel: null, agreement_activate: new Date().toISOString() },
  });

  return NextResponse.json({ success: true });
}
