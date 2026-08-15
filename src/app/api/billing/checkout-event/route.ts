import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  logCheckoutEvent,
  type CheckoutEventName,
} from "@/lib/billing-checkout-log";

const CLIENT_EVENTS = new Set<CheckoutEventName>([
  "sdk_ready",
  "checkout_started",
  "paypal_opened",
  "approved",
  "cancelled",
  "abandoned",
  "client_error",
]);

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const memberId = parseInt(session.user.id, 10);

  let body: {
    attemptId?: string;
    planId?: number;
    eventName?: CheckoutEventName;
    paypalSubscriptionId?: string;
    errorCode?: string;
    errorMessage?: string;
    metadata?: Record<string, string | number | boolean | null>;
  };
  try {
    body = JSON.parse(await req.text());
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const attemptId = String(body.attemptId || "").trim();
  const planId = Number(body.planId);
  const eventName = body.eventName;

  if (
    !/^[0-9a-f-]{36}$/i.test(attemptId) ||
    !Number.isFinite(planId) ||
    !eventName ||
    !CLIENT_EVENTS.has(eventName)
  ) {
    return NextResponse.json({ error: "Invalid checkout event" }, { status: 400 });
  }

  const attempt = await prisma.billing_checkout_attempts.findFirst({
    where: { attempt_id: attemptId, member_id: memberId, plan_id: planId },
    select: { brand_id: true, checkout_mode: true, status: true },
  });
  if (!attempt) {
    return NextResponse.json({ error: "Checkout attempt not found" }, { status: 404 });
  }

  // A delayed pagehide beacon must not overwrite a successfully activated or
  // explicitly cancelled attempt.
  if (
    eventName === "abandoned" &&
    ["activated", "cancelled", "failed"].includes(attempt.status)
  ) {
    return NextResponse.json({ received: true, ignored: true });
  }

  await logCheckoutEvent({
    attemptId,
    memberId,
    planId,
    brandId: attempt.brand_id,
    eventName,
    checkoutMode:
      attempt.checkout_mode === "redirect" ? "redirect" : "in_page",
    paypalSubscriptionId: body.paypalSubscriptionId,
    errorCode: body.errorCode,
    errorMessage: body.errorMessage,
    metadata: body.metadata,
  });

  return NextResponse.json({ received: true });
}
