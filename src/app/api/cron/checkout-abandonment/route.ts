import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateCron } from "@/lib/api/helpers";
import { logCheckoutEvent } from "@/lib/billing-checkout-log";

const OPEN_STATUSES = [
  "created",
  "ready",
  "started",
  "paypal_opened",
  "approved",
  "activating",
  "redirected",
  "webhook_received",
];

/** Mark checkout journeys with no activity for 30 minutes as abandoned. */
export async function GET(req: NextRequest) {
  if (!authenticateCron(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const staleBefore = new Date(Date.now() - 30 * 60 * 1000);
  const stale = await prisma.billing_checkout_attempts.findMany({
    where: {
      status: { in: OPEN_STATUSES },
      updated_at: { lt: staleBefore },
    },
    orderBy: { updated_at: "asc" },
    take: 500,
  });

  for (const attempt of stale) {
    await logCheckoutEvent({
      attemptId: attempt.attempt_id,
      memberId: attempt.member_id,
      planId: attempt.plan_id,
      brandId: attempt.brand_id,
      eventName: "abandoned",
      checkoutMode:
        attempt.checkout_mode === "redirect" ? "redirect" : "in_page",
      paypalSubscriptionId: attempt.paypal_subscription_id,
      metadata: {
        reason: "no_activity_for_30_minutes",
        previousStatus: attempt.status,
      },
    });
  }

  return NextResponse.json({
    success: true,
    stale_before: staleBefore.toISOString(),
    marked_abandoned: stale.length,
  });
}
