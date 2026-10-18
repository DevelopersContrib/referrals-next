import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSubscription, suspendSubscription } from "@/lib/paypal";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const memberId = parseInt(session.user.id, 10);

  const activePlan = await prisma.member_plan.findFirst({
    where: {
      member_id: memberId,
      agreement_cancel: null,
      paypal_agreement_id: { not: null },
    },
    orderBy: { id: "desc" },
  });

  if (!activePlan?.paypal_agreement_id) {
    return NextResponse.json({ error: "No active subscription" }, { status: 404 });
  }

  const paypal = await suspendSubscription(activePlan.paypal_agreement_id);
  if (paypal && paypal.success === false) {
    return NextResponse.json(
      { error: "PayPal could not suspend this subscription" },
      { status: 502 },
    );
  }

  const live = await getSubscription(activePlan.paypal_agreement_id);
  const status = String(live?.status ?? "").toUpperCase();
  if (status && status !== "SUSPENDED") {
    return NextResponse.json(
      { error: "PayPal has not confirmed this subscription as suspended" },
      { status: 502 },
    );
  }

  await prisma.member_plan.update({
    where: { id: activePlan.id },
    data: { agreement_cancel: "suspended" },
  });

  return NextResponse.json({ success: true });
}
