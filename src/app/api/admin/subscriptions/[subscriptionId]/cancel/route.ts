import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cancelSubscription } from "@/lib/paypal";
import { requirePlatformAdminApi } from "@/lib/require-platform-admin";

type RouteParams = { params: Promise<{ subscriptionId: string }> };

/**
 * Admin-cancel a PayPal recurring subscription (member_plan row).
 * Calls the live PayPal API to cancel the agreement, then records the
 * cancellation locally — mirroring the member-facing /api/billing/cancel flow,
 * but keyed by member_plan id and restricted to platform admins.
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  const gate = await requirePlatformAdminApi();
  if (!gate.ok)
    return NextResponse.json(
      { error: gate.status === 401 ? "Unauthorized" : "Forbidden" },
      { status: gate.status }
    );

  const { subscriptionId } = await params;
  const id = parseInt(subscriptionId, 10);
  if (Number.isNaN(id))
    return NextResponse.json({ error: "Invalid subscription ID" }, { status: 400 });

  const sub = await prisma.member_plan.findUnique({ where: { id } });
  if (!sub)
    return NextResponse.json({ error: "Subscription not found" }, { status: 404 });

  if (sub.agreement_cancel) {
    return NextResponse.json({
      success: true,
      alreadyCancelled: true,
      message: "Subscription was already cancelled.",
    });
  }

  if (!sub.paypal_agreement_id) {
    return NextResponse.json(
      { error: "This subscription has no PayPal agreement to cancel." },
      { status: 400 }
    );
  }

  const { reason } = (await req.json().catch(() => ({}))) as { reason?: string };

  try {
    await cancelSubscription(
      sub.paypal_agreement_id,
      reason?.trim() || "Cancelled by administrator"
    );

    await prisma.member_plan.update({
      where: { id },
      data: { agreement_cancel: new Date().toISOString() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin cancel subscription error:", error);
    return NextResponse.json(
      { error: "PayPal cancellation failed. The agreement was not cancelled." },
      { status: 502 }
    );
  }
}
